import React, { useState } from 'react';
import { Check, Bell, RefreshCw, Mail, Smartphone, TrendingUp, Shield, Zap, Clock, Eye, ArrowRight, DollarSign, FileCheck, BarChart, Settings, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import LoginModal from '../components/LoginModal';

const Automation = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('signup');

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Automatisation Quittances de Loyer - Quittance Simple",
    "applicationCategory": "BusinessApplication",
    "description": "Solution d'automatisation complète pour la gestion des quittances de loyer. Rappels intelligents SMS et email, synchronisation bancaire PSD2, détection automatique des paiements et envoi instantané des quittances.",
    "offers": [
      {
        "@type": "Offer",
        "name": "Quittance Automatique",
        "price": "1",
        "priceCurrency": "EUR",
        "description": "Rappels intelligents et envoi en 1 clic"
      },
      {
        "@type": "Offer",
        "name": "Quittance Connectée Plus",
        "price": "1.50",
        "priceCurrency": "EUR",
        "description": "Synchronisation bancaire et automatisation complète"
      }
    ],
    "featureList": [
      "Rappels SMS et email automatiques",
      "Synchronisation bancaire sécurisée PSD2",
      "Détection automatique des paiements",
      "Envoi automatique des quittances",
      "Tableau de bord en temps réel",
      "Historique illimité des quittances"
    ]
  };

  const openModal = () => {
    setLoginMode('signup');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Automatisation Quittances de Loyer - Rappels SMS & Synchro Bancaire PSD2"
        description="Automatisez l'envoi de vos quittances de loyer : rappels intelligents SMS/email ou synchronisation bancaire PSD2 avec détection automatique des paiements. Dès 1€/mois."
        keywords="automatisation quittance loyer, quittance automatique, rappel paiement loyer, synchronisation bancaire psd2, détection paiement automatique, envoi automatique quittance, gestion locative automatisée, logiciel quittance bailleur"
        schema={schema}
        canonical="https://quittance-simple.fr/automation"
      />

      {/* Hero Section avec titre */}
      <section className="pt-24 pb-12 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-[#415052] mb-3">
              Deux niveaux d'automatisation
            </h1>
            <p className="text-xl text-[#415052]/70 mb-16">
              pour vous simplifier la vie
            </p>
          </motion.div>

          {/* Grille avec 2 colonnes */}
          <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">

            {/* QUITTANCE AUTOMATIQUE - Gauche */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#fef5f1] to-[#fef9f7] rounded-3xl p-8 lg:p-10 relative overflow-hidden flex flex-col"
            >
              {/* Titre */}
              <h2 className="text-3xl lg:text-4xl font-bold text-[#ed7862] mb-8">
                Quittance<br />Automatique
              </h2>

              {/* Femme + Téléphone côte à côte */}
              <div className="flex items-start justify-center -gap-4 lg:gap-2 mb-8 flex-1">
                {/* Image femme plus grande */}
                <div className="flex-shrink-0">
                  <img
                    src="/femme2_vert-removebg-preview.png"
                    alt="Femme consultant son téléphone"
                    className="w-56 lg:w-72 h-auto object-contain"
                  />
                </div>

                {/* Mockup mobile plus petit */}
                <div className="relative flex-shrink-0 mt-8">
                  {/* Phone frame */}
                  <div className="w-24 lg:w-32 h-[180px] lg:h-[220px] bg-gradient-to-br from-[#2d5052] to-[#3d6365] rounded-[1.5rem] p-2 shadow-2xl relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-[#1a3335] rounded-b-xl"></div>

                    {/* Screen */}
                    <div className="w-full h-full bg-gradient-to-b from-[#4a7073] to-[#3d5f62] rounded-[1.2rem] p-2 flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Content */}
                      <div className="text-center space-y-2 z-10">
                        <h3 className="text-white text-xs font-bold mb-2">
                          Loyer reçu?
                        </h3>

                        {/* Button OUI */}
                        <button className="w-full bg-[#79ae91] text-white font-semibold py-2 px-2 rounded-lg shadow-lg text-[10px] leading-tight">
                          OUI<br />Envoi Quittance
                        </button>

                        {/* Button NON */}
                        <button className="w-full bg-[#ed7862] text-white font-semibold py-2 px-2 rounded-lg shadow-lg text-[10px] leading-tight">
                          NON<br />Relancer Locataire
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phrase descriptive */}
              <p className="text-center text-lg text-[#415052] mb-6">
                Le rappel intelligent qui vous fait gagner du temps
              </p>

              {/* Fonctionnalités du plan */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#ed7862] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-[#415052]">Rappels SMS + e-mail</strong>
                    <p className="text-sm text-[#415052]">Notification automatique chaque mois</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#ed7862] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-[#415052]">Validation en 1 clic</strong>
                    <p className="text-sm text-[#415052]">Vous confirmez que le loyer est payé</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#ed7862] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-[#415052]">Envoi automatique</strong>
                    <p className="text-sm text-[#415052]">La quittance part directement au locataire</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#ed7862] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-[#415052]">Historique illimité</strong>
                    <p className="text-sm text-[#415052]">Toutes vos quittances accessibles 24/7</p>
                  </div>
                </li>
              </ul>

              {/* Prix */}
              <div className="bg-[#fefdf9] rounded-2xl p-6 mb-6">
                <div className="text-4xl font-bold text-[#415052] mb-2">1€<span className="text-lg font-normal">/mois</span></div>
                <p className="text-base text-[#415052] font-semibold">1er locataire + 0,50€/locataire supp.</p>
              </div>

              {/* Bouton CTA */}
              <button
                onClick={() => openModal()}
                className="w-full py-4 rounded-full bg-[#ed7862] hover:bg-[#e56651] text-white font-bold transition-all transform hover:scale-105"
              >
                Activer Quittance Automatique
              </button>
            </motion.div>

            {/* QUITTANCE AUTOMATIQUE+ - Droite */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#e8f4f1] to-[#f0f8f6] rounded-3xl p-8 lg:p-10 relative overflow-hidden flex flex-col"
            >
              {/* Titre */}
              <h2 className="text-3xl lg:text-4xl font-bold text-[#2d5052] mb-8">
                Quittance<br />Connectée<span className="text-[#79ae91]">+</span>
              </h2>

              {/* Image homme avec bulle */}
              <div className="relative flex justify-center flex-1 items-start mt-8 mb-2">
                <img
                  src="/homme_bras_back_final.png"
                  alt="Homme confiant"
                  className="w-64 lg:w-80 h-auto object-contain"
                />

                {/* Bulle notification bancaire positionnée en haut à droite */}
                <div className="absolute top-0 -right-4 lg:right-8">
                  <div className="bg-gradient-to-br from-[#2d5052] to-[#3d6365] rounded-2xl p-3 shadow-2xl max-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-[#79ae91] rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg font-bold">€</span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs leading-tight mb-0.5">Paiement détecté</p>
                        <p className="text-white/80 text-[10px] leading-tight">Envoi quittance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phrase descriptive */}
              <p className="text-center text-lg text-[#415052] mb-6">
                La tranquillité totale — tout est synchronisé automatiquement
              </p>

              {/* Fonctionnalités du plan */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#79ae91] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-[#415052]">+ Synchronisation bancaire (PSD2)</strong>
                    <p className="text-sm text-[#415052]">Connexion sécurisée à votre compte</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#79ae91] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-[#415052]">Détection automatique du paiement</strong>
                    <p className="text-sm text-[#415052]">Le système détecte l'encaissement</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#79ae91] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-[#415052]">Zéro action, 100% automatisé</strong>
                    <p className="text-sm text-[#415052]">Vous ne faites rien, tout part automatiquement</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#79ae91] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-[#415052]">Suivi des encaissements</strong>
                    <p className="text-sm text-[#415052]">Dashboard temps réel de vos paiements</p>
                  </div>
                </li>
              </ul>

              {/* Prix */}
              <div className="bg-[#79ae91]/10 rounded-2xl p-6 mb-6 border border-[#79ae91]/20">
                <div className="text-4xl font-bold text-[#415052] mb-2">1,50€<span className="text-lg font-normal">/mois</span></div>
                <p className="text-base text-[#415052] font-semibold">1er locataire + 1€/locataire supp.</p>
              </div>

              {/* Bouton CTA */}
              <button
                onClick={() => openModal()}
                className="w-full py-4 rounded-full bg-[#79ae91] hover:bg-[#6a9d7f] text-white font-bold transition-all transform hover:scale-105"
              >
                Activer Quittance Connectée+
              </button>
            </motion.div>

          </div>
        </div>
      </section>


      {/* Section contenu SEO */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-[#415052] mb-8">
              Pourquoi automatiser l'envoi de vos quittances de loyer ?
            </h2>

            <div className="prose prose-lg max-w-none text-[#415052]">
              <p className="mb-6 leading-relaxed">
                L'<strong>automatisation des quittances de loyer</strong> est devenue incontournable pour les propriétaires bailleurs qui gèrent un ou plusieurs biens locatifs. En France, la loi Alur impose l'envoi d'une quittance de loyer gratuite au locataire qui en fait la demande, mais cette obligation peut vite devenir une charge administrative mensuelle chronophage.
              </p>

              <h3 className="text-2xl font-bold text-[#415052] mt-8 mb-4">
                Gagnez du temps avec les rappels automatiques
              </h3>
              <p className="mb-6 leading-relaxed">
                Avec notre système de <strong>rappels intelligents par SMS et email</strong>, vous ne risquez plus d'oublier l'échéance de paiement. Chaque mois, à la date définie, vous recevez une notification pour chaque locataire. Un simple clic suffit pour valider le paiement et déclencher l'envoi automatique de la quittance PDF conforme à la législation.
              </p>

              <h3 className="text-2xl font-bold text-[#415052] mt-8 mb-4">
                La synchronisation bancaire PSD2 : l'avenir de la gestion locative
              </h3>
              <p className="mb-6 leading-relaxed">
                Notre formule <strong>Quittance Connectée+</strong> va encore plus loin grâce à la <strong>synchronisation bancaire sécurisée PSD2</strong>. Cette technologie européenne permet à notre système de se connecter à votre compte bancaire de manière ultra-sécurisée (sans jamais stocker vos identifiants) pour détecter automatiquement les virements de loyer entrants.
              </p>

              <p className="mb-6 leading-relaxed">
                Dès qu'un paiement correspondant au montant du loyer et provenant de l'IBAN du locataire est détecté, la <strong>quittance est générée et envoyée instantanément</strong> automatiquement ou après validation de votre part, au choix. C'est la solution idéale pour déléguer totalement cette tâche répétitive et vous concentrer sur l'essentiel.
              </p>

              <h3 className="text-2xl font-bold text-[#415052] mt-8 mb-4">
                Conformité légale et traçabilité
              </h3>
              <p className="mb-6 leading-relaxed">
                Toutes les quittances générées sont <strong>conformes aux obligations légales</strong> (loi Alur, loi de 1989) et incluent toutes les mentions obligatoires : montant du loyer, montant des charges, période concernée, coordonnées complètes du bailleur et du locataire. Un historique illimité est accessible 24/7 depuis votre tableau de bord, garantissant une traçabilité parfaite en cas de contrôle ou de litige.
              </p>

              <div className="bg-[#79ae91]/10 rounded-2xl p-8 border border-[#79ae91]/20 mt-8">
                <p className="text-lg font-semibold text-[#415052] mb-4">
                  💡 Le saviez-vous ?
                </p>
                <p className="text-[#415052] leading-relaxed">
                  Plus de 2 500 propriétaires font déjà confiance à Quittance Simple pour automatiser leurs envois de quittances. En moyenne, ils économisent <strong>20 minutes par mois et par locataire</strong> tout en garantissant une conformité légale irréprochable.
                </p>
              </div>
            </div>
          </motion.div>
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

export default Automation;
