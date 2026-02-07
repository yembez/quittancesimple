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
