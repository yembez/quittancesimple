import React, { useState, useEffect } from 'react';
import { Check, Shield, Zap, Bell, Smartphone, Mail, RefreshCw, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import LoginModal from '../components/LoginModal';
import NotifyMeModal from '../components/NotifyMeModal';
import QuickPaymentModal from '../components/QuickPaymentModal';
import { supabase } from '../lib/supabase';
import { useIsMobile, detectMobileDevice } from '../hooks/useIsMobile';

const Pricing = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('signup');
  const [simulatedTenants, setSimulatedTenants] = useState(1);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'auto' | 'plus'>('auto');
  const [isNotifyMeModalOpen, setIsNotifyMeModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isQuickPaymentModalOpen, setIsQuickPaymentModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const isMobileDevice = detectMobileDevice();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Quittance Simple",
    "offers": [
      {
        "@type": "Offer",
        "name": "Automatique",
        "price": "1",
        "priceCurrency": "EUR"
      },
      {
        "@type": "Offer",
        "name": "Connectée+",
        "price": "1.50",
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
  }, []);

  const loadUserSubscription = async (email: string) => {
    const { data, error } = await supabase
      .from('proprietaires')
      .select('plan_actuel, abonnement_actif')
      .eq('email', email)
      .maybeSingle();

    if (!error && data && data.abonnement_actif) {
      setCurrentPlan(data.plan_actuel || '');
    }
  };

  const openModal = async (plan: string) => {
    if (userEmail && currentPlan) {
      alert('Vous avez déjà un abonnement actif. Pour changer d\'abonnement, veuillez d\'abord annuler votre abonnement actuel depuis la page "Gérer mon abonnement", puis souscrire à une nouvelle formule.');
      return;
    }

    if (plan === 'Quittance Connectée+') {
      setSelectedPlan('plus');
    } else {
      setSelectedPlan('auto');
    }

    if (isMobile || isMobileDevice) {
      setIsQuickPaymentModalOpen(true);
    } else {
      setLoginMode('signup');
      setIsModalOpen(true);
    }
  };

  const calculateAutoPrice = (tenants: number, cycle: 'monthly' | 'yearly' = 'monthly') => {
    let monthlyPrice = 0;

    if (tenants >= 1 && tenants <= 2) {
      monthlyPrice = 0.99;
    } else if (tenants >= 3 && tenants <= 5) {
      monthlyPrice = 1.49;
    } else {
      monthlyPrice = 2.49;
    }

    return cycle === 'yearly' ? monthlyPrice * 10 : monthlyPrice;
  };

  const calculateBankPrice = (tenants: number, cycle: 'monthly' | 'yearly' = 'monthly') => {
    let monthlyPrice = 0;

    if (tenants >= 1 && tenants <= 2) {
      monthlyPrice = 1.49;
    } else if (tenants >= 3 && tenants <= 4) {
      monthlyPrice = 2.49;
    } else if (tenants >= 5 && tenants <= 8) {
      monthlyPrice = 3.49;
    } else {
      monthlyPrice = 3.49;
    }

    return cycle === 'yearly' ? monthlyPrice * 10 : monthlyPrice;
  };

  const getMonthlyEquivalent = (yearlyPrice: number) => {
    return (Math.floor((yearlyPrice / 12) * 100) / 100).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Tarifs Quittance Simple | Automatisation dès 0,99€/mois pour 1-2 logements"
        description="Tarifs dégressifs selon le nombre de logements : 0,99€ pour 1-2 logements, 1,49€ pour 3-4, 2,49€ pour 5+ logements."
        keywords="tarifs quittance loyer, automatisation quittance, abonnement quittance, prix quittance automatique"
        schema={schema}
        canonical="https://quittance-simple.fr/pricing"
      />

      {/* Hero */}
      <section className="pt-20 pb-6 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-5 lg:px-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-xl lg:text-3xl font-bold text-[#1a1f20] mb-3 leading-tight">
            Détail des tarifs <br />
            </h1>
            <p className="text-base lg:text-xl font-bold text-[#ed7862] mb-2">
              Tarifs de lancement*
            </p>
          

          </motion.div>
        </div>
      </section>

{/* Toggle Mensuel/Annuel */}
<section className="pt-6 pb-3">
  <div className="max-w-10xl mx-auto px-5 lg:px-7">
    <div className="flex justify-center items-center gap-4 mb-0">
      <motion.div
        className="bg-white rounded-full p-1.5 shadow-lg border border-gray-200 inline-flex items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
            billingCycle === 'monthly'
              ? 'bg-[#ed7862] text-white shadow-md'
              : 'text-[#545454] hover:text-[#1a1f20]'
          }`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            billingCycle === 'yearly'
              ? 'bg-[#ed7862] text-white shadow-md'
              : 'text-[#545454] hover:text-[#1a1f20]'
          }`}
        >
          Annuel
          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            -17%
          </span>
        </button>
      </motion.div>
    </div>
  </div>
</section>

{/* Plans */}
<section className="py-9">
  <div className="max-w-7xl mx-auto px-5 lg:px-7">

    {/* Grille asymétrique : gros bloc principal + petit bloc secondaire */}
    <div className="grid md:grid-cols-[1.7fr_1fr] gap-6 max-w-5xl mx-auto items-start">

      {/* Plan Automatique */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white rounded-3xl border-2 border-[#ed7862]/20 p-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#ed7862]/10 rounded-full -mr-10 -mt-10"></div>

        <div className="relative">
         

          <h2 className="text-xl font-bold text-[#1a1f20] mb-1.5">Pack Automatique</h2>
          <p className="text-xs text-[#545454] mb-4"><Link to="/automation" className="text-[#ed7862] hover:underline text-xs font-semibold ml-1">Détail</Link></p>

          <AnimatePresence mode="wait">
            <motion.div
              key={billingCycle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-5"
            >
              {billingCycle === 'monthly' ? (
                <>
                  <div className="flex items-baseline mb-1">
                    <span className="text-xl font-bold text-[#ed7862]">0,99€/mois</span>
                    <span className="text-xs text-[#545454] ml-2">— offre de lancement pour 1–2 locataires</span>
                  </div>
                  <p className="text-xs text-[#545454] mb-2 line-through opacity-60">
                    (au lieu de 1,49 € / mois ensuite)
                  </p>

                  <p className="text-sm text-[#545454]">
                    <span className="text-[#ed7862]">1,49€/mois</span>  <span className="text-xs text-[#545454] ml-2">— offre de lancement (3–5 locataires)</span>
                  </p>
                  <p className="text-xs text-[#545454] mb-2 line-through opacity-60">
                    (au lieu de 2,49 € / mois ensuite)
                  </p>

                  <p className="text-sm text-[#545454]">
                    <span className="text-[#ed7862]">2,49€/mois</span> <span className="text-xs text-[#545454] ml-2">— offre de lancement (5+ locataires)</span>
                  </p>
                  <p className="text-xs text-[#545454] line-through opacity-60">
                    (au lieu de 3,99 € / mois ensuite)
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline mb-1">
                    <span className="text-xl font-bold text-[#ed7862]">0,82€/mois</span>
                    <span className="text-xs text-[#545454] ml-2">(9,90€/an) — offre de lancement pour 1 à 2 locataires</span>
                  </div>
                  <p className="text-xs text-[#545454] mb-2 line-through opacity-60">
                    (au lieu de 14,90 € / an ensuite)
                  </p>

                  <p className="text-sm text-[#545454]">
                    <span className="text-[#ed7862]">1,24€/mois</span> <span className="text-xs">(14,90€/an)</span> <span className="text-xs text-[#545454] ml-2">— offre de lancement (3–5 locataires)</span> 
                  </p>
                  <p className="text-xs text-[#545454] mb-2 line-through opacity-60">
                    (au lieu de 24,90 € / an ensuite)
                  </p>

                  <p className="text-sm text-[#545454]">
                    <span className="text-[#ed7862]">2,07€/mois</span> <span className="text-xs">(24,90€/an)</span> <span className="text-xs text-[#545454] ml-2">— offre de lancement (5+ locataires)</span> 
                  </p>
                  <p className="text-xs text-[#545454] line-through opacity-60">
                    (au lieu de 39,90 € / an ensuite)
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <ul className="space-y-2.5 mb-5">
            <li className="flex items-start">
              <Check className="w-3.5 h-3.5 text-[#2D3436] mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-[#545454]"><strong>Quittance automatiques</strong></span>
            </li>
            <li className="flex items-start">
              <Check className="w-3.5 h-3.5 text-[#2D3436] mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-[#545454]"><strong>Calcul IRL</strong> + courrier automatique</span>
            </li>
            <li className="flex items-start">
              <Check className="w-3.5 h-3.5 text-[#2D3436] mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-[#545454]"><strong>Bilan annuel</strong> / CA prêt</span>
            </li>
            <li className="flex items-start">
              <Check className="w-3.5 h-3.5 text-[#2D3436] mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-[#545454]"><strong>Historique</strong> + stockage documents</span>
            </li>
          </ul>

          <button
            onClick={() => openModal('Pack Automatique')}
            className="w-full py-2.5 rounded-full bg-[#ed7862] hover:bg-[#e56651] text-white text-xs font-bold transition-all transform hover:scale-105 shadow-lg"
          >
            Activer le Pack Automatique
          </button>

          <p className="text-xs text-center text-[#7CAA89] mt-3 font-semibold">
            💡 Vous conservez ce tarif tant que votre abonnement reste actif.
          </p>

          <p className="text-[10px] text-center text-[#545454] mt-2">Sans engagement</p>
        </div>
      </motion.div>

      {/* Plan Connectée+ — Option A (plus petit + décalé + discret) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="bg-white/60 rounded-3xl border border-gray-200 p-3 shadow-sm relative overflow-hidden opacity-70 scale-85 mt-10"
      >
        <div className="absolute top-2.5 right-2.5 bg-gray-600 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-md">
          Bientôt disponible
        </div>

        <div className="relative">
          <div className="w-9 h-9 bg-gray-300 rounded-2xl flex items-center justify-center mb-2.5">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </div>

          <h2 className="text-base font-semibold text-gray-600 mb-1">
            Quittance Connectée<span className="text-gray-500 text-2xl">+</span>
          </h2>

          <p className="text-[10px] text-gray-500 mb-3">
            La tranquillité totale grâce à la synchronisation bancaire automatique.
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={billingCycle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-3"
            >
              {billingCycle === 'monthly' ? (
                <>
                  <div className="flex items-baseline mb-0.5">
                    <span className="text-lg font-semibold text-gray-600">1,49€</span>
                    <span className="text-[10px] text-gray-500 ml-1.5">/mois TTC — 1-2 logements</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    2,49€/mois pour 3-4 logements
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    3,49€/mois pour 5-8 logements
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline mb-0.5">
                    <span className="text-lg font-semibold text-gray-600">1,24€/mois</span>
                    <span className="text-[10px] text-gray-500 ml-1.5">(14,90€/an) — 1-2 logements</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    2,07€/mois (24,90€/an) pour 3-4 logements
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    2,91€/mois (34,90€/an) pour 5-8 logements
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <ul className="space-y-1.5 mb-3 text-gray-500 text-[10px]">
            <li className="flex items-start">
              <Check className="w-3 h-3 text-gray-400 mr-1 mt-0.5" />
              Synchronisation bancaire (PSD2)
            </li>
            <li className="flex items-start">
              <Check className="w-3 h-3 text-gray-400 mr-1 mt-0.5" />
              Détection automatique du paiement du loyer
            </li>
            <li className="flex items-start">
              <Check className="w-3 h-3 text-gray-400 mr-1 mt-0.5" />
              Envoi 100% automatisé
            </li>
          </ul>

          <button
            onClick={() => setIsNotifyMeModalOpen(true)}
            className="w-full py-1.5 rounded-full bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-all text-[10px] shadow-sm"
          >
            Me tenir informé
          </button>

          <p className="text-[10px] text-center text-gray-500 mt-2.5">Lancement prochainement</p>
        </div>
      </motion.div>

    </div>
  </div>
</section>


      {/* Simulateur */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-5 lg:px-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-9"
          >
            <h2 className="text-2xl font-bold text-[#1a1f20] mb-3">
              Simuler votre coût mensuel
            </h2>
            <p className="text-sm text-[#545454]">
              Ajustez le nombre de logements pour voir le prix exact
            </p>
          </motion.div>

          <div className="bg-[#fefdf9] rounded-3xl p-6 border border-gray-200">
            <div className="mb-6">
              <label className="block text-base font-bold text-[#1a1f20] mb-3">
                Nombre de logements : <span className="text-[#2D3436]">{simulatedTenants}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={simulatedTenants}
                onChange={(e) => setSimulatedTenants(parseInt(e.target.value))}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-gray-300"
                style={{
                  accentColor: '#2D3436',
                  background: `linear-gradient(to right, #2D3436 0%, #2D3436 ${((simulatedTenants - 1) / 9) * 100}%, #d1d5db ${((simulatedTenants - 1) / 9) * 100}%, #d1d5db 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-[#545454] mt-1.5">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={billingCycle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-[1.3fr_1fr] gap-5 mb-6"
              >
                <div className="bg-white rounded-xl p-5 border-2 border-[#ed7862]/20">
                  <h3 className="font-bold text-[#1a1f20] mb-3 text-sm">Pack Automatique</h3>
                  {billingCycle === 'monthly' ? (
                    <>
                      <div className="text-3xl font-bold text-[#ed7862] mb-1.5">
                        {calculateAutoPrice(simulatedTenants, billingCycle).toFixed(2)}€
                      </div>
                      <p className="text-xs text-[#545454]">par mois</p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-[#ed7862] mb-1.5">
                        {getMonthlyEquivalent(calculateAutoPrice(simulatedTenants, billingCycle)).replace('.', ',')}€
                      </div>
                      <p className="text-xs text-[#545454] mb-0.5">par mois</p>
                      <p className="text-xs text-gray-500">
                        ({calculateAutoPrice(simulatedTenants, billingCycle).toFixed(2).replace('.', ',')}€/an)
                      </p>
                    </>
                  )}
                </div>

                <div className="bg-white/60 rounded-xl p-4 border border-gray-300 opacity-70 relative">
                  <div className="absolute top-1.5 right-1.5 bg-gray-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                    Bientôt
                  </div>
                  <h3 className="font-semibold text-gray-600 mb-2.5 text-xs">Quittance Connectée+</h3>
                  {billingCycle === 'monthly' ? (
                    <>
                      <div className="text-2xl font-bold text-gray-600 mb-0.5">
                        {calculateBankPrice(simulatedTenants, billingCycle).toFixed(2)}€
                      </div>
                      <p className="text-[10px] text-gray-500">par mois</p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-600 mb-0.5">
                        {getMonthlyEquivalent(calculateBankPrice(simulatedTenants, billingCycle)).replace('.', ',')}€
                      </div>
                      <p className="text-[10px] text-gray-500 mb-0.5">par mois</p>
                      <p className="text-[10px] text-gray-500">
                        ({calculateBankPrice(simulatedTenants, billingCycle).toFixed(2).replace('.', ',')}€/an)
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Bloc comparaison prix */}
      <section className="py-9 bg-white">
        <div className="max-w-4xl mx-auto px-5 lg:px-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-[#7CAA89]/10 rounded-3xl p-6 lg:p-8 border-[#7CAA89]"
          >
            <h2 className="text-2xl font-bold text-[#1a1f20] mb-4">
              Pourquoi des prix aussi accessibles ?
            </h2>

            <p className="text-base text-[#415052] leading-relaxed mb-4">
              Le Pack Outils Automatisés est en moyenne <strong>6 fois moins cher</strong> que des solutions comme Pmylo, Qalimo, BailFacile ou Dooradoora.
            </p>

            <p className="text-base text-[#415052] leading-relaxed">
              <strong>👉 Un choix volontaire :</strong><br />
              Car nous avons délibérément choisi le maximum de simplicité, et non pas "une usine à gaz". On se concentre sur l'essentiel : un outil vraiment utile sans fonctionalités chères (et parfois inutiles), avec en plus en ce moment un prix de lancement encore plus accessible pour tout le monde : petits bailleurs, SCI, agents immobiliers ou plus gros portefeuilles immobiliers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="py-9 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-5 lg:px-7">
          <div className="flex flex-wrap justify-center items-center gap-6 text-[#545454]">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-[#2D3436] mr-1.5" />
              <span className="text-sm font-semibold">Paiement sécurisé</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-[#2D3436] mr-1.5" />
              <span className="text-sm font-semibold">Sans engagement</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-[#2D3436] mr-1.5" />
              <span className="text-sm font-semibold">Données sécurisées (RGPD & PSD2)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section réassurance tarifs */}
      <section className="py-9 bg-white">
        <div className="max-w-4xl mx-auto px-5 lg:px-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-[#ed7862]/10 rounded-3xl p-6 lg:p-8 border-2 border-[#ed7862]/20 text-center"
          >
            <p className="text-base text-[#1a1f20] leading-relaxed font-semibold mb-3">
              🔒 Les tarifs évolueront pour les nouveaux abonnés.
            </p>
            <p className="text-base text-[#415052] leading-relaxed">
              Les premiers abonnés conservent leur tarif de lancement<br />
              tant que leur abonnement reste actif.
             
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footnote */}
      <div className="bg-[#fefdf9] pb-6">
        <div className="max-w-7xl mx-auto px-5 lg:px-7 text-center">
          <p className="text-xs text-[#545454]/70">*tant que l'offre est affichée</p>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      {(isMobile || isMobileDevice) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl z-40 md:hidden">
          <button
            onClick={() => openModal('Pack Automatique')}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#ed7862] to-[#e56651] hover:from-[#e56651] hover:to-[#d85540] text-white font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2"
          >
           
            Passez en Pack Automatique
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
      />

      <NotifyMeModal
        isOpen={isNotifyMeModalOpen}
        onClose={() => setIsNotifyMeModalOpen(false)}
        sourcePage="pricing"
      />
    </div>
  );
};

export default Pricing;
