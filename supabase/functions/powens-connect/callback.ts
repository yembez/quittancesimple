// supabase/functions/powens-connect/callback.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

Deno.serve(async (req: Request) => {
  // Préflight CORS éventuel
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any = null;

  try {
    payload = await req.json();
  } catch (_err) {
    // Si jamais le body n'est pas du JSON
    payload = null;
  }

  console.log("🔔 Powens webhook reçu sur /powens-connect/callback");
  console.log("Headers:", Object.fromEntries(req.headers.entries()));
  console.log("Body:", payload);

  try {
    // On loggue simplement le webhook pour debug dans powens_callback_logs
    await supabase.from("powens_callback_logs").insert({
      event_type: "powens_webhook",
      request_url: req.url,
      request_method: req.method,
      response_body: payload,
    });
  } catch (e: any) {
    console.error("❌ Erreur lors de l'insertion dans powens_callback_logs :", e?.message);
    // Même en cas d'erreur de log, on renvoie 200 à Powens
  }

  // Très important : répondre 200 pour arrêter les retries Powens
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
