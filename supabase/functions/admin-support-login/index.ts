import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

const SITE_URL = "https://www.quittancesimple.fr";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
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

  let body: { adminPassword?: string; email?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body JSON invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if ((body.adminPassword ?? "") !== adminPassword) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = (body.email ?? "").trim();
  if (!email || !email.includes("@")) {
    return new Response(JSON.stringify({ error: "Email invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Choisir la destination selon plan_type.
  const { data: proprietaire } = await supabase
    .from("proprietaires")
    .select("plan_type")
    .ilike("email", email)
    .maybeSingle();

  const planType = (proprietaire as { plan_type?: string } | null)?.plan_type ?? "";
  const redirectPath =
    planType === "free"
      ? `/free-dashboard?email=${encodeURIComponent(email)}`
      : `/dashboard`;

  const redirectTo = `${SITE_URL}${redirectPath}`;
  const ua = req.headers.get("user-agent") ?? "";

  // Générer un magic link (ou invite si l’utilisateur Auth n’existe pas).
  const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
  const linkType: "invite" | "magiclink" = existingUser?.user ? "magiclink" : "invite";

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo },
  });

  const actionLink = linkData?.properties?.action_link;
  if (linkError || !actionLink) {
    return new Response(JSON.stringify({ error: "Impossible de générer le lien d'accès" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Audit log (best-effort).
  try {
    await supabase.from("support_access_logs").insert({
      admin_label: "admin_analytics",
      target_email: email,
      reason: String(body.reason ?? ""),
      redirect_path: redirectPath,
      link_type: linkType,
      user_agent: ua,
    });
  } catch {
    // no-op
  }

  return new Response(
    JSON.stringify({
      success: true,
      email,
      planType,
      redirectPath,
      linkType,
      actionLink,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

