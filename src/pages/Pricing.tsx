import React, { useState } from 'react';
import { Check, Shield, Zap, Bell, Smartphone, Mail, RefreshCw, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import LoginModal from '../components/LoginModal';

const Pricing = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('signup');
  const [simulatedTenants, setSimulatedTenants] = useState(1);

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
        "name": "Automatique+",
        "price": "1.50",
        "priceCurrency": "EUR"
      }
    ]
  };

  const openModal = () => {
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
            <h1 className="text-4xl lg:text-5xl font-bold text-[#415052] mb-6 leading-tight">
              Deux niveaux d'automatisation<br />selon votre besoin
            </h1>
            <p className="text-xl text-[#415052] leading-relaxed">
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

                <h2 className="text-3xl font-bold text-[#415052] mb-2">
                  Quittance Automatique
                </h2>
                <p className="text-[#415052] mb-6 text-lg">
                  La simplicité du rappel intelligent.
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline mb-2">
                    <span className="text-5xl font-bold text-[#415052]">1€</span>
                    <span className="text-[#415052] ml-2">/mois</span>
                  </div>
                  <p className="text-base text-[#415052] font-semibold">
                    1er locataire + 0,50€/locataire supp.
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#79ae91] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#415052]">Rappels SMS + e-mail au bailleur</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#79ae91] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#415052]">Génération automatique de la quittance</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#79ae91] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#415052]">Envoi en 1 clic après validation</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#79ae91] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#415052]">Historique des paiements</span>
                  </li>
                </ul>

                <button
                  onClick={() => openModal()}
                  className="w-full py-4 rounded-full bg-[#ed7862] hover:bg-[#e56651] text-white font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  Souscrire Quittance Automatique
                </button>

                <p className="text-xs text-center text-[#415052] mt-4">
                  Sans engagement
                </p>
              </div>
            </motion.div>

            {/* Plan Automatique+ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border-2 border-[#79ae91]/20 p-8 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 bg-[#79ae91] text-white px-4 py-1 rounded-full text-sm font-bold">
                Recommandé
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-[#79ae91]/10 rounded-full -mr-16 -mt-16"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-[#79ae91] rounded-2xl flex items-center justify-center mb-6">
                  <RefreshCw className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-3xl font-bold text-[#415052] mb-2">
                  Quittance Automatique<span className="text-[#79ae91] text-5xl">+</span>
                </h2>
                <p className="text-[#415052] mb-6 text-lg">
                  La tranquillité totale — tout est synchronisé automatiquement.
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline mb-2">
                    <span className="text-5xl font-bold text-[#415052]">1,50€</span>
                    <span className="text-[#415052] ml-2">/mois</span>
                  </div>
                  <p className="text-base text-[#415052] font-semibold">
                    1er locataire + 1€/locataire supp.
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#79ae91] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#415052]"><strong>Synchronisation bancaire</strong> (PSD2)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#79ae91] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#415052]">Détection du paiement du loyer</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#79ae91] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#415052]">Génération + envoi automatique sans action</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-[#79ae91] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#415052]">Suivi temps réel des encaissements</span>
                  </li>
                </ul>

                <button
                  onClick={() => openModal()}
                  className="w-full py-4 rounded-full bg-[#79ae91] hover:bg-[#6a9d7f] text-white font-bold transition-all transform hover:scale-105 shadow-lg"
                >
                  Souscrire Quittance Automatique+
                </button>

                <p className="text-xs text-center text-[#415052] mt-4">
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
            <h2 className="text-3xl font-bold text-[#415052] mb-4">
              Simuler votre coût mensuel
            </h2>
            <p className="text-[#415052]">
              Ajustez le nombre de locataires pour voir le prix exact
            </p>
          </motion.div>

          <div className="bg-[#fefdf9] rounded-3xl p-8 border border-gray-200">
            <div className="mb-8">
              <label className="block text-lg font-bold text-[#415052] mb-4">
                Nombre de locataires : <span className="text-[#79ae91]">{simulatedTenants}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={simulatedTenants}
                onChange={(e) => setSimulatedTenants(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gray-300"
                style={{
                  accentColor: '#79ae91',
                  background: `linear-gradient(to right, #79ae91 0%, #79ae91 ${((simulatedTenants - 1) / 9) * 100}%, #d1d5db ${((simulatedTenants - 1) / 9) * 100}%, #d1d5db 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-[#415052] mt-2">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border-2 border-[#ed7862]/20">
                <h3 className="font-bold text-[#415052] mb-4">Quittance Automatique</h3>
                <div className="text-4xl font-bold text-[#ed7862] mb-2">
                  {calculateAutoPrice(simulatedTenants).toFixed(2)}€
                </div>
                <p className="text-sm text-[#415052]">par mois</p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-[#79ae91]/20">
                <h3 className="font-bold text-[#415052] mb-4">Quittance Automatique+</h3>
                <div className="text-4xl font-bold text-[#79ae91] mb-2">
                  {calculateBankPrice(simulatedTenants).toFixed(2)}€
                </div>
                <p className="text-sm text-[#415052]">par mois</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="py-12 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 text-[#415052]">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-[#79ae91] mr-2" />
              <span className="font-semibold">Paiement sécurisé</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-6 h-6 text-[#79ae91] mr-2" />
              <span className="font-semibold">Sans engagement</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-[#79ae91] mr-2" />
              <span className="font-semibold">Données sécurisées (RGPD & PSD2)</span>
            </div>
          </div>
        </div>
      </section>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={loginMode}
        onModeChange={setLoginMode}
      />
    </div>
  );
};

export default Pricing;
