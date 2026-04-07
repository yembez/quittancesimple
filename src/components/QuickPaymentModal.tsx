import React, { useState, useEffect } from 'react';
import { X, Zap, Check, Loader2, CreditCard, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe, StripeError } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface QuickPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: 'auto' | 'plus';
  billingCycle?: 'monthly' | 'yearly';
  prefilledEmail?: string;
  /** Affichage intégré (sans overlay) pour `/payment-checkout` post-essai. */
  embedded?: boolean;
  /** En mode embedded, on masque le sélecteur de palier et on verrouille sur le palier des données bailleur. */
  lockTenantTierToActiveCount?: boolean;
  /** Titre personnalisé (sinon titre historique). */
  titleOverride?: string;
  /** Masque la note “Compte créé après paiement” (cas post-essai). */
  hideAccountCreatedNote?: boolean;
}

const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  billingCycle: initialBillingCycle = 'yearly',
  prefilledEmail,
  embedded = false,
  lockTenantTierToActiveCount = false,
  titleOverride,
  hideAccountCreatedNote = false,
}) => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [paymentRequestAvailable, setPaymentRequestAvailable] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialBillingCycle);
  const [activeTenantsCount, setActiveTenantsCount] = useState<number | null>(null);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [tenantTier, setTenantTier] = useState<'1-2' | '3-5' | '5+'>(() => {
    const saved = localStorage.getItem('tenant_tier');
    const validTiers = ['1-2', '3-5', '5+'];
    return validTiers.includes(saved as string) ? (saved as '1-2' | '3-5' | '5+') : '1-2';
  });

  // Fonction pour déterminer le tier selon le nombre de locataires
  const getTierFromTenantCount = (count: number): '1-2' | '3-5' | '5+' => {
    if (count >= 1 && count <= 2) return '1-2';
    if (count >= 3 && count <= 5) return '3-5';
    if (count >= 6) return '5+';
    return '1-2'; // Par défaut
  };

  // Fonction pour obtenir les limites d'un tier
  const getTierLimits = (tier: '1-2' | '3-5' | '5+'): { min: number; max: number } => {
    switch (tier) {
      case '1-2':
        return { min: 1, max: 2 };
      case '3-5':
        return { min: 3, max: 5 };
      case '5+':
        return { min: 6, max: Infinity };
      default:
        return { min: 1, max: 2 };
    }
  };

  // Fonction pour obtenir le label d'affichage d'un tier
  const getTierDisplayLabel = (tier: '1-2' | '3-5' | '5+'): string => {
    return tier === '5+' ? '6+' : tier;
  };

  // Vérifier la compatibilité entre le nombre de locataires et le tier sélectionné
  const getTierValidation = () => {
    if (activeTenantsCount === null) return null;

    const tierLimits = getTierLimits(tenantTier);
    const tierDisplayLabel = getTierDisplayLabel(tenantTier);
    
    // Cas 1 : Tier inférieur au nombre de locataires → ERREUR, bloquer
    if (activeTenantsCount > tierLimits.max) {
      return {
        type: 'error' as const,
        message: `Vous avez ${activeTenantsCount} locataire${activeTenantsCount > 1 ? 's' : ''} actif${activeTenantsCount > 1 ? 's' : ''}. Pour souscrire au plan "${tierDisplayLabel}", vous devez d'abord supprimer ${activeTenantsCount - tierLimits.max} locataire${activeTenantsCount - tierLimits.max > 1 ? 's' : ''} depuis votre espace bailleur.`,
        canProceed: false
      };
    }
    
    // Cas 2 : Tier supérieur au nombre de locataires → AVERTISSEMENT, permettre
    if (activeTenantsCount < tierLimits.min) {
      return {
        type: 'warning' as const,
        message: `Vous avez ${activeTenantsCount} locataire${activeTenantsCount > 1 ? 's' : ''} actif${activeTenantsCount > 1 ? 's' : ''}. Le plan "${tierDisplayLabel}" vous permettra d'ajouter jusqu'à ${tierLimits.max === Infinity ? 'un nombre illimité de' : tierLimits.max} locataire${tierLimits.max > 1 ? 's' : ''} dans votre espace bailleur.`,
        canProceed: true
      };
    }
    
    // Cas 3 : Compatible → OK
    return null;
  };

  const tierValidation = React.useMemo(() => getTierValidation(), [activeTenantsCount, tenantTier]);

  const getTierPrice = (tier: string, cycle: 'monthly' | 'yearly') => {
    const prices: Record<string, { monthly: number; yearly: number; monthlyEquivalent: number }> = {
      '1-2': { monthly: 3.90, yearly: 39.00, monthlyEquivalent: 3.25 },
      '3-5': { monthly: 5.90, yearly: 59.00, monthlyEquivalent: 4.92 },
      '5+': { monthly: 8.90, yearly: 89.00, monthlyEquivalent: 7.42 },
    };
    // Default to '1-2' if tier is invalid
    const validTier = prices[tier] ? tier : '1-2';
    return prices[validTier];
  };

  const tierPricing = getTierPrice(tenantTier, billingCycle);
  const price = billingCycle === 'yearly' ? tierPricing.yearly : tierPricing.monthly;
  const planName = 'Pack Automatique';
  const cycleLabel = billingCycle === 'monthly' ? 'mois' : 'an';
  const monthlyEquivalent = billingCycle === 'yearly' 
    ? tierPricing.monthlyEquivalent.toFixed(2) 
    : tierPricing.monthly.toFixed(2);

  // Price ID Stripe (même source que Dashboard : .env VITE_STRIPE_PRICE_*)
  const getStripePriceIdForTier = (): string => {
    if (billingCycle === 'yearly') {
      if (tenantTier === '1-2') return import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1_YEARLY || '';
      if (tenantTier === '3-5') return import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2_YEARLY || '';
      return import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3_YEARLY || '';
    }
    if (tenantTier === '1-2') return import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1 || '';
    if (tenantTier === '3-5') return import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2 || '';
    return import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3 || '';
  };

  const stripePriceId = getStripePriceIdForTier();

  // Au moment d'ouvrir le modal : afficher le dernier envoi (pour debug après retour Stripe)
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('lastQuickPaymentDebug');
      if (raw) {
        const last = JSON.parse(raw);
        console.log('[QuickPayment] Dernier envoi (au retour de Stripe) :', last);
      }
    } catch (_) {}
  }, [isOpen]);

  // Charger le nombre de locataires actifs quand le modal s'ouvre
  useEffect(() => {
    const loadActiveTenants = async () => {
      if (!isOpen) return;

      setIsLoadingTenants(true);
      try {
        // Récupérer l'email
        const emailToUse = prefilledEmail || 
                          localStorage.getItem('proprietaireEmail') ||
                          localStorage.getItem('captured_email') || '';

        if (!emailToUse) {
          setIsLoadingTenants(false);
          return;
        }

        // Vérifier si l'utilisateur est connecté
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Récupérer le propriétaire par user_id
          const { data: proprietaire, error: propError } = await supabase
            .from('proprietaires')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (propError || !proprietaire) {
            setIsLoadingTenants(false);
            return;
          }

          // Récupérer le nombre de locataires actifs
          const { data: locataires, error: locError } = await supabase
            .from('locataires')
            .select('id', { count: 'exact', head: false })
            .eq('proprietaire_id', proprietaire.id)
            .eq('actif', true);

          if (!locError && locataires) {
            const count = locataires.length;
            setActiveTenantsCount(count);
            
            // Déterminer automatiquement le tier selon le nombre de locataires
            if (count > 0) {
              const autoTier = getTierFromTenantCount(count);
              setTenantTier(autoTier);
              localStorage.setItem('tenant_tier', autoTier);
            }
          }
        } else {
          // Si pas connecté, essayer de trouver par email
          const { data: proprietaire, error: propError } = await supabase
            .from('proprietaires')
            .select('id')
            .eq('email', emailToUse)
            .maybeSingle();

          if (!propError && proprietaire) {
            const { data: locataires, error: locError } = await supabase
              .from('locataires')
              .select('id', { count: 'exact', head: false })
              .eq('proprietaire_id', proprietaire.id)
              .eq('actif', true);

            if (!locError && locataires) {
              const count = locataires.length;
              setActiveTenantsCount(count);
              
              if (count > 0) {
                const autoTier = getTierFromTenantCount(count);
                setTenantTier(autoTier);
                localStorage.setItem('tenant_tier', autoTier);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des locataires:', error);
      } finally {
        setIsLoadingTenants(false);
      }
    };

    loadActiveTenants();
  }, [isOpen, prefilledEmail]);

  // En mode "checkout post-essai": on verrouille le palier sur le nombre de locataires actifs détecté.
  useEffect(() => {
    if (!isOpen) return;
    if (!lockTenantTierToActiveCount) return;
    if (activeTenantsCount == null) return;
    if (activeTenantsCount <= 0) return;
    const autoTier = getTierFromTenantCount(activeTenantsCount);
    setTenantTier(autoTier);
    localStorage.setItem('tenant_tier', autoTier);
  }, [isOpen, lockTenantTierToActiveCount, activeTenantsCount]);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    } else {
      const savedEmail = localStorage.getItem('proprietaireEmail') ||
                         localStorage.getItem('captured_email') || '';
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }

    if (isOpen) {
      console.log('[Analytics] begin_checkout_auto', { tier: tenantTier, cycle: billingCycle });
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'begin_checkout_auto',
          tier: tenantTier,
          billing_cycle: billingCycle
        });
      }
    }
  }, [isOpen, prefilledEmail, tenantTier, billingCycle]);

  useEffect(() => {
    const checkPaymentRequest = async () => {
      if (!stripePromise) return;

      const stripe = await stripePromise;
      if (!stripe) return;

      const pr = stripe.paymentRequest({
        country: 'FR',
        currency: 'eur',
        total: {
          label: `${planName} - ${cycleLabel}`,
          amount: Math.round(price * 100),
        },
        requestPayerEmail: true,
      });

      const result = await pr.canMakePayment();
      if (result) {
        setCanMakePayment(true);
        setPaymentRequestAvailable(true);
      }
    };

    if (isOpen) {
      checkPaymentRequest();
    }
  }, [isOpen, price, planName, cycleLabel]);

  const handleTenantTierChange = (newTier: '1-2' | '3-5' | '5+') => {
    setTenantTier(newTier);
    localStorage.setItem('tenant_tier', newTier);

    console.log('[Analytics] select_locataire_tier', { tier: newTier });
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'select_locataire_tier',
        tier: newTier
      });
    }
  };

  const handleQuickPayment = async () => {
    if (!email || !email.includes('@')) {
      setError('Email invalide');
      return;
    }

    if (!stripePromise) {
      setError('Configuration Stripe manquante');
      return;
    }

    // Vérifier la validation du tier avant de procéder au paiement
    const validation = getTierValidation();
    if (validation && !validation.canProceed) {
      setError(validation.message);
      return;
    }

    // stripePriceId peut être vide (déploiement sans VITE_STRIPE_PRICE_*).
    // La Edge Function `quick-checkout` sait résoudre le priceId via secrets ou mapping fallback.

    setIsProcessing(true);
    setError('');

    const payload: any = {
      email,
      plan: selectedPlan,
      billingCycle,
      tenantTier,
    };
    if (stripePriceId) payload.stripePriceId = stripePriceId;
    const debugInfo = {
      stripePriceId,
      tenantTier,
      billingCycle,
      tousLesEnv: {
        tier1: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1,
        tier2: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2,
        tier3: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3,
        tier1Y: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1_YEARLY,
        tier2Y: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2_YEARLY,
        tier3Y: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3_YEARLY,
      },
    };
    console.log('[QuickPayment] Envoi vers quick-checkout:', debugInfo);
    try {
      localStorage.setItem('lastQuickPaymentDebug', JSON.stringify(debugInfo, null, 2));
    } catch (_) {}

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quick-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const isSessionIdError =
          data.error === 'session_id is required' ||
          data.code === 'missing_session_id' ||
          (data.error && String(data.error).toLowerCase().includes('session_id'));
        if (!isSessionIdError) {
          console.log('[Analytics] checkout_cancel_auto', { error: data.error });
          if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({
              event: 'checkout_cancel_auto',
              error: data.error
            });
          }
        } else {
          console.warn('[QuickPayment] Réponse inattendue (session_id requis) — possible mauvaise URL d’API.');
        }
        throw new Error(
          isSessionIdError
            ? 'Erreur de configuration du paiement. Veuillez réessayer ou contacter le support.'
            : (data.error || 'Erreur lors du paiement')
        );
      }

      console.log('[Analytics] checkout_success_auto', { tier: tenantTier, cycle: billingCycle });
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'checkout_success_auto',
          tier: tenantTier,
          billing_cycle: billingCycle
        });
      }

      if (data.url) {
        localStorage.setItem('lastQuickPaymentDebug', JSON.stringify(debugInfo, null, 2));
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement manquante');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setIsProcessing(false);
    }
  };

  const handleExpressPayment = async () => {
    if (!email || !email.includes('@')) {
      setError('Email requis pour le paiement express');
      return;
    }

    if (!stripePromise) {
      setError('Configuration Stripe manquante');
      return;
    }

    const stripe = await stripePromise;
    if (!stripe) return;

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quick-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email,
            plan: selectedPlan,
            billingCycle,
            tenantTier,
            stripePriceId,
            expressCheckout: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du paiement');
      }

      const pr = stripe.paymentRequest({
        country: 'FR',
        currency: 'eur',
        total: {
          label: `${planName} - ${cycleLabel}`,
          amount: Math.round(price * 100),
        },
        requestPayerEmail: true,
      });

      // Vérifier la disponibilité avant d'afficher
      const canPay = await pr.canMakePayment();
      if (!canPay) {
        setError('Apple Pay / Google Pay non disponible');
        setIsProcessing(false);
        return;
      }

      pr.on('paymentmethod', async (ev) => {
        try {
          const confirmResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-express-payment`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                paymentMethodId: ev.paymentMethod.id,
                sessionId: data.sessionId,
              }),
            }
          );

          const confirmData = await confirmResponse.json();

          if (confirmData.success) {
            ev.complete('success');
            window.location.href = `/quick-confirm?email=${encodeURIComponent(email)}`;
          } else {
            ev.complete('fail');
            setError('Paiement échoué');
            setIsProcessing(false);
          }
        } catch (err) {
          ev.complete('fail');
          setError('Erreur lors du paiement');
          setIsProcessing(false);
        }
      });

      pr.show();
      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    console.log('[Analytics] checkout_cancel_auto', { reason: 'user_closed' });
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'checkout_cancel_auto',
        reason: 'user_closed'
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className={
          embedded
            ? 'w-full'
            : 'fixed inset-0 z-50 flex items-end sm:items-center justify-center'
        }
      >
        {!embedded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
        )}

        <motion.div
          initial={embedded ? { opacity: 0 } : { y: '100%', opacity: 0 }}
          animate={embedded ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={embedded ? { opacity: 0 } : { y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={
            embedded
              ? 'relative w-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden'
              : 'relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] overflow-y-auto'
          }
        >
          {!embedded && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}

          <div className="p-6 pb-8">
           

            <h2 className="text-2xl font-bold text-center text-[#1a1f20] mb-4">
              {titleOverride || 'Offre de lancement'}
            </h2>

            <div className="bg-[#fefdf9] rounded-2xl p-4 mb-4 border border-gray-200">
              {/* Message informatif sur le nombre de locataires détectés */}
              {activeTenantsCount !== null && activeTenantsCount > 0 && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-[#1a1f20]">
                    Vous avez <span className="text-[#ed7862]">{activeTenantsCount}</span> locataire{activeTenantsCount > 1 ? 's' : ''} actif{activeTenantsCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-[#545454] mt-1">
                    Prix : <span className="font-semibold text-[#ed7862]">{monthlyEquivalent}€/mois</span>
                    {billingCycle === 'yearly' && ` (${price.toFixed(2)}€/an)`}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-semibold text-[#1a1f20]">{planName}</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#ed7862]">
                    {monthlyEquivalent}€/mois
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-xs text-[#545454]">
                      {price.toFixed(2)}€/an
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-200">
                <label className="text-xs font-medium text-[#545454]">Cycle</label>
                <div className="flex gap-1.5 bg-white rounded-lg p-1 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                      billingCycle === 'yearly'
                        ? 'bg-[#545454] text-white'
                        : 'text-[#545454] hover:text-[#1a1f20]'
                    }`}
                  >
                    Annuel
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-[#545454] text-white'
                        : 'text-[#545454] hover:text-[#1a1f20]'
                    }`}
                  >
                    Mensuel
                  </button>
                </div>
              </div>

              {!lockTenantTierToActiveCount && (
                <div className="mb-3">
                  <label className="text-xs font-medium text-[#545454] mb-2 block">
                    Nombre de locataires
                    {isLoadingTenants && (
                      <span className="ml-2 text-xs text-[#545454]">(chargement...)</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    {(['1-2', '3-5', '5+'] as const).map((tier) => {
                      const tierLimits = getTierLimits(tier);
                      const isIncompatible = activeTenantsCount !== null && activeTenantsCount > tierLimits.max;
                      const displayLabel = tier === '5+' ? '6+' : tier;

                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => handleTenantTierChange(tier)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                            tenantTier === tier
                              ? isIncompatible
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-[#ed7862] bg-[#ed7862] text-white'
                              : isIncompatible
                                ? 'border-red-200 text-red-600 hover:border-red-300'
                                : 'border-gray-200 text-[#545454] hover:border-[#ed7862]'
                          }`}
                          title={
                            isIncompatible
                              ? `Incompatible avec ${activeTenantsCount} locataire${activeTenantsCount > 1 ? 's' : ''}`
                              : ''
                          }
                        >
                          {displayLabel}
                        </button>
                      );
                    })}
                  </div>

                  {tierValidation && (
                    <div
                      className={`mt-3 p-3 rounded-lg border ${
                        tierValidation.type === 'error'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <p
                        className={`text-xs font-medium ${
                          tierValidation.type === 'error' ? 'text-red-800' : 'text-amber-800'
                        }`}
                      >
                        {tierValidation.type === 'error' && '⚠️ '}
                        {tierValidation.type === 'warning' && 'ℹ️ '}
                        {tierValidation.message}
                      </p>
                      {tierValidation.type === 'error' && (
                        <a
                          href="/dashboard"
                          className="mt-2 inline-block text-xs font-semibold text-red-700 hover:text-red-800 underline"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/dashboard';
                          }}
                        >
                          Accéder à mon espace bailleur pour gérer mes locataires
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Quittances et relances automatiques + historique
                </div>
                <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Calcul IRL "timé" + courriers automatiques
                </div>
                 <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Export revenus annuels / CA déclaration
                </div>
                <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Annonces immobilières par IA
                </div>
                <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Signature électronique de bail
                </div>
                <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Bail Facile
                </div>
                <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Sans engagement
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a1f20] mb-2">
                  Votre email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#ed7862] focus:outline-none transition-colors text-base"
                  disabled={isProcessing}
                />
                {error && (
                  <p className="mt-2 text-xs text-red-600">{error}</p>
                )}
              </div>

              {paymentRequestAvailable && (
                <>
                  <button
                    onClick={handleExpressPayment}
                    disabled={isProcessing || !email}
                    className="w-full py-4 rounded-xl bg-[#1a1f20] hover:bg-[#2a3132] text-white font-bold text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Smartphone className="w-5 h-5" />
                        Apple Pay / Google Pay
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-white text-[#545454]">ou</span>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleQuickPayment}
                disabled={isProcessing || !email || (tierValidation?.canProceed === false)}
                className="w-full py-4 rounded-xl bg-[#ed7862] hover:bg-[#e56651] text-white font-bold text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Payer par carte
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 space-y-2">
              {!hideAccountCreatedNote && (
                <p className="text-xs text-center text-[#7CAA89] font-semibold">
                  ✨ Compte créé après paiement
                </p>
              )}
            
              <p className="text-xs text-center text-[#545454]">
                Paiement sécurisé par Stripe - Sans engagement
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickPaymentModal;
