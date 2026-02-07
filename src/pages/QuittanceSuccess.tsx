import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText, Calculator, Mail, BarChart3, Clock, FolderArchive } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackGA4Event, trackCtaClick } from '../utils/analytics';
import QuickPaymentModal from '../components/QuickPaymentModal';

const QuittanceSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
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
      // Send feedback to your email via edge function or API
      await fetch('https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/send-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
          email: email || 'anonymous',
          source: 'quittance_success'
        })
      });

      setSatisfactionStep('sent');
      trackGA4Event('feedback_sent', { page_source: 'quittance_success' });

      setTimeout(() => {
        setShowSatisfaction(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending feedback:', error);
      // Fallback: open email client
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
      <main className="flex-1 px-4 py-3 md:py-8 max-w-3xl md:max-w-2xl mx-auto w-full pb-20 md:pb-6">
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
          <p className="text-sm md:text-lg font-semibold text-[#1a1f20] max-w-2xl mx-auto px-2">
            On espère vous avoir bien aidé...
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
            <p className="text-sm md:text-sm text-[#545454] leading-relaxed max-w-2xl mx-auto">
              Mais vous devez encore transférer le PDF, rédiger un message, trouver l'adresse, archiver etc. Et le mois prochain&nbsp;? ... Pareil :(
            </p>
            <p className="text-sm md:text-base text-[#1a1f20] font-semibold mt-2 md:mt-4 max-w-2xl mx-auto">
              Et si vous arrêtiez de vous infliger ça chaque mois&nbsp;?
            </p>
          </div>

          <div className="text-xs md:text-base text-[#545454] mb-3 md:mb-6 space-y-1.5 md:space-y-3 max-w-2xl mx-auto">
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span>Quittance et relance envoyées automatiquement <strong>sans oubli</strong></span>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span>Bilan annuel / CA <strong>prêt pour déclaration</strong> (LMNP/Pinel/vide)</span>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span>Calcul révision IRL automatique <strong>au bon moment</strong></span>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span>Rappel et Courrier IRL prêt, <strong>sans perte d'argent</strong></span>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-base md:text-lg flex-shrink-0">✓</span>
              <span>Historique conservé, <strong>bien rangé</strong> 24/24</span>
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

            {/* Price */}
            <p className="text-center text-sm md:text-base text-[#545454] mb-4">
              <strong>et ne plus m'en occuper</strong> dès <span className="font-bold text-[#1a1f20]">0,82 € / mois</span>
            </p>
            <p className="text-center text-sm md:text-base text-[#545454] mb-4">
              Sans engagement
            </p>

            {/* Skip link */}
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

        {/* Satisfaction Section - In-page, centered, sober */}
        <div className="mt-8 md:mt-12 pt-8 md:pt-10 border-t border-gray-200">
          {satisfactionStep === 'question' && (
            <div className="text-center max-w-md mx-auto">
              <p className="text-sm md:text-base text-gray-700 mb-4">
                L'outil vous a-t-il été utile ?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleSatisfactionResponse('yes')}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-full transition-colors"
                >
                  Oui 👍
                </button>
                <button
                  onClick={() => handleSatisfactionResponse('no')}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium rounded-full transition-colors"
                >
                  Moyen 😕
                </button>
              </div>
            </div>
          )}

          {satisfactionStep === 'positive' && (
            <div className="text-center max-w-md mx-auto">
              <p className="text-sm md:text-base text-gray-700 mb-2">
                Génial ! Un petit avis nous donne un immense coup de pouce pour améliorer notre offre.
              </p>
              <p className="text-xs text-gray-500 mb-4">(entre bailleurs 😉)</p>
              <a
                href="https://g.page/r/CXTzg3vBtXQcEBM/review"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackGA4Event('google_review_clicked', { page_source: 'quittance_success' })}
                className="inline-block px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-full transition-colors mb-3"
              >
                Laisser un avis Google ⭐
              </a>
              <button
                onClick={() => setSatisfactionStep('question')}
                className="block w-full text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Retour
              </button>
            </div>
          )}

          {satisfactionStep === 'negative' && (
            <div className="text-center max-w-md mx-auto">
              <p className="text-sm md:text-base font-medium text-gray-900 mb-2">
                Désolé ! 😔
              </p>
              <p className="text-xs md:text-sm text-gray-600 mb-4">
                Dites-nous ce qui a coincé pour qu'on puisse corriger ça immédiatement.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Votre retour nous aide à améliorer..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-3"
                rows={3}
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedback.trim()}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full transition-colors"
                >
                  Envoyer
                </button>
                <button
                  onClick={() => setSatisfactionStep('question')}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium rounded-full transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {satisfactionStep === 'sent' && (
            <div className="text-center max-w-md mx-auto py-4">
              <p className="text-sm md:text-base font-medium text-gray-900 mb-1">
                Merci pour votre retour ! 🙏
              </p>
              <p className="text-xs text-gray-600">
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
          <span>Mode Tranquillité</span>
          <span className="text-xs font-normal opacity-90">• 0,82€/mois</span>
        </button>
      </div>

      {/* Simple footer - Mobile optimized */}
      <footer className="py-6 text-center hidden md:block">

      </footer>

      {/* Satisfaction Widget - Appears on scroll - DESKTOP + MOBILE */}
      {showSatisfaction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 md:bottom-6 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm z-40"
        >
          {satisfactionStep === 'question' && (
            <div>
              <p className="text-sm font-semibold text-[#1a1f20] mb-3">
                L'outil vous a-t-il été utile ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSatisfactionResponse('yes')}
                  className="flex-1 bg-[#7CAA89] hover:bg-[#6b9879] text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Oui 👍
                </button>
                <button
                  onClick={() => handleSatisfactionResponse('no')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-[#1a1f20] text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Moyen 😕
                </button>
              </div>
              <button
                onClick={() => setShowSatisfaction(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
          )}

          {satisfactionStep === 'positive' && (
            <div>
              <p className="text-sm text-[#1a1f20] mb-3 leading-relaxed">
                Génial ! Un petit avis nous donne un immense coup de pouce pour améliorer notre offre.
                <span className="block mt-1 text-xs text-[#545454]">(entre bailleurs 😉)</span>
              </p>
              <a
                href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackGA4Event('google_review_clicked', { page_source: 'quittance_success' })}
                className="block w-full bg-[#4285F4] hover:bg-[#3367D6] text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors text-center"
              >
                Laisser un avis Google ⭐
              </a>
              <button
                onClick={() => setShowSatisfaction(false)}
                className="w-full text-xs text-gray-500 hover:text-gray-700 mt-2 underline"
              >
                Peut-être plus tard
              </button>
            </div>
          )}

          {satisfactionStep === 'negative' && (
            <div>
              <p className="text-sm font-semibold text-[#1a1f20] mb-2">
                Désolé ! 😔
              </p>
              <p className="text-xs text-[#545454] mb-3">
                Dites-nous ce qui a coincé pour qu'on puisse corriger ça immédiatement.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Votre retour nous aide à améliorer..."
                className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7CAA89] focus:border-transparent"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedback.trim()}
                  className="flex-1 bg-[#545454] hover:bg-[#1a1f20] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Envoyer
                </button>
                <button
                  onClick={() => setShowSatisfaction(false)}
                  className="px-3 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {satisfactionStep === 'sent' && (
            <div className="text-center py-2">
              <p className="text-sm font-semibold text-[#7CAA89] mb-1">
                Merci pour votre retour ! 🙏
              </p>
              <p className="text-xs text-[#545454]">
                On va corriger ça au plus vite.
              </p>
            </div>
          )}
        </motion.div>
      )}

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
