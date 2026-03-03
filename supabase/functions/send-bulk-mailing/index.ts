import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildEmailHtml } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Mailing-List-Secret",
};

const EMAILS_TEST = new Set([
  "leachainais@gmail.com",
  "gillesalze@gmail.com",
  "2speek@gmail.com",
]);
const DOMAINE_TEST = "@maildrop.cc";

function isEmailValidePourMailing(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const e = email.trim().toLowerCase();
  if (e.endsWith(DOMAINE_TEST)) return false;
  if (EMAILS_TEST.has(e)) return false;
  return e.includes("@") && e.includes(".");
}

/** Délai entre chaque envoi (ms) pour rester sous 2 req/s Resend. */
const DEFAULT_DELAY_MS = 800;
/** Limite par défaut pour Resend gratuit (100/jour). */
const DEFAULT_LIMIT_PER_RUN = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const MAX_TEST_EMAILS = 5;

interface BulkPayload {
  subject: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  /** Nombre max d'e-mails à envoyer dans cette exécution (défaut 100). */
  limit?: number;
  /** Décalage dans la liste (pour envoi sur plusieurs jours). */
  offset?: number;
  /** Délai en ms entre chaque envoi (défaut 800). */
  delayMs?: number;
  /** Segment: all | leads (défaut all). */
  segment?: string;
  /** Envoi test : envoie uniquement à ces adresses (pas de liste BDD). Max 5. */
  testEmails?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Méthode non autorisée" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const secret = Deno.env.get("MAILING_LIST_SECRET");
  const authHeader = req.headers.get("Authorization");
  const customHeader = req.headers.get("X-Mailing-List-Secret");
  const provided = customHeader || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
  if (!secret || provided !== secret) {
    return new Response(
      JSON.stringify({ error: "Non autorisé" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let payload: BulkPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Body JSON invalide" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const subject = payload.subject?.trim();
  const bodyHtml = payload.bodyHtml?.trim();
  if (!subject || !bodyHtml) {
    return new Response(
      JSON.stringify({ error: "subject et bodyHtml sont requis" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const delayMs = Math.max(500, payload.delayMs ?? DEFAULT_DELAY_MS);

  // Mode test : envoi uniquement aux adresses fournies (pour prévisualiser avant campagne)
  const rawTestEmails = payload.testEmails;
  const testEmails =
    Array.isArray(rawTestEmails) && rawTestEmails.length > 0
      ? rawTestEmails
          .slice(0, MAX_TEST_EMAILS)
          .map((e) => (typeof e === "string" ? e.trim() : ""))
          .filter((e) => e && e.includes("@"))
      : null;

  let list: { email: string; prenom?: string }[];
  let runOffset = 0;

  if (testEmails && testEmails.length > 0) {
    list = testEmails.map((email) => ({ email, prenom: "Prénom" }));
  } else {
    const limit = Math.min(Math.max(1, payload.limit ?? DEFAULT_LIMIT_PER_RUN), 200);
    runOffset = Math.max(0, payload.offset ?? 0);
    const segment = payload.segment || "all";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Configuration Supabase manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    let query = supabase
      .from("proprietaires")
      .select("id, email, nom, prenom")
      .not("email", "is", null)
      .not("email", "ilike", "%" + DOMAINE_TEST + "%")
      .or("mailing_desabonne.is.null,mailing_desabonne.eq.false")
      .order("created_at", { ascending: true });

    if (segment === "leads") {
      query = query.eq("lead_statut", "free_quittance_pdf");
    }

    const { data: rows, error: fetchError } = await query.range(runOffset, runOffset + limit - 1);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: desabonnesRows } = await supabase.from("mailing_desabonnes").select("email");
    const desabonnesSet = new Set(
      (desabonnesRows || []).map((r: { email: string }) => r.email?.toLowerCase()).filter(Boolean)
    );

    list = (rows || [])
      .filter((r: { email?: string }) => {
        const e = (r.email || "").trim().toLowerCase();
        return isEmailValidePourMailing(r.email || "") && !desabonnesSet.has(e);
      })
      .map((r: { email: string; prenom?: string; nom?: string }) => ({
        email: r.email,
        prenom: (r.prenom || "").trim() || "Propriétaire",
      }));
  }

  let sent = 0;
  const failed: { email: string; error: string }[] = [];

  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const prenom = (r.prenom || "").trim() || "Propriétaire";
    const bodyPersonalized = bodyHtml
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenom)
      .replace(/\[\s*Prénom\s*\]/gi, prenom);

    const ctaUrlRaw = payload.ctaUrl || "";
    const ctaUrlPersonalized = ctaUrlRaw
      .replace(/\{\{\s*email\s*\}\}/gi, encodeURIComponent(r.email.trim()));

    const SITE_URL = "https://www.quittancesimple.fr";
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(r.email.trim())}`;

    const html = buildEmailHtml({
      title: "Quittance Simple",
      bodyHtml: bodyPersonalized,
      ctaText: payload.ctaText,
      ctaUrl: ctaUrlPersonalized || undefined,
      unsubscribeUrl,
    });

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Quittance Simple <noreply@quittancesimple.fr>",
          to: [r.email.trim()],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        failed.push({ email: r.email, error: `${res.status}: ${errText.slice(0, 200)}` });
      } else {
        sent++;
      }
    } catch (err) {
      failed.push({ email: r.email, error: err instanceof Error ? err.message : String(err) });
    }

    if (i < list.length - 1) {
      await sleep(delayMs);
    }
  }

  const nextOffset = testEmails ? undefined : runOffset + list.length;

  return new Response(
    JSON.stringify({
      testMode: !!testEmails,
      sent,
      failed: failed.length,
      failedDetails: failed.length > 0 ? failed : undefined,
      nextOffset,
      message: testEmails
        ? (failed.length === 0
            ? `${sent} e-mail(s) de test envoyé(s). Vérifiez votre boîte.`
            : `${sent} envoyé(s), ${failed.length} en erreur.`)
        : failed.length === 0
          ? `${sent} e-mail(s) envoyé(s). Pour la suite : rappeler avec offset=${nextOffset}.`
          : `${sent} envoyé(s), ${failed.length} en erreur. Prochaine fois : offset=${nextOffset}.`,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
