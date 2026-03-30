import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

type LocLite = {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  adresse_logement: string | null;
  mode_envoi_quittance: string | null;
  date_rappel?: number | null;
  heure_rappel?: number | null;
  minute_rappel?: number | null;
};

type PropLite = {
  id: string;
  email: string | null;
  nom: string | null;
  prenom: string | null;
  lead_statut: string | null;
  date_fin_essai: string | null;
  abonnement_actif: boolean | null;
};

/** Aligné sur les exclusions du rapport essai (comptes / e-mails de test). */
function isExcludedTestBailleurEmail(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return false;
  if (e.endsWith("@maildrop.cc")) return true;
  if (e.endsWith("@maidrop.cc")) return true;
  if (e.includes("@sharklasers.com")) return true;
  if (e.startsWith("2speek")) return true;
  if (e.startsWith("skszqtuxxeacphxxhw@ne")) return true;
  const blocked = new Set([
    "bailleur@maildrop.cc",
    "bailleur@maidrop.cc",
    "bailleur2@gmail.com",
    "noreply.eazypic@gmail.com",
    "ioeqwdv@sharklasers.com",
    "lioeqwdv@sharklasers.com",
  ]);
  return blocked.has(e);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
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

  let body: { adminPassword?: string };
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

  const supabase = createClient(supabaseUrl, serviceKey);

  // --- 1) Préavis / envoi auto : lignes actives dans quittances_systematic
  const { data: sysRows, error: sysErr } = await supabase
    .from("quittances_systematic")
    .select(
      "id, status, periode, date_preavis, date_envoi_auto, created_at, locataire_id, proprietaire_id",
    )
    .in("status", ["pending_owner_action", "reminder_sent"])
    .order("date_envoi_auto", { ascending: true, nullsFirst: false });

  if (sysErr) {
    console.error("[get-admin-automation-overview] systematic:", sysErr);
    return new Response(JSON.stringify({ error: sysErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const systematic = (sysRows ?? []) as Array<{
    id: string;
    status: string;
    periode: string;
    date_preavis: string;
    date_envoi_auto: string;
    created_at: string;
    locataire_id: string;
    proprietaire_id: string;
  }>;

  const locIds = [...new Set(systematic.map((r) => r.locataire_id))];
  const propIds = [...new Set(systematic.map((r) => r.proprietaire_id))];

  const locMap = new Map<string, LocLite>();
  const propMap = new Map<string, PropLite>();

  if (locIds.length > 0) {
    const { data: locs } = await supabase
      .from("locataires")
      .select(
        "id, nom, prenom, email, telephone, adresse_logement, mode_envoi_quittance",
      )
      .in("id", locIds);
    for (const l of locs || []) locMap.set((l as LocLite).id, l as LocLite);
  }
  if (propIds.length > 0) {
    const { data: props } = await supabase
      .from("proprietaires")
      .select("id, email, nom, prenom, lead_statut, date_fin_essai, abonnement_actif")
      .in("id", propIds);
    for (const p of props || []) propMap.set((p as PropLite).id, p as PropLite);
  }

  const systematicEnriched = systematic.map((row) => ({
    ...row,
    locataire: locMap.get(row.locataire_id) ?? null,
    proprietaire: propMap.get(row.proprietaire_id) ?? null,
  }));

  const systematicFiltered = systematicEnriched
    .filter((r) => r.proprietaire && !isExcludedTestBailleurEmail(r.proprietaire.email))
    .sort(
      (a, b) =>
        new Date(a.date_envoi_auto).getTime() - new Date(b.date_envoi_auto).getTime(),
    );

  // --- 2) Rappel classique : configs actives (récurrence)
  const { data: classicRows, error: classicErr } = await supabase
    .from("locataires")
    .select(
      "id, nom, prenom, email, telephone, adresse_logement, date_rappel, heure_rappel, minute_rappel, mode_envoi_quittance, proprietaire_id",
    )
    .eq("mode_envoi_quittance", "rappel_classique")
    .not("date_rappel", "is", null)
    .gt("date_rappel", 0)
    .not("heure_rappel", "is", null)
    .not("minute_rappel", "is", null)
    .order("proprietaire_id")
    .limit(3000);

  if (classicErr) {
    console.error("[get-admin-automation-overview] classic:", classicErr);
    return new Response(JSON.stringify({ error: classicErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const classicList = (classicRows ?? []) as Array<
    LocLite & { proprietaire_id: string }
  >;
  const classicPropIds = [...new Set(classicList.map((r) => r.proprietaire_id))];
  const classicPropMap = new Map<string, PropLite>();
  if (classicPropIds.length > 0) {
    const { data: props2 } = await supabase
      .from("proprietaires")
      .select("id, email, nom, prenom, lead_statut, date_fin_essai, abonnement_actif")
      .in("id", classicPropIds);
    for (const p of props2 || []) classicPropMap.set((p as PropLite).id, p as PropLite);
  }

  const rappelClassique = classicList.map((l) => {
    const pr = classicPropMap.get(l.proprietaire_id);
    const hr = l.heure_rappel ?? 0;
    const mn = l.minute_rappel ?? 0;
    const libelleRappel = `Le ${l.date_rappel} de chaque mois à ${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
    return {
      locataire: {
        id: l.id,
        nom: l.nom,
        prenom: l.prenom,
        email: l.email,
        telephone: l.telephone,
        adresse_logement: l.adresse_logement,
        mode_envoi_quittance: l.mode_envoi_quittance,
        date_rappel: l.date_rappel,
        heure_rappel: l.heure_rappel,
        minute_rappel: l.minute_rappel,
        libelle_rappel_mensuel: libelleRappel,
      },
      proprietaire: pr ?? null,
    };
  });

  const rappelClassiqueFiltered = rappelClassique
    .filter((r) => r.proprietaire && !isExcludedTestBailleurEmail(r.proprietaire.email))
    .sort((a, b) => {
      const ea = (a.proprietaire?.email ?? "").toLowerCase();
      const eb = (b.proprietaire?.email ?? "").toLowerCase();
      const c = ea.localeCompare(eb, "fr");
      if (c !== 0) return c;
      const na = [a.locataire.prenom, a.locataire.nom].filter(Boolean).join(" ");
      const nb = [b.locataire.prenom, b.locataire.nom].filter(Boolean).join(" ");
      return na.localeCompare(nb, "fr");
    });

  const stats = {
    systematic_pending: systematicFiltered.filter((r) => r.status === "pending_owner_action").length,
    systematic_reminder_sent: systematicFiltered.filter((r) => r.status === "reminder_sent").length,
    systematic_total: systematicFiltered.length,
    rappel_classique_locataires: rappelClassiqueFiltered.length,
  };

  return new Response(
    JSON.stringify({
      stats,
      systematic: systematicFiltered,
      rappelClassique: rappelClassiqueFiltered,
      generatedAt: new Date().toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
