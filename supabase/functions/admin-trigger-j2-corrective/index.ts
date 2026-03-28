import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

const SITE_URL = "https://www.quittancesimple.fr";
const DEFAULT_DELAY_MS = 800;

function isEmailValidePourMailing(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const e = email.trim().toLowerCase();
  if (!e.includes("@") || !e.includes(".")) return false;
  if (e.endsWith("@maildrop.cc")) return false;
  if (e.startsWith("2speek")) return false;
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!supabaseUrl || !serviceKey || !resendKey) {
    return new Response(JSON.stringify({ error: "Configuration serveur manquante" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { limit?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body JSON invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const limit = Math.min(100, Math.max(1, Number(body.limit) || 50));
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: rows, error: fetchError } = await supabase
    .from("proprietaires")
    .select("id, email, prenom, campaign_j2_sent_at, campaign_j2_fix_sent_at")
    .not("campaign_j2_sent_at", "is", null)
    .is("campaign_j2_fix_sent_at", null)
    .order("campaign_j2_sent_at", { ascending: true })
    .range(0, limit - 1);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: desabonnesRows } = await supabase.from("mailing_desabonnes").select("email");
  const desabonnesSet = new Set(
    (desabonnesRows || []).map((r: { email: string }) => r.email?.toLowerCase()).filter(Boolean)
  );

  const list = (rows || [])
    .filter((r: { email?: string }) => {
      const e = (r.email || "").trim().toLowerCase();
      return isEmailValidePourMailing(r.email || "") && !desabonnesSet.has(e);
    })
    .map((r: { id: string; email: string; prenom?: string }) => ({
      id: r.id,
      email: r.email.trim(),
      prenom: (r.prenom || "").trim() || "Prénom",
    }));

  let sent = 0;
  const failed: { email: string; error: string }[] = [];
  const sentIds: string[] = [];

  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const activationUrl = `${SITE_URL}/#loginEmail=${encodeURIComponent(r.email)}&mode=signup`;
    const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f5;">
    <tr><td style="padding:24px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background:#fff;">
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0 0 14px;font-size:18px;font-weight:600;color:#111;">Bonjour ${r.prenom},</p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#111;">
            Petit message de correction : le lien d'accès de notre précédent e-mail pouvait être indisponible.
          </p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#111;">
            Il est maintenant rétabli. Vous pouvez accéder à votre espace bailleur ici :
          </p>
          <p style="margin:0 0 24px;">
            <a href="${activationUrl}" style="display:inline-block;background:#4A90E2;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;">
              Accéder à mon espace bailleur
            </a>
          </p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#444;">
            Merci pour votre compréhension,<br>Marc — Quittance Simple
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
          to: [r.email],
          subject: "Correctif lien d'accès à votre espace Quittance Simple",
          html,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        failed.push({ email: r.email, error: `${res.status}: ${errText.slice(0, 200)}` });
      } else {
        sent++;
        sentIds.push(r.id);
      }
    } catch (e) {
      failed.push({ email: r.email, error: e instanceof Error ? e.message : String(e) });
    }

    if (i < list.length - 1) await sleep(DEFAULT_DELAY_MS);
  }

  if (sentIds.length > 0) {
    await supabase
      .from("proprietaires")
      .update({ campaign_j2_fix_sent_at: new Date().toISOString() })
      .in("id", sentIds);
  }

  return new Response(
    JSON.stringify({
      sent,
      failed: failed.length,
      failedDetails: failed.length > 0 ? failed : undefined,
      message: `${sent} e-mail(s) correctif J+2 envoyé(s).${failed.length ? ` ${failed.length} échec(s).` : ""}`,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

