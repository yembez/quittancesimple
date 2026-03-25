import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCampaignEmailHtml } from "../_shared/campaign-email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

const SITE_URL = "https://www.quittancesimple.fr";

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
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

  const adminPassword = Deno.env.get("ADMIN_ANALYTICS_PASSWORD");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!adminPassword || !supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { adminPassword?: string; campaign?: string; email?: string; prenom?: string };
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

  const email = (body.email ?? "preview@quittancesimple.fr").trim();
  const prenom = (body.prenom ?? "Prénom").trim() || "Prénom";
  const subject = String(row.subject ?? "")
    .replace(/\{\{\s*prenom\s*\}\}/gi, prenom)
    .replace(/\[\s*Prénom\s*\]/gi, prenom);
  const ctaUrlPersonalized = String(row.cta_url ?? "").replace(/\{\{\s*email\s*\}\}/gi, encodeURIComponent(email));
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`;

  const html = buildCampaignEmailHtml({
    prenom,
    lienActivation: ctaUrlPersonalized || `${SITE_URL}/`,
    lienDesabonnement: unsubscribeUrl,
    bodyHtml: String(row.body_html ?? ""),
    ctaText: String(row.cta_text ?? ""),
    closingHtml: String(row.closing_html ?? ""),
    slots: (row as { slots?: unknown }).slots as Record<string, unknown>,
  });

  const htmlHash = await sha256Hex(html);
  const subjectHash = await sha256Hex(subject);

  return new Response(
    JSON.stringify({
      campaign,
      subject,
      subjectHash,
      html,
      htmlHash,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

