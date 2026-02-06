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
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7CAA89] rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-[#1a1f20]">Quittance Simple</span>
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
      <main className="flex-1 px-5 py-4 md:py-8 max-w-3xl md:max-w-2xl mx-auto w-full">
        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-4 md:mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-[#1a1f20]">
              Quittance envoyée
            </h1>
            <CheckCircle className="w-8 h-8 md:w-8 md:h-8 text-[#7CAA89]" />
          </div>
          <p className="text-base md:text-lg font-semibold text-[#1a1f20] max-w-2xl mx-auto px-2">
            Les prochaines ? Vous pouvez les oublier...
          </p>
        </motion.div>

        {/* CTA Card - Mode Tranquillité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 md:p-8 border border-gray-200 shadow-lg"
        >
          <div className="mb-4 md:mb-6">
            <p className="text-base md:text-base text-[#545454] leading-relaxed max-w-2xl mx-auto">
              Chaque mois, même contrainte, créer, remplir, copier, télécharger, vérifier, chercher, coller, rédiger, envoyer etc. Un oubli? une erreur? ou un retard? et il faut faire et re-faire...
               </p>
            <p className="text-base md:text-base text-[#1a1f20] font-semibold mt-3 md:mt-4 max-w-2xl mx-auto">
              Et si vous arretiez de vous embeter avec tout çà&nbsp;?
            </p>
          </div>

          <div className="text-sm md:text-base text-[#545454] mb-4 md:mb-6 space-y-2 md:space-y-3 max-w-2xl mx-auto">
            <div className="flex items-start gap-3 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-lg flex-shrink-0">✓</span>
              <span>Quittance et relance envoyée automatiquement sans oubli</span>
            </div>
            <div className="flex items-start gap-3 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-lg flex-shrink-0">✓</span>
              <span>Bilan anuel / CA prêt pour déclaration (lmnp/Pinel/vide)</span>
            </div>
            <div className="flex items-start gap-3 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-lg flex-shrink-0">✓</span>
              <span>Calcul révison IRL automatique</span>
            </div>
            <div className="flex items-start gap-3 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-lg flex-shrink-0">✓</span>
              <span>Rappel et Courrier IRL prêt, plus d'oubli ni de perte</span>
            </div>
            <div className="flex items-start gap-3 md:gap-3">
              <span className="text-[#7CAA89] font-bold text-lg flex-shrink-0">✓</span>
              <span>Historique conservé, disponible 24/24</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="max-w-md mx-auto">
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
              className="w-full bg-[#ed7862] hover:bg-[#e56651] text-white font-bold text-base md:text-lg py-4 md:py-4 rounded-full transition-all transform hover:scale-[1.02] shadow-lg mb-4">
              Passer en Mode Tranquillité
            </button>

            {/* Price */}
            <p className="text-center text-sm md:text-base text-[#545454] mb-4">
              Ne plus m'en occuper dès <span className="font-bold text-[#1a1f20]">0,82 € / mois</span>
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

      {/* Simple footer - Mobile optimized */}
      <footer className="py-6 text-center">

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
