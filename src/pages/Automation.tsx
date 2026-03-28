import React, { useState, useEffect } from 'react';
import { Check, Bell, RefreshCw, Mail, Shield, Zap, Clock, ArrowRight, Calendar, FileText, Archive, Send, PieChart, MessageSquare, FileUp, User, XCircle, Home, X, Maximize2, Sparkles, CreditCard, Briefcase, PenLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import LoginModal from '../components/LoginModal';
import NotifyMeModal from '../components/NotifyMeModal';
import QuickPaymentModal from '../components/QuickPaymentModal';
import PackActivationFlow from '../components/PackActivationFlow';
import { supabase } from '../lib/supabase';
import { trackCtaClick } from '../utils/analytics';
import { getPricing, formatPrice } from '../utils/pricing';

const AVIS_MOBILE = [
  { text: "J'ai automatisé mes quittances, je ne m'en occupe plus ! C'est trop bien :)", author: 'Julie, propriétaire coloc 5 chambres' },
  { text: "Yes, Enfin un outil simple ! On automatise hyper facilement", author: 'Thomas, bailleur' },
  { text: "L'idée est super, c'est automatisé mais j'ai le contrôle ", author: 'Marie, propriétaire' },
];

/** Bulles sur la photo du hero — sur mobile : une seule à la fois en bas, en boucle */
const HERO_PHOTO_BUBBLES = [
  { line1: 'Quittance envoyée automatiquement', line2: 'Locataire : Marie Dubois' },
  { line1: 'Quittance envoyée automatiquement', line2: 'Locataire : Gilles Martin' },
];

const Automation = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('signup');
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isNotifyMeModalOpen, setIsNotifyMeModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isQuickPaymentModalOpen, setIsQuickPaymentModalOpen] = useState(false);
  const [isQuittanceModalOpen, setIsQuittanceModalOpen] = useState(false);
  const [isPackActivationFlowOpen, setIsPackActivationFlowOpen] = useState(false);
  const [proprietaireInfo, setProprietaireInfo] = useState<any>(null);
  const [locatairesCount, setLocatairesCount] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState<{ src: string; alt: string } | null>(null);
  const [avisIndex, setAvisIndex] = useState(0);
  const [heroPhotoBubbleIndex, setHeroPhotoBubbleIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setAvisIndex((i) => (i + 1) % AVIS_MOBILE.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      setHeroPhotoBubbleIndex((i) => (i + 1) % HERO_PHOTO_BUBBLES.length);
    }, 3200);
    return () => clearInterval(t);
  }, []);
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Automatisation Quittances de Loyer - Quittance Simple",
    "applicationCategory": "BusinessApplication",
    "description": "Solution d'automatisation complète pour la gestion des quittances de loyer. Rappels intelligents SMS et email, synchronisation bancaire PSD2, détection automatique des paiements et envoi instantané des quittances.",
    "offers": [
      {
        "@type": "Offer",
        "name": "Pack Automatique",
        "price": "3.90",
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
      .select('id, plan_actuel, abonnement_actif, nom, prenom, adresse, telephone, email')
      .eq('email', email)
      .maybeSingle();

    if (!error && data) {
      if (data.abonnement_actif) {
        setCurrentPlan(data.plan_actuel || '');
      }
      setProprietaireInfo(data);
      
      // Charger le nombre de locataires
      const { count } = await supabase
        .from('locataires')
        .select('*', { count: 'exact', head: true })
        .eq('proprietaire_id', data.id)
        .eq('actif', true);
      
      setLocatairesCount(count || 0);
    }
  };

  const isProprietaireInfoComplete = (prop: any): boolean => {
    if (!prop) return false;
    return !!(prop.nom && prop.prenom && prop.adresse && prop.email && prop.telephone);
  };

  const openModal = async (plan: string) => {
    if (userEmail && currentPlan) {
      alert('Vous avez déjà un abonnement actif. Pour changer d\'abonnement, veuillez d\'abord annuler votre abonnement actuel depuis la page "Gérer mon abonnement", puis souscrire à une nouvelle formule.');
      return;
    }

    // Ouvrir le flow d'activation Pack Automatique avec essai gratuit
    trackCtaClick('pack_automatique_activation', 'automation', 'pack_activation_flow');
    setIsPackActivationFlowOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fefefe] sm:bg-[#f7f5fa] font-sans text-[#212a3e]">
      <SEOHead
        title="Automatisation Quittances de Loyer - Rappels SMS & Synchro Bancaire PSD2"
        description="Automatisez l'envoi de vos quittances de loyer : rappels intelligents SMS/email ou synchronisation bancaire PSD2 avec détection automatique des paiements. Dès 3,90€/mois TTC."
        keywords="automatisation quittance loyer, quittance automatique, rappel paiement loyer, synchronisation bancaire psd2, détection paiement automatique, envoi automatique quittance, gestion locative automatisée, logiciel quittance bailleur"
        schema={schema}
        canonical="https://quittance-simple.fr/automation"
      />

      {/* Hero : modèle deux colonnes — titre, choix niveau, CTA, confiance | photo + overlay + texte */}
      <header className="pt-8 sm:pt-10 lg:pt-14 pb-12 sm:pb-16 bg-[#fbf9fe] border-b border-[#e8e7ef]">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1 text-center sm:text-left"
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#212a3e] leading-tight">
                Fini les quittances manuelles
              </h1>
              <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#212a3e] leading-tight">
                Elles partent automatiquement
              </h1>
             

              {/* Carte : Choisissez votre niveau d'automatisation */}
              <div className="mt-6 p-4 sm:p-5 bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
                <p className="text-sm font-medium text-[#212a3e] mb-3">
                  Deux modes au choix&nbsp;:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-[#e2e8f0]">
                    <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#212a3e]">
                        100% automatique <span className="text-xs font-normal text-amber-600">(nouveau)</span>
                      </p>
                      <p className="text-xs text-[#5e6478] mt-0.5">
                        Vous recevez un email 5 jours avant l'envoi réel juste pour vous prévenir. <br />Si vous ne faites rien, la quittance partira automatiquement.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-[#e2e8f0]">
                    <Zap className="w-5 h-5 text-[#E65F3F] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#212a3e]">Validation en un clic</p>
                      <p className="text-xs text-[#5e6478] mt-0.5">
                        Vous recevez un SMS + e-mail. Un clic et la quittance part.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center sm:items-start gap-3">
                <button
                  onClick={() => {
                    trackCtaClick('passer_pack_automatique_hero', 'automation', 'pack_automatique_modal');
                    openModal('Pack Automatique');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-6 py-3 bg-[#E65F3F] hover:bg-[#d95530] text-white text-sm font-semibold transition-colors shadow-[0_2px_6px_rgba(15,23,42,0.1)]"
                >
                  Activer le Pack Automatique gratuit
                </button>
                <ul className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-[#5e6478] list-none">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    30 jours d'essai gratuit
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Sans carte bancaire
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    L'activation en 1 minute
                  </li>
                </ul>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2 flex flex-col justify-center items-center lg:items-start bg-[#fbf9fe] relative"
            >
              {/* Conteneur sans overflow pour que badge et overlay mobile puissent dépasser */}
              <div className="relative w-full max-w-md lg:max-w-lg">
                {/* Photo avec arrondis (overflow uniquement sur l'image) */}
                <div className="overflow-hidden rounded-2xl lg:rounded-3xl">
                  <img
                    src="/images/femme_terrasse_amis2.png"
                    alt="Pack Automatique"
                    className="w-full h-auto object-contain"
                  />
                </div>
                {/* Mobile : bulle type SMS (étroite), dans la partie basse de la photo, droite pour laisser le badge à gauche */}
                <div
                  className="lg:hidden absolute z-20 right-2.5 bottom-2.5 pointer-events-none flex justify-end"
                  aria-live="polite"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={heroPhotoBubbleIndex}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 36 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="inline-flex w-fit max-w-[min(148px,calc(100vw-2rem))]"
                    >
                      <div className="rounded-[14px] rounded-br-[5px] bg-[#e9e9ee] py-1.5 pl-2 pr-2 shadow-[0_1px_4px_rgba(15,23,42,0.12)]">
                        <div className="flex items-start gap-1">
                          <Check className="w-2.5 h-2.5 text-green-600 shrink-0 mt-[1px]" strokeWidth={2.5} />
                          <div className="min-w-0">
                            <p className="text-[9px] font-medium text-[#212a3e] leading-snug text-left">
                              {HERO_PHOTO_BUBBLES[heroPhotoBubbleIndex].line1}
                            </p>
                            <p className="text-[8px] text-[#5e6478] mt-0.5 leading-snug text-left">
                              {HERO_PHOTO_BUBBLES[heroPhotoBubbleIndex].line2}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* Desktop : deux bulles comme avant (haut droite) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="hidden lg:block absolute top-3 right-2 sm:top-5 sm:right-6 z-20"
                >
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-2 shadow-lg border border-[#e2e8f0] max-w-[180px]">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-medium text-[#212a3e] leading-snug">
                          Quittance envoyée automatiquement
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-[#5e6478] mt-0.5 leading-snug">
                          Locataire : Marie Dubois
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 0.92, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="hidden lg:block absolute top-14 right-8 sm:top-20 sm:right-14 z-10"
                >
                  <div className="bg-white/85 backdrop-blur-sm rounded-xl px-2.5 py-2 shadow-md border border-[#e2e8f0] max-w-[170px]">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[#212a3e] leading-snug">
                          Quittance envoyée automatiquement
                        </p>
                        <p className="text-[10px] text-[#5e6478] mt-0.5 leading-snug">
                          Locataire : Gilles Martin
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                {/* Badge promotionnel — au-dessus et à l’extérieur de la photo, non rogné */}
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
                  className="absolute bottom-4 left-3 sm:bottom-6 sm:-left-5 md:bottom-8 md:-left-8 lg:bottom-10 lg:-left-12 z-20"
                >
                  <div className="bg-[#E65F3F]/80 backdrop-blur-sm rounded-full px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 shadow-md border border-white/30 flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24">
                    <div className="flex flex-col items-center gap-0 sm:gap-0.5">
                      <span className="text-white font-bold text-[9px] sm:text-[10px] md:text-xs lg:text-sm leading-none">Essai</span>
                      <span className="text-white font-semibold text-[9px] sm:text-[10px] md:text-xs lg:text-sm leading-none">gratuit</span>
                      <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
                        <CreditCard className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 text-white/90" />
                        <span className="text-white/90 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs leading-none">Sans CB</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
             
            </motion.div>
          </div>
          {/* Phrase statistiques centrée en bas du hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 sm:mt-10 text-center"
          >
            <p className="text-sm text-[#5e6478] font-medium">
              Adopté par 450+ propriétaires — 4 000+ quittances générées
            </p>
          </motion.div>
          {/* Messages défilants (comme sur la Home version mobile) */}
          <div className="mt-4 max-w-xl mx-auto">
            <div className="w-full min-h-[68px] bg-white/90 backdrop-blur-sm border border-[#e8e7ef] rounded-2xl px-4 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.08)] overflow-hidden relative flex items-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={avisIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 px-4 py-3 flex flex-col justify-center"
                >
                  <p className="text-xs sm:text-sm leading-snug text-[#212a3e] italic line-clamp-2">
                    « {AVIS_MOBILE[avisIndex].text} »
                  </p>
                  <span className="text-[10px] sm:text-xs text-[#8b90a3] mt-1 shrink-0">{AVIS_MOBILE[avisIndex].author}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Message d'accueil si utilisateur connecté avec infos incomplètes */}
      {userEmail && proprietaireInfo && proprietaireInfo.abonnement_actif && (
        <section className="py-4 bg-[#f7f5fa] border-b border-[#e8e7ef]">
          <div className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10">
            {!isProprietaireInfoComplete(proprietaireInfo) && (
              <div className="bg-gradient-to-r from-[#E65F3F]/10 via-[#f97316]/10 to-[#E65F3F]/10 border-2 border-[#E65F3F]/30 rounded-2xl p-5 mb-4 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#E65F3F] rounded-xl flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base sm:text-lg text-[#212a3e] font-bold mb-2">
                      Bienvenue et merci de nous rejoindre !
                    </p>
                    <p className="text-sm sm:text-base text-[#5e6478] leading-relaxed">
                      Il ne vous reste plus qu'à finaliser votre profil en quelques secondes dans votre{' '}
                      <a href="/dashboard" className="text-[#E65F3F] font-semibold hover:underline">espace bailleur</a>{' '}
                      pour pouvoir utiliser pleinement toutes les fonctionnalités du Pack Automatique. Complétez simplement vos informations et vous serez prêt à automatiser vos quittances !
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isProprietaireInfoComplete(proprietaireInfo) && locatairesCount === 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm sm:text-base font-semibold text-[#212a3e] mb-2">
                  🎉 Votre profil est complet !
                </p>
                <p className="text-xs sm:text-sm text-[#5e6478] leading-relaxed">
                  Il ne vous reste plus qu'à ajouter votre premier locataire dans votre{' '}
                  <a href="/dashboard" className="text-[#E65F3F] font-semibold hover:underline">espace bailleur</a>{' '}
                  pour activer l'automatisation des quittances. Quelques clics suffisent pour commencer !
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bandeau : perte de temps + Déjà adopté par des centaines de propriétaires */}
      <section className="py-14 sm:py-20 bg-[#f7f5fa] border-b border-[#e8e7ef]" aria-label="Adopté par des propriétaires">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10">
          <div className="bg-[#2d3648] rounded-3xl border border-[#4b5563]/70 shadow-[0_14px_48px_rgba(0,0,0,0.14)] p-6 sm:p-8 lg:p-10">
            <div className="text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-5">
                Chaque mois, la même perte de temps…
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 max-w-2xl mx-auto mb-5 text-left">
                {[
                  'Créer la quittance manuellement.',
                  'Vérifier les montants.',
                  "L'envoyer au bon locataire, sans fautes.",
                  "Vérifier l'IRL, les baux, les charges etc.",
                  'Chercher vos bilans.',
                  'Relancer en cas de retard.',
                ].map((label, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-base text-slate-300 justify-start">
                    <XCircle className="w-5 h-5 shrink-0 text-[#E65F3F]" aria-hidden />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-base sm:text-lg text-slate-200 font-medium">
                Cela vous prend du temps. Cela vous fatigue. Cela vous stresse...<br />
                Et ça revient chaque mois !
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche ? — timeline vertical */}
      <section className="py-14 sm:py-20 bg-[#f7f5fa] border-b border-[#e8e7ef]" aria-label="Comment ça marche">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#212a3e] text-center mb-12 sm:mb-16"
          >
            Comment ça marche ?
          </motion.h2>

          <div className="relative">
            {/* Ligne verticale centrale (desktop) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#E65F3F]/40 via-[#212a3e]/30 to-[#E65F3F]/40 transform -translate-x-1/2"></div>
            {/* Ligne verticale gauche (mobile) */}
            <div className="lg:hidden absolute left-[1.125rem] top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#E65F3F]/40 via-[#212a3e]/30 to-[#E65F3F]/40" aria-hidden></div>

            {/* Étape 1 : Texte à gauche, icône au centre */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative mb-12 sm:mb-16 pl-12 lg:pl-0"
            >
              {/* Point sur la ligne (desktop centre / mobile gauche) */}
              <div className="hidden lg:block absolute left-1/2 top-1/2 w-4 h-4 bg-[#E65F3F] rounded-full border-3 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
              <div className="lg:hidden absolute left-[1.125rem] top-10 w-4 h-4 bg-[#E65F3F] rounded-full border-[3px] border-[#f7f5fa] shadow-md transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
                <div className="order-2 lg:order-1 lg:text-right">
                  <span className="text-xs font-semibold text-[#E65F3F] uppercase tracking-wider">Étape 1</span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#212a3e] mt-1.5 mb-2">Ajoutez votre locataire</h3>
                  <p className="text-[#5e6478] text-sm sm:text-base leading-relaxed mb-2">
                    Pré-rempli si vous avez déjà fait une quittance gratuite, ou en quelques secondes grâce à un formulaire simplifié. ANTI usine à gaz.
                  </p>
                  <span className="inline-block text-xs font-medium text-[#212a3e] bg-[#E65F3F]/10 px-2.5 py-1 rounded-full">20 secondes à 2 minutes</span>
                </div>
                <div className="order-1 lg:order-2 flex justify-center lg:justify-start relative z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-[0_4px_12px_rgba(33,42,62,0.12)] ring-4 ring-[#f7f5fa] flex items-center justify-center p-2.5">
                    <img src="/icons/icon-locataire-head.png" alt="" className="w-full h-full object-contain" aria-hidden />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Étape 2 : Icône au centre, texte à droite */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative mb-12 sm:mb-16 pl-12 lg:pl-0"
            >
              {/* Point sur la ligne (desktop centre / mobile gauche) */}
              <div className="hidden lg:block absolute left-1/2 top-1/2 w-4 h-4 bg-[#E65F3F] rounded-full border-3 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
              <div className="lg:hidden absolute left-[1.125rem] top-10 w-4 h-4 bg-[#E65F3F] rounded-full border-[3px] border-[#f7f5fa] shadow-md transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
                <div className="order-1 lg:order-1 flex justify-center lg:justify-end relative z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-[0_4px_12px_rgba(33,42,62,0.12)] ring-4 ring-[#f7f5fa] flex items-center justify-center p-2.5">
                    <img src="/icons/icon-schedule.png" alt="" className="w-full h-full object-contain" aria-hidden />
                  </div>
                </div>
                <div className="order-2 lg:order-2 lg:text-left">
                  <span className="text-xs font-semibold text-[#E65F3F] uppercase tracking-wider">Étape 2</span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#212a3e] mt-1.5 mb-2">Choisissez la date de rappel d'échéance</h3>
                  <p className="text-[#5e6478] text-sm sm:text-base leading-relaxed mb-2">
                  Selon le mode choisi, c'est la date où vous receverez soit&nbsp;: <br /> - Un mail pour vous prevenir 5 jours avant l'envoi.<br /> soit&nbsp;:<br />- 1 SMS + un email, pour valider en 1 clic.<br /> <strong>Et c'est tout !</strong>
                  </p>
                  <span className="inline-block text-xs font-medium text-[#212a3e] bg-[#E65F3F]/10 px-2.5 py-1 rounded-full">30 secondes</span>
                </div>
              </div>
            </motion.div>

            {/* Étape 3 : Texte à gauche, icône au centre */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative mb-12 sm:mb-16 pl-12 lg:pl-0"
            >
              {/* Point sur la ligne (desktop centre / mobile gauche) */}
              <div className="hidden lg:block absolute left-1/2 top-1/2 w-4 h-4 bg-[#E65F3F] rounded-full border-3 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
              <div className="lg:hidden absolute left-[1.125rem] top-10 w-4 h-4 bg-[#E65F3F] rounded-full border-[3px] border-[#f7f5fa] shadow-md transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
                <div className="order-2 lg:order-1 lg:text-right">
                  <span className="text-xs font-semibold text-[#E65F3F] uppercase tracking-wider">Étape 3</span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#212a3e] mt-1.5 mb-2">Utilisez tous les outils "simples et intelligents" dans votre espace bailleur</h3>
                  <p className="text-[#5e6478] text-sm sm:text-base leading-relaxed mb-2">
                  Création d'annonces avec IA, Rédaction et siganture de bail en ligne, Calcul Révision IRL automatique au bon moment, Coffre fort de tous vos documents, Modèles de bails, Bilan annuel... Et d'autres bonus encore.
                  </p>
                  <span className="inline-block text-xs font-medium text-[#212a3e] bg-[#E65F3F]/10 px-2.5 py-1 rounded-full">Quand vous voulez</span>
                </div>
                <div className="order-1 lg:order-2 flex justify-center lg:justify-start relative z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-[0_4px_12px_rgba(33,42,62,0.12)] ring-4 ring-[#f7f5fa] flex items-center justify-center p-2.5">
                    <img src="/icons/icon-historique-clair-organise.png" alt="" className="w-full h-full object-contain" aria-hidden />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Étape 4 : Icône au centre, texte à droite */}
           
          </div>
        </div>
      </section>

      {/* Pour qui est fait le Pack Automatique ? — profils avec photos */}
      <section className="py-14 sm:py-20 bg-white border-b border-[#e8e7ef]" aria-label="Pour qui">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#212a3e] text-center mb-10 sm:mb-12"
          >
            Pour qui est fait le Pack Automatique ?
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Profil 1 : Le propriétaire indépendant */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-[0_2px_12px_rgba(15,23,42,0.08)] ring-1 ring-[#e8e7ef]/60 overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.12)] transition-all"
            >
              {/* Photo */}
              <div className="w-full aspect-[4/3] bg-[#f7f5fa] flex items-center justify-center">
                <img 
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/homme_cafe_jardin_2.png" 
                  alt="Marc, propriétaire indépendant"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-[#5e6478] text-sm">
                  Photo à venir
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#212a3e] mb-1">Marc, 58 ans</h3>
                <p className="text-lg font-bold text-[#212a3e] mb-1">L'indépendant serein</p>
                <p className="text-sm text-[#5e6478] mb-4">2 appartements • Gère seul</p>
                <div className="border-t border-[#e8e7ef] pt-4">
                  <p className="text-sm text-[#5e6478] italic leading-relaxed">
                    "Je veux que mes quittances partent sans y penser."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Profil 2 : Le bailleur qui manque de temps */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-[0_2px_12px_rgba(15,23,42,0.08)] ring-1 ring-[#e8e7ef]/60 overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.12)] transition-all"
            >
              {/* Photo */}
              <div className="w-full aspect-[4/3] bg-[#f7f5fa] flex items-center justify-center">
                <img 
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/femme_dossier.png" 
                  alt="Sophie, bailleur qui manque de temps"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-[#5e6478] text-sm">
                  Photo à venir
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#212a3e] mb-1">Sophie, 52 ans</h3>
                <p className="text-lg font-bold text-[#212a3e] mb-1">La prudente rassurée</p>
                <p className="text-sm text-[#5e6478] mb-4">1 à 3 logements</p>
                <div className="border-t border-[#e8e7ef] pt-4">
                  <p className="text-sm text-[#5e6478] italic leading-relaxed">
                    "Je veux être conforme sans me compliquer la vie."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Profil 3 : Nouveau profil au milieu */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-[0_2px_12px_rgba(15,23,42,0.08)] ring-1 ring-[#e8e7ef]/60 overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.12)] transition-all"
            >
              {/* Photo */}
              <div className="w-full aspect-[4/3] bg-[#f7f5fa] flex items-center justify-center">
                <img 
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/homme_appart_visite.png" 
                  alt="Nouveau profil"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-[#5e6478] text-sm">
                  Photo à venir
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#212a3e] mb-1">Thomas, 37 ans</h3>
                <p className="text-lg font-bold text-[#212a3e] mb-1">L'investisseur qui optimise son temps'</p>
                <p className="text-sm text-[#5e6478] mb-4">2 à 4 logements • Semi - Professionnel</p>
                <div className="border-t border-[#e8e7ef] pt-4">
                  <p className="text-sm text-[#5e6478] italic leading-relaxed">
                    "Je préfère chercher des nouveaux biens que perdre mon temps à gérer."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Profil 4 : Le propriétaire prudent */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-[0_2px_12px_rgba(15,23,42,0.08)] ring-1 ring-[#e8e7ef]/60 overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.12)] transition-all"
            >
              {/* Photo */}
              <div className="w-full aspect-[4/3] bg-[#f7f5fa] flex items-center justify-center">
                <img 
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/femme_45_rue.png" 
                  alt="Claire, propriétaire prudent"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-[#5e6478] text-sm">
                  Photo à venir
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#212a3e] mb-1">Claire, 45 ans</h3>
                <p className="text-lg font-bold text-[#212a3e] mb-1">La pressée qui respire</p>
                <p className="text-sm text-[#5e6478] mb-4">3 à 5 biens</p>
                <div className="border-t border-[#e8e7ef] pt-4">
                  <p className="text-sm text-[#5e6478] italic leading-relaxed">
                    "Je n'ai pas le temps d'y penser chaque mois."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Profil 5 : L'investisseur organisé */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-[0_2px_12px_rgba(15,23,42,0.08)] ring-1 ring-[#e8e7ef]/60 overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.12)] transition-all"
            >
              {/* Photo */}
              <div className="w-full aspect-[4/3] bg-[#f7f5fa] flex items-center justify-center">
                <img 
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/homme_haie.png" 
                  alt="Pierre, investisseur organisé"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-[#5e6478] text-sm">
                  Photo à venir
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#212a3e] mb-1">Pierre, 62 ans</h3>
                <p className="text-lg font-bold text-[#212a3e] mb-1">L'investisseur organisé</p>
                <p className="text-sm text-[#5e6478] mb-4">5+ logements • Portefeuille</p>
                <div className="border-t border-[#e8e7ef] pt-4">
                  <p className="text-sm text-[#5e6478] italic leading-relaxed">
                    "Je veux que tout soit clair et prêt pour ma déclaration."
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comment ça marche en détail — mise en page quinconce, fond foncé */}
      <section className="py-16 sm:py-24 bg-[#f7f5fa] border-b border-[#e8e7ef]" aria-label="Comment ça marche en détail">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-[#4b5563]/70 bg-gradient-to-b from-[#252d42] to-[#2d3648] shadow-[0_14px_50px_rgba(0,0,0,0.16)] p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#E65F3F]/20 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[#2d3648]/20 blur-3xl" aria-hidden />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-center mb-12 sm:mb-16"
          >
            Voir plus en détail
          </motion.h2>

          {/* Étape 1 : Image à gauche, texte à droite */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 sm:mb-20"
          >
            <div className="relative order-2 lg:order-1 group cursor-pointer" onClick={() => setEnlargedImage({ src: "/images/automation/etape1-dashboard.png", alt: "Tableau de bord Automatisation des quittances : informations propriétaire et liste des locataires" })}>
              <img
                src="/images/automation/etape1-dashboard.png"
                alt="Tableau de bord Automatisation des quittances : informations propriétaire et liste des locataires"
                className="w-full rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-white/20 object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                  <Maximize2 className="w-4 h-4 text-[#212a3e]" />
                  <span className="text-sm font-semibold text-[#212a3e]">Cliquer pour agrandir</span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block text-xs font-semibold text-[#E65F3F] uppercase tracking-wider mb-3">Pramétrage</span>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
              Ajoutez vos infos propriétaire et locataire en quelques secondes
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Remplissez vos informations de propriétaire et locataires, la date d'échéance automatique... Et c'est tout.
              </p>
            </div>
          </motion.div>

          {/* Étape 2 : Texte à gauche, image à droite */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 sm:mb-20"
          >
            <div>
              <span className="inline-block text-xs font-semibold text-[#E65F3F] uppercase tracking-wider mb-3">Exemple 1</span>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                Formulaire simple pour l'ajout de locataire
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Un clic sur « Ajouter locataire » ouvre un formulaire clair : coordonées, puis loyer et charges. L'envoi automatique des quittances se fait selon la date d'échéance que vous définissez. Aucune usine à gaz — juste l'essentiel.
              </p>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setEnlargedImage({ src: "/images/automation/locataire_add_screen_2.png", alt: "Formulaire Ajouter un locataire : informations personnelles, logement et montants" })}>
              <img
                src="/images/automation/locataire_add_screen_2.png"
                alt="Formulaire Ajouter un locataire : informations personnelles, logement et montants"
                className="w-full rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-white/20 object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                  <Maximize2 className="w-4 h-4 text-[#212a3e]" />
                  <span className="text-sm font-semibold text-[#212a3e]">Cliquer pour agrandir</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Étape 3 : Image à gauche, texte à droite */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          >
            <div className="relative order-2 lg:order-1 group cursor-pointer" onClick={() => setEnlargedImage({ src: "/images/automation/overview_screen_2.png", alt: "Vue d'ensemble : révision IRL, révision des charges, bilan annuel" })}>
              <img
                src="/images/automation/overview_screen_2.png"
                alt="Vue d'ensemble : révision IRL, révision des charges, bilan annuel"
                className="w-full rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-white/20 object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                  <Maximize2 className="w-4 h-4 text-[#212a3e]" />
                  <span className="text-sm font-semibold text-[#212a3e]">Cliquer pour agrandir</span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block text-xs font-semibold text-[#E65F3F] uppercase tracking-wider mb-3">Exemple 2</span>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                Suivi, rappels et bilan annuel
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Votre espace vous donne une vue d'ensemble, le statut des quittances, les comptes à rebours pour Révision IRL et Révision des charges. Un aperçu du bilan en cours loyers et charges pour votre déclaration. Tout est centralisé pour une gestion sereine.
              </p>
            </div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Ce que comprend le Pack Automatique — grille 3 colonnes */}
      <section className="py-14 sm:py-20 bg-[#f7f5fa] border-b border-[#e8e7ef]" aria-label="Ce que comprend le Pack">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#212a3e] text-center mb-10 sm:mb-12"
          >
            Ce que comprend le Pack Automatique
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white/90 rounded-xl p-5 ring-1 ring-[#e8e7ef]/60 hover:ring-[#212a3e]/20 transition-all flex flex-col"
            >
              <div className="mb-3 flex items-center justify-start">
                <img src="/icons/icon-envoi-automatique-quittances.png" alt="" className="h-10 w-auto object-contain" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-[#212a3e] mb-1.5">Envoi automatique des quittances ou rappels</h3>
              <p className="text-xs text-[#5e6478] leading-relaxed flex-1">Générées et envoyées chaque mois automatiquement. Vous validez en un clic. Retard de loyer ? Rappel courtois envoyé en un clic aussi.</p>
            </motion.div>

            {/* Feature 2 : Générateur d'annonces assisté par IA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              viewport={{ once: true }}
              className="bg-white/90 rounded-xl p-5 ring-1 ring-[#e8e7ef]/60 hover:ring-[#212a3e]/20 transition-all flex flex-col"
            >
              <div className="mb-3 flex items-center justify-start">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#E65F3F]/10 text-[#E65F3F]">
                  <Sparkles className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <h3 className="text-sm font-bold text-[#212a3e] mb-1.5">Générateur d'annonces assisté par IA</h3>
              <p className="text-xs text-[#5e6478] leading-relaxed flex-1">Rédigez vos annonces immobilières plus vite avec l'aide de l'intelligence artificielle.</p>
            </motion.div>

            {/* Feature 3 : Signature électronique de bail directe */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/90 rounded-xl p-5 ring-1 ring-[#e8e7ef]/60 hover:ring-[#212a3e]/20 transition-all flex flex-col"
            >
              <div className="mb-3 flex items-center justify-start">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#E65F3F]/10 text-[#E65F3F]">
                  <PenLine className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <h3 className="text-sm font-bold text-[#212a3e] mb-1.5">Signature électronique de bail directe</h3>
              <p className="text-xs text-[#5e6478] leading-relaxed flex-1">Bail vide ou meublé : créez, envoyez et faites signer en ligne par le locataire et le garant.</p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
              className="bg-white/90 rounded-xl p-5 ring-1 ring-[#e8e7ef]/60 hover:ring-[#212a3e]/20 transition-all flex flex-col"
            >
              <div className="mb-3 flex items-center justify-start">
                <img src="/icons/icon-documents-centralises.png" alt="" className="h-10 w-auto object-contain" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-[#212a3e] mb-1.5">Votre espace stockage privé</h3>
              <p className="text-xs text-[#5e6478] leading-relaxed flex-1">Déposez tous vos documents au même endroit.</p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/90 rounded-xl p-5 ring-1 ring-[#e8e7ef]/60 hover:ring-[#212a3e]/20 transition-all flex flex-col"
            >
              <div className="mb-3 flex items-center justify-start">
                <img src="/icons/icon-revision-irl.png" alt="" className="h-10 w-auto object-contain" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-[#212a3e] mb-1.5">Révisions IRL et charges</h3>
              <p className="text-xs text-[#5e6478] leading-relaxed flex-1">Calcul conforme INSEE, rappel à la bonne date, lettre automatique prête à envoyer.</p>
            </motion.div>

            {/* Feature 6 : Courrier de révisions de loyer automatique */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              viewport={{ once: true }}
              className="bg-white/90 rounded-xl p-5 ring-1 ring-[#e8e7ef]/60 hover:ring-[#212a3e]/20 transition-all flex flex-col"
            >
              <div className="mb-3 flex items-center justify-start">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#E65F3F]/10 text-[#E65F3F]">
                  <Mail className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <h3 className="text-sm font-bold text-[#212a3e] mb-1.5">Courrier de révisions de loyer automatique</h3>
              <p className="text-xs text-[#5e6478] leading-relaxed flex-1">Lettre de révision IRL générée et prête à envoyer au bon moment.</p>
            </motion.div>

            {/* Feature 7 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/90 rounded-xl p-5 ring-1 ring-[#e8e7ef]/60 hover:ring-[#212a3e]/20 transition-all flex flex-col"
            >
              <div className="mb-3 flex items-center justify-start">
                <img src="/icons/icon-bail-facile.png" alt="" className="h-10 w-auto object-contain" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-[#212a3e] mb-1.5">Bail Facile</h3>
              <p className="text-xs text-[#5e6478] leading-relaxed flex-1">Modèle de bail facile à remplir ou à télécharger vierge avec aide au remplissage.</p>
            </motion.div>

            {/* Feature 8 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              viewport={{ once: true }}
              className="bg-white/90 rounded-xl p-5 ring-1 ring-[#e8e7ef]/60 hover:ring-[#212a3e]/20 transition-all flex flex-col"
            >
              <div className="mb-3 flex items-center justify-start">
                <img src="/icons/icon-bilan-annuel.png" alt="" className="h-10 w-auto object-contain" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-[#212a3e] mb-1.5">Bilan annuel simplifié / report fiscal</h3>
              <p className="text-xs text-[#5e6478] leading-relaxed flex-1">Votre déclaration prête en quelques clics.</p>
            </motion.div>

            {/* Feature 9 : Historique toujours disponible */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white/90 rounded-xl p-5 ring-1 ring-[#e8e7ef]/60 hover:ring-[#212a3e]/20 transition-all flex flex-col"
            >
              <div className="mb-3 flex items-center justify-start">
                <img src="/icons/icon-historique-clair-organise.png" alt="" className="h-10 w-auto object-contain" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-[#212a3e] mb-1.5">Historique toujours disponible</h3>
              <p className="text-xs text-[#5e6478] leading-relaxed flex-1">Plus jamais à chercher un PDF.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Déjà adopté par des centaines de propriétaires — preuve sociale */}
      <section className="py-14 sm:py-20 bg-white border-b border-[#e8e7ef]" aria-label="Adopté par des propriétaires">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10">
          <div className="bg-[#2d3648] rounded-3xl border border-[#4b5563]/70 shadow-[0_14px_48px_rgba(0,0,0,0.14)] p-6 sm:p-8 lg:p-10">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-center mb-2"
            >
              Déjà adopté par plus de 450 propriétaires
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center text-slate-300 text-sm sm:text-base mb-8"
            >
              Des bailleurs indépendants, partout en France.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center mb-10"
            >
              {[
                { gender: 'men', id: 12 },
                { gender: 'men', id: 17 },
                { gender: 'men', id: 23 },
                { gender: 'women', id: 28 },
                { gender: 'men', id: 31 },
                { gender: 'men', id: 38 },
                { gender: 'men', id: 44 },
                { gender: 'women', id: 42 },
                { gender: 'men', id: 52 },
                { gender: 'men', id: 58 },
                { gender: 'men', id: 65 },
                { gender: 'women', id: 55 },
              ].map(({ gender, id }, i) => (
                <img
                  key={`${gender}-${id}`}
                  src={`https://randomuser.me/api/portraits/med/${gender}/${id}.jpg`}
                  alt=""
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0 ${i > 0 ? '-ml-4 sm:-ml-5' : ''}`}
                  loading="lazy"
                  decoding="async"
                  aria-hidden
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6"
            >
              {[
                { value: '4 000+', label: 'Quittances générées' },
                { value: '4,9 / 5', label: 'Satisfaction' },
                { value: '250+', label: 'Propriétaires' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 rounded-xl px-4 py-4 text-center backdrop-blur-sm">
                  <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bloc tarifs + CTA */}
      <section className="py-12 sm:py-16 bg-[#fefefe] border-b border-[#e8e7ef]">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10 flex flex-col items-center">
          {/* Titre section prix */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl font-bold text-[#212a3e] text-center mb-6"
          >
            Un pilotage automatique à partir de 3,25€/mois.
          </motion.h2>

          {/* Badge promotionnel essai gratuit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            viewport={{ once: true }}
            className="mb-6 flex justify-center"
          >
            <div className="relative inline-flex items-center gap-3 bg-gradient-to-r from-[#E65F3F] to-[#f97316] rounded-2xl px-6 py-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E65F3F] to-[#f97316] rounded-2xl blur opacity-30"></div>
              <div className="relative flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <span className="text-white font-bold text-base sm:text-lg">🎁 30 jours d'essai gratuit</span>
                  <span className="hidden sm:inline text-white/90">•</span>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm sm:text-base">Sans CB</span>
                  </div>
                  <span className="hidden sm:inline text-white/90">•</span>
                  <span className="text-white font-semibold text-sm sm:text-base">Sans engagement</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full max-w-2xl bg-white rounded-2xl p-6 lg:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-[#e8e7ef] mb-24 mx-auto"
          >
            <div className="flex flex-col items-center gap-8">
              <div className="w-full space-y-5 flex flex-col items-center">
                {/* Toggle Mensuel / Annuel */}
                <div className="flex justify-center items-center gap-4">
                  <motion.div
                    className="bg-slate-100 rounded-xl p-1 border border-slate-200 inline-flex items-center gap-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        billingCycle === 'monthly'
                          ? 'bg-[#212a3e] text-white shadow-sm'
                          : 'text-[#5e6478] hover:text-[#212a3e]'
                      }`}
                    >
                      Mensuel
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        billingCycle === 'yearly'
                          ? 'bg-[#212a3e] text-white shadow-sm'
                          : 'text-[#5e6478] hover:text-[#212a3e]'
                      }`}
                    >
                      Annuel
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
                    className="w-full bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center"
                  >
                    {billingCycle === 'monthly' ? (
                      <>
                        <div className="flex items-baseline justify-center mb-1">
                          <span className="text-2xl sm:text-3xl font-bold text-[#212a3e]">{formatPrice(getPricing(2).monthlyPrice)}€/mois</span>
                          <span className="text-[#5e6478] ml-2 text-sm">— 1-2 logements</span>
                        </div>
                        <p className="text-sm text-[#212a3e] font-semibold mb-1"><span className="text-[#212a3e] font-bold">{formatPrice(getPricing(5).monthlyPrice)}€/mois</span> — 3–5 logements</p>
                        <p className="text-sm text-[#212a3e] font-semibold"><span className="text-[#212a3e] font-bold">{formatPrice(getPricing(6).monthlyPrice)}€/mois</span> — 6+ logements</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center mb-1">
                          <span className="text-2xl sm:text-3xl font-bold text-[#212a3e]">{formatPrice(getPricing(2).monthlyEquivalent)}€/mois</span>
                          <span className="text-[#5e6478] ml-2 text-sm">({formatPrice(getPricing(2).yearlyPrice)}€/an) — 1-2 logements</span>
                        </div>
                        <p className="text-sm text-[#212a3e] font-semibold mb-1"><span className="text-[#212a3e] font-bold">{formatPrice(getPricing(5).monthlyEquivalent)}€/mois</span> ({formatPrice(getPricing(5).yearlyPrice)}€/an) — 3–5 logements</p>
                        <p className="text-sm text-[#212a3e] font-semibold"><span className="text-[#212a3e] font-bold">{formatPrice(getPricing(6).monthlyEquivalent)}€/mois</span> ({formatPrice(getPricing(6).yearlyPrice)}€/an) — 6+ logements</p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                <button
                  onClick={() => {
                    trackCtaClick('passer_pack_automatique_details', 'automation', 'pack_automatique_modal');
                    openModal('Pack Automatique');
                  }}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-[#E65F3F] hover:bg-[#d95530] text-white text-sm font-semibold transition-colors shadow-[0_2px_6px_rgba(15,23,42,0.1)]"
                >
                  Essai gratuit
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Bloc quittances PDF conformes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="rounded-2xl p-6 lg:p-8 mb-16 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] border border-[#e8e7ef]"
          >
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#212a3e] mb-4">
              Des quittances PDF de qualité conformes
            </h2>
            <p className="text-sm text-[#5e6478] leading-relaxed mb-4">
              Les quittances générées par Quittance Simple sont :
            </p>
            <ul className="space-y-2 mb-5">
              {['Ultra qualitatives', '100 % conformes à la loi ALUR (2026)', 'Mentions légales obligatoires, signature électronique validée', 'Montants en chiffres et en lettres', 'Rendu propre, clair, professionnel'].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#212a3e] shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-[#212a3e]">{text}</span>
                </li>
              ))}
            </ul>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-5">
              <p className="text-sm text-[#5e6478] leading-relaxed">
                Beaucoup d'outils sont chers, compliqués et génèrent encore des quittances incomplètes ou non conformes. Chez nous : même exigence que le modèle de référence <strong>legifrance.gouv.fr</strong>, mais automatisée, instantanée, au prix le plus juste.
              </p>
            </div>

            {/* Miniature de la quittance */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-[#212a3e] mb-3 text-center">Exemple de quittance générée :</p>
              <div className="flex justify-center">
                <button
                  onClick={() => setIsQuittanceModalOpen(true)}
                  className="group relative inline-block rounded-xl overflow-hidden border-2 border-[#e8e7ef] hover:border-[#212a3e] transition-all shadow-md hover:shadow-lg bg-[#212a3e] p-4"
                >
                  <div className="relative scale-[0.8] origin-center">
                    <img
                      src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/quittance_modele_full_mini.png"
                      alt="Exemple de quittance conforme générée par Quittance Simple"
                      className="block max-w-full h-auto bg-white rounded"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                        <Maximize2 className="w-4 h-4 text-[#212a3e]" />
                        <span className="text-sm font-semibold text-[#212a3e]">Cliquer pour agrandir</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Section contenu SEO */}
      <section className="py-12 bg-[#fefefe] border-b border-[#e8e7ef]">
        <div className="max-w-4xl mx-auto px-4 sm:px-5 lg:px-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#212a3e] mb-6">
              Comment fonctionne l'automatisation des quittances ?
            </h2>
            <div className="prose prose-sm max-w-none text-[#5e6478]">
              <p className="mb-5 leading-relaxed">
                L'<strong className="text-[#212a3e]">automatisation des quittances de loyer</strong> est devenue incontournable pour les propriétaires qui gèrent un ou plusieurs biens. La loi Alur impose l'envoi d'une quittance gratuite au locataire qui en fait la demande ; notre outil transforme cette charge en processus automatisé.
              </p>
              <h3 className="text-lg font-bold text-[#212a3e] mt-6 mb-2">Rappels automatiques intelligents</h3>
              <p className="mb-5 leading-relaxed">
                Avec nos <strong className="text-[#212a3e]">rappels par SMS et email</strong>, vous recevez une notification à la date définie pour chaque locataire. Un clic suffit pour valider le paiement et déclencher l'envoi de la quittance PDF conforme.
              </p>
              <h3 className="text-lg font-bold text-[#212a3e] mt-6 mb-2">Conformité légale garantie</h3>
              <p className="mb-5 leading-relaxed">
                Toutes les quittances sont <strong className="text-[#212a3e]">conformes aux obligations légales</strong> (loi Alur, loi de 1989) avec les mentions obligatoires. Historique illimité 24/7 pour une traçabilité parfaite.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footnote */}
      <div className="bg-[#f7f5fa] pb-28 md:pb-8 pt-6">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 text-center">
          <p className="text-xs text-[#8b90a3]">* Tarif forfaitaire plafonné — Tous prix TTC</p>
        </div>
      </div>

      {/* CTA fixe mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e7ef] shadow-[0_-4px_20px_rgba(15,23,42,0.08)] p-4 z-50 md:hidden">
        <button
          onClick={() => openModal('Pack Automatique')}
          className="w-full px-6 py-3.5 rounded-xl bg-[#E65F3F] hover:bg-[#d95530] text-white font-semibold text-sm transition-colors shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
        >
          Essai gratuit
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

      <PackActivationFlow
        isOpen={isPackActivationFlowOpen}
        onClose={() => setIsPackActivationFlowOpen(false)}
        prefillEmail={userEmail || undefined}
      />

      {/* Modal pour afficher la quittance en grand */}
      <AnimatePresence>
        {isQuittanceModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuittanceModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setIsQuittanceModalOpen(false)}
                  className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-[#212a3e]" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[90vh] p-4 sm:p-6">
                <img
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/quittance_modele_full.png"
                  alt="Quittance conforme générée par Quittance Simple - Vue complète"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal pour afficher les images agrandies de la section "Voir plus en détail" */}
      <AnimatePresence>
        {enlargedImage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEnlargedImage(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 max-w-5xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setEnlargedImage(null)}
                  className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-[#212a3e]" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[90vh] p-4 sm:p-6">
                <img
                  src={enlargedImage.src}
                  alt={enlargedImage.alt}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Automation;
