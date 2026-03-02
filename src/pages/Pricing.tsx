import React, { useState, useEffect } from 'react';
import { Check, Shield, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import LoginModal from '../components/LoginModal';
import NotifyMeModal from '../components/NotifyMeModal';
import QuickPaymentModal from '../components/QuickPaymentModal';
import PackActivationFlow from '../components/PackActivationFlow';
import { supabase } from '../lib/supabase';
import { useIsMobile, detectMobileDevice } from '../hooks/useIsMobile';
import { trackCtaClick } from '../utils/analytics';
import { getPricing, formatPrice } from '../utils/pricing';

const Pricing = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('signup');
  const [simulatedTenants, setSimulatedTenants] = useState(1);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [isInTrialPeriod, setIsInTrialPeriod] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'auto' | 'plus'>('auto');
  const [isNotifyMeModalOpen, setIsNotifyMeModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isQuickPaymentModalOpen, setIsQuickPaymentModalOpen] = useState(false);
  const [isPackActivationFlowOpen, setIsPackActivationFlowOpen] = useState(false);
  const isMobile = useIsMobile();
  const isMobileDevice = detectMobileDevice();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Quittance Simple",
    "offers": [
      {
        "@type": "Offer",
        "name": "Gratuit",
        "price": "0",
        "priceCurrency": "EUR"
      },
      {
        "@type": "Offer",
        "name": "Pack Automatique",
        "price": "3.90",
        "priceCurrency": "EUR"
      }
    ]
  };

  useEffect(() => {
    const email = localStorage.getItem('proprietaireEmail');
    if (email) {
      setUserEmail(email);
      loadUserSubscription(email);
    }

    // Debug : afficher le dernier envoi quick-checkout si présent (après retour de Stripe)
    try {
      const raw = localStorage.getItem('lastQuickPaymentDebug');
      if (raw) {
        const last = JSON.parse(raw);
        console.log('[Pricing] Dernier envoi quick-checkout (après retour Stripe) :', last);
        console.log('[Pricing] stripePriceId envoyé:', last.stripePriceId);
        console.log('[Pricing] Variables env VITE_STRIPE_PRICE_*:', last.tousLesEnv);
      }
    } catch (_) {}
  }, []);

  const loadUserSubscription = async (email: string) => {
    const { data, error } = await supabase
      .from('proprietaires')
      .select('plan_actuel, abonnement_actif, date_fin_essai')
      .eq('email', email)
      .maybeSingle();

    if (!error && data && data.abonnement_actif) {
      setCurrentPlan(data.plan_actuel || '');
      // Essai gratuit = date_fin_essai renseignée et dans le futur
      const inTrial =
        data.date_fin_essai != null &&
        new Date(data.date_fin_essai) > new Date();
      setIsInTrialPeriod(!!inTrial);
    }
  };

  const openModal = async (plan: string) => {
    // Abonnement payant actif (pas en essai) : on bloque et on redirige vers "Gérer mon abonnement"
    if (userEmail && currentPlan && !isInTrialPeriod) {
      alert('Vous avez déjà un abonnement actif. Pour changer d\'abonnement, veuillez d\'abord annuler votre abonnement actuel depuis la page "Gérer mon abonnement", puis souscrire à une nouvelle formule.');
      return;
    }

    // Compte existant (essai gratuit ou pas encore d'abonnement) : ouvrir le modal de paiement (locataires + palier + prix)
    if (userEmail) {
      setSelectedPlan('auto');
      trackCtaClick('pack_automatique_activation', 'pricing', 'quick_payment_modal');
      setIsQuickPaymentModalOpen(true);
      return;
    }

    // Nouveau visiteur : flow d'activation avec essai gratuit
    trackCtaClick('pack_automatique_activation', 'pricing', 'pack_activation_flow');
    setIsPackActivationFlowOpen(true);
  };

  const calculateAutoPrice = (tenants: number, cycle: 'monthly' | 'yearly' = 'monthly') => {
    const pricing = getPricing(tenants);
    return cycle === 'yearly' ? pricing.yearlyPrice : pricing.monthlyPrice;
  };

  const getMonthlyEquivalent = (yearlyPrice: number) => {
    if (yearlyPrice === 39.00) return '3.25';
    if (yearlyPrice === 59.00) return '4.92';
    if (yearlyPrice === 89.00) return '7.42';
    
    const monthlyRaw = yearlyPrice / 12;
    if (monthlyRaw % 0.1 < 0.05) {
      return (Math.round(monthlyRaw * 10) / 10).toFixed(1);
    }
    return (Math.round(monthlyRaw * 100) / 100).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SEOHead
        title="Tarifs Quittance Simple | Plan Gratuit et Pack Automatique dès 3,90€/mois"
        description="Générateur de quittance gratuit ou Pack Automatique avec envoi automatique : 3,90€ pour 1-2 locataires, 5,90€ pour 3-5, 8,90€ pour 6+ locataires."
        keywords="tarifs quittance loyer, automatisation quittance, abonnement quittance, prix quittance automatique, générateur quittance gratuit"
        schema={schema}
        canonical="https://quittance-simple.fr/pricing"
      />

      {/* Plans - mobile: Pack en premier (order), desktop: Gratuit | Pack */}
      <section className="pt-12 sm:pt-16 pb-28 md:pb-12 bg-[#fafafa]">
        <div className="max-w-[980px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Plan Gratuit - ordre 2 sur mobile pour afficher Pack en premier */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1 bg-white rounded-2xl border border-[#d2d2d7] shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6 sm:p-8 relative"
            >
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-[#1d1d1f] tracking-tight mb-1">Outils Gratuits</h2>
                <p className="text-sm text-[#6e6e73] mb-4">Générateur de quittance simple et efficace</p>
                
                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold text-[#1d1d1f] tracking-tight">0€</span>
                    <span className="text-base text-[#6e6e73]">/mois</span>
                  </div>
                  <p className="text-sm text-[#6e6e73] mt-0.5">Pour toujours</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#1d1d1f] leading-snug"><strong className="font-medium">Quittance Simple Generator</strong> — Génération illimitée de quittances PDF</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#1d1d1f] leading-snug"><strong className="font-medium">Réception sur e-mail perso</strong> — Recevez vos quittances par email</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#1d1d1f] leading-snug"><strong className="font-medium">Signature automatique</strong> — Quittances signées électroniquement</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#1d1d1f] leading-snug"><strong className="font-medium">Calculateur de pro rata</strong> — Calcul automatique des quittances au prorata</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#1d1d1f] leading-snug"><strong className="font-medium">Calculateur IRL</strong> — Calcul des révisions de loyer selon l'INSEE</span>
                </li>
              </ul>

              <Link
                to="/"
                onClick={() => trackCtaClick('utiliser_gratuit_pricing', 'pricing', '/')}
                className="w-full py-3 rounded-xl bg-[#1d1d1f] hover:bg-[#424245] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                Utiliser gratuitement
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Pack Automatique - ordre 1 sur mobile (affiché en premier) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 bg-white rounded-2xl border border-[#d2d2d7] shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-5 sm:p-6 relative lg:ring-1 lg:ring-[#1d1d1f] lg:ring-offset-0 overflow-visible"
            >
              {/* Badge 30 jours gratuits à cheval sur la bordure */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#E65F3F] text-white px-3 py-1.5 text-xs font-medium shadow-sm border-2 border-white">
                <Sparkles className="w-3.5 h-3.5" />
                30 jours gratuits · Sans CB
              </div>

              {/* Ligne 1 : Titre à gauche, Toggle + Prix à droite */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Pack Automatique complet</h2>
                  <p className="text-xs text-[#6e6e73] mt-0.5">La boite à outils "simples et intelligents" du bailleur </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="inline-flex rounded-full bg-[#f5f5f7] p-0.5">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        billingCycle === 'monthly' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                      }`}
                    >
                      Mensuel
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        billingCycle === 'yearly' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                      }`}
                    >
                      Annuel
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${billingCycle}-${simulatedTenants}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-right"
                    >
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-xl font-semibold text-[#1d1d1f] tracking-tight">{billingCycle === 'monthly' ? formatPrice(getPricing(simulatedTenants).monthlyPrice) : formatPrice(getPricing(simulatedTenants).monthlyEquivalent)}€</span>
                        <span className="text-sm text-[#6e6e73]">/mois</span>
                      </div>
                      <p className="text-[10px] text-[#6e6e73] mt-0.5">
                        {billingCycle === 'monthly'
                          ? (simulatedTenants <= 2 ? '1-2 loc.' : simulatedTenants <= 5 ? '3-5 loc.' : '6+ loc.')
                          : `${formatPrice(getPricing(simulatedTenants).yearlyPrice)}€/an`}
                        {billingCycle === 'yearly' && getPricing(simulatedTenants).savings && (
                          <span className="text-[#34c759] font-medium ml-1">· −{formatPrice(getPricing(simulatedTenants).savings!)}€</span>
                        )}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Sélecteur nombre de locataires */}
              <div className="mb-3">
                <p className="text-xs font-medium text-[#1d1d1f] mb-1.5">Nombre de locataires</p>
                <div className="flex gap-1.5">
                  {([2, 5, 6] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setSimulatedTenants(n)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        (n === 2 && simulatedTenants <= 2) || (n === 5 && simulatedTenants >= 3 && simulatedTenants <= 5) || (n === 6 && simulatedTenants >= 6)
                          ? 'bg-[#1d1d1f] text-white'
                          : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed]'
                      }`}
                    >
                      {n === 2 ? '1-2' : n === 5 ? '3-5' : '6+'}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-[#1d1d1f] leading-snug"><strong className="font-medium">Envoi automatique des quittances ou rappels</strong> — Générées et envoyées chaque mois. Vous validez en un clic.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-[#1d1d1f] leading-snug"><strong className="font-medium">Historique toujours disponible</strong> — Plus jamais à chercher un PDF.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-[#1d1d1f] leading-snug"><strong className="font-medium">Espace stockage privé</strong> — Déposez tous vos documents au même endroit.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-[#1d1d1f] leading-snug"><strong className="font-medium">Révisions IRL automatiques</strong> — Calcul conforme INSEE, rappel à la bonne date, lettre prête à envoyer.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-[#1d1d1f] leading-snug"><strong className="font-medium">Bail Facile</strong> — Modèle de bail à remplir ou à télécharger vierge avec aide au remplissage.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#34c759] mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-[#1d1d1f] leading-snug"><strong className="font-medium">Bilan annuel simplifié / report fiscal</strong> — Déclaration prête en quelques clics.</span>
                </li>
              </ul>

              <button
                onClick={() => {
                  trackCtaClick('activer_pack_automatique_pricing_card', 'pricing', 'pack_automatique_modal');
                  openModal('Pack Automatique');
                }}
                className="w-full py-2.5 rounded-xl bg-[#E65F3F] hover:bg-[#d95530] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                Activer le Pack Automatique
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Réassurance sobre */}
      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-[980px] mx-auto px-5 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 text-[#6e6e73]">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1d1d1f]" />
              <span className="text-sm font-medium">Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#1d1d1f]" />
              <span className="text-sm font-medium">Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1d1d1f]" />
              <span className="text-sm font-medium">Données sécurisées (RGPD)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Note tarifs */}
      <section className="py-10 sm:py-12 bg-[#fafafa]">
        <div className="max-w-[980px] mx-auto px-5 sm:px-6 text-center">
          <p className="text-sm text-[#6e6e73]">
            Les tarifs pourront évoluer pour les nouveaux abonnés. Vous conservez le vôtre tant que votre abonnement reste actif.
          </p>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      {(isMobile || isMobileDevice) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#e8e7ef] p-4 shadow-2xl z-40 md:hidden">
          <button
            onClick={() => {
              trackCtaClick('passer_pack_automatique_pricing_mobile', 'pricing', 'pack_automatique_modal');
              openModal('Pack Automatique');
            }}
            className="w-full py-4 rounded-xl bg-[#E65F3F] hover:bg-[#d95530] text-white font-bold text-base transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Activer le Pack Automatique
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={loginMode}
        onModeChange={setLoginMode}
        selectedPlan={selectedPlan}
        billingCycle={billingCycle}
      />

      <QuickPaymentModal
        isOpen={isQuickPaymentModalOpen}
        onClose={() => setIsQuickPaymentModalOpen(false)}
        selectedPlan={selectedPlan}
        billingCycle={billingCycle}
        prefilledEmail={userEmail || undefined}
      />

      <NotifyMeModal
        isOpen={isNotifyMeModalOpen}
        onClose={() => setIsNotifyMeModalOpen(false)}
        sourcePage="pricing"
      />

      <PackActivationFlow
        isOpen={isPackActivationFlowOpen}
        onClose={() => setIsPackActivationFlowOpen(false)}
        prefillEmail={userEmail || undefined}
      />
    </div>
  );
};

export default Pricing;
