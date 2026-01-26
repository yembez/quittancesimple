import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

interface PaymentWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  missingFields: string[];
  planName: string;
  planPrice: string;
  billingCycle: 'monthly' | 'yearly';
}

const PaymentWarningModal: React.FC<PaymentWarningModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  missingFields,
  planName,
  planPrice,
  billingCycle
}) => {
  if (!isOpen) return null;

  const hasMissingFields = missingFields.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7CAA89]/10 to-[#7CAA89]/5 px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Confirmation de votre abonnement</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Warning Section - Only if missing fields */}
          {hasMissingFields && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    Informations incomplètes
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Pour profiter pleinement de l'envoi automatique, pensez à compléter votre profil après le paiement : <span className="font-medium">{missingFields.join(', ')}</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plan Summary */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Formule sélectionnée</span>
              <span className="font-semibold text-gray-900">{planName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Facturation</span>
              <span className="font-semibold text-gray-900">
                {billingCycle === 'yearly' ? 'Annuelle' : 'Mensuelle'}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-[#7CAA89]">
                {planPrice}
                <span className="text-sm font-normal text-gray-600">
                  /{billingCycle === 'yearly' ? 'an' : 'mois'}
                </span>
              </span>
            </div>
          </div>

          {/* Features Reminder */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Inclus dans votre formule
            </p>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-[#7CAA89] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Envoi automatique des quittances par email</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-[#7CAA89] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Rappels automatiques par SMS et email</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-[#7CAA89] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Historique complet et téléchargement illimité</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-5 py-2.5 bg-[#7CAA89] hover:bg-[#6b9378] text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>Continuer vers le paiement</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentWarningModal;
