import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

const VALID_CAMPAIGNS = ["j2", "j5", "j8"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(null, { status: 405, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const campaign = (url.searchParams.get("campaign") ?? "").toLowerCase();
  const to = url.searchParams.get("to") ?? "";

  const redirectTo = to.startsWith("http://") || to.startsWith("https://")
    ? to
    : "https://www.quittancesimple.fr/";

  if (VALID_CAMPAIGNS.includes(campaign)) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        await supabase.from("campaign_cta_clicks").insert({
          campaign_key: campaign,
          clicked_at: new Date().toISOString(),
        });
      } catch (_e) {
        // Ne pas bloquer la redirection en cas d’erreur d’écriture
      }
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: redirectTo,
    },
  });
});
