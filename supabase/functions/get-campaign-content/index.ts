import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
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

  const adminPassword = Deno.env.get("ADMIN_ANALYTICS_PASSWORD");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!adminPassword || !supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { adminPassword?: string };
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

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: rows, error } = await supabase
    .from("campaign_templates")
    .select("campaign_key, subject, body_html, cta_text, cta_url, closing_html, slots, updated_at");

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const j2 = (rows || []).find((r: { campaign_key: string }) => r.campaign_key === "j2");
  const j5 = (rows || []).find((r: { campaign_key: string }) => r.campaign_key === "j5");
  const j8 = (rows || []).find((r: { campaign_key: string }) => r.campaign_key === "j8");
  const trialLt20 = (rows || []).find((r: { campaign_key: string }) => r.campaign_key === "trial_auto_incomplete_lt20");

  const mapRow = (r: { subject: string; body_html: string; cta_text: string; cta_url: string; closing_html: string; slots?: unknown; updated_at: string } | undefined) =>
    r
      ? {
          subject: r.subject,
          bodyHtml: r.body_html,
          ctaText: r.cta_text,
          ctaUrl: r.cta_url,
          closingHtml: r.closing_html,
          slots: (r.slots && typeof r.slots === "object") ? r.slots : {},
          updatedAt: r.updated_at,
        }
      : { subject: "", bodyHtml: "", ctaText: "", ctaUrl: "", closingHtml: "", slots: {}, updatedAt: "" };

  return new Response(
    JSON.stringify({
      j2: mapRow(j2),
      j5: mapRow(j5),
      j8: mapRow(j8),
      trial_auto_incomplete_lt20: mapRow(trialLt20),
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
