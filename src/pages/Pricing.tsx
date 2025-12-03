import React, { useState, useEffect } from 'react';
import { Check, Shield, Zap, Bell, Smartphone, Mail, RefreshCw, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import LoginModal from '../components/LoginModal';
import { supabase } from '../lib/supabase';

const Pricing = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('signup');
  const [simulatedTenants, setSimulatedTenants] = useState(1);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'auto' | 'plus'>('auto');

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

  const openModal = (plan: string) => {
    if (userEmail && currentPlan) {
      // L'utilisateur a déjà un abonnement - afficher un message
      alert('Vous avez déjà un abonnement actif. Pour changer d\'abonnement, veuillez d\'abord annuler votre abonnement actuel depuis la page "Gérer mon abonnement", puis souscrire à une nouvelle formule.');
      return;
    }
    // Déterminer le plan sélectionné
    if (plan === 'Quittance Connectée+') {
      setSelectedPlan('plus');
    } else {
      setSelectedPlan('auto');
    }
    // Pas d'abonnement, ouvrir la modal de connexion/inscription
    setLoginMode('signup');
    setIsModalOpen(true);
  };

  const calculateAutoPrice = (tenants: number) => {
    return 1 + (tenants - 1) * 0.5;
  };

  const calculateBankPrice = (tenants: number) => {
    return 1.5 + (tenants - 1) * 1;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Tarifs Quittance Simple | Automatisation dès 1€/mois"
        description="Deux niveaux d'automatisation pour vos quittances. Rappels intelligents ou synchronisation bancaire complète."
        keywords="tarifs quittance loyer, automatisation quittance, abonnement quittance, prix quittance automatique"
        schema={schema}
        canonical="https://quittance-simple.fr/pricing"
      />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1a1f20] mb-6 leading-tight">
              Deux niveaux d'automatisation<br />selon votre besoin
            </h1>
            <p className="text-base text-[#545454] leading-relaxed">
              Choisissez la solution qui vous simplifie la gestion de vos quittances chaque mois.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plan Automatique */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border-2 border-[#ed7862]/20 p-8 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ed7862]/10 rounded-full -mr-16 -mt-16"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-[#ed7862] rounded-2xl flex items-center justify-center mb-6">
                  <Bell className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-3xl font-bold text-[#1a1f20] mb-2">
                  Quittance Automatique
                </h2>
                <p className="text-base text-[#545454] mb-6">
                  La simplicité du rappel intelligent.
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline mb-2">
                    <span className="text-3xl font-bold text-[#1a1f20]">1€</span>
                    <span className="text-[#545454] ml-2">/mois TTC — 1er locataire</span>
                  </div>
                  <p className="text-2xl text-[#545454] font-semibold">
                    + 0,70€/mois TTC/locataire supp.*
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#2D3436] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#545454]"><strong>Rappels SMS + e-mail mensuel au bailleur</strong></span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#2D3436] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#545454]">Génération automatique de la quittance</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#2D3436] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#545454]">Validation et envoi de la quittance ou d'une relance en 1 clic</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#2D3436] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#545454]">Historique des paiements</span>
                  </li>
                </ul>

                <button
                  onClick={() => openModal('Quittance Automatique')}
                  className="w-full py-4 rounded-full bg-[#ed7862] hover:bg-[#e56651] text-white font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  Souscrire Quittance Automatique
                </button>

                <p className="text-sm text-center text-[#545454] mt-4">
                  Sans engagement
                </p>
              </div>
            </motion.div>

            {/* Plan Connectée+ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border-2 border-[#415052]/20 p-8 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 bg-[#415052] text-white px-4 py-1 rounded-full text-sm font-bold">
                Recommandé
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-[#415052]/10 rounded-full -mr-16 -mt-16"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-[#415052] rounded-2xl flex items-center justify-center mb-6">
                  <RefreshCw className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-3xl font-bold text-[#1a1f20] mb-2">
                  Quittance Connectée<span className="text-[#2D3436] text-5xl">+</span>
                </h2>
                <p className="text-base text-[#545454] mb-6">
                  La tranquillité totale — tout est synchronisé automatiquement.
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline mb-2">
                    <span className="text-3xl font-bold text-[#1a1f20]">1,50€</span>
                    <span className="text-[#545454] ml-2">/mois TTC — 1er locataire</span>
                  </div>
                  <p className="text-2xl text-[#545454] font-semibold">
                    + 1€/mois TTC/locataire supp.*
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#2D3436] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#545454]"><strong>Synchronisation bancaire</strong> (PSD2)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#2D3436] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#545454]">Détection du paiement du loyer</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#2D3436] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#545454]">Génération + envoi automatique avec ou sans validation au choix</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#2D3436] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#545454]">Suivi temps réel des encaissements</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#2D3436] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#545454]">Historique des paiements</span>
                  </li>
                </ul>

                <button
                  onClick={() => openModal('Quittance Connectée+')}
                  className="w-full py-4 rounded-full bg-[#2D3436] hover:bg-[#1a1f20] text-white font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  Souscrire Quittance Connectée+
                </button>

                <p className="text-sm text-center text-[#545454] mt-4">
                  Sans engagement
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Simulateur */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-[#1a1f20] mb-4">
              Simuler votre coût mensuel
            </h2>
            <p className="text-base text-[#545454]">
              Ajustez le nombre de locataires pour voir le prix exact
            </p>
          </motion.div>

          <div className="bg-[#fefdf9] rounded-3xl p-8 border border-gray-200">
            <div className="mb-8">
              <label className="block text-lg font-bold text-[#1a1f20] mb-4">
                Nombre de locataires : <span className="text-[#2D3436]">{simulatedTenants}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={simulatedTenants}
                onChange={(e) => setSimulatedTenants(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gray-300"
                style={{
                  accentColor: '#2D3436',
                  background: `linear-gradient(to right, #2D3436 0%, #2D3436 ${((simulatedTenants - 1) / 9) * 100}%, #d1d5db ${((simulatedTenants - 1) / 9) * 100}%, #d1d5db 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-[#545454] mt-2">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border-2 border-[#ed7862]/20">
                <h3 className="font-bold text-[#1a1f20] mb-4">Quittance Automatique</h3>
                <div className="text-4xl font-bold text-[#ed7862] mb-2">
                  {calculateAutoPrice(simulatedTenants).toFixed(2)}€
                </div>
                <p className="text-sm text-[#545454]">par mois</p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-[#2D3436]/20">
                <h3 className="font-bold text-[#1a1f20] mb-4">Quittance Connectée+</h3>
                <div className="text-4xl font-bold text-[#2D3436] mb-2">
                  {calculateBankPrice(simulatedTenants).toFixed(2)}€
                </div>
                <p className="text-sm text-[#545454]">par mois</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="py-12 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 text-[#545454]">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-[#2D3436] mr-2" />
              <span className="text-base font-semibold">Paiement sécurisé</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-6 h-6 text-[#2D3436] mr-2" />
              <span className="font-semibold">Sans engagement</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-[#2D3436] mr-2" />
              <span className="font-semibold">Données sécurisées (RGPD & PSD2)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footnote */}
      <div className="bg-[#fefdf9] pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm text-[#545454]/70">* supplémentaire</p>
        </div>
      </div>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={loginMode}
        onModeChange={setLoginMode}
        selectedPlan={selectedPlan}
      />
    </div>
  );
};

export default Pricing;
