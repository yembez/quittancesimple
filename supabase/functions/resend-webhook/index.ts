import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

interface ResendEvent {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string | string[];
    subject?: string;
    tags?: Array<{ name?: string; value?: string }>;
  };
}

function normaliseEmail(value: unknown): string | null {
  if (!value) return null;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === "string" ? first.trim().toLowerCase() : null;
  }
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }
  return null;
}

function extractCampaignFromTags(tags: ResendEvent["data"]["tags"]): string | null {
  if (!tags || !Array.isArray(tags)) return null;
  for (const t of tags) {
    const name = (t.name || "").toString().toLowerCase();
    const value = (t.value || "").toString().toLowerCase();
    if (!name && !value) continue;
    // On accepte soit name=campaign, soit value=j2/j5/j8
    if (name === "campaign" && (value === "j2" || value === "j5" || value === "j8")) {
      return value;
    }
    if (!name && (value === "j2" || value === "j5" || value === "j8")) {
      return value;
    }
  }
  return null;
}

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

  const rawBody = await req.text();

  let event: ResendEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(
      JSON.stringify({ error: "Body JSON invalide" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!event || event.type !== "email.opened") {
    return new Response(
      JSON.stringify({ ok: true, ignored: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Configuration serveur manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const openedAt = event.created_at || new Date().toISOString();
  const email = normaliseEmail(event.data?.to);
  const campaign = extractCampaignFromTags(event.data?.tags);

  if (!email || !campaign) {
    return new Response(
      JSON.stringify({ ok: true, ignored: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from("campaign_opens").insert({
      email,
      campaign_key: campaign,
      opened_at: openedAt,
    });
  } catch (_err) {
    // On ne renvoie pas d'erreur à Resend pour ne pas bloquer le webhook
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

