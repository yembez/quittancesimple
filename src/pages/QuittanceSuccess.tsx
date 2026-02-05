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

      {/* Content */}
      <main className="flex-1 px-5 py-4 max-w-2xl mx-auto w-full">
        {/* Back button
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            trackGA4Event('back_button_clicked', {
              page_source: 'quittance_success',
              destination: 'home',
            });
            navigate('/');
          }}
          className="flex items-center gap-2 text-[#545454] hover:text-[#1a1f20] transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base">Retour</span>
        </motion.button> */}

        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-4"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-xl md:text xl font-bold text-[#1a1f20]">
              Quittance envoyée
            </h1>
            <CheckCircle className="w-8 h-8 text-[#7CAA89]" />
          </div>
          <p className="text-base md:text-lg text-[#545454]">
            Et si c'était la dernière à gérer manuellement?
          </p>
        </motion.div>

        {/* CTA Card - Mode Tranquillité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-50 rounded-2xl p-3 md:p-0 border border-gray-200"
        >
          <p className="text-base md:text-base font-medium text-[#1a1f20] mb-2">
            Avec notre <span className="font-semibold text-[#1a1f20]">Mode Tranquillité...</span>  oubliez l'administratif locatif
          </p>
<p className="text-1xl md:text-base font-medium text-[#1a1f20] mb-2">
           
          </p>
          <div className="text-sm md:text-lg text-[#545454] mb-3 space-y-1.5">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
              <span><span className="font-semibold text-[#1a1f20]">Quittances</span> et relances loyer automatiques</span>
            </div>
            <div className="flex items-start gap-2">
              <Calculator className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
              <span><span className="font-semibold text-[#1a1f20]">Calcul révisions IRL</span> automatique</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
              <span><span className="font-semibold text-[#1a1f20]">Courrier révision IRL</span> automatique</span>
            </div>
            <div className="flex items-start gap-2">
              <BarChart3 className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
              <span><span className="font-semibold text-[#1a1f20]">Bilans / CA annuel</span> prêts pour déclaration</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
              <span><span className="font-semibold text-[#1a1f20]">Historique</span> archivé, disponible 24/24</span>
            </div>
           
          </div>

          <p className="text-sm md:text-lg text-[#545454] mb-6">
            Tout est pris en charge, mais vous gardez le contrôle.
          </p>

          {/* CTA Button */}
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
            className="w-full bg-[#ed7862] hover:bg-[#e56651] text-white font-bold text-base md:text-lg py-4 rounded-full transition-all transform hover:scale-[1.02] shadow-lg mb-4">
            Passer en Mode Tranquillité
          </button>

          {/* Price */}
          <p className="text-center text-sm md:text-base text-[#545454] mb-4">
            Dès 0,82 € / mois • Sans engagement
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
            className="w-full text-center text-sm md:text-base text-[#545454] hover:text-[#1a1f20] transition-colors underline">
            Retour
          </button>
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
