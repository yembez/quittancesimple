import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  // Autoriser les en-têtes envoyés par supabase-js côté front (dont apikey)
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return email.includes("@") && email.includes(".") && email.length >= 5;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let email: string | null = null;

  if (req.method === "GET") {
    const url = new URL(req.url);
    email = url.searchParams.get("email");
  } else {
    try {
      const body = await req.json();
      email = body?.email ?? null;
    } catch {
      email = null;
    }
  }

  const normalized = normalizeEmail(email || "");
  if (!normalized || !isValidEmail(normalized)) {
    return new Response(
      JSON.stringify({ success: false, error: "Adresse e-mail invalide ou manquante" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ success: false, error: "Configuration manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    await supabase.from("mailing_desabonnes").upsert(
      { email: normalized, created_at: new Date().toISOString() },
      { onConflict: "email" }
    );

    const { error: updateErr } = await supabase
      .from("proprietaires")
      .update({ mailing_desabonne: true })
      .eq("email", normalized);

    if (updateErr) {
      console.warn("Unsubscribe: update proprietaires:", updateErr.message);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Vous êtes bien désabonné des communications Quittance Simple." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur lors du désabonnement" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
