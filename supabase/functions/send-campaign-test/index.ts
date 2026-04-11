import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCampaignEmailHtml } from "../_shared/campaign-email-template.ts";
import { openLoginLandingInsteadOfDashboard } from "../_shared/email-landing-urls.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

const SITE_URL = "https://www.quittancesimple.fr";

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

  const adminPassword = Deno.env.get("ADMIN_ANALYTICS_PASSWORD");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!adminPassword || !resendKey || !supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: {
    adminPassword?: string;
    testEmail?: string;
    campaign?: string;
    payload?: {
      subject?: string;
      bodyHtml?: string;
      ctaText?: string;
      ctaUrl?: string;
      closingHtml?: string;
    };
  };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Body JSON invalide" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if ((body.adminPassword ?? "") !== adminPassword) {
    return new Response(
      JSON.stringify({ error: "Non autorisé" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const testEmail = (body.testEmail ?? "").trim();
  if (!testEmail || !testEmail.includes("@")) {
    return new Response(
      JSON.stringify({ error: "Adresse e-mail de test requise" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let subject: string;
  let bodyHtml: string;
  let ctaText: string;
  let ctaUrl: string;
  let closingHtml: string;
  let slots: unknown = undefined;

  if (body.payload?.subject != null) {
    subject = body.payload.subject ?? "";
    bodyHtml = body.payload.bodyHtml ?? "";
    ctaText = body.payload.ctaText ?? "";
    ctaUrl = body.payload.ctaUrl ?? "";
    closingHtml = body.payload.closingHtml ?? "";
  } else {
    const campaign = (body.campaign ?? "j2").toLowerCase();
    if (campaign !== "j2" && campaign !== "j5" && campaign !== "j8") {
      return new Response(
        JSON.stringify({ error: "Campagne invalide (j2, j5 ou j8)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: row, error } = await supabase
      .from("campaign_templates")
      .select("subject, body_html, cta_text, cta_url, closing_html, slots")
      .eq("campaign_key", campaign)
      .single();

    if (error || !row) {
      return new Response(
        JSON.stringify({ error: "Contenu campagne introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    subject = row.subject ?? "";
    bodyHtml = row.body_html ?? "";
    ctaText = row.cta_text ?? "";
    ctaUrl = row.cta_url ?? "";
    closingHtml = row.closing_html ?? "";
    // Option A (slots) : si présents, on les passe au template sans parsing.
    slots = (row as { slots?: unknown }).slots;
  }

  const prenom = "Prénom";
  const subjectPersonalized = (subject || "")
    .replace(/\{\{\s*prenom\s*\}\}/gi, prenom)
    .replace(/\[\s*Prénom\s*\]/gi, prenom);
  let ctaUrlPersonalized = (ctaUrl || "").replace(/\{\{\s*email\s*\}\}/gi, encodeURIComponent(testEmail));
  if (ctaUrlPersonalized) {
    ctaUrlPersonalized = openLoginLandingInsteadOfDashboard(ctaUrlPersonalized, {
      fallbackLoginEmail: testEmail,
    });
  }
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(testEmail)}`;

  const html = buildCampaignEmailHtml({
    prenom,
    lienActivation: ctaUrlPersonalized || `${SITE_URL}/`,
    lienDesabonnement: unsubscribeUrl,
    bodyHtml,
    ctaText,
    closingHtml,
    slots: (slots && typeof slots === "object") ? (slots as Record<string, unknown>) : undefined,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Marc – Quittance Simple <contact@quittancesimple.fr>",
      reply_to: "Marc – Quittance Simple <contact@quittancesimple.fr>",
      to: [testEmail],
      subject: subjectPersonalized || subject || "Test campagne",
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return new Response(
      JSON.stringify({ error: `Envoi échoué: ${res.status} ${errText.slice(0, 200)}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: `E-mail de test envoyé à ${testEmail}.` }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
