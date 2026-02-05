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
}

const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  billingCycle: initialBillingCycle = 'yearly',
  prefilledEmail,
}) => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [paymentRequestAvailable, setPaymentRequestAvailable] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialBillingCycle);
  const [tenantTier, setTenantTier] = useState<'1-2' | '3-5' | '5+'>(() => {
    const saved = localStorage.getItem('tenant_tier');
    const validTiers = ['1-2', '3-5', '5+'];
    return validTiers.includes(saved as string) ? (saved as '1-2' | '3-5' | '5+') : '1-2';
  });

  const getTierPrice = (tier: string, cycle: 'monthly' | 'yearly') => {
    const prices: Record<string, { monthly: number; yearly: number }> = {
      '1-2': { monthly: 0.99, yearly: 9.90 },
      '3-5': { monthly: 1.49, yearly: 14.90 },
      '5+': { monthly: 2.49, yearly: 24.90 },
    };
    // Default to '1-2' if tier is invalid
    const validTier = prices[tier] ? tier : '1-2';
    return prices[validTier][cycle];
  };

  const price = getTierPrice(tenantTier, billingCycle);
  const planName = 'Mode Tranquillité';
  const cycleLabel = billingCycle === 'monthly' ? 'mois' : 'an';
  const monthlyEquivalent = billingCycle === 'yearly' ? (Math.floor(price / 12 * 100) / 100).toFixed(2) : price.toFixed(2);

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
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log('[Analytics] checkout_cancel_auto', { error: data.error });
        if (typeof window !== 'undefined' && (window as any).dataLayer) {
          (window as any).dataLayer.push({
            event: 'checkout_cancel_auto',
            error: data.error
          });
        }
        throw new Error(data.error || 'Erreur lors du paiement');
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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="p-6 pb-8">
           

            <h2 className="text-2xl font-bold text-center text-[#1a1f20] mb-4">
              Offre de lancement
            </h2>

            <div className="bg-[#fefdf9] rounded-2xl p-4 mb-4 border border-gray-200">
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

              <div className="mb-3">
                <label className="text-xs font-medium text-[#545454] mb-2 block">Nombre de locataires</label>
                <div className="flex gap-2">
                  {(['1-2', '3-5', '5+'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handleTenantTierChange(tier)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                        tenantTier === tier
                          ? 'border-[#ed7862] bg-[#ed7862] text-white'
                          : 'border-gray-200 text-[#545454] hover:border-[#ed7862]'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Quittances et relances automatiques + histoirique
                </div>
                <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Calcul IRL et courriers automatiques
                </div>
                 <div className="flex items-center text-xs text-[#545454]">
                  <Check className="w-3.5 h-3.5 text-[#7CAA89] mr-2" />
                  Export revenus annuels
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
                disabled={isProcessing || !email}
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
              <p className="text-xs text-center text-[#7CAA89] font-semibold">
                ✨ Compte créé automatiquement après paiement
              </p>
              <p className="text-xs text-center text-[#545454]">
                Vous recevrez vos identifiants par email
              </p>
              <p className="text-xs text-center text-[#545454]">
                Paiement sécurisé par Stripe
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickPaymentModal;
