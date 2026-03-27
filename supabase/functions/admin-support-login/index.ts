import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

const SITE_URL = "https://www.quittancesimple.fr";

Deno.serve(async (req: Request) => {
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return json({ error: "Méthode non autorisée" }, 405);
    }

    const adminPassword = Deno.env.get("ADMIN_ANALYTICS_PASSWORD");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!adminPassword || !supabaseUrl || !serviceKey) {
      return json({ error: "Configuration serveur manquante" }, 500);
    }

    let body: { adminPassword?: string; email?: string; reason?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body JSON invalide" }, 400);
    }

    if ((body.adminPassword ?? "") !== adminPassword) {
      return json({ error: "Non autorisé" }, 401);
    }

    const email = (body.email ?? "").trim();
    if (!email || !email.includes("@")) {
      return json({ error: "Email invalide" }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Choisir la destination selon plan_type.
    const { data: proprietaire, error: propErr } = await supabase
      .from("proprietaires")
      .select("plan_type")
      .ilike("email", email)
      .maybeSingle();
    if (propErr) {
      return json({ error: "Erreur lecture propriétaire", detail: propErr.message }, 500);
    }

    const planType = (proprietaire as { plan_type?: string } | null)?.plan_type ?? "";
    const redirectPath =
      planType === "free"
        ? `/free-dashboard?email=${encodeURIComponent(email)}`
        : `/dashboard`;

    const redirectTo = `${SITE_URL}${redirectPath}`;
    const ua = req.headers.get("user-agent") ?? "";

    // Générer un magic link (ou invite si l’utilisateur Auth n’existe pas).
    const { data: existingUser, error: getUserErr } = await supabase.auth.admin.getUserByEmail(email);
    if (getUserErr) {
      return json({ error: "Erreur lecture Auth user", detail: getUserErr.message }, 500);
    }

    const linkType: "invite" | "magiclink" = existingUser?.user ? "magiclink" : "invite";

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: linkType,
      email,
      options: { redirectTo },
    });

    const actionLink = linkData?.properties?.action_link;
    if (linkError || !actionLink) {
      console.error("admin-support-login: generateLink failed", {
        linkType,
        email,
        redirectTo,
        error: linkError?.message,
      });
      return json(
        {
          error: "Impossible de générer le lien d'accès",
          detail: linkError?.message || "action_link manquant",
          redirectTo,
          linkType,
        },
        500
      );
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
    } catch (e) {
      console.warn("admin-support-login: audit insert failed", e);
    }

    return json({
      success: true,
      email,
      planType,
      redirectPath,
      linkType,
      actionLink,
    });
  } catch (e) {
    console.error("admin-support-login: unexpected error", e);
    return json(
      {
        error: "Erreur serveur inattendue",
        detail: e instanceof Error ? e.message : String(e),
      },
      500
    );
  }
});


