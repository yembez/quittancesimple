import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildEmailHtml, type EmailTitle, MARC_SIGNATURE_IMAGE_URL } from "../_shared/email-template.ts";
import { openLoginLandingInsteadOfDashboard } from "../_shared/email-landing-urls.ts";
import { buildCampaignEmailHtml } from "../_shared/campaign-email-template.ts";
import { buildRecipientsTrialAutoIncompleteLt20, loadAutomationOverviewData } from "../_shared/automation-overview-data.ts";

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
const PREFIX_TEST = "2speek";

function isEmailValidePourMailing(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const e = email.trim().toLowerCase();
  if (e.endsWith(DOMAINE_TEST)) return false;
  if (e.startsWith(PREFIX_TEST)) return false;
  if (EMAILS_TEST.has(e)) return false;
  return e.includes("@") && e.includes(".");
}

/**
 * Resend : max 2 requêtes par seconde. On ne peut PAS envoyer 100 e-mails "en bloc" la même seconde :
 * il faut espacer chaque envoi (au moins 500 ms entre chaque). 800 ms = ~1,25 envoi/s, large sous la limite.
 */
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
  /** Signature personnalisée (HTML), insérée après le CTA. */
  closingHtml?: string;
  /** Option A : texte par blocs (slots) pour campagnes. */
  slots?: Record<string, unknown>;
  /**
   * Si `bodyHtml` contient un document HTML complet (`<!doctype html>` / `<html>`),
   * l'envoyer tel quel (après remplacement des placeholders) sans l'envelopper
   * dans `buildEmailHtml` / `buildCampaignEmailHtml`.
   */
  rawHtml?: boolean;
  /** URL d'image injectée dans les templates type {{photo_vincent_url}}. */
  photoVincentUrl?: string;
  /** En-tête du template `buildEmailHtml` : ex. « QS- Espace Bailleur » (défaut : vide). */
  emailTitle?: EmailTitle;
  /** Nombre max d'e-mails à envoyer dans cette exécution (défaut 100). */
  limit?: number;
  /** Décalage dans la liste (pour envoi sur plusieurs jours). */
  offset?: number;
  /** Délai en ms entre chaque envoi (défaut 800). */
  delayMs?: number;
  /**
   * Segment: all | leads | free_leads | leads_j2 | … | trial_auto_incomplete_lt20
   * (essai actif, moins de 20 j restants, auto configurée, e-mail locataire ou tél. bailleur manquant).
   */
  segment?: string;
  /** Envoi test : envoie uniquement à ces adresses (pas de liste BDD). Max 5. */
  testEmails?: string[];
  /**
   * Envoi test avancé (prévisualisation) : fournit des destinataires complets
   * (prénom + jours restants, etc.). Prioritaire sur `testEmails`.
   */
  testRecipients?: Array<{ email: string; prenom?: string; jours_restants?: number; days_remaining?: number }>;
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

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const isInternalCall = !!serviceRoleKey && bearerToken === serviceRoleKey;

  let bodyJson: Record<string, unknown>;
  try {
    bodyJson = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Body JSON invalide" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!isInternalCall) {
    const secretRaw = Deno.env.get("MAILING_LIST_SECRET");
    const secret = typeof secretRaw === "string" ? secretRaw.trim() : "";
    const customHeader = req.headers.get("X-Mailing-List-Secret");
    const bodySecret = typeof bodyJson._mailingSecret === "string" ? String(bodyJson._mailingSecret).trim() : null;
    const providedRaw = customHeader || (bearerToken && bearerToken !== serviceRoleKey ? bearerToken : null) || bodySecret;
    const provided = typeof providedRaw === "string" ? providedRaw.trim() : "";
    if (!secret) {
      return new Response(
        JSON.stringify({
          error: "Non autorisé (401)",
          hint: "MAILING_LIST_SECRET n'est pas défini. Supabase → Edge Functions → Secrets → ajoutez MAILING_LIST_SECRET. Ou utilisez le déclenchement depuis l'admin (admin-trigger-campaign envoie avec la Service Role Key).",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (provided !== secret) {
      return new Response(
        JSON.stringify({
          error: "Non autorisé (401)",
          hint: "Le secret reçu ne correspond pas à MAILING_LIST_SECRET.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  delete bodyJson._mailingSecret;
  const payload = bodyJson as unknown as BulkPayload;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

  // Minimum 500 ms entre chaque e-mail pour rester sous 2 req/s Resend (sinon 429 / blocage).
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

  let list: { id?: number; email: string; prenom?: string; jours_restants?: number }[];
  let runOffset = 0;

  const rawTestRecipients = payload.testRecipients;
  const testRecipients =
    Array.isArray(rawTestRecipients) && rawTestRecipients.length > 0
      ? rawTestRecipients
          .slice(0, MAX_TEST_EMAILS)
          .map((r) => ({
            email: typeof r?.email === "string" ? r.email.trim() : "",
            prenom: typeof r?.prenom === "string" ? r.prenom.trim() : "",
            jours_restants:
              typeof r?.jours_restants === "number"
                ? r.jours_restants
                : typeof (r as { days_remaining?: unknown })?.days_remaining === "number"
                  ? Number((r as { days_remaining: number }).days_remaining)
                  : undefined,
          }))
          .filter((r) => r.email && r.email.includes("@"))
      : null;

  if (testRecipients && testRecipients.length > 0) {
    list = testRecipients.map((r) => ({ email: r.email, prenom: r.prenom || "Prénom", jours_restants: r.jours_restants }));
  } else if (testEmails && testEmails.length > 0) {
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

    const { data: desabonnesRows } = await supabase.from("mailing_desabonnes").select("email");
    const desabonnesSet = new Set(
      (desabonnesRows || []).map((r: { email: string }) => r.email?.toLowerCase()).filter(Boolean),
    );

    if (segment === "trial_auto_incomplete_lt20") {
      const loaded = await loadAutomationOverviewData(supabase);
      if (!loaded.ok) {
        return new Response(JSON.stringify({ error: loaded.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const all = buildRecipientsTrialAutoIncompleteLt20(loaded.systematic, loaded.rappelClassique);
      const filtered = all.filter((r) => {
        const e = r.email.trim().toLowerCase();
        return isEmailValidePourMailing(r.email) && !desabonnesSet.has(e);
      });
      const page = filtered.slice(runOffset, runOffset + limit);
      list = page.map((r) => ({
        id: r.id,
        email: r.email,
        prenom: r.prenom || "",
        jours_restants: r.jours_restants,
      }));
    } else {
      const today = new Date();
      const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

      let daysOffset: number | null = null;
      let isCatchupJ2 = false;
      let isFreeLeads = false;
      let campaignField: "campaign_j2_sent_at" | "campaign_j5_sent_at" | "campaign_j8_sent_at" | null = null;
      if (segment === "free_leads") {
        isFreeLeads = true;
        campaignField = "campaign_j2_sent_at";
      } else if (segment === "leads_j2") {
        daysOffset = 2;
        campaignField = "campaign_j2_sent_at";
      } else if (segment === "leads_j2_catchup") {
        daysOffset = 2;
        campaignField = "campaign_j2_sent_at";
        isCatchupJ2 = true;
      } else if (segment === "leads_j5") {
        daysOffset = 5;
        campaignField = "campaign_j5_sent_at";
      } else if (segment === "leads_j8") {
        daysOffset = 8;
        campaignField = "campaign_j8_sent_at";
      }

      let query = supabase
        .from("proprietaires")
        .select("id, email, nom, prenom, created_at, lead_statut, nombre_quittances, campaign_j2_sent_at, campaign_j5_sent_at, campaign_j8_sent_at")
        .not("email", "is", null)
        .not("email", "ilike", "%" + DOMAINE_TEST + "%")
        .or("mailing_desabonne.is.null,mailing_desabonne.eq.false")
        .order("created_at", { ascending: true });

      if (segment === "free_leads") {
        query = query
          .eq("lead_statut", "free_quittance_pdf")
          .gte("nombre_quittances", 1)
          .is("campaign_j2_sent_at", null)
          .is("user_id", null);
      } else if (segment === "leads" || segment.startsWith("leads_")) {
        query = query.eq("lead_statut", "free_quittance_pdf").is("user_id", null);
      }

      if (isFreeLeads) {
        // déjà filtré
      } else if (daysOffset !== null && campaignField) {
        const targetStart = new Date(todayUtc);
        targetStart.setUTCDate(targetStart.getUTCDate() - daysOffset);
        const targetEnd = new Date(targetStart);
        targetEnd.setUTCDate(targetEnd.getUTCDate() + 1);

        if (isCatchupJ2 && segment === "leads_j2_catchup") {
          query = query.lt("created_at", targetStart.toISOString()).is(campaignField, null);
        } else {
          query = query
            .gte("created_at", targetStart.toISOString())
            .lt("created_at", targetEnd.toISOString())
            .is(campaignField, null);
        }
      }

      const { data: rows, error: fetchError } = await query.range(runOffset, runOffset + limit - 1);

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      list = (rows || [])
        .filter((r: { email?: string }) => {
          const e = (r.email || "").trim().toLowerCase();
          return isEmailValidePourMailing(r.email || "") && !desabonnesSet.has(e);
        })
        .map((r: { id?: number | string; email: string; prenom?: string; nom?: string }) => ({
          id: r.id,
          email: r.email,
          prenom: (r.prenom || "").trim() || "",
        }));
    }
  }

  let sent = 0;
  const sentIds: (string | number)[] = [];
  const failed: { email: string; error: string }[] = [];

  const bulkSegment = payload.segment || "";
  const effectiveEmailTitle = (payload.emailTitle ??
    (bulkSegment === "trial_auto_incomplete_lt20" ? "QS- Espace Bailleur" : "")) as EmailTitle;

  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const prenom = (r.prenom || "").trim() || "";
    const joursRestants =
      typeof r.jours_restants === "number" && Number.isFinite(r.jours_restants) ? Math.max(0, Math.round(r.jours_restants)) : null;
    let bodyPersonalized = bodyHtml
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenom)
      .replace(/\[\s*Prénom\s*\]/gi, prenom)
      .replace(/\{\{\s*email\s*\}\}/gi, encodeURIComponent(r.email.trim()))
      .replace(/\{\{\s*jours_restants\s*\}\}/gi, joursRestants === null ? "" : String(joursRestants))
      .replace(/\{\{\s*days_remaining\s*\}\}/gi, joursRestants === null ? "" : String(joursRestants))
      .replace(/\[\s*X\s*\]/gi, joursRestants === null ? "" : String(joursRestants));
    if (!prenom) {
      bodyPersonalized = bodyPersonalized.replace(/\bBonjour\s+,/gi, "Bonjour,");
    }

    let subjectPersonalized = subject
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenom)
      .replace(/\[\s*Prénom\s*\]/gi, prenom);
    if (!prenom) {
      subjectPersonalized = subjectPersonalized.replace(/^,\s*/, "").replace(/\s{2,}/g, " ").trim();
    }

    const ctaUrlRaw = payload.ctaUrl || "";
    let ctaUrlPersonalized = ctaUrlRaw
      .replace(/\{\{\s*email\s*\}\}/gi, encodeURIComponent(r.email.trim()));

    if (
      bulkSegment === "trial_auto_incomplete_lt20" &&
      ctaUrlPersonalized &&
      !/\bloginhint=/i.test(ctaUrlPersonalized)
    ) {
      const sep = ctaUrlPersonalized.includes("?") ? "&" : "?";
      ctaUrlPersonalized = `${ctaUrlPersonalized}${sep}loginHint=${encodeURIComponent(r.email.trim())}`;
    }

    if (ctaUrlPersonalized) {
      ctaUrlPersonalized = openLoginLandingInsteadOfDashboard(ctaUrlPersonalized, {
        fallbackLoginEmail: r.email.trim(),
      });
    }

    const segment = payload.segment || "all";
    const campaignKeyForTracking =
      segment === "free_leads" || segment === "leads_j2" || segment === "leads_j2_catchup"
        ? "j2"
        : segment === "leads_j5"
          ? "j5"
          : segment === "leads_j8"
            ? "j8"
            : null;
    const supabaseUrlForTracking = Deno.env.get("SUPABASE_URL");
    const ctaUrlForEmail =
      campaignKeyForTracking && ctaUrlPersonalized && supabaseUrlForTracking
        ? `${supabaseUrlForTracking}/functions/v1/track-cta-click?campaign=${campaignKeyForTracking}&to=${encodeURIComponent(ctaUrlPersonalized)}`
        : ctaUrlPersonalized || undefined;

    const SITE_URL = "https://www.quittancesimple.fr";
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(r.email.trim())}`;
    const photoVincentUrl =
      (payload.photoVincentUrl && String(payload.photoVincentUrl).trim()) || MARC_SIGNATURE_IMAGE_URL;

    const isCampaign = ["free_leads", "leads_j2", "leads_j2_catchup", "leads_j5", "leads_j8"].includes(payload.segment || "");
    const shouldSendRaw =
      payload.rawHtml === true ||
      /^\s*<!doctype\s+html/i.test(bodyPersonalized) ||
      (/<html[\s>]/i.test(bodyPersonalized) && /<\/html>/i.test(bodyPersonalized));

    const html = shouldSendRaw
      ? bodyPersonalized
          .replace(/\{\{\s*lien_activation\s*\}\}/gi, ctaUrlForEmail || ctaUrlPersonalized || "")
          .replace(/\{\{\s*lien_desabonnement\s*\}\}/gi, unsubscribeUrl)
          .replace(/\{\{\s*photo_vincent_url\s*\}\}/gi, photoVincentUrl)
      : isCampaign
        ? buildCampaignEmailHtml({
            prenom: prenom || "Prénom",
            lienActivation: ctaUrlForEmail || ctaUrlPersonalized || "",
            lienDesabonnement: unsubscribeUrl,
            bodyHtml: bodyPersonalized,
            ctaText: payload.ctaText,
            closingHtml: payload.closingHtml,
            slots: (payload.slots && typeof payload.slots === "object") ? payload.slots : undefined,
            photoVincentUrl,
          })
        : buildEmailHtml({
            title: effectiveEmailTitle,
            bodyHtml: bodyPersonalized,
            ctaText: payload.ctaText,
            ctaUrl: ctaUrlForEmail,
            closingHtml: payload.closingHtml,
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
          from: "Marc – Quittance Simple <contact@quittancesimple.fr>",
          reply_to: "Marc – Quittance Simple <contact@quittancesimple.fr>",
          to: [r.email.trim()],
          subject: subjectPersonalized || subject,
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        failed.push({ email: r.email, error: `${res.status}: ${errText.slice(0, 200)}` });
      } else {
        sent++;
        if (!testEmails && r.id != null) {
          sentIds.push(r.id);
        }
      }
    } catch (err) {
      failed.push({ email: r.email, error: err instanceof Error ? err.message : String(err) });
    }

    if (i < list.length - 1) {
      await sleep(delayMs);
    }
  }

  // Marquer les destinataires comme "mail J+N envoyé" si on est dans un segment J+N
  if (!testEmails && sentIds.length > 0) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);
      const segment = payload.segment || "all";
      let field: string | null = null;
      if (segment === "free_leads" || segment === "leads_j2") field = "campaign_j2_sent_at";
      if (segment === "leads_j5") field = "campaign_j5_sent_at";
      if (segment === "leads_j8") field = "campaign_j8_sent_at";
      if (segment === "leads_j2_catchup") field = "campaign_j2_sent_at";

      if (field) {
        const updatePayload: Record<string, string> = {};
        updatePayload[field] = new Date().toISOString();
        await supabase
          .from("proprietaires")
          .update(updatePayload)
          .in("id", sentIds);
      }
    }
  }

  const nextOffset = (testEmails || testRecipients) ? undefined : runOffset + list.length;

  return new Response(
    JSON.stringify({
      testMode: !!testEmails || !!testRecipients,
      sent,
      failed: failed.length,
      failedDetails: failed.length > 0 ? failed : undefined,
      nextOffset,
      message: testEmails
        ? (failed.length === 0
            ? `${sent} e-mail(s) de test envoyé(s). Vérifiez votre boîte.`
            : `${sent} envoyé(s), ${failed.length} en erreur.`)
        : testRecipients
          ? (failed.length === 0
              ? `${sent} e-mail(s) de test (destinataires) envoyé(s). Vérifiez votre boîte.`
              : `${sent} envoyé(s), ${failed.length} en erreur.`)
        : failed.length === 0
          ? `${sent} e-mail(s) envoyé(s). Pour la suite : rappeler avec offset=${nextOffset}.`
          : `${sent} envoyé(s), ${failed.length} en erreur. Prochaine fois : offset=${nextOffset}.`,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
