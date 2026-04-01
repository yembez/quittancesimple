import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

type TrialLeadRow = {
  id: string;
  email: string;
  telephone?: string | null;
  user_id?: string | null;
  nom: string | null;
  prenom: string | null;
  date_inscription: string | null;
  created_at: string | null;
  date_fin_essai: string | null;
  nombre_quittances: number;
  lead_statut: string | null;
  password_set: boolean | null;
  welcome_email_sent_at: string | null;
  campaign_j2_sent_at: string | null;
  campaign_j5_sent_at: string | null;
  campaign_j8_sent_at: string | null;
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

  // 1) Récupérer tous les leads créés (essai + comptes gratuits)
  const { data: rows, error: trialError } = await supabase
    .from("proprietaires")
    .select(
      "id, user_id, email, telephone, nom, prenom, created_at, date_inscription, date_fin_essai, nombre_quittances, lead_statut, password_set, welcome_email_sent_at, campaign_j2_sent_at, campaign_j5_sent_at, campaign_j8_sent_at",
    )
    .in("lead_statut", ["QA_1st_interested", "free_account"])
    .not("email", "ilike", "2speek%")
    .not("email", "ilike", "%@maildrop.cc")
    .neq("email", "bailleur@maildrop.cc")
    .neq("email", "bailleur@maidrop.cc")
    .neq("email", "bailleur2@gmail.com")
    .neq("email", "noreply.eazypic@gmail.com")
    .neq("email", "ioeqwdv@sharklasers.com")
    .neq("email", "lioeqwdv@sharklasers.com")
    // Adresse de test qui commence par \"skszqtuxxeacphxxhw@ne...\" (on filtre par préfixe pour couvrir toutes les variantes)
    .not("email", "ilike", "skszqtuxxeacphxxhw@ne%");

  if (trialError) {
    return new Response(
      JSON.stringify({ error: trialError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const allLeads = (rows || []) as TrialLeadRow[];
  if (allLeads.length === 0) {
    return new Response(
      JSON.stringify({ trialLeads: [], trialStats: { count: 0, active: 0, expired: 0 }, freeLeads: [], freeStats: { count: 0, active: 0, expired: 0 } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const trialRows = allLeads.filter((l) => l.lead_statut === "QA_1st_interested");
  const freeRows = allLeads.filter((l) => l.lead_statut === "free_account");

  const leadIds = allLeads.map((l) => l.id);
  const leadEmailsLower = allLeads.map((l) => (l.email || "").trim().toLowerCase()).filter(Boolean);

  // 1bis) Locataires par lead : compter ceux sans email (erreur "fausse activation").
  const { data: locRows, error: locErr } = await supabase
    .from("locataires")
    .select("id, proprietaire_id, email, actif")
    .in("proprietaire_id", leadIds);

  if (locErr) {
    return new Response(
      JSON.stringify({ error: "Erreur lecture locataires", detail: locErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const locStatsByLead = new Map<string, { total: number; active: number; missing_email_active: number }>();
  for (const r of locRows || []) {
    const pid = (r as any).proprietaire_id as string;
    const actif = Boolean((r as any).actif);
    const email = String((r as any).email ?? "").trim();
    if (!locStatsByLead.has(pid)) locStatsByLead.set(pid, { total: 0, active: 0, missing_email_active: 0 });
    const s = locStatsByLead.get(pid)!;
    s.total += 1;
    if (actif) {
      s.active += 1;
      if (!email) s.missing_email_active += 1;
    }
  }

  // 2) Origine « quittance gratuite » via free_quittance_snapshots
  const { data: snapshots } = await supabase
    .from("free_quittance_snapshots")
    .select("email")
    .in("email", leadEmailsLower);

  const snapshotEmails = new Set(
    (snapshots || [])
      .map((r: { email: string }) => (r.email || "").trim().toLowerCase())
      .filter(Boolean),
  );

  // 3) Relances d'essai envoyées (trial_reminders.status = 'sent')
  const { data: reminders } = await supabase
    .from("trial_reminders")
    .select("proprietaire_id, reminder_type, sent_at, status")
    .in("proprietaire_id", leadIds)
    .eq("status", "sent");

  const remindersByLead = new Map<
    string,
    { reminder_type: string; sent_at: string | null }[]
  >();

  for (const r of reminders || []) {
    const pid = r.proprietaire_id as string;
    if (!remindersByLead.has(pid)) remindersByLead.set(pid, []);
    remindersByLead.get(pid)!.push({
      reminder_type: r.reminder_type as string,
      sent_at: r.sent_at ?? null,
    });
  }

  // 4) Calcul des jours restants
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enrich = (subset: TrialLeadRow[]) =>
    subset.map((l) => {
    let daysRemaining: number | null = null;
    if (l.date_fin_essai) {
      const end = new Date(l.date_fin_essai);
      end.setHours(0, 0, 0, 0);
      daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    const emailLower = (l.email || "").trim().toLowerCase();
    const origine = snapshotEmails.has(emailLower) ? "quittance_gratuite" : "vierge";

    const trialEmails = remindersByLead.get(l.id) || [];
    const locStats = locStatsByLead.get(l.id) ?? { total: 0, active: 0, missing_email_active: 0 };
    const ownerPhoneOk = !!String((l as any).telephone ?? "").trim();

      return {
        id: l.id,
        user_id: (l as any).user_id ?? null,
        email: l.email,
        nom: l.nom,
        prenom: l.prenom,
        date_inscription: l.date_inscription ?? l.created_at,
        date_fin_essai: l.date_fin_essai,
        days_remaining: daysRemaining,
        nombre_quittances: l.nombre_quittances ?? 0,
        lead_statut: l.lead_statut,
        password_set: !!l.password_set,
        welcome_email_sent_at: l.welcome_email_sent_at,
        campaign_j2_sent_at: l.campaign_j2_sent_at,
        campaign_j5_sent_at: l.campaign_j5_sent_at,
        campaign_j8_sent_at: l.campaign_j8_sent_at,
        origine,
        trial_emails: trialEmails,
        owner_phone_ok: ownerPhoneOk,
        owner_telephone: (l as any).telephone ?? null,
        locataires_total: locStats.total,
        locataires_actifs: locStats.active,
        locataires_actifs_sans_email: locStats.missing_email_active,
      };
    });

  const enrichedTrial = enrich(trialRows);
  const enrichedFree = enrich(freeRows);

  const trialTotal = enrichedTrial.length;
  const trialActive = enrichedTrial.filter((l) => l.days_remaining !== null && l.days_remaining >= 0).length;
  const trialExpired = enrichedTrial.filter((l) => l.days_remaining !== null && l.days_remaining < 0).length;

  const freeTotal = enrichedFree.length;
  const freeActive = enrichedFree.filter((l) => l.days_remaining !== null && l.days_remaining >= 0).length;
  const freeExpired = enrichedFree.filter((l) => l.days_remaining !== null && l.days_remaining < 0).length;

  return new Response(
    JSON.stringify({
      trialLeads: enrichedTrial,
      trialStats: {
        count: trialTotal,
        active: trialActive,
        expired: trialExpired,
      },
      freeLeads: enrichedFree,
      freeStats: {
        count: freeTotal,
        active: freeActive,
        expired: freeExpired,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

