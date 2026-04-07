import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, Loader, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AlertModal } from '../components/AlertModal';
import { loadStripe } from '@stripe/stripe-js';

const PaymentCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessages, setSuccessMessages] = useState<string[]>([]);
  const [setupData, setSetupData] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'automatique' | 'connectee'>('automatique');

  const calculatePrice = (tenants: number) => {
    if (tenants >= 1 && tenants <= 2) {
      return 3.90;
    } else if (tenants >= 3 && tenants <= 5) {
      return 5.90;
    } else {
      return 8.90;
    }
  };

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    automatique: {
      name: 'Pack Automatique',
      monthly: {
        priceIdTier1: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1,
        priceIdTier2: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2,
        priceIdTier3: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3
      },
      yearly: {
        priceIdTier1: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1_YEARLY,
        priceIdTier2: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2_YEARLY,
        priceIdTier3: import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3_YEARLY
      }
    },
    connectee: {
      name: 'Quittance Connectée+',
      priceIdFirst: import.meta.env.VITE_STRIPE_PRICE_PLUS_FIRST,
      priceIdAdditional: import.meta.env.VITE_STRIPE_PRICE_PLUS_ADDITIONAL
    }
  };

  useEffect(() => {
    const trialParam = searchParams.get('trial');
    const reactivateParam = searchParams.get('reactivate');
    const emailParam = searchParams.get('email');

    // Si c'est une conversion d'essai ou une réactivation, charger les données depuis Supabase
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

          // Charger les locataires du propriétaire
          const { data: locataires, error: locError } = await supabase
            .from('locataires')
            .select('*')
            .eq('proprietaire_id', proprietaire.id);

          if (locError) {
            console.error('Erreur chargement locataires:', locError);
          }

          // Même forme que `automationSetupData` (localStorage) : le rendu attend `proprietaire.*`
          const setupDataFromDb = {
            proprietaire: {
              nom: (proprietaire as { nom?: string | null }).nom ?? '',
              prenom: (proprietaire as { prenom?: string | null }).prenom ?? '',
              email: proprietaire.email ?? '',
              adresse: (proprietaire as { adresse?: string | null }).adresse ?? '',
              telephone: (proprietaire as { telephone?: string | null }).telephone ?? '',
            },
            locataires: locataires || [],
          };

          setSetupData(setupDataFromDb);
          setSelectedPlan('automatique');
          
          // Par défaut, choisir le cycle annuel pour les conversions d'essai
          setBillingCycle('yearly');
        } catch (err) {
          console.error('Erreur:', err);
          navigate('/automation-setup');
        }
      };

      loadProprietaireData();
    } else {
      // Comportement normal : charger depuis localStorage
      const data = localStorage.getItem('automationSetupData');
      if (!data) {
        navigate('/automation-setup');
        return;
      }

      const parsed = JSON.parse(data);
      setSetupData(parsed);

      // Default to automatique plan
      setSelectedPlan('automatique');

      // Get billing cycle from localStorage
      const storedBillingCycle = localStorage.getItem('billingCycle') as 'monthly' | 'yearly';
      if (storedBillingCycle) {
        setBillingCycle(storedBillingCycle);
      }
    }
  }, [navigate, searchParams]);

  const handlePayment = async () => {
    if (!setupData) return;

    setLoading(true);
    setError('');

    try {
      const plan = plans[selectedPlan];
      const numTenants = setupData.locataires?.length || 0;

      // Calculate line items for Stripe
      const lineItems = [];

      if (selectedPlan === 'automatique') {
        // Nouveau pricing par paliers
        const pricingTier = billingCycle === 'yearly' ? plan.yearly : plan.monthly;
        let priceId;

        if (numTenants >= 1 && numTenants <= 2) {
          priceId = pricingTier.priceIdTier1;
        } else if (numTenants >= 3 && numTenants <= 5) {
          priceId = pricingTier.priceIdTier2;
        } else {
          priceId = pricingTier.priceIdTier3;
        }

        lineItems.push({
          price: priceId,
          quantity: 1
        });
      } else {
        // Plan Connectée+ garde l'ancien système (First + Additional)
        lineItems.push({
          price: plan.priceIdFirst,
          quantity: 1
        });

        if (numTenants > 1) {
          lineItems.push({
            price: plan.priceIdAdditional,
            quantity: numTenants - 1
          });
        }
      }

      // Vérifier si c'est une conversion d'essai ou une réactivation
      const trialParam = searchParams.get('trial');
      const reactivateParam = searchParams.get('reactivate');
      const isTrialConversion = trialParam === 'true' || reactivateParam === 'true';

      // Call Stripe checkout
      const { data: session, error: checkoutError } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          line_items: lineItems,
          mode: 'subscription',
          success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/payment-cancelled`,
          metadata: {
            plan_name: plan.name,
            num_tenants: numTenants.toString(),
            trial_conversion: isTrialConversion ? 'true' : 'false'
          }
        }
      });

      if (checkoutError) {
        throw new Error(checkoutError.message || 'Erreur lors de la création de la session Stripe');
      }

      if (session?.url) {
        // Redirect to Stripe checkout
        window.location.href = session.url;
      } else {
        throw new Error('URL de paiement non disponible');
      }

    } catch (err: any) {
      console.error('Erreur paiement:', err);
      setError(err.message || 'Une erreur est survenue lors du paiement');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (!setupData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const plan = plans[selectedPlan];
  const numTenants = setupData.locataires?.length || 0;

  const totalPrice = calculatePrice(numTenants);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Finaliser votre abonnement
          </h1>
          <p className="text-lg text-gray-600">
            Choisissez votre formule et finalisez votre inscription
          </p>
        </div>

        <div className="mb-8 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedPlan('automatique')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              selectedPlan === 'automatique'
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pack Automatique</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {calculatePrice(numTenants).toFixed(2)}€
              <span className="text-sm text-gray-600">/mois</span>
            </div>
            <p className="text-sm text-gray-600">
              1-2 logements : 3,90€/mois<br/>
              3-5 logements : 5,90€/mois<br/>
              6+ logements : 8,90€/mois
            </p>
          </button>

          <button
            onClick={() => setSelectedPlan('connectee')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              selectedPlan === 'connectee'
                ? 'border-purple-600 bg-purple-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-purple-300'
            }`}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quittance Connectée+</h3>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {calculatePrice(numTenants).toFixed(2)}€
              <span className="text-sm text-gray-600">/mois</span>
            </div>
            <p className="text-sm text-gray-600">
              1-2 logements : 3,90€/mois<br/>
              3-5 logements : 5,90€/mois<br/>
              6+ logements : 8,90€/mois
            </p>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Résumé de votre commande</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Plan sélectionné</span>
                <span className="font-bold text-gray-900">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Nombre de logements</span>
                <span className="font-bold text-gray-900">{numTenants}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Propriétaire</span>
                <span className="font-bold text-gray-900">{setupData.proprietaire.nom}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-700">{setupData.proprietaire.email}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total mensuel</span>
                <span className="text-3xl font-bold text-blue-600">
                  {totalPrice.toFixed(2)}€
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>{numTenants} logement{numTenants > 1 ? 's' : ''}</span>
                  <span>{totalPrice.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Paiement sécurisé via Stripe
                  </p>
                  <p className="text-xs text-gray-700">
                    Vos informations bancaires sont sécurisées. Annulez à tout moment.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Paiement sécurisé</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Paiement sécurisé :</strong> Vous allez être redirigé vers Stripe pour finaliser votre paiement de manière sécurisée.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Paiement 100% sécurisé</span>
              </div>
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Cartes bancaires acceptées</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Annulation à tout moment</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-[#ed7862] hover:bg-[#e56651] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full font-semibold text-base transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Redirection en cours...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Valider et payer</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Vous serez redirigé vers Stripe pour finaliser votre paiement
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ce qui est inclus :</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">Génération automatique des quittances</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">Rappels SMS + Email</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">Historique complet</span>
            </div>
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

      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/dashboard');
        }}
        type="success"
        title="Succès"
        messages={successMessages}
      />
    </div>
  );
};

export default PaymentCheckout;
