import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackGA4Event, trackCtaClick } from '../utils/analytics';
import QuickPaymentModal from '../components/QuickPaymentModal';

const QuittanceSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [satisfactionStep, setSatisfactionStep] = useState<'question' | 'positive' | 'negative' | 'sent'>('question');
  const [feedback, setFeedback] = useState('');

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Mobile optimized */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#7CAA89] rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-[#1a1f20]">Quittance Simple</span>
          </div>
          <button
            className="md:hidden p-2"
            onClick={() => navigate('/')}
          >
            <div className="w-6 h-0.5 bg-[#1a1f20] mb-1.5"></div>
            <div className="w-6 h-0.5 bg-[#1a1f20] mb-1.5"></div>
            <div className="w-6 h-0.5 bg-[#1a1f20]"></div>
          </button>
        </div>
      </header>

      {/* Content - DESKTOP 40% SMALLER */}
      <main className="flex-1 px-4 py-3 md:py-8 max-w-3xl md:max-w-2xl mx-auto w-full pb-24 md:pb-6">
        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-3 md:mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2 md:mb-4">
            <h1 className="text-lg md:text-2xl font-bold text-[#1a1f20]">
              Quittance envoyée
            </h1>
            <CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-[#7CAA89]" />
          </div>
          <p className="text-sm md:text-xs text-[#1a1f20] max-w-2xl mx-auto px-2">
            On espère vous avoir aidé...
          </p>
        </motion.div>

        {/* CTA Card - Mode Tranquillité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-3 md:p-8 border border-gray-200 shadow-lg"
        >
          <div className="mb-3 md:mb-6">
            <p className="text-xs md:text-sm text-[#545454] leading-relaxed max-w-2xl mx-auto">
              Mais vous devrez recommencer les mois prochains : chercher e-mail et loyer, transférer le PDF, rédiger l'email, archiver…😕
            </p>
            <p className="text-sm md:text-base text-[#1a1f20] font-semibold mt-2 md:mt-4 max-w-2xl mx-auto">
              Et si vous stoppiez enfin ces corvées&nbsp;?
            </p>
          </div>

          <div className="text-xs md:text-base text-[#545454] mb-3 md:mb-6 space-y-1.5 md:space-y-3 max-w-2xl mx-auto">
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span><strong>Zéro oubli :</strong> Quittance et relance auto chaque mois, sous votre contrôle</span>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span><strong>Saisie minimale :</strong> Pas de formulaires sans fin, on a fait vraiment simple</span>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span><strong>Zéro perte :</strong> Révision IRL automatique pour ne plus oublier d'augmenter votre loyer</span>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span><strong>Zéro calcul :</strong> Bilan annuel prêt pour votre déclaration d'impôts</span>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span><strong>Zéro stress :</strong> Tout est archivé accessible 24h/24</span>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span><strong>Prix de lancement :</strong> Dès 0,82€/mois</span>
            </div>
          </div>

          {/* Desktop CTA (hidden on mobile) */}
          <div className="hidden md:block max-w-md mx-auto">
            <button
              onClick={() => {
                trackCtaClick('mode_tranquillite_success_page', 'quittance_success', 'payment_modal');
                trackGA4Event('conversion_cta_clicked', {
                  cta_name: 'passer_mode_tranquillite',
                  page_source: 'quittance_success',
                  destination: 'payment_modal',
                });
                setIsPaymentModalOpen(true);
              }}
              className="w-full bg-[#545454] hover:bg-[#1a1f20] text-white font-bold text-base md:text-lg py-4 md:py-4 rounded-full transition-all transform hover:scale-[1.02] shadow-lg mb-4">
              Passer en Mode Tranquillité
            </button>

            <p className="text-center text-sm md:text-base text-[#545454] mb-4">
              <strong>et ne plus m'en occuper</strong> dès <span className="font-bold text-[#1a1f20]">0,82 € / mois</span>
            </p>
            <p className="text-center text-sm md:text-base text-[#545454] mb-4">
              Sans engagement
            </p>

            <button
              onClick={() => {
                trackGA4Event('skip_automation_clicked', {
                  page_source: 'quittance_success',
                  action: 'continue_without_automation',
                });
                navigate('/');
              }}
              className="w-full text-center text-sm md:text-sm text-[#545454] hover:text-[#1a1f20] transition-colors underline">
              Retour
            </button>
          </div>
        </motion.div>

        {/* Satisfaction Section - In-page, centered, sober - MOVED DOWN MORE */}
        <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-gray-100 mb-24 md:mb-6">
          {satisfactionStep === 'question' && (
            <div className="text-center max-w-sm mx-auto">
              <p className="text-xs md:text-sm text-gray-600 mb-3">
                L'outil gratuit vous a-t-il été utile ?
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleSatisfactionResponse('yes')}
                  className="px-4 py-2 bg-[#ed7862] hover:bg-[#ed6a62] text-white text-xs font-medium rounded-full transition-colors"
                >
                  Oui 👍
                </button>
                <button
                  onClick={() => handleSatisfactionResponse('no')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 text-xs font-medium rounded-full transition-colors"
                >
                  Moyen 😕
                </button>
              </div>
            </div>
          )}

          {satisfactionStep === 'positive' && (
            <div className="text-center max-w-sm mx-auto">
              <p className="text-xs md:text-sm text-gray-700 mb-2">
                Génial ! Un petit avis nous donne un immense coup de pouce.
              </p>
              <p className="text-[10px] text-gray-500 mb-3">(entre bailleurs 😉)</p>
              <a
                href="https://g.page/r/CXTzg3vBtXQcEBM/review"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackGA4Event('google_review_clicked', { page_source: 'quittance_success' })}
                className="inline-block px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-full transition-colors mb-2"
              >
                Laisser un avis Google ⭐
              </a>
              <button
                onClick={() => setSatisfactionStep('question')}
                className="block w-full text-[10px] text-gray-500 hover:text-gray-700 underline"
              >
                Retour
              </button>
            </div>
          )}

          {satisfactionStep === 'negative' && (
            <div className="text-center max-w-sm mx-auto">
              <p className="text-xs md:text-sm font-medium text-gray-900 mb-1">
                Désolé ! 😔
              </p>
              <p className="text-[10px] md:text-xs text-gray-600 mb-3">
                Dites-nous ce qui a coincé pour qu'on puisse corriger ça.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Votre retour nous aide à améliorer..."
                className="w-full border border-gray-300 rounded-lg p-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-2"
                rows={3}
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedback.trim()}
                  className="px-4 py-2 bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-full transition-colors"
                >
                  Envoyer
                </button>
                <button
                  onClick={() => setSatisfactionStep('question')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 text-xs font-medium rounded-full transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {satisfactionStep === 'sent' && (
            <div className="text-center max-w-sm mx-auto py-3">
              <p className="text-xs md:text-sm font-medium text-gray-900 mb-1">
                Merci pour votre retour ! 🙏
              </p>
              <p className="text-[10px] text-gray-600">
                On va corriger ça au plus vite.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Mobile CTA - Only on mobile - COMPACT VERSION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 py-2 shadow-lg z-50">
        <button
          onClick={() => {
            trackCtaClick('mode_tranquillite_success_page', 'quittance_success', 'payment_modal');
            trackGA4Event('conversion_cta_clicked', {
              cta_name: 'passer_mode_tranquillite',
              page_source: 'quittance_success',
              destination: 'payment_modal',
            });
            setIsPaymentModalOpen(true);
          }}
          className="w-full bg-[#545454] hover:bg-[#1a1f20] text-white font-bold text-sm py-3 rounded-full transition-all shadow-lg flex items-center justify-center gap-2">
          <span>Passer en Mode Tranquillité</span>
        </button>
      </div>

      {/* Simple footer - Mobile optimized */}
      <footer className="py-6 text-center hidden md:block">
      </footer>

      {/* Payment Modal */}
      <QuickPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedPlan="auto"
        prefilledEmail={email}
      />
    </div>
  );
};

export default QuittanceSuccess;
