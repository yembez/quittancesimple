import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, Loader, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AlertModal } from '../components/AlertModal';
import { getPricing, formatPrice } from '../utils/pricing';

const PLAN_NAME = 'Pack Automatique complet';

/** Nombre de locataires pour le palier minimum (actifs, sinon hint BDD, min 1). */
function countTenantsForPricing(setupData: any): number {
  const locs = setupData?.locataires || [];
  const active = locs.filter((l: { actif?: boolean }) => l.actif !== false).length;
  if (active > 0) return active;
  const n = Number(setupData?.nombre_locataires ?? 0);
  return Math.max(1, n || 1);
}

/** Palier simulé comme sur la page Tarifs : 2 → 1-2, 5 → 3-5, 6 → 6+. */
function minTierFromCount(count: number): 2 | 5 | 6 {
  if (count <= 2) return 2;
  if (count <= 5) return 5;
  return 6;
}

const packStripePrices = {
  monthly: {
    priceIdTier1: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1,
    priceIdTier2: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2,
    priceIdTier3: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3,
  },
  yearly: {
    priceIdTier1: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1_YEARLY,
    priceIdTier2: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2_YEARLY,
    priceIdTier3: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3_YEARLY,
  },
};

const PACK_FEATURES: { title: string; desc: string }[] = [
  {
    title: 'Quittances et rappels auto',
    desc: 'Envoyés chaque mois, validation et rappel retard en 1 clic.',
  },
  {
    title: 'Annonces immobilières par IA',
    desc: 'Rédigez vos annonces plus vite.',
  },
  {
    title: 'Signature électronique de bail',
    desc: 'Vide ou meublé, signé en ligne (locataire + garant).',
  },
  {
    title: 'Bail Facile',
    desc: 'Modèle à remplir en ligne ou à télécharger vierge.',
  },
  {
    title: 'Révisions IRL et charges',
    desc: 'Calcul INSEE, rappel.',
  },
  {
    title: 'Courrier révision IRL auto',
    desc: 'Lettre générée automatiquement prête à envoyer.',
  },
  {
    title: 'Espace stockage privé',
    desc: 'Tous vos documents au même endroit.',
  },
  {
    title: 'Bilan annuel / report fiscal',
    desc: 'Déclaration prête en quelques clics.',
  },
  {
    title: 'Historique illimité',
    desc: 'Tous vos PDF à portée de main.',
  },
];

const PaymentCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [setupData, setSetupData] = useState<any>(null);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  /** Palier affiché / facturé (2, 5 ou 6), comme `simulatedTenants` sur Tarifs. */
  const [selectedTier, setSelectedTier] = useState<2 | 5 | 6>(2);

  useEffect(() => {
    const trialParam = searchParams.get('trial');
    const reactivateParam = searchParams.get('reactivate');
    const emailParam = searchParams.get('email');

    if ((trialParam === 'true' || reactivateParam === 'true') && emailParam) {
      const loadProprietaireData = async () => {
        try {
          const { data: proprietaire, error } = await supabase
            .from('proprietaires')
            .select('id, email, nom, prenom, adresse, telephone, nombre_locataires')
            .ilike('email', emailParam.trim())
            .maybeSingle();

          if (error || !proprietaire) {
            console.error('Erreur chargement propriétaire:', error);
            navigate('/automation-setup');
            return;
          }

          const { data: locataires, error: locError } = await supabase
            .from('locataires')
            .select('*')
            .eq('proprietaire_id', proprietaire.id);

          if (locError) {
            console.error('Erreur chargement locataires:', locError);
          }

          const setupDataFromDb = {
            proprietaire: {
              nom: (proprietaire as { nom?: string | null }).nom ?? '',
              prenom: (proprietaire as { prenom?: string | null }).prenom ?? '',
              email: proprietaire.email ?? '',
              adresse: (proprietaire as { adresse?: string | null }).adresse ?? '',
              telephone: (proprietaire as { telephone?: string | null }).telephone ?? '',
            },
            locataires: locataires || [],
            nombre_locataires: (proprietaire as { nombre_locataires?: number | null }).nombre_locataires ?? 0,
          };

          setSetupData(setupDataFromDb);
          setBillingCycle('yearly');
        } catch (err) {
          console.error('Erreur:', err);
          navigate('/automation-setup');
        }
      };

      loadProprietaireData();
    } else {
      const data = localStorage.getItem('automationSetupData');
      if (!data) {
        navigate('/automation-setup');
        return;
      }

      const parsed = JSON.parse(data);
      setSetupData(parsed);

      const storedBillingCycle = localStorage.getItem('billingCycle') as 'monthly' | 'yearly';
      if (storedBillingCycle) {
        setBillingCycle(storedBillingCycle);
      }
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    const trial = searchParams.get('trial') === 'true';
    const reactivate = searchParams.get('reactivate') === 'true';
    if (!trial && !reactivate) {
      localStorage.setItem('billingCycle', billingCycle);
    }
  }, [billingCycle, searchParams]);

  useEffect(() => {
    if (!setupData) return;
    const min = minTierFromCount(countTenantsForPricing(setupData));
    setSelectedTier(min);
  }, [setupData]);

  const handlePayment = async () => {
    if (!setupData) return;

    setLoading(true);
    setError('');

    try {
      const numTenants = countTenantsForPricing(setupData);
      const pricingTier = billingCycle === 'yearly' ? packStripePrices.yearly : packStripePrices.monthly;
      let priceId: string;

      if (selectedTier <= 2) {
        priceId = pricingTier.priceIdTier1;
      } else if (selectedTier <= 5) {
        priceId = pricingTier.priceIdTier2;
      } else {
        priceId = pricingTier.priceIdTier3;
      }

      const lineItems = [{ price: priceId, quantity: 1 }];

      const trialParam = searchParams.get('trial');
      const reactivateParam = searchParams.get('reactivate');
      const isTrialConversion = trialParam === 'true' || reactivateParam === 'true';

      const { data: session, error: checkoutError } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          line_items: lineItems,
          mode: 'subscription',
          success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/payment-cancelled`,
          metadata: {
            plan_name: PLAN_NAME,
            num_tenants: numTenants.toString(),
            pricing_tier: String(selectedTier),
            trial_conversion: isTrialConversion ? 'true' : 'false',
          },
        },
      });

      if (checkoutError) {
        throw new Error(checkoutError.message || 'Erreur lors de la création de la session Stripe');
      }

      if (session?.url) {
        window.location.href = session.url;
      } else {
        throw new Error('URL de paiement non disponible');
      }
    } catch (err: unknown) {
      console.error('Erreur paiement:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du paiement');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (!setupData) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#1d1d1f]" />
      </div>
    );
  }

  const actualTenantCount = countTenantsForPricing(setupData);
  const minTier = minTierFromCount(actualTenantCount);
  const packPricing = getPricing(selectedTier);

  const summaryLine =
    billingCycle === 'monthly'
      ? {
          label: 'Total mensuel',
          amount: packPricing.monthlyPrice,
          sub: `${selectedTier <= 2 ? '1–2' : selectedTier <= 5 ? '3–5' : '6+'} loc. · ${formatPrice(packPricing.monthlyPrice)}€/mois`,
        }
      : {
          label: 'Équivalent mensuel',
          amount: packPricing.monthlyEquivalent,
          sub: `${formatPrice(packPricing.yearlyPrice)}€/an · ${selectedTier <= 2 ? '1–2' : selectedTier <= 5 ? '3–5' : '6+'} loc.`,
        };

  return (
    <div className="min-h-screen bg-[#fafafa] pt-24 pb-16">
      <div className="max-w-[980px] mx-auto px-5 sm:px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
            Finaliser votre abonnement
          </h1>
          <p className="text-sm sm:text-base text-[#6e6e73]">
            Même formule et mêmes prix que la page Tarifs — Pack Automatique complet.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Carte identique à la page Tarifs */}
          <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-5 sm:p-6 relative lg:ring-1 lg:ring-[#1d1d1f] lg:ring-offset-0 overflow-visible">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1 rounded-full bg-[#E65F3F] text-white border-2 border-white px-2 py-1 text-[10px] font-medium md:gap-1.5 md:px-3 md:py-1.5 md:text-xs md:shadow-sm">
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
              30 jours gratuits · Sans CB
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3 mb-3 mt-2">
              <div>
                <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">{PLAN_NAME}</h2>
                <p className="text-xs text-[#6e6e73] mt-0.5">
                  La boite à outils &quot;simples et intelligents&quot; du bailleur
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="inline-flex rounded-full bg-[#f5f5f7] p-0.5">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-[#1d1d1f] shadow-sm'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      billingCycle === 'yearly'
                        ? 'bg-white text-[#1d1d1f] shadow-sm'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                  >
                    Annuel
                  </button>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
                      {billingCycle === 'monthly'
                        ? formatPrice(packPricing.monthlyPrice)
                        : formatPrice(packPricing.monthlyEquivalent)}
                      €
                    </span>
                    <span className="text-sm text-[#6e6e73]">/mois</span>
                  </div>
                  <p className="text-[10px] text-[#6e6e73] mt-0.5">
                    {billingCycle === 'monthly'
                      ? selectedTier <= 2
                        ? '1-2 loc.'
                        : selectedTier <= 5
                          ? '3-5 loc.'
                          : '6+ loc.'
                      : `${formatPrice(packPricing.yearlyPrice)}€/an`}
                    {billingCycle === 'yearly' && packPricing.savings != null && (
                      <span className="text-[#34c759] font-medium ml-1">· −{formatPrice(packPricing.savings)}€</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs font-medium text-[#1d1d1f] mb-1.5">Nombre de locataires</p>
              <div className="flex gap-1.5">
                {([2, 5, 6] as const).map((n) => {
                  const isSelected =
                    (n === 2 && selectedTier === 2) ||
                    (n === 5 && selectedTier === 5) ||
                    (n === 6 && selectedTier === 6);
                  const disabled = n < minTier;
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedTier(n)}
                      title={
                        disabled
                          ? `Votre dossier nécessite au minimum le palier ${minTier === 5 ? '3–5' : '6+'}`
                          : undefined
                      }
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-[#1d1d1f] text-white'
                          : disabled
                            ? 'bg-[#f5f5f7] text-[#c7c7cc] cursor-not-allowed'
                            : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed]'
                      }`}
                    >
                      {n === 2 ? '1-2' : n === 5 ? '3-5' : '6+'}
                    </button>
                  );
                })}
              </div>
              {minTier > 2 && (
                <p className="text-[10px] text-[#6e6e73] mt-1.5">
                  Palier minimum selon vos {actualTenantCount} locataire{actualTenantCount > 1 ? 's' : ''} enregistré
                  {actualTenantCount > 1 ? 's' : ''}.
                </p>
              )}
            </div>

            <ul className="space-y-2 mb-4">
              {PACK_FEATURES.map((f) => (
                <li key={f.title} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-[#1d1d1f] leading-snug">
                    <strong className="font-medium">{f.title}</strong> — {f.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Résumé + paiement */}
          <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[#1d1d1f] mb-6">Résumé de la commande</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center pb-3 border-b border-[#e8e8ed]">
                <span className="text-sm text-[#6e6e73]">Plan</span>
                <span className="text-sm font-medium text-[#1d1d1f] text-right">{PLAN_NAME}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[#e8e8ed]">
                <span className="text-sm text-[#6e6e73]">Facturation</span>
                <span className="text-sm font-medium text-[#1d1d1f]">
                  {billingCycle === 'monthly' ? 'Mensuelle' : 'Annuelle'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[#e8e8ed]">
                <span className="text-sm text-[#6e6e73]">Palier</span>
                <span className="text-sm font-medium text-[#1d1d1f]">
                  {selectedTier <= 2 ? '1–2' : selectedTier <= 5 ? '3–5' : '6+'} locataires
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[#e8e8ed]">
                <span className="text-sm text-[#6e6e73]">Propriétaire</span>
                <span className="text-sm font-medium text-[#1d1d1f] text-right truncate max-w-[55%]">
                  {setupData.proprietaire.nom}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[#e8e8ed]">
                <span className="text-sm text-[#6e6e73]">Email</span>
                <span className="text-sm text-[#1d1d1f] text-right break-all max-w-[60%]">
                  {setupData.proprietaire.email}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#f5f5f7] p-4 mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-[#1d1d1f]">{summaryLine.label}</span>
                <span className="text-2xl font-semibold text-[#1d1d1f]">{formatPrice(summaryLine.amount)}€</span>
              </div>
              <p className="text-xs text-[#6e6e73]">{summaryLine.sub}</p>
              {billingCycle === 'yearly' && packPricing.savings != null && (
                <p className="text-xs text-[#34c759] font-medium mt-2">
                  Économie vs 12× mensuel : −{formatPrice(packPricing.savings)}€
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 mb-6 text-[#6e6e73]">
              <Shield className="w-4 h-4 text-[#1d1d1f] flex-shrink-0 mt-0.5" />
              <span className="text-xs">Paiement sécurisé par Stripe · Données protégées (RGPD)</span>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#E65F3F] hover:bg-[#d95530] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Redirection vers Stripe…
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Valider et payer
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-[#6e6e73] mt-3">
              Vous serez redirigé vers Stripe pour finaliser le paiement en toute sécurité.
            </p>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Erreur"
        messages={[error]}
      />

    </div>
  );
};

export default PaymentCheckout;
