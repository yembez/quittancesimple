function isPaidLead(lead_statut?: string | null): boolean {
  const s = lead_statut || '';
  return s === 'QA_paid_subscriber' || s === 'QA_paying_customer';
}

function hasStripeSubscription(stripe_subscription_id?: string | null): boolean {
  return !!(stripe_subscription_id && String(stripe_subscription_id).trim().length > 0);
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

  if (p.date_fin_essai) {
    const end = new Date(p.date_fin_essai);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end >= today) return false;
    return true;
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
