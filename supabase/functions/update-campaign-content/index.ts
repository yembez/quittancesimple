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

  let body: {
    adminPassword?: string;
    campaign?: string;
    subject?: string;
    bodyHtml?: string;
    ctaText?: string;
    ctaUrl?: string;
    closingHtml?: string;
    slots?: Record<string, unknown>;
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
  if (
    campaign !== "j2" && campaign !== "j5" && campaign !== "j8" &&
    campaign !== "trial_auto_incomplete_lt20"
  ) {
    return new Response(
      JSON.stringify({ error: "Campagne invalide (j2, j5, j8 ou trial_auto_incomplete_lt20)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  // IMPORTANT: ne pas écraser `body_html` à vide si l'UI n'envoie plus ce champ (Option A slots).
  // On ne set un champ que s'il est fourni (!== undefined). Ainsi, on garde l'historique legacy.
  const upsertRow: Record<string, unknown> = {
    campaign_key: campaign,
    updated_at: new Date().toISOString(),
  };

  if (body.subject !== undefined) upsertRow.subject = body.subject ?? "";
  if (body.bodyHtml !== undefined) upsertRow.body_html = body.bodyHtml ?? "";
  if (body.ctaText !== undefined) upsertRow.cta_text = body.ctaText ?? "";
  if (body.ctaUrl !== undefined) upsertRow.cta_url = body.ctaUrl ?? "";
  if (body.closingHtml !== undefined) upsertRow.closing_html = body.closingHtml ?? "";
  if (body.slots !== undefined) upsertRow.slots = (body.slots && typeof body.slots === "object") ? body.slots : {};

  const { error } = await supabase.from("campaign_templates").upsert(upsertRow, { onConflict: "campaign_key" });

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
