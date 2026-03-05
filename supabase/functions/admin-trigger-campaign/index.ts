import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

const SEGMENT_BY_CAMPAIGN: Record<string, string> = {
  j2: "free_leads",
  j5: "leads_j5",
  j8: "leads_j8",
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
  const mailingSecret = Deno.env.get("MAILING_LIST_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!adminPassword || !mailingSecret || !supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { adminPassword?: string; campaign?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Body JSON invalide" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const providedPassword = body.adminPassword ?? "";
  if (providedPassword !== adminPassword) {
    return new Response(
      JSON.stringify({ error: "Non autorisé" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
  const payload = {
    segment,
    subject: row.subject ?? "",
    bodyHtml: row.body_html ?? "",
    ctaText: row.cta_text ?? "",
    ctaUrl: row.cta_url ?? "",
    closingHtml: row.closing_html ?? "",
    limit: 100,
  };

  const url = `${supabaseUrl}/functions/v1/send-bulk-mailing`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Mailing-List-Secret": mailingSecret,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return new Response(JSON.stringify(json), {
    status: res.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
