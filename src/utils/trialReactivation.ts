/**
 * Bailleurs dont l’essai (30 j) est terminé : Pack auto ou compte gratuit avec date_fin_essai,
 * sans statut « client payant » Stripe enregistré côté lead.
 */
export function needsTrialReactivationPage(p: {
  abonnement_actif?: boolean | null;
  date_fin_essai?: string | null;
  plan_type?: string | null;
  lead_statut?: string | null;
} | null): boolean {
  if (!p) return false;
  if (p.lead_statut === 'QA_paid_subscriber' || p.lead_statut === 'QA_paying_customer') {
    return false;
  }
  if (!p.date_fin_essai) return false;

  const end = new Date(p.date_fin_essai);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end >= today) return false;

  const plan = (p.plan_type || 'auto').toLowerCase();
  if (plan === 'free' || plan === 'auto' || plan === 'premium') return true;
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
