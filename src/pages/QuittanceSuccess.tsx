import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Check, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackGA4Event, trackCtaClick } from '../utils/analytics';
import PackActivationFlow from '../components/PackActivationFlow';

// Motion: premium easing, reduced-motion support
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
const STAGGER_MS = 90;
const OVERSHOOT_DURATION_MS = 280;

// Découpe "Prénom Nom" en { prenom, nom } (ou tout en nom si un seul mot)
function splitFullName(fullName: string): { prenom: string; nom: string } {
  const t = (fullName || '').trim();
  if (!t) return { prenom: '', nom: '' };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { prenom: '', nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}

const BUBBLE_TENANTS = [
  { id: 'marie', name: 'Marie Dubois' },
  { id: 'gilles', name: 'Gilles Martin' },
  { id: 'vincent', name: 'Vincent Debourg' },
] as const;

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
  const [reducedMotion, setReducedMotion] = useState(false);
  const [bubbleIndex, setBubbleIndex] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // Animation des bulles sur la photo : rotation Marie → Gilles → Vincent
  useEffect(() => {
    const id = window.setInterval(() => {
      setBubbleIndex((prev) => (prev + 1) % BUBBLE_TENANTS.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, []);

  const primaryBubble = BUBBLE_TENANTS[bubbleIndex];

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

  const handleSatisfactionResponse = async (response: 'yes' | 'no') => {
    const responseType = response === 'yes' ? 'positive' : 'negative';
    const uaIsMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const device = uaIsMobile ? 'mobile' : 'desktop';

    // 1. Enregistrer dans Supabase (instantané)
    try {
      const supabaseResponse = await fetch('https://jfpbddtdblqakabyjxkq.supabase.co/rest/v1/satisfaction_clicks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDc4OTUsImV4cCI6MjA3NDI4Mzg5NX0.6RmDCMJRN5lsmaI3H3Jfurs0Idz5-MbQRkV40zbnQIU',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDc4OTUsImV4cCI6MjA3NDI4Mzg5NX0.6RmDCMJRN5lsmaI3H3Jfurs0Idz5-MbQRkV40zbnQIU',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          email: email || null,
          response: responseType,
          page_source: 'quittance_success',
          device: device
        })
      });
      if (!supabaseResponse.ok) {
        const errorText = await supabaseResponse.text();
        console.error('❌ Supabase satisfaction error:', supabaseResponse.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error saving satisfaction click:', error);
    }

    // 2. Track GA4 + état local
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
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDc4OTUsImV4cCI6MjA3NDI4Mzg5NX0.6RmDCMJRN5lsmaI3H3Jfurs0Idz5-MbQRkV40zbnQIU'
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

          
        </div>

        {/* Photo + bandeau — version simple avec la photo d'automatisation */}
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
            <div className="relative w-full aspect-[3/1.5] md:aspect-[4/2] overflow-hidden bg-black">
              <img
                src="/images/femme_terrasse_amis2.png"
                alt="Bailleur recevant la confirmation de quittance"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />

              {/* Bulle statique réutilisant le message du hero Automation */}
              {/* Bulle principale (en haut) — locataire courant */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={primaryBubble.id}
                  initial={{ opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute top-3 right-2 sm:top-5 sm:right-6 z-20"
                >
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-2 shadow-lg border border-[#e2e8f0] max-w-[180px]">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-medium text-[#212a3e] leading-snug">
                          Quittance envoyée automatiquement
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-[#5e6478] mt-0.5 leading-snug">
                          Locataire : {primaryBubble.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

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
            <strong>L'automatisation</strong>  des quittances<span className="font-semibold text-[#1e3a5f]"> + la boîte à outils intelligents :</span>
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
