import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Check, CheckCircle, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackGA4Event, trackCtaClick } from '../utils/analytics';
import PackActivationFlow from '../components/PackActivationFlow';

// Motion: premium easing, reduced-motion support
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
const STAGGER_MS = 90;
const OVERSHOOT_DURATION_MS = 280;
const BUBBLE_APPEAR_MS = 680; // apparition progressive depuis le téléphone

// Découpe "Prénom Nom" en { prenom, nom } (ou tout en nom si un seul mot)
function splitFullName(fullName: string): { prenom: string; nom: string } {
  const t = (fullName || '').trim();
  if (!t) return { prenom: '', nom: '' };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { prenom: '', nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}

const QuittanceSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as {
    email?: string;
    nom?: string;
    baillorAddress?: string;
    locataireName?: string;
    locataireAddress?: string;
    loyer?: string;
    charges?: string;
  };
  const email = state.email || '';
  const [isPackActivationFlowOpen, setIsPackActivationFlowOpen] = useState(false);
  const [satisfactionStep, setSatisfactionStep] = useState<'question' | 'positive' | 'negative' | 'sent'>('question');
  const [feedback, setFeedback] = useState('');
  const [photoAnimStep, setPhotoAnimStep] = useState(0); // 0: rien, 1: phrase1, 2: phrase1+2, 3: hold, 4: disparition
  const [bubbleStep, setBubbleStep] = useState<'idle' | 'appear' | 'visible' | 'tap' | 'release' | 'fly'>('idle'); // bulle : apparition → clic (tap) → relâche (release) → envol
  const [handPhase, setHandPhase] = useState<'hidden' | 'moving' | 'onButton'>('hidden'); // main : cachée → en déplacement (2s) → sur le bouton
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // Track page view + store email
  useEffect(() => {
    trackGA4Event('quittance_success_viewed', {
      page_source: 'generator',
      has_email: !!email,
    });

    if (email) {
      localStorage.setItem('captured_email', email);
    }
  }, [email]);

  // Boucle : bulle visible → main part du coin bas-droit → arrive au bouton (1,4 s) → clic dès l'arrivée → envol
  const HAND_START_MOVE_MS = 2000; // délai après "visible" avant que la main commence à bouger vers le bouton
  const HAND_MOVE_DURATION_MS = 1400; // durée du trajet main (doit correspondre au duration 1.4 de l'animation)
  const TAP_AT_MS = HAND_START_MOVE_MS + HAND_MOVE_DURATION_MS; // clic déclenché dès que le doigt est à position finale
  const BUBBLE_END_MS = BUBBLE_APPEAR_MS + TAP_AT_MS + 200 + 120 + 500; // tap(200) → release(120) → fly(500) → idle
  const TEXT_APPEAR_DELAY_MS = 200;

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const runFullCycle = () => {
      setPhotoAnimStep(0);
      setHandPhase('hidden');
      setBubbleStep('appear');
      timeouts.push(setTimeout(() => {
        setBubbleStep('visible');
        setHandPhase('moving'); // main apparaît en bas à droite, opacité 100%
      }, BUBBLE_APPEAR_MS));
      timeouts.push(setTimeout(() => setHandPhase('onButton'), BUBBLE_APPEAR_MS + HAND_START_MOVE_MS)); // main part vers le bouton
      timeouts.push(setTimeout(() => setBubbleStep('tap'), BUBBLE_APPEAR_MS + TAP_AT_MS)); // clic dès arrivée du doigt
      timeouts.push(setTimeout(() => setBubbleStep('release'), BUBBLE_APPEAR_MS + TAP_AT_MS + 200));
      timeouts.push(setTimeout(() => setBubbleStep('fly'), BUBBLE_APPEAR_MS + TAP_AT_MS + 320));
      timeouts.push(setTimeout(() => {
        setBubbleStep('idle');
        setHandPhase('hidden');
      }, BUBBLE_END_MS));
      const afterBubble = BUBBLE_END_MS + TEXT_APPEAR_DELAY_MS;
      // Apparition progressive des deux lignes
      timeouts.push(setTimeout(() => setPhotoAnimStep(1), afterBubble));
      timeouts.push(setTimeout(() => setPhotoAnimStep(2), afterBubble + 480));
      // Phase "en place" plus longue pour que le texte reste bien lisible
      timeouts.push(setTimeout(() => setPhotoAnimStep(3), afterBubble + 2200));
      // Disparition du texte
      timeouts.push(setTimeout(() => setPhotoAnimStep(4), afterBubble + 2200 + 1000));
      // Petite pause avant de relancer un cycle complet
      timeouts.push(setTimeout(() => {
        setPhotoAnimStep(0);
        timeouts.push(setTimeout(runFullCycle, reducedMotion ? 900 : 800));
      }, afterBubble + 2200 + 1000 + 400));
    };

    timeouts.push(setTimeout(runFullCycle, 320));
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [reducedMotion]);

  const handleSatisfactionResponse = (response: 'yes' | 'no') => {
    if (response === 'yes') {
      setSatisfactionStep('positive');
      trackGA4Event('satisfaction_positive', { page_source: 'quittance_success' });
    } else {
      setSatisfactionStep('negative');
      trackGA4Event('satisfaction_negative', { page_source: 'quittance_success' });
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;

    try {
      await fetch('https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/send-feedback', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MjE2ODUsImV4cCI6MjA1MjE5NzY4NX0.LRorMT1dq6sMB1xNMcpvAFl97TCz8c2WnSuKTdwMshY'
        },
        body: JSON.stringify({
          feedback,
          email: email || 'anonymous',
          source: 'quittance_success'
        })
      });

      setSatisfactionStep('sent');
      trackGA4Event('feedback_sent', { page_source: 'quittance_success' });

      setTimeout(() => {
        setSatisfactionStep('question');
      }, 3000);
    } catch (error) {
      console.error('Error sending feedback:', error);
      window.location.href = `mailto:2speek@gmail.com?subject=Feedback Quittance Simple&body=${encodeURIComponent(feedback)}`;
      setSatisfactionStep('sent');
    }
  };

  return (
    <div className="quittance-success-page min-h-screen bg-white flex flex-col overflow-hidden md:overflow-auto">
      {/* Header - Quittance Simple, lien logo, flèche back, burger mobile */}
      <header className="bg-white border-b border-[#e8e7ef] px-3 py-2 md:px-4 md:py-3 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/" className="flex items-center gap-1.5 md:gap-2">
              <div className="w-7 h-7 md:w-9 md:h-9 bg-[#E65F3F] rounded-lg md:rounded-xl flex items-center justify-center shadow-sm">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-sm md:text-base font-bold text-[#212a3e]">Quittance Simple</span>
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1.5 text-[#212a3e] hover:bg-[#f7f5fa] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 md:w-5 md:h-5" />
            </button>
          </div>
          {/* Desktop : rien ou lien ; Mobile : menu burger */}
          <div className="md:hidden">
            <Link to="/" className="p-2 flex items-center justify-center text-[#212a3e] hover:bg-[#f7f5fa] rounded-lg transition-colors" aria-label="Menu">
              <span className="sr-only">Menu</span>
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className="block w-5 h-0.5 bg-[#212a3e] rounded" />
                <span className="block w-5 h-0.5 bg-[#212a3e] rounded" />
                <span className="block w-5 h-0.5 bg-[#212a3e] rounded" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Content — sobriété, hiérarchie claire */}
      <main className="flex-1 px-4 py-6 md:px-6 md:py-8 max-w-2xl mx-auto w-full md:pb-6 overflow-y-auto">
        <div className="mb-2 md:mb-3">
          {/* Desktop : "Quittance envoyée" et entonnoir sur la même ligne */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
            <motion.div
              initial={{ opacity: 0, ...(reducedMotion ? {} : { y: 6, scale: 0.96 }) }}
              animate={{ opacity: 1, ...(reducedMotion ? {} : { y: 0, scale: reducedMotion ? 1 : [0.96, 1.02, 1] }) }}
              transition={{
                duration: reducedMotion ? 0.25 : OVERSHOOT_DURATION_MS / 1000,
                ease: EASE_PREMIUM,
                ...(reducedMotion ? {} : { scale: { duration: OVERSHOOT_DURATION_MS / 1000, times: [0, 0.55, 1], ease: EASE_PREMIUM } }),
              }}
              className="flex items-center gap-2"
            >
              <h1 className="text-xl md:text-2xl font-normal text-[#111827] tracking-tight">
                Quittance envoyée
              </h1>
              <Check className="w-6 h-6 md:w-7 md:h-7 text-[#111827] flex-shrink-0" strokeWidth={2.5} />
            </motion.div>

            {/* Entonnoir de satisfaction — même ligne que "Quittance envoyée" sur desktop, masqué sur mobile */}
            <motion.div
              initial={{ opacity: 0, ...(reducedMotion ? {} : { y: 8 }) }}
              animate={{ opacity: 1, ...(reducedMotion ? {} : { y: 0 }) }}
              transition={{ duration: reducedMotion ? 0.25 : 0.3, delay: reducedMotion ? 0 : STAGGER_MS / 1000, ease: EASE_PREMIUM }}
              className="hidden md:flex flex-shrink-0"
            >
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
            {satisfactionStep === 'question' && (
              <>
                <span className="text-[10px] md:text-xs text-[#5e6478] whitespace-nowrap">Notre outil vous a plu&nbsp;?</span>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleSatisfactionResponse('yes')}
                    className="px-2 py-0 md:px-2.5 md:py-0.5 bg-[#f7f5fa] hover:bg-[#e8e7ef] text-[#212a3e] text-[10px] md:text-xs font-medium rounded leading-none min-h-0 shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => handleSatisfactionResponse('no')}
                    className="px-2 py-0 md:px-2.5 md:py-0.5 bg-[#f7f5fa] hover:bg-[#e8e7ef] text-[#212a3e] text-[10px] md:text-xs font-medium rounded leading-none min-h-0 shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
                  >
                    Bof
                  </button>
                </div>
              </>
            )}
            {satisfactionStep === 'positive' && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-[10px] md:text-xs text-[#5e6478] whitespace-nowrap">Merci ! Un avis Google nous aiderait 🙏</span>
                <a
                  href="https://g.page/r/CXTzg3vBtXQcEBM/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackGA4Event('google_review_clicked', { page_source: 'quittance_success' })}
                  className="px-2.5 py-1 bg-[#E65F3F] hover:bg-[#d95530] text-white text-[10px] md:text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Laisser un avis
                </a>
              </div>
            )}
            {satisfactionStep === 'negative' && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-[10px] md:text-xs text-[#5e6478] whitespace-nowrap">Dites-nous ce qui n'a pas marché :</span>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Votre retour..."
                  className="w-24 md:w-32 border border-[#e8e7ef] rounded-lg p-1.5 text-[10px] md:text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#E65F3F]/20 focus:border-[#E65F3F]"
                  rows={1}
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedback.trim()}
                    className="px-2 py-1 bg-[#E65F3F] hover:bg-[#d95530] disabled:bg-[#e8e7ef] disabled:text-[#5e6478] text-white text-[10px] md:text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Envoyer
                  </button>
                  <button
                    onClick={() => setSatisfactionStep('question')}
                    className="px-2 py-1 bg-[#f7f5fa] hover:bg-[#e8e7ef] text-[#212a3e] text-[10px] md:text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
            {satisfactionStep === 'sent' && (
              <span className="text-[10px] md:text-xs text-[#5e6478] whitespace-nowrap">
                Merci pour votre retour ! 🙏
              </span>
            )}
            </div>
          </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, ...(reducedMotion ? {} : { y: 6 }) }}
            animate={{ opacity: 1, ...(reducedMotion ? {} : { y: 0 }) }}
            transition={{ duration: reducedMotion ? 0.25 : 0.3, delay: reducedMotion ? 0 : (STAGGER_MS * 2) / 1000, ease: EASE_PREMIUM }}
            className="text-base md:text-lg text-[#111827] font-normal leading-relaxed mt-2"
          >
            Vous faites encore tout à la main ?
          </motion.p>
        </div>

        {/* Photo + bandeau — on garde la photo, texte sobre */}
        <motion.div
          initial={{ opacity: 0, ...(reducedMotion ? {} : { y: 10 }) }}
          animate={{ opacity: 1, ...(reducedMotion ? {} : { y: 0 }) }}
          transition={{ duration: reducedMotion ? 0.25 : 0.32, delay: reducedMotion ? 0 : (STAGGER_MS * 3) / 1000, ease: EASE_PREMIUM }}
          className="mb-4 md:mb-5"
        >
          <div className="w-screen relative left-1/2 -translate-x-1/2 md:w-full md:left-0 md:translate-x-0 md:max-w-2xl md:mx-auto md:rounded-xl overflow-hidden">
            <div className="bg-[#374151] py-3 md:py-4 px-4 flex items-center justify-center">
              <p className="text-lg md:text-2xl font-normal text-white text-center leading-snug">
                Et si ça se faisait tout seul ?
              </p>
            </div>
            <div className="relative w-full aspect-[3/1.5] md:aspect-[4/2] overflow-hidden">
              <img
                src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/femme_rue_mobile_2.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-top"
              />

              {/* Bulle de message animée : sort du téléphone → tap Envoyer → s'envole */}
              {bubbleStep !== 'idle' && (
                <>
                  <motion.div
                    className="absolute z-10 pointer-events-none"
                    initial={{
                      left: reducedMotion ? '52%' : '50%',
                      bottom: reducedMotion ? '47%' : isMobile ? '32%' : '32%',
                      scale: reducedMotion ? (isMobile ? 1.8 : 2.16) : 0.35,
                      opacity: 0,
                      ...(reducedMotion ? {} : { filter: 'blur(0px)' }),
                    }}
                    animate={{
                      left: reducedMotion
                        ? '52%'
                        : bubbleStep === 'fly'
                          ? '92%'
                          : isMobile
                            ? '45%'
                            : '52%',
                      bottom: reducedMotion
                        ? '47%'
                        : bubbleStep === 'fly'
                          ? '96%'
                          : isMobile
                            ? '40%'
                            : '47%',
                      scale:
                        reducedMotion
                          ? (isMobile ? 1.8 : 2.16)
                          : bubbleStep === 'fly'
                            ? 0.18
                            : bubbleStep === 'appear'
                              ? (isMobile ? 1.8 : 2.16)
                              : bubbleStep === 'tap'
                                ? (isMobile ? 1.6 : 1.95) // tap plus marqué pour mieux sentir le clic
                                : bubbleStep === 'release'
                                  ? (isMobile ? 1.8 : 2.16)
                                  : (isMobile ? 1.8 : 2.16),
                      opacity: bubbleStep === 'fly' ? 0 : 1,
                      rotate: bubbleStep === 'fly' && !reducedMotion ? -20 : 0,
                      ...(reducedMotion ? {} : { filter: bubbleStep === 'fly' ? ['blur(0px)', 'blur(2px)', 'blur(0px)'] : 'blur(0px)' }),
                    }}
                    transition={
                      (reducedMotion
                        ? { duration: 0.3, ease: EASE_PREMIUM }
                        : bubbleStep === 'fly'
                          ? {
                              duration: 0.5,
                              ease: [0.4, 0, 0.6, 1],
                              filter: { duration: 0.5, times: [0, 0.4, 1], ease: [0.4, 0, 0.6, 1] },
                            }
                          : {
                              duration:
                                bubbleStep === 'appear'
                                  ? BUBBLE_APPEAR_MS / 1000
                                  : bubbleStep === 'tap'
                                    ? 0.12
                                    : bubbleStep === 'release'
                                      ? 0.18
                                      : 0.5,
                              ease: EASE_PREMIUM,
                            })
                    }
                    style={{ transformOrigin: '0% 100%' }}
                  >
                    <motion.div
                      className="relative inline-block origin-[0%_100%]"
                      animate={{
                        scale: isMobile ? 1.2 : 1,
                      }}
                      transition={{ duration: 0.25, ease: EASE_PREMIUM }}
                    >
                      <img
                        src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/bulle_message_envoi_auto_transp2.png"
                        alt="Quittance envoyée !"
                        className="w-[min(42%,140px)] h-auto object-contain drop-shadow-md block"
                      />
                      {/* Bouton Envoyer ancré dans la bulle, juste au-dessus de la zone bouton dans l'image */}
                      <motion.div
                        className="absolute left-[3%] md:left-[0%] top-[44%] md:top-[53%] -translate-y-1/2 pointer-events-none"
                        initial={false}
                        animate={{
                          scale: isMobile
                            ? 1 // en mobile, taille fixe : pas de micro-ajustement propre au bouton
                            : (bubbleStep === 'tap' ? 0.74 : 0.81), // comportement historique en desktop
                          opacity: (bubbleStep === 'appear' || bubbleStep === 'visible' || bubbleStep === 'tap' || bubbleStep === 'release') ? 1 : 0,
                          filter: bubbleStep === 'tap' ? 'brightness(0.92)' : 'brightness(1)',
                        }}
                        transition={{
                          duration: bubbleStep === 'tap' ? 0.1 : 0.01, // changement quasi instantané hors tap → pas de petit saut
                          ease: bubbleStep === 'tap' ? [0.25, 0.1, 0.25, 1] : EASE_PREMIUM,
                        }}
                      >
                        <span className="inline-flex items-center gap-0.5 md:gap-1 bg-[#22c55e] text-white text-[8px] md:text-xs font-semibold px-1.5 py-0.5 md:px-[0.605rem] md:py-[0.152rem] rounded-md shadow-md whitespace-nowrap scale-[0.64] md:scale-[0.81] origin-left">
                          <Send className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 flex-shrink-0" strokeWidth={2.5} />
                          Envoyer
                        </span>
                      </motion.div>

                      {/* Main : apparaît en bas à droite (opacité 100%), met 2s à arriver, reste sur le bouton, disparaît avec la bulle */}
                      <motion.img
                        src="/images/icone_doigt_main_simple.png"
                        alt=""
                        className="absolute left-[8%] md:left-[8%] top-[52%] md:top-[54%] w-7 md:w-10 h-auto pointer-events-none"
                        initial={false}
                        animate={{
                          opacity: (handPhase === 'moving' || handPhase === 'onButton') && bubbleStep !== 'fly' ? 1 : 0,
                          x: handPhase === 'onButton' ? 0 : 90,
                          y: handPhase === 'onButton' ? 0 : 90,
                          scale: handPhase === 'onButton' ? 1 : 0.45,
                        }}
                        transition={{
                          duration: handPhase === 'onButton' ? (reducedMotion ? 0.5 : 1.4) : 0.25, // fin de course légèrement accélérée
                          ease: EASE_PREMIUM,
                        }}
                      />
                      {/* Variante avec traits FX au moment du clic ; disparaît avec la bulle */}
                      <motion.img
                        src="/images/icone_doigt_main_FX.png"
                        alt=""
                        className="absolute left-[8%] md:left-[8%] top-[52%] md:top-[54%] w-7 md:w-10 h-auto pointer-events-none"
                        initial={false}
                        animate={{
                          opacity: bubbleStep === 'tap' ? 1 : 0,
                          scale: bubbleStep === 'tap' ? [1, 1.05, 1] : 0.9,
                        }}
                        transition={{
                          duration: 0.22,
                          ease: EASE_PREMIUM,
                        }}
                      />
                    </motion.div>
                  </motion.div>
                </>
              )}

              <motion.div
                className="absolute inset-x-0 bottom-[-8%] md:bottom-[-4%] pb-4 md:pb-6 px-4 flex items-end justify-center pointer-events-none"
              >
                <motion.div
                  animate={{ opacity: photoAnimStep >= 1 && photoAnimStep <= 3 ? 1 : 0 }}
                  transition={{ duration: reducedMotion ? 0.25 : 0.28, ease: EASE_PREMIUM }}
                  className="flex flex-col items-center justify-center gap-1 px-4 py-3 md:px-6 md:py-4 rounded-[2rem] max-w-xs md:max-w-none"
                  style={{
                    background: 'rgba(55, 65, 81, 0.88)', // même bleu que le bandeau, avec légère transparence
                    boxShadow: '0 18px 36px rgba(0,0,0,0.45)',
                  }}
                >
                  <motion.p
                    animate={{
                      opacity: photoAnimStep >= 1 && photoAnimStep <= 3 ? 1 : 0,
                      ...(reducedMotion ? {} : { y: photoAnimStep >= 1 && photoAnimStep <= 3 ? 0 : 4 }),
                    }}
                    transition={{ duration: reducedMotion ? 0.25 : 0.28, ease: EASE_PREMIUM }}
                    className="text-lg md:text-2xl font-semibold text-white text-center"
                  >
                    Génération et envoi
                  </motion.p>
                  <motion.p
                    animate={{
                      opacity: photoAnimStep >= 2 && photoAnimStep <= 3 ? 1 : 0,
                      ...(reducedMotion ? {} : { y: photoAnimStep >= 2 && photoAnimStep <= 3 ? 0 : 3 }),
                    }}
                    transition={{ duration: reducedMotion ? 0.25 : 0.28, delay: reducedMotion ? 0 : STAGGER_MS / 1000, ease: EASE_PREMIUM }}
                    className="text-lg md:text-2xl font-semibold text-white text-center"
                  >
                    en 3 secondes
                  </motion.p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Bloc offre — accroche + boîte à outils */}
        <motion.div
          initial={{ opacity: 0, ...(reducedMotion ? {} : { y: 10 }) }}
          animate={{ opacity: 1, ...(reducedMotion ? {} : { y: 0 }) }}
          transition={{ duration: reducedMotion ? 0.25 : 0.32, delay: reducedMotion ? 0 : (STAGGER_MS * 4) / 1000, ease: EASE_PREMIUM }}
          className="mb-20 md:mb-6 px-1"
        >
          <p className="text-base md:text-lg text-[#111827]  leading-loose tracking-normal mb-3">
            Essayez, c'est gratuit avec :
          </p>
          <p className="text-[15px] text-[#4b5563] leading-relaxed my-4 mx-0">
            L'automate <span className="font-semibold text-[#1e3a5f]">Quittance Automatique + la boîte à outils intelligents :</span>
          </p>
          <ul className="space-y-1.5 mb-5 pl-0">
            <li className="flex items-start gap-2 text-[15px] text-[#4b5563]">
             
              <span>Annonces assistée par IA - Baux et états des lieux intelligents - Signature électronique simplifiée - Bilan annuel prêt - Alerte révision loyers etc.</span>
            </li>
            
          </ul>

          <button
            onClick={() => {
              trackCtaClick('mode_tranquillite_success_page', 'quittance_success', 'pack_activation_flow');
              trackGA4Event('conversion_cta_clicked', {
                cta_name: 'passer_mode_tranquillite',
                page_source: 'quittance_success',
                destination: 'pack_activation_flow',
              });
              setIsPackActivationFlowOpen(true);
            }}
            className="hidden md:flex w-full bg-[#E65F3F] hover:bg-[#d95530] text-white font-medium text-[15px] py-3.5 rounded-xl flex-col items-center justify-center gap-0.5 transition-colors"
          >
            <span className="flex items-center gap-2">
              Activer l'automate gratuitement
              <ArrowRight className="w-5 h-5" />
            </span>
            <span className="text-[12px] font-normal text-white/90">Sans carte bancaire - sans engagement</span>
          </button>

          </motion.div>

      </main>

      {/* CTA mobile fixe — sobre */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] px-4 py-3 z-50">
        <button
          onClick={() => {
            trackCtaClick('mode_tranquillite_success_page', 'quittance_success', 'pack_activation_flow');
            trackGA4Event('conversion_cta_clicked', {
              cta_name: 'passer_mode_tranquillite',
              page_source: 'quittance_success',
              destination: 'pack_activation_flow',
            });
            setIsPackActivationFlowOpen(true);
          }}
          className="w-full bg-[#E65F3F] hover:bg-[#d95530] text-white font-medium text-[15px] py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors"
        >
          <span className="flex items-center gap-2">
            Essayer gratuitement
            <ArrowRight className="w-5 h-5" />
          </span>
          <span className="text-[12px] font-normal text-white/90">Sans CB - sans engagement</span>
        </button>
      </div>

      {/* Pack Activation Flow Modal — préremplissage depuis le formulaire quittance gratuite */}
      <PackActivationFlow
        isOpen={isPackActivationFlowOpen}
        onClose={() => setIsPackActivationFlowOpen(false)}
        prefillEmail={email}
        prefillProprietaire={email || state.nom || state.baillorAddress ? {
          ...splitFullName(state.nom || ''),
          adresse: state.baillorAddress || '',
          telephone: ''
        } : undefined}
        prefillLocataire={state.locataireName && state.locataireAddress ? {
          ...splitFullName(state.locataireName),
          adresse_logement: state.locataireAddress || '',
          loyer_mensuel: state.loyer ? parseFloat(state.loyer) || 0 : 0,
          charges_mensuelles: state.charges ? parseFloat(state.charges) || 0 : 0,
          email: '',
          telephone: ''
        } : undefined}
      />
    </div>
  );
};

export default QuittanceSuccess;
