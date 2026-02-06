import React, { useState, useEffect } from 'react';
import { Check, Bell, RefreshCw, Mail, Smartphone, TrendingUp, Shield, Zap, Clock, Eye, ArrowRight, DollarSign, FileCheck, BarChart, Settings, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import LoginModal from '../components/LoginModal';
import NotifyMeModal from '../components/NotifyMeModal';
import QuickPaymentModal from '../components/QuickPaymentModal';
import { supabase } from '../lib/supabase';

const Automation = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('signup');
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isNotifyMeModalOpen, setIsNotifyMeModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isQuickPaymentModalOpen, setIsQuickPaymentModalOpen] = useState(false);

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Automatisation Quittances de Loyer - Quittance Simple",
    "applicationCategory": "BusinessApplication",
    "description": "Solution d'automatisation complète pour la gestion des quittances de loyer. Rappels intelligents SMS et email, synchronisation bancaire PSD2, détection automatique des paiements et envoi instantané des quittances.",
    "offers": [
      {
        "@type": "Offer",
        "name": "Mode Tranquillité",
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

    // Le statut QA_1st_interested sera défini lors de l'inscription dans le LoginModal
    setLoginMode('signup');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Automatisation Quittances de Loyer - Rappels SMS & Synchro Bancaire PSD2"
        description="Automatisez l'envoi de vos quittances de loyer : rappels intelligents SMS/email ou synchronisation bancaire PSD2 avec détection automatique des paiements. Dès 0,99€/mois TTC."
        keywords="automatisation quittance loyer, quittance automatique, rappel paiement loyer, synchronisation bancaire psd2, détection paiement automatique, envoi automatique quittance, gestion locative automatisée, logiciel quittance bailleur"
        schema={schema}
        canonical="https://quittance-simple.fr/automation"
      />

      {/* Section description principale */}
      <section className="pt-4 sm:pt-16 pb-8 sm:pb-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Bloc caché en mobile uniquement */}
            <div className="hidden md:block">
              <h1 className="text-4xl sm:text-5xl lg:text-4xl font-bold text-[#1a1f20] mb-0 leading-tight">
                <br />Passez en Mode Tranquillité<br /> <span className="text-2xl text-[#545454] font-medium">et oubliez l'administratif locatif</span>
              </h1>

              <p className="text-base text-[#1a1f20] font-bold mb-4 sm:mb-6">
Tout est pris en charge, mais toujours sous votre contrôle.
              </p>

              <div className="space-y-2 sm:space-y-4 text-left flex justify-center">
                <div className="max-w-5xl space-y-2 sm:space-y-4">
                  <p className="text-sm sm:text-sm text-[#415052] leading-snug sm:leading-relaxed indent-8 sm:indent-20">
                    <strong>- La vraie alternative aux logiciels de gestion locative complexes et coûteux. </strong>
Créée par des bailleurs, pour des bailleurs.
                  </p>
                  <p className="text-sm sm:text-sm text-[#415052] leading-snug sm:leading-relaxed indent-8 sm:indent-20">
                    - On s'occupe de l'administratif pour que vous n'y pensiez plus... <strong></strong> <strong>sans jamais perdre la main.</strong>
                  </p>
                 <p className="text-sm sm:text-sm text-[#415052] leading-snug sm:leading-relaxed indent-8 sm:indent-20">
                    - Aucun logiciel "usine à gaz". <strong>Ultra simple. Ultra fluide. </strong> <span className="italic">"Je ne fais quasiment rien, je ne rate rien... et je garde la main."</span>
                  </p>

                </div>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#1a1f20] mb-2 text-center mt-20 sm:mt-32">
              Le Mode Tranquillité en détail
            </h3>
            <p className="text-sm text-[#1a1f20] font-semibold text-center mb-8 md:hidden">
              0,82€/mois, offre de lancement
            </p>

            <div className="flex flex-col lg:flex-row items-center gap-6">
              {/* Image à gauche */}
              <div className="flex-shrink-0">
                <img
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/homme_bras_back_final.png"
                  alt="Homme détendu - Gestion simplifiée"
                  className="w-32 md:w-64 lg:w-80 h-auto object-contain"
                />
              </div>

              {/* Contenu à droite - VERSION DESKTOP */}
              <div className="flex-1 text-left hidden md:block">
                <div className="space-y-3"><br />
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">Zéro oubli, vos quittances envoyées automatiquement</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Générées et envoyées par nos soins, vous recevez un bref rappel pour valider.<br />
                        C'est automatique mais vous êtes toujours maitre à bord.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">Tout votre historique, bien rangé</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Accessible à tout moment, au même endroit.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">La révision de loyer automatique (IRL). Fini la perte d'argent</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Calcul automatique<br />
                        On vous le rappelle au bon moment = zéro oublis = zero perte.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">La lettre de révision obligatoire déjà prête</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Conforme, pré-remplie, il ne reste qu'à l'envoyer.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">Votre bilan annuel, prêt pour votre déclaration.</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Loyers et charges cumulés automatiquement.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">Retard de loyer ? Des relances simples et courtoises</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Pour rester professionnel, sans stress.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu à droite - VERSION MOBILE */}
              <div className="flex-1 text-left block md:hidden">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">Zéros oubli, vos quittances envoyées automatiquement</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        C'est automatique mais vous êtes toujours maitre à bord.
                      </p>
                    </div>
                  </div>
   <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">Export des revenus annuel automatique</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Prêt pour votre déclaration. (Pinel/LMNP/Vide)
                      </p>
                    </div>
                  </div>
                
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">Calcul révision de loyer (IRL). Ne perdez plus d'argent</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Calcul automatique et lettre de révision prête à l'envoi.
                      </p>
                    </div>
                  </div>
                 
               

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">Relance automatique en cas de retard</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Professionnel, courtois et sans stress.
                      </p>
                    </div>
                  </div>
                    <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1f20] mb-1 text-sm">Historique 100% sécurisé, bien rangé</h4>
                      <p className="text-xs text-[#415052] leading-relaxed">
                        Accessible à tout moment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="pt-4 pb-3 bg-[#fefdf9]">
        <div className="max-w-5xl mx-auto px-5 lg:px-7">

         

          {/* BLOC QUITTANCE AUTOMATIQUE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 lg:p-9 mb-16 shadow-lg"
          >
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-9">
              {/* Image femme à gauche */}
              <div className="flex-shrink-0">
                <img
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/femme2_vert-removebg-preview.png"
                  alt="Femme consultant son téléphone"
                  className="w-56 lg:w-68 h-auto object-contain"
                />
              </div>

              {/* Contenu à droite */}
              <div className="flex-1 space-y-5">
              
                {/* Fonctionnalités 
                <ul className="space-y-2.5">
                  <li className="flex items-start">
                    <div className="w-5 h-5 bg-[#ed7862] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-sm text-[#415052]">Envoi de quittance automatique</strong>
                      <p className="text-xs text-[#415052]">Notification automatique, validation</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 bg-[#ed7862] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-sm text-[#415052]">Relance en cas de retard de loyer</strong>
                      <p className="text-xs text-[#415052]">Relance prête à envoyer en 1 clic</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 bg-[#ed7862] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-sm text-[#415052]">Bilan annuel</strong>
                      <p className="text-xs text-[#415052]">Cumul des loyers et charges par locataire + total</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 bg-[#ed7862] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-sm text-[#415052]">Calcul révision de loyer (IRL) notifiée au bon moment</strong>
                      <p className="text-xs text-[#415052]">Plus de perte d'argent</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 bg-[#ed7862] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-sm text-[#415052]">Lettre de révision prête à être envoyée</strong>
                      <p className="text-xs text-[#415052]">Générée automatiquement selon le calcul IRL</p>
                    </div>
                  </li>
                   <li className="flex items-start">
                    <div className="w-5 h-5 bg-[#ed7862] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-sm text-[#415052]">Historique illimité</strong>
                      <p className="text-xs text-[#415052]">Toutes vos quittances accessibles 24/7</p>
                    </div>
                  </li>
                </ul> */}

                {/* Toggle Mensuel/Annuel */}
                <div className="flex justify-center lg:justify-start items-center gap-4">
                  <motion.div
                    className="bg-white rounded-full p-1 shadow-lg border border-gray-200 inline-flex items-center gap-1.5"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                        billingCycle === 'monthly'
                          ? 'bg-[#7CAA89] text-white shadow-md'
                          : 'text-[#545454] hover:text-[#1a1f20]'
                      }`}
                    >
                      Formule mensuelle
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                        billingCycle === 'yearly'
                          ? 'bg-[#7CAA89] text-white shadow-md'
                          : 'text-[#545454] hover:text-[#1a1f20]'
                      }`}
                    >
                      Formule annuelle
                    
                    </button>
                  </motion.div>
                </div>

                {/* Prix */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={billingCycle}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/80 rounded-2xl p-5 border border-[#ed7862]/20"
                  >
                    {billingCycle === 'monthly' ? (
                      <>
                        <div className="flex items-baseline mb-1">
                          <span className="text-3xl font-bold text-[#ed7862]">0,99€/mois</span>
                          <span className="text-[#545454] ml-2 text-sm">— offre de lancement</span>
                        </div>
                        <p className="text-xs text-[#545454] mb-3 line-through opacity-60">
                          (au lieu de 1,49 € / mois ensuite)
                        </p>

                        <p className="text-base text-[#415052] font-semibold">
                          <span className="text-[#ed7862] font-bold">1,49€/mois</span> — offre de lancement (3–5 locataires)
                        </p>
                        <p className="text-xs text-[#545454] mb-2 line-through opacity-60">
                          (au lieu de 2,49 € / mois ensuite)
                        </p>

                        <p className="text-base text-[#415052] font-semibold">
                          <span className="text-[#ed7862] font-bold">2,49€/mois</span> — offre de lancement (5+ locataires)
                        </p>
                        <p className="text-xs text-[#545454] line-through opacity-60">
                          (au lieu de 3,99 € / mois ensuite)
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline mb-1">
                          <span className="text-3xl font-bold text-[#ed7862]">0,82€/mois</span>
                          <span className="text-[#545454] ml-2 text-sm">(9,90€/an) — offre de lancement</span>
                        </div>
                        <p className="text-xs text-[#545454] mb-3 line-through opacity-60">
                          (au lieu de 14,90 € / an ensuite)
                        </p>

                        <p className="text-base text-[#415052] font-semibold">
                          <span className="text-[#ed7862] font-bold">1,24€/mois</span> <span className="text-sm">(14,90€/an)</span> — offre de lancement (3–5 locataires)
                        </p>
                        <p className="text-xs text-[#545454] mb-2 line-through opacity-60">
                          (au lieu de 24,90 € / an ensuite)
                        </p>

                        <p className="text-base text-[#415052] font-semibold">
                          <span className="text-[#ed7862] font-bold">2,07€/mois</span> <span className="text-sm">(24,90€/an)</span> — offre de lancement (5+ locataires)
                        </p>
                        <p className="text-xs text-[#545454] line-through opacity-60">
                          (au lieu de 39,90 € / an ensuite)
                        </p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Bouton CTA - Visible uniquement sur desktop */}
                <button
                  onClick={() => openModal('Mode Tranquillité')}
                  className="hidden md:block w-full lg:w-auto px-6 py-3 rounded-full bg-[#ed7862] hover:bg-[#e56651] text-white font-bold text-base transition-all transform hover:scale-105 shadow-lg"
                >
                  Passer en Mode Tranquillité
                </button>
              </div>
            </div>
          </motion.div>

          {/* BLOC PRIX LE PLUS BAS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-6 lg:p-8 mb-8 shadow-md border border-gray-100"
          >
            <h2 className="text-xl text-[#415052] indent-0 font-semibold mb-4">
              Un prix volontairement bas, pourquoi ?
            </h2>

           

            <div className="bg-[#7CAA89]/10 rounded-2xl p-5 border-[#7CAA89] mt-4">
              <p className="text-base text-[#415052] leading-relaxed">
                <strong>👉 Un choix volontaire :</strong><br />
                Car on se concentre sur l'essentiel : un outil vraiment utile, simple et efficace.
              </p>
            </div>
          </motion.div>

          {/* BLOC QUITTANCES PDF CONFORMES */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="rounded-3xl p-6 lg:p-8 mb-16 shadow-md border border-[#FFD76F]/20"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1a1f20] mb-5">
             Des quittances PDF de qualité conformes.
            </h2>

            <p className="text-base text-[#415052] leading-relaxed mb-4">
              Les quittances générées par Quittance Simple sont :
            </p>

            <ul className="space-y-2 mb-5">
              <li className="flex items-start">
                <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-[#415052]"><strong>ultra qualitatives</strong></span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-[#415052]"><strong>100 % conformes à la loi ALUR</strong> (2026)</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-[#415052]">avec toutes les <strong>mentions légales obligatoires</strong>, signature électronique validée</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-[#415052]">les <strong>montants en chiffres et en lettres</strong></span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-[#415052]">un <strong>rendu propre, clair, professionnel</strong></span>
              </li>
            </ul>

            <div className="bg-white/60 rounded-2xl p-5 border-[#ed7862] mb-5">
              <p className="text-sm text-[#415052] leading-relaxed">
                👉 Beaucoup d'outils sont chers, compliqués et génèrent encore des quittances incomplètes, parfois non conformes, ou juridiquement fragiles.<br />
              
              </p>
            </div>

            <div className="bg-[#7CAA89]/10 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-[#1a1f20] mb-2 flex items-center">
                <span className="mr-2"></span> Notre référence : 
              </h3>
              <p className="text-sm text-[#415052] leading-relaxed">
                Quittance Simple s'appuie sur le modèle de référence de <strong>www.legifrance.gouv.fr/</strong>
              </p>
              <p className="text-sm text-[#415052] leading-relaxed mt-2">
                Même exigence.
                Mais automatisée, instantanée, et au prix le plus juste.
              </p>
            </div>
          </motion.div>

          {/* SEPARATEUR "Et bientôt :" */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center my-14"
          >
            <h3 className="text-2xl lg:text-xl font-bold text-[#545454] opacity-70">Et bientôt :</h3>
          </motion.div>

          {/* BLOC QUITTANCE CONNECTÉE+ - VERSION DISCRÈTE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="bg-gray-50/50 rounded-2xl p-3 lg:p-5 border border-gray-200 relative opacity-60 scale-95 max-w-2xl mx-auto"
          >
            {/* Badge Bientôt disponible */}
            <div className="absolute top-2.5 right-2.5 bg-gray-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold shadow-sm z-10">
              Bientôt disponible
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-5">
              {/* Image homme à gauche */}
              <div className="flex-shrink-0">
                <img
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/homme_bras_back_final.png"
                  alt="Homme confiant"
                  className="w-28 lg:w-36 h-auto object-contain opacity-80"
                />
              </div>

              {/* Contenu à droite */}
              <div className="flex-1 space-y-2.5">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-700">
                  Quittance Connectée<span className="text-gray-600">+</span>
                </h2>

                <p className="text-xs text-gray-600">
                  La tranquillité totale — tout est synchronisé automatiquement
                </p>

                {/* Fonctionnalités */}
                <ul className="space-y-1.5">
                  <li className="flex items-start">
                    <div className="w-3.5 h-3.5 bg-gray-400 rounded-full flex items-center justify-center mr-1.5 mt-0.5 flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-xs text-gray-600">Synchronisation bancaire (PSD2)</strong>
                      <p className="text-[10px] text-gray-500">Connexion sécurisée à votre compte</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-3.5 h-3.5 bg-gray-400 rounded-full flex items-center justify-center mr-1.5 mt-0.5 flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-xs text-gray-600">Détection automatique du paiement</strong>
                      <p className="text-[10px] text-gray-500">Le système détecte l'encaissement</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-3.5 h-3.5 bg-gray-400 rounded-full flex items-center justify-center mr-1.5 mt-0.5 flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-xs text-gray-600">Zéro action, 100% automatisé</strong>
                      <p className="text-[10px] text-gray-500">Vous ne faites rien, tout part automatiquement</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-3.5 h-3.5 bg-gray-400 rounded-full flex items-center justify-center mr-1.5 mt-0.5 flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div>
                      <strong className="text-xs text-gray-600">Suivi des encaissements</strong>
                      <p className="text-[10px] text-gray-500">Dashboard temps réel de vos paiements</p>
                    </div>
                  </li>
                </ul>

                {/* Prix */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={billingCycle}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-100 rounded-xl p-2.5 border border-gray-300"
                  >
                    {billingCycle === 'monthly' ? (
                      <>
                        <div className="flex items-baseline mb-0.5">
                          <span className="text-xl font-bold text-gray-700">1,49€</span>
                          <span className="text-gray-600 ml-1.5 text-xs">/mois — 1-2 logements</span>
                        </div>
                        <p className="text-[10px] text-gray-600 font-semibold">
                          2,49€/mois pour 3-4 logements
                        </p>
                        <p className="text-[10px] text-gray-600 font-semibold">
                          3,49€/mois pour 5-8 logements
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline mb-0.5">
                          <span className="text-xl font-bold text-gray-700">1,24€/mois</span>
                          <span className="text-gray-600 ml-1.5 text-xs">(14,90€/an) — 1-2 logements</span>
                        </div>
                        <p className="text-[10px] text-gray-600 font-semibold">
                          2,07€/mois (24,90€/an) pour 3-4 logements
                        </p>
                        <p className="text-[10px] text-gray-600 font-semibold">
                          2,91€/mois (34,90€/an) pour 5-8 logements
                        </p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Bouton CTA */}
                <button
                  onClick={() => setIsNotifyMeModalOpen(true)}
                  className="w-full lg:w-auto px-3 py-1.5 rounded-full bg-gray-600 hover:opacity-90 text-white font-semibold text-xs transition-all transform hover:scale-105 shadow-sm"
                >
                  Me tenir informé
                </button>

                <p className="text-[10px] text-gray-500">
                  Lancement prévu prochainement
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Section avantages avec icônes */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-5 lg:px-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-9"
          >
            <h2 className="text-2xl font-bold text-[#1a1f20] mb-3">
              Pourquoi choisir l'automatisation ?
            </h2>
            <p className="text-sm text-[#415052]/70">
              Simplifiez votre gestion locative avec nos solutions intelligentes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 text-center shadow-sm"
            >
              <div className="w-14 h-14 bg-[#ed7862]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-[#ed7862]" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1f20] mb-2">
                Gagnez du temps
              </h3>
              <p className="text-sm text-[#415052]">
                Simplifiez-vous la vie
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 text-center shadow-sm"
            >
              <div className="w-14 h-14 bg-[#FFF8E7] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-[#415052]" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1f20] mb-2">
                100% conforme
              </h3>
              <p className="text-sm text-[#415052]">
                Respect de la loi Alur et traçabilité complète
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 text-center shadow-sm"
            >
              <div className="w-14 h-14 bg-[#415052]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-[#415052]" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1f20] mb-2">
                Zéro oubli
              </h3>
              <p className="text-sm text-[#415052]">
                Rappels automatiques pour ne jamais manquer une échéance
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section contenu SEO */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-5 lg:px-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-[#1a1f20] mb-6">
              Comment fonctionne l'automatisation des quittances ?
            </h2>

            <div className="prose prose-lg max-w-none text-[#415052]">
              <p className="mb-5 leading-relaxed text-sm">
                L'<strong>automatisation des quittances de loyer</strong> est devenue incontournable pour les propriétaires bailleurs qui gèrent un ou plusieurs biens locatifs. En France, la loi Alur impose l'envoi d'une quittance de loyer gratuite au locataire qui en fait la demande, mais cette obligation peut vite devenir une charge administrative mensuelle chronophage.
              </p>

              <h3 className="text-xl font-bold text-[#1a1f20] mt-6 mb-3">
                Rappels automatiques intelligents
              </h3>
              <p className="mb-5 leading-relaxed text-sm">
                Avec notre système de <strong>rappels intelligents par SMS et email</strong>, vous ne risquez plus d'oublier l'échéance de paiement. Chaque mois, à la date définie, vous recevez une notification pour chaque locataire. Un simple clic suffit pour valider le paiement et déclencher l'envoi automatique de la quittance PDF conforme à la législation.
              </p>

              <h3 className="text-xl font-bold text-[#1a1f20] mt-6 mb-3">
                Synchronisation bancaire PSD2 sécurisée (Bientôt disponible)
              </h3>
              <p className="mb-5 leading-relaxed text-sm">
                Notre future formule <strong>Quittance Connectée+</strong> ira encore plus loin grâce à la <strong>synchronisation bancaire sécurisée PSD2</strong>. Cette technologie européenne permettra à notre système de se connecter à votre compte bancaire de manière ultra-sécurisée (sans jamais stocker vos identifiants) pour détecter automatiquement les virements de loyer entrants.
              </p>

              <p className="mb-5 leading-relaxed text-sm">
                Dès qu'un paiement correspondant au montant du loyer et provenant de l'IBAN du locataire sera détecté, la <strong>quittance sera générée et envoyée instantanément</strong> automatiquement ou après validation de votre part, au choix. Ce sera la solution idéale pour déléguer totalement cette tâche répétitive et vous concentrer sur l'essentiel.
              </p>

              <h3 className="text-xl font-bold text-[#1a1f20] mt-6 mb-3">
                Conformité légale garantie
              </h3>
              <p className="mb-5 leading-relaxed text-sm">
                Toutes les quittances générées sont <strong>conformes aux obligations légales</strong> (loi Alur, loi de 1989) et incluent toutes les mentions obligatoires : montant du loyer, montant des charges, période concernée, coordonnées complètes du bailleur et du locataire. Un historique illimité est accessible 24/7 depuis votre tableau de bord, garantissant une traçabilité parfaite en cas de contrôle ou de litige.
              </p>

              
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footnote */}
      <div className="bg-gray-50 pb-32 md:pb-6">
        <div className="max-w-5xl mx-auto px-5 lg:px-7 text-center">
          <p className="text-xs text-[#415052]/70">* Tarif forfaitaire plafonné - Tous prix TTC</p>
        </div>
      </div>

      {/* CTA fixe en bas de page - UNIQUEMENT MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-0 border-[#7CAA89] shadow-2xl p-4 z-50 md:hidden">
        <button
          onClick={() => setIsQuickPaymentModalOpen(true)}
          className="w-full px-6 py-3.5 rounded-full bg-[#ed7862] hover:bg-[#e56651] text-white font-bold text-base transition-all transform hover:scale-105 shadow-lg"
        >
          Passer en Mode Tranquillité
        </button>
    
      </div>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={loginMode}
        onModeChange={setLoginMode}
        billingCycle={billingCycle}
      />

      <NotifyMeModal
        isOpen={isNotifyMeModalOpen}
        onClose={() => setIsNotifyMeModalOpen(false)}
        sourcePage="automation"
      />

      <QuickPaymentModal
        isOpen={isQuickPaymentModalOpen}
        onClose={() => setIsQuickPaymentModalOpen(false)}
        selectedPlan="auto"
        billingCycle={billingCycle}
      />

    </div>
  );
};

export default Automation;
