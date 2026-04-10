import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

type SegState =
  | "paid_active"
  | "trial_active"
  | "trial_expired"
  | "account_no_trial"
  | "lead_only";

type Row = {
  id: string;
  email: string | null;
  nom: string | null;
  prenom: string | null;
  created_at: string | null;
  date_inscription: string | null;
  date_fin_essai: string | null;
  plan_type: string | null;
  plan_actuel: string | null;
  abonnement_actif: boolean | null;
  lead_statut: string | null;
  user_id: string | null;
  stripe_subscription_id: string | null;
  features_enabled: Record<string, boolean> | null;
};

function toDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function safeDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeState(r: Row, now: Date): { state: SegState; days_remaining: number | null; days_since_signup: number | null } {
  const hasStripe = !!(r.stripe_subscription_id && String(r.stripe_subscription_id).trim());
  const today = toDay(now);

  // Compte créé ?
  const hasAccount = !!(r.user_id && String(r.user_id).trim());

  // Essai ?
  const end = safeDate(r.date_fin_essai);
  let daysRemaining: number | null = null;
  if (end) {
    const endDay = toDay(end);
    daysRemaining = Math.ceil((endDay.getTime() - today.getTime()) / 86400000);
  }

  // Ancienneté
  const ref = safeDate(r.date_inscription) || safeDate(r.created_at);
  let daysSince: number | null = null;
  if (ref) {
    daysSince = Math.floor((today.getTime() - toDay(ref).getTime()) / 86400000);
  }

  if (hasStripe) return { state: "paid_active", days_remaining: daysRemaining, days_since_signup: daysSince };
  if (!hasAccount) return { state: "lead_only", days_remaining: daysRemaining, days_since_signup: daysSince };

  if (end) {
    if ((daysRemaining ?? -999) >= 0) return { state: "trial_active", days_remaining: daysRemaining, days_since_signup: daysSince };
    return { state: "trial_expired", days_remaining: daysRemaining, days_since_signup: daysSince };
  }

  return { state: "account_no_trial", days_remaining: null, days_since_signup: daysSince };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminPassword = Deno.env.get("ADMIN_ANALYTICS_PASSWORD");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!adminPassword || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Configuration serveur manquante" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { adminPassword?: string; limit?: number; offset?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body JSON invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if ((body.adminPassword ?? "").trim() !== adminPassword.trim()) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const limit = Math.min(Math.max(Number(body.limit ?? 2000) || 2000, 1), 5000);
  const offset = Math.max(Number(body.offset ?? 0) || 0, 0);

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("proprietaires")
    .select(
      "id, email, nom, prenom, created_at, date_inscription, date_fin_essai, plan_type, plan_actuel, abonnement_actif, lead_statut, user_id, stripe_subscription_id, features_enabled",
    )
    .not("email", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const rows = (data || []) as Row[];
  const enriched = rows.map((r) => {
    const seg = computeState(r, now);
    return {
      ...r,
      state: seg.state,
      days_remaining: seg.days_remaining,
      days_since_signup: seg.days_since_signup,
    };
  });

  const stats: Record<SegState, number> = {
    paid_active: 0,
    trial_active: 0,
    trial_expired: 0,
    account_no_trial: 0,
    lead_only: 0,
  };
  for (const r of enriched) stats[r.state as SegState] += 1;

  return new Response(JSON.stringify({ total: enriched.length, stats, rows: enriched }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

