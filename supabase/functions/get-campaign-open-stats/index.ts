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
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const adminPassword = Deno.env.get("ADMIN_ANALYTICS_PASSWORD");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!adminPassword || !supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: { adminPassword?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Body JSON invalide" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if ((body.adminPassword ?? "").trim() !== adminPassword.trim()) {
    return new Response(
      JSON.stringify({ error: "Non autorisé" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { count: total, error: totalError } = await supabase
    .from("campaign_opens")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    return new Response(
      JSON.stringify({ error: totalError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { count: j2, error: j2Error } = await supabase
    .from("campaign_opens")
    .select("*", { count: "exact", head: true })
    .eq("campaign_key", "j2");
  if (j2Error) {
    return new Response(
      JSON.stringify({ error: j2Error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { count: j5, error: j5Error } = await supabase
    .from("campaign_opens")
    .select("*", { count: "exact", head: true })
    .eq("campaign_key", "j5");
  if (j5Error) {
    return new Response(
      JSON.stringify({ error: j5Error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { count: j8, error: j8Error } = await supabase
    .from("campaign_opens")
    .select("*", { count: "exact", head: true })
    .eq("campaign_key", "j8");
  if (j8Error) {
    return new Response(
      JSON.stringify({ error: j8Error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      j2: j2 ?? 0,
      j5: j5 ?? 0,
      j8: j8 ?? 0,
      total: total ?? 0,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

