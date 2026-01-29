import React, { useState } from 'react';
import { X, Check, Calendar } from 'lucide-react';

interface BillingCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billingCycle: 'monthly' | 'yearly') => void;
  numberOfTenants: number;
  ownerInfoComplete: boolean;
  missingFieldsMessage: string;
  selectedBillingCycle?: 'monthly' | 'yearly';
}

const BillingCycleModal = ({
  isOpen,
  onClose,
  onConfirm,
  numberOfTenants,
  ownerInfoComplete,
  missingFieldsMessage,
  selectedBillingCycle = 'yearly'
}: BillingCycleModalProps) => {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>(selectedBillingCycle);

  if (!isOpen) return null;

  const getPriceByTenants = (cycle: 'monthly' | 'yearly') => {
    if (cycle === 'monthly') {
      if (numberOfTenants >= 1 && numberOfTenants <= 2) return { price: 0.99, savings: null };
      if (numberOfTenants >= 3 && numberOfTenants <= 5) return { price: 1.49, savings: null };
      return { price: 2.49, savings: null };
    } else {
      if (numberOfTenants >= 1 && numberOfTenants <= 2) return { price: 9.90, savings: 1.98 };
      if (numberOfTenants >= 3 && numberOfTenants <= 5) return { price: 14.90, savings: 2.98 };
      return { price: 24.90, savings: 4.98 };
    }
  };

  const monthlyPrice = getPriceByTenants('monthly');
  const yearlyPrice = getPriceByTenants('yearly');

  const handleConfirm = () => {
    if (!ownerInfoComplete) {
      return;
    }
    onConfirm(selectedCycle);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Choisissez votre formule</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!ownerInfoComplete && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">
                    Informations incomplètes
                  </h3>
                  <p className="text-sm text-red-700">
                    {missingFieldsMessage}
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    Veuillez compléter vos informations de propriétaire avant de procéder au paiement.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 text-center mb-6">
              Pour <span className="font-bold text-[#7CAA89]">{numberOfTenants} {numberOfTenants === 1 ? 'locataire' : 'locataires'}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div
              onClick={() => !ownerInfoComplete ? null : setSelectedCycle('monthly')}
              className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                selectedCycle === 'monthly'
                  ? 'border-[#7CAA89] bg-[#7CAA89]/5 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!ownerInfoComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedCycle === 'monthly' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-[#7CAA89] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#7CAA89]" />
                <h3 className="font-bold text-lg text-gray-900">Mensuel</h3>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">{monthlyPrice.price.toFixed(2)} €</span>
                  <span className="text-gray-600">/mois</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Soit {(monthlyPrice.price * 12).toFixed(2)} €/an
                </p>
              </div>

              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
                  <span>Engagement mensuel</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
                  <span>Annulation à tout moment</span>
                </li>
              </ul>
            </div>

            <div
              onClick={() => !ownerInfoComplete ? null : setSelectedCycle('yearly')}
              className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                selectedCycle === 'yearly'
                  ? 'border-[#7CAA89] bg-[#7CAA89]/5 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!ownerInfoComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedCycle === 'yearly' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-[#7CAA89] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#ed7862] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  RECOMMANDÉ
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#7CAA89]" />
                <h3 className="font-bold text-lg text-gray-900">Annuel</h3>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">{yearlyPrice.price.toFixed(2)} €</span>
                  <span className="text-gray-600">/an</span>
                </div>
                <p className="text-sm text-[#7CAA89] font-semibold mt-1">
                  Économisez {yearlyPrice.savings?.toFixed(2)} € par an
                </p>
              </div>

              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
                  <span>Paiement unique annuel</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
                  <span>Meilleur rapport qualité-prix</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
                  <span>Pas de souci de renouvellement mensuel</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
              Inclus dans toutes les formules :
            </h4>
            <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
                <span>Génération illimitée de quittances</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
                <span>Envoi automatique par email</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
                <span>Rappels SMS automatiques</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#7CAA89] mt-0.5 flex-shrink-0" />
                <span>Historique complet</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!ownerInfoComplete}
              className={`flex-1 px-6 py-3 rounded-full font-semibold transition-colors ${
                ownerInfoComplete
                  ? 'bg-[#7CAA89] hover:bg-[#6b9378] text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continuer vers le paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingCycleModal;
