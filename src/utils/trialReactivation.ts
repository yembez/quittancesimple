function isPaidLead(lead_statut?: string | null): boolean {
  const s = lead_statut || '';
  return s === 'QA_paid_subscriber' || s === 'QA_paying_customer';
}

function hasStripeSubscription(stripe_subscription_id?: string | null): boolean {
  return !!(stripe_subscription_id && String(stripe_subscription_id).trim().length > 0);
}

/**
 * Jours restants d’essai (même formule que la campagne `trial_auto_incomplete_lt20` côté Edge :
 * `computeTrialDaysRemainingAdmin` dans `automation-overview-data.ts`). À garder synchronisé.
 */
export function computeTrialDaysRemainingFloored(date_fin_essai: string | null | undefined): number | null {
  if (!date_fin_essai || !String(date_fin_essai).trim()) return null;
  const end = new Date(String(date_fin_essai).trim());
  if (Number.isNaN(end.getTime())) return null;
  return Math.floor((end.getTime() - Date.now()) / 86400000);
}

/** Âge du compte en jours (à partir de created_at). */
function accountAgeDays(created_at?: string | null): number | null {
  if (!created_at) return null;
  const created = new Date(created_at);
  if (Number.isNaN(created.getTime())) return null;
  const ms = Date.now() - created.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

/**
 * Bailleurs à orienter vers la réactivation :
 * - essai terminé (date_fin_essai passée), ou
 * - compte pack auto / premium créé il y a plus de 30 jours sans abonnement Stripe (cas legacy sans date_fin_essai),
 * et pas client payant (lead + souscription Stripe).
 */
export function needsTrialReactivationPage(p: {
  abonnement_actif?: boolean | null;
  date_fin_essai?: string | null;
  plan_type?: string | null;
  lead_statut?: string | null;
  created_at?: string | null;
  stripe_subscription_id?: string | null;
} | null): boolean {
  if (!p) return false;
  if (isPaidLead(p.lead_statut)) return false;
  if (hasStripeSubscription(p.stripe_subscription_id)) return false;

  const plan = (p.plan_type || 'auto').toLowerCase();
  if (plan !== 'free' && plan !== 'auto' && plan !== 'premium') return false;

  if (p.date_fin_essai && String(p.date_fin_essai).trim()) {
    const days = computeTrialDaysRemainingFloored(p.date_fin_essai);
    if (days !== null) {
      // Aligné campagne e-mail : essai encore valable tant que jours >= 0
      if (days >= 0) return false;
      return true;
    }
    // date_fin_essai illisible : on laisse les branches legacy ci-dessous
  }

  // Pas de date_fin_essai : anciens comptes auto/premium (>30 j) sans essai daté en BDD
  const age = accountAgeDays(p.created_at);
  if (age !== null && age > 30 && (plan === 'auto' || plan === 'premium')) {
    return true;
  }

  // 3) Gratuit + lead trial_expired + ancien compte
  if (plan === 'free' && age !== null && age > 30 && p.lead_statut === 'trial_expired') {
    return true;
  }

  return false;
}

/** Valeur stockée en BDD quand l’essai est terminé : pas d’envoi auto ni relances automatisées. */
export const FEATURES_DISABLED_AFTER_TRIAL = {
  auto_send: false,
  reminders: false,
  bank_sync: false,
} as const;

export const FEATURES_RESTORED_AFTER_PAYMENT = {
  auto_send: true,
  reminders: true,
  bank_sync: false,
} as const;
