import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey",
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

  let body: {
    adminPassword?: string;
    campaign?: string;
    subject?: string;
    bodyHtml?: string;
    ctaText?: string;
    ctaUrl?: string;
    closingHtml?: string;
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

  const campaign = (body.campaign ?? "").toLowerCase();
  if (campaign !== "j2" && campaign !== "j5" && campaign !== "j8") {
    return new Response(
      JSON.stringify({ error: "Campagne invalide (j2, j5 ou j8)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error } = await supabase.from("campaign_templates").upsert(
    {
      campaign_key: campaign,
      subject: body.subject ?? "",
      body_html: body.bodyHtml ?? "",
      cta_text: body.ctaText ?? "",
      cta_url: body.ctaUrl ?? "",
      closing_html: body.closingHtml ?? "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "campaign_key" }
  );

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, campaign }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
