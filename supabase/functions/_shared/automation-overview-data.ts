import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type LocLite = {
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

export type PropLite = {
  id: string;
  email: string | null;
  telephone?: string | null;
  nom: string | null;
  prenom: string | null;
  lead_statut: string | null;
  date_fin_essai: string | null;
  abonnement_actif: boolean | null;
  plan_type: string | null;
  plan_actuel: string | null;
  created_at: string | null;
  date_inscription: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  user_id: string | null;
  features_enabled: Record<string, unknown> | null;
  mailing_desabonne: boolean | null;
};

const PROP_SELECT =
  "id, email, telephone, nom, prenom, lead_statut, date_fin_essai, abonnement_actif, plan_type, plan_actuel, created_at, date_inscription, stripe_customer_id, stripe_subscription_id, user_id, features_enabled, mailing_desabonne";

/** Si plusieurs lignes fusionnées pour le même e-mail : garder la fin d’essai la plus tardive (évite faux « 12 j » vs essai expiré). */
function pickLaterDateFinEssai(a: string | null, b: string | null): string | null {
  if (!a?.trim()) return b?.trim() ? b : null;
  if (!b?.trim()) return a;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta)) return b;
  if (Number.isNaN(tb)) return a;
  return tb >= ta ? b : a;
}

/** Aligné sur les exclusions du rapport essai (comptes / e-mails de test). */
export function isExcludedTestBailleurEmail(email: string | null | undefined): boolean {
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

export type SystematicEnrichedRow = {
  id: string;
  status: string;
  periode: string;
  date_preavis: string;
  date_envoi_auto: string;
  created_at: string;
  locataire_id: string;
  proprietaire_id: string;
  locataire: LocLite | null;
  proprietaire: PropLite | null;
  diagnostics: { missing_locataire_email: boolean; missing_owner_phone: boolean };
};

export type RappelClassiqueRow = {
  locataire: {
    id: string;
    nom: string | null;
    prenom: string | null;
    email: string | null;
    telephone: string | null;
    adresse_logement: string | null;
    mode_envoi_quittance: string | null;
    date_rappel: number | null;
    heure_rappel: number | null;
    minute_rappel: number | null;
    libelle_rappel_mensuel: string;
  };
  proprietaire: PropLite | null;
  diagnostics: { missing_locataire_email: boolean; missing_owner_phone: boolean };
};

export async function loadAutomationOverviewData(supabase: SupabaseClient): Promise<
  | { ok: true; systematic: SystematicEnrichedRow[]; rappelClassique: RappelClassiqueRow[] }
  | { ok: false; message: string }
> {
  const { data: sysRows, error: sysErr } = await supabase
    .from("quittances_systematic")
    .select("id, status, periode, date_preavis, date_envoi_auto, created_at, locataire_id, proprietaire_id")
    .in("status", ["pending_owner_action", "reminder_sent"])
    .order("date_envoi_auto", { ascending: true, nullsFirst: false });

  if (sysErr) {
    console.error("[automation-overview-data] systematic:", sysErr);
    return { ok: false, message: sysErr.message };
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
      .select("id, nom, prenom, email, telephone, adresse_logement, mode_envoi_quittance")
      .in("id", locIds);
    for (const l of locs || []) locMap.set((l as LocLite).id, l as LocLite);
  }
  if (propIds.length > 0) {
    const { data: props } = await supabase.from("proprietaires").select(PROP_SELECT).in("id", propIds);
    for (const p of props || []) propMap.set((p as PropLite).id, p as PropLite);
  }

  const systematicEnriched: SystematicEnrichedRow[] = systematic.map((row) => {
    const loc = locMap.get(row.locataire_id) ?? null;
    const prop = propMap.get(row.proprietaire_id) ?? null;
    const missingLocataireEmail = !String(loc?.email ?? "").trim();
    return {
      ...row,
      locataire: loc,
      proprietaire: prop,
      diagnostics: {
        missing_locataire_email: missingLocataireEmail,
        missing_owner_phone: false,
      },
    };
  });

  const systematicFiltered = systematicEnriched
    .filter((r) => r.proprietaire && !isExcludedTestBailleurEmail(r.proprietaire.email))
    .sort((a, b) => new Date(a.date_envoi_auto).getTime() - new Date(b.date_envoi_auto).getTime());

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
    console.error("[automation-overview-data] classic:", classicErr);
    return { ok: false, message: classicErr.message };
  }

  const classicList = (classicRows ?? []) as Array<LocLite & { proprietaire_id: string }>;
  const classicPropIds = [...new Set(classicList.map((r) => r.proprietaire_id))];
  const classicPropMap = new Map<string, PropLite>();
  if (classicPropIds.length > 0) {
    const { data: props2 } = await supabase.from("proprietaires").select(PROP_SELECT).in("id", classicPropIds);
    for (const p of props2 || []) classicPropMap.set((p as PropLite).id, p as PropLite);
  }

  const rappelClassique: RappelClassiqueRow[] = classicList.map((l) => {
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
        date_rappel: l.date_rappel ?? null,
        heure_rappel: l.heure_rappel ?? null,
        minute_rappel: l.minute_rappel ?? null,
        libelle_rappel_mensuel: libelleRappel,
      },
      proprietaire: pr ?? null,
      diagnostics: {
        missing_locataire_email: !String(l.email ?? "").trim(),
        missing_owner_phone: !String(pr?.telephone ?? "").trim(),
      },
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

  return { ok: true, systematic: systematicFiltered, rappelClassique: rappelClassiqueFiltered };
}

/**
 * Jours restants (floor sur ms) — garder aligné avec `computeTrialDaysRemainingFloored`
 * dans `src/utils/trialReactivation.ts` et `needsTrialReactivationPage`.
 */
export function computeTrialDaysRemainingAdmin(date_fin_essai: string | null | undefined): number | null {
  if (!date_fin_essai) return null;
  const end = new Date(date_fin_essai);
  if (Number.isNaN(end.getTime())) return null;
  return Math.floor((end.getTime() - Date.now()) / 86400000);
}

export type TrialIncompleteRecipient = {
  id: string;
  email: string;
  prenom: string;
  jours_restants: number;
};

/**
 * Bailleurs avec automatisation active mais coordonnées incomplètes (e-mail locataire et/ou tél. bailleur),
 * essai en cours avec strictement moins de 20 jours restants, sans abonnement Stripe actif.
 */
export function buildRecipientsTrialAutoIncompleteLt20(
  systematic: SystematicEnrichedRow[],
  rappelClassique: RappelClassiqueRow[],
): TrialIncompleteRecipient[] {
  type MergeEntry = {
    proprietaireId: string;
    emailDisplay: string;
    date_fin_essai: string | null;
    stripe_subscription_id: string | null;
    user_id: string | null;
    features_enabled: Record<string, unknown> | null;
    mailing_desabonne: boolean | null;
    prenom: string;
  };

  const m = new Map<string, MergeEntry>();

  const putFromProp = (prop: PropLite | null, needsRelance: boolean) => {
    if (!needsRelance || !prop?.email) return;
    const email = prop.email.trim();
    if (!email) return;
    const el = email.toLowerCase();
    const entry: MergeEntry = {
      proprietaireId: prop.id,
      emailDisplay: email,
      date_fin_essai: prop.date_fin_essai ?? null,
      stripe_subscription_id: prop.stripe_subscription_id ?? null,
      user_id: prop.user_id ?? null,
      features_enabled: prop.features_enabled,
      mailing_desabonne: prop.mailing_desabonne ?? null,
      prenom: (prop.prenom ?? "").trim(),
    };
    const prev = m.get(el);
    if (!prev) {
      m.set(el, entry);
    } else {
      m.set(el, {
        ...prev,
        date_fin_essai: pickLaterDateFinEssai(prev.date_fin_essai, entry.date_fin_essai),
        mailing_desabonne: prev.mailing_desabonne === true || entry.mailing_desabonne === true ? true : prev.mailing_desabonne ?? entry.mailing_desabonne,
      });
    }
  };

  for (const r of systematic) {
    if (r.diagnostics.missing_locataire_email) putFromProp(r.proprietaire, true);
  }
  for (const r of rappelClassique) {
    const relance = r.diagnostics.missing_locataire_email || r.diagnostics.missing_owner_phone;
    if (relance) putFromProp(r.proprietaire, true);
  }

  const out: TrialIncompleteRecipient[] = [];
  for (const e of m.values()) {
    if (isExcludedTestBailleurEmail(e.emailDisplay)) continue;
    if (e.mailing_desabonne === true) continue;
    const uid = e.user_id && String(e.user_id).trim();
    if (!uid) continue;
    const hasStripe = !!(e.stripe_subscription_id && String(e.stripe_subscription_id).trim());
    if (hasStripe) continue;
    const fe = e.features_enabled as { auto_send?: boolean } | null | undefined;
    if (fe && fe.auto_send === false) continue;
    const days = computeTrialDaysRemainingAdmin(e.date_fin_essai);
    if (days === null || days < 0 || days >= 20) continue;
    out.push({
      id: e.proprietaireId,
      email: e.emailDisplay,
      prenom: e.prenom,
      jours_restants: days,
    });
  }

  return out;
}

export function automationOverviewStats(systematic: SystematicEnrichedRow[], rappelClassique: RappelClassiqueRow[]) {
  return {
    systematic_pending: systematic.filter((r) => r.status === "pending_owner_action").length,
    systematic_reminder_sent: systematic.filter((r) => r.status === "reminder_sent").length,
    systematic_total: systematic.length,
    rappel_classique_locataires: rappelClassique.length,
  };
}
