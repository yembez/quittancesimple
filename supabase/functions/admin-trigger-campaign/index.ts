import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey",
};

/** Payload J+2 (premier email campagne free leads) */
const PAYLOAD_J2 = {
  segment: "free_leads",
  subject: "Votre Espace Bailleur est prêt — vos infos sont déjà là",
  bodyHtml: `<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bonjour {{ prenom }},</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Vous avez utilisé notre générateur de quittances récemment et je vous en remercie.</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Aujourd'hui, nous vous ouvrons l'accès à votre <strong>QS - Espace Bailleur</strong>.<br>Plus qu'un simple outil, c'est le nouvel assistant de gestion tout-en-un des bailleurs qui optent pour la simplicité et la sérénité.</p><p style="margin: 0 0 0.9em 0; line-height: 1.75;">Pourquoi vous allez apprécier :</p><ul style="margin: 0.2em 0 1.25em 1.2em; padding-left: 1em; line-height: 1.75;"><li style="margin-bottom: 0.7em;"><strong>Gain de temps</strong> — vos infos et celles de votre locataire sont déjà pré-remplies.</li><li style="margin-bottom: 0.7em;"><strong>Automatisation</strong> — vos quittances s'envoient désormais toutes seules, après un clic de validation (vous gardez le contrôle).</li><li style="margin-bottom: 0.1em;"><strong>Nouveautés</strong> — signature de bail par SMS, calcul d'IRL automatique et aide à la rédaction d'annonces par IA, etc.</li></ul><p style="margin: 0 0 1.15em 0; line-height: 1.75;">On a voulu faire simple, vraiment simple, parce qu'on est bailleurs nous aussi. Prenez le temps de découvrir l'outil à votre rythme.</p>`,
  ctaText: "Découvrir mon espace",
  ctaUrl: "https://www.quittancesimple.fr/#loginEmail={{ email }}&mode=signup",
  closingHtml: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 4px;"><tr><td style="padding-right: 12px; vertical-align: middle;"><img src="https://www.quittancesimple.fr/images/guilhem-photo-3.png" alt="Guilhem, Quittance Simple" style="width: 76px; height: 76px; border-radius: 999px; display: block; object-fit: cover; object-position: 50% 28%;"></td><td style="font-size: 14px; line-height: 1.5; color: #111827; vertical-align: middle;">À bientôt,<br><strong>Guilhem</strong><br><span style="color:#4b5563;">Fondateur de Quittance Simple</span><br><span style="color:#4b5563;">Bailleur comme vous</span></td></tr></table>`,
  limit: 100,
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

  if (!adminPassword || !mailingSecret || !supabaseUrl) {
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

  if (campaign === "j5" || campaign === "j8") {
    return new Response(
      JSON.stringify({ error: "Campagne J+5 et J+8 à venir. Contenu non configuré." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const payload = campaign === "j2" ? PAYLOAD_J2 : null;
  if (!payload) {
    return new Response(
      JSON.stringify({ error: "Payload campagne introuvable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

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
