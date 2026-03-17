import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCampaignEmailHtml } from "../_shared/campaign-email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

const DOMAINE_TEST = "@maildrop.cc";
const PREFIX_TEST = "2speek";
const DEFAULT_DELAY_MS = 800;
const SITE_URL = "https://www.quittancesimple.fr";

function isEmailValidePourMailing(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const e = email.trim().toLowerCase();
  if (e.endsWith(DOMAINE_TEST)) return false;
  if (e.startsWith(PREFIX_TEST)) return false;
  return e.includes("@") && e.includes(".");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const SEGMENT_BY_CAMPAIGN: Record<string, string> = {
  j2: "free_leads",
  j5: "leads_j5",
  j8: "leads_j8",
};

type CampaignField = "campaign_j2_sent_at" | "campaign_j5_sent_at" | "campaign_j8_sent_at";
const CAMPAIGN_FIELD_BY_KEY: Record<string, CampaignField> = {
  j2: "campaign_j2_sent_at",
  j5: "campaign_j5_sent_at",
  j8: "campaign_j8_sent_at",
};

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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { campaign?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Body JSON invalide" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const campaign = (body.campaign ?? "").toLowerCase();
  if (campaign !== "j2" && campaign !== "j5" && campaign !== "j8") {
    return new Response(
      JSON.stringify({ error: "Campagne invalide. Utilisez j2, j5 ou j8." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: row, error } = await supabase
    .from("campaign_templates")
    .select("subject, body_html, cta_text, cta_url, closing_html")
    .eq("campaign_key", campaign)
    .single();

  if (error || !row) {
    return new Response(
      JSON.stringify({ error: "Contenu campagne introuvable en base." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const segment = SEGMENT_BY_CAMPAIGN[campaign] ?? "free_leads";
  const limit = Math.min(100, Math.max(1, Number(body.limit) || 100));
  const campaignField = CAMPAIGN_FIELD_BY_KEY[campaign];

  let query = supabase
    .from("proprietaires")
    .select("id, email, nom, prenom, created_at, lead_statut, nombre_quittances, campaign_j2_sent_at, campaign_j5_sent_at, campaign_j8_sent_at")
    .not("email", "is", null)
    .not("email", "ilike", "%" + DOMAINE_TEST + "%")
    .or("mailing_desabonne.is.null,mailing_desabonne.eq.false")
    .order("created_at", { ascending: true });

  // J+2 : mêmes critères que J+5/J+8 (uniquement leads "quittance gratuite" non inscrits)
  if (segment === "free_leads") {
    query = query
      .eq("lead_statut", "free_quittance_pdf")
      .gte("nombre_quittances", 1)
      .is("campaign_j2_sent_at", null);
  } else if (segment === "leads_j5") {
    query = query.eq("lead_statut", "free_quittance_pdf").is("campaign_j5_sent_at", null);
  } else if (segment === "leads_j8") {
    query = query.eq("lead_statut", "free_quittance_pdf").is("campaign_j8_sent_at", null);
  }

  const { data: rows, error: fetchError } = await query.range(0, limit - 1);
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

  const list = (rows || [])
    .filter((r: { email?: string }) => {
      const e = (r.email || "").trim().toLowerCase();
      return isEmailValidePourMailing(r.email || "") && !desabonnesSet.has(e);
    })
    .map((r: { id?: number; email: string; prenom?: string }) => ({
      id: r.id,
      email: r.email,
      prenom: (r.prenom || "").trim() || "",
    }));

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const subjectTemplate = (row.subject ?? "").trim();
  const bodyHtml = (row.body_html ?? "").trim();
  const ctaText = row.cta_text ?? "";
  const ctaUrlRaw = row.cta_url ?? "";
  const closingHtml = row.closing_html ?? "";
  const delayMs = Math.max(500, DEFAULT_DELAY_MS);

  let sent = 0;
  const sentIds: (string | number)[] = [];
  const failed: { email: string; error: string }[] = [];

  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const prenom = (r.prenom || "").trim() || "";
    let subjectPersonalized = subjectTemplate
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenom)
      .replace(/\[\s*Prénom\s*\]/gi, prenom);
    if (!prenom) {
      subjectPersonalized = subjectPersonalized.replace(/^,\s*/, "").replace(/\s{2,}/g, " ").trim();
    }
    const ctaUrlPersonalized = ctaUrlRaw.replace(/\{\{\s*email\s*\}\}/gi, encodeURIComponent(r.email.trim()));
    const ctaUrlForEmail = ctaUrlPersonalized
      ? `${supabaseUrl}/functions/v1/track-cta-click?campaign=${campaign}&to=${encodeURIComponent(ctaUrlPersonalized)}`
      : undefined;
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(r.email.trim())}`;

    const html = buildCampaignEmailHtml({
      prenom: prenom || "Prénom",
      lienActivation: ctaUrlForEmail || ctaUrlPersonalized || `${SITE_URL}/`,
      lienDesabonnement: unsubscribeUrl,
      bodyHtml,
      ctaText,
      closingHtml,
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
      subject: subjectPersonalized || subjectTemplate,
          html,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        failed.push({ email: r.email, error: `${res.status}: ${errText.slice(0, 200)}` });
      } else {
        sent++;
        if (r.id != null) sentIds.push(r.id as string | number);
      }
    } catch (err) {
      failed.push({ email: r.email, error: err instanceof Error ? err.message : String(err) });
    }
    if (i < list.length - 1) await sleep(delayMs);
  }

  if (sentIds.length > 0 && campaignField) {
    const updatePayload: Record<string, string> = {};
    updatePayload[campaignField] = new Date().toISOString();
    await supabase.from("proprietaires").update(updatePayload).in("id", sentIds);
  }

  const json = {
    sent,
    failed: failed.length,
    failedDetails: failed.length > 0 ? failed : undefined,
    message: `${sent} e-mail(s) envoyé(s).${failed.length > 0 ? ` ${failed.length} échec(s).` : ""}`,
  };
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
