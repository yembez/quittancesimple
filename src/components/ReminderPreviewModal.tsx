import React, { useState } from 'react';
import { X, Send, Edit2 } from 'lucide-react';

interface ReminderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customMessage?: string) => void;
  locataireName: string;
  baillorName: string;
  loyer: number;
  charges: number;
  adresseLogement: string;
  isSending: boolean;
}

const ReminderPreviewModal: React.FC<ReminderPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  locataireName,
  baillorName,
  loyer,
  charges,
  adresseLogement,
  isSending
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  if (!isOpen) return null;

  const total = loyer + charges;

  const defaultMessage = `Bonjour ${locataireName},

J'espère que vous allez bien. Je me permets de vous envoyer ce message pour vous rappeler que le loyer du mois en cours n'a pas encore été réglé pour le logement situé au :

${adresseLogement}

Pour rappel, voici le détail des montants dus :

Loyer mensuel : ${loyer.toFixed(2)} €
Charges mensuelles : ${charges.toFixed(2)} €
Total à régler : ${total.toFixed(2)} €

Pourriez-vous s'il vous plaît procéder au règlement dans les meilleurs délais ? Si vous avez déjà effectué le paiement, merci de ne pas tenir compte de ce message.

Je reste à votre disposition pour toute question.

Cordialement,
${baillorName}`;

  const displayMessage = customMessage || defaultMessage;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Prévisualisation de la relance</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSending}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Email Preview */}
        <div className="p-6">
          {/* Edit Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                if (!isEditing && !customMessage) {
                  setCustomMessage(defaultMessage);
                }
                setIsEditing(!isEditing);
              }}
              className="flex items-center space-x-2 px-4 py-2 text-base font-medium text-[#2D3436] hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSending}
            >
              <Edit2 className="w-4 h-4" />
              <span>{isEditing ? 'Aperçu' : 'Modifier'}</span>
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            {/* Email Header */}
            <div className="mb-6 pb-4 border-b border-gray-200">
              <div className="text-sm text-gray-600 mb-2">
                <strong>À :</strong> {locataireName}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Objet :</strong> Rappel de paiement du loyer
              </div>
            </div>

            {/* Email Body - Editable or Preview */}
            {isEditing ? (
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full h-96 p-4 text-base text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Modifiez votre message ici..."
              />
            ) : (
              <div className="space-y-4 text-base text-gray-800 whitespace-pre-wrap">
                {displayMessage}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSending}
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(customMessage || undefined)}
            disabled={isSending}
            className="px-6 py-3 text-base font-semibold bg-[#2D3436] hover:bg-[#1a1f20] text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            <span>{isSending ? 'Envoi en cours...' : 'Envoyer la relance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderPreviewModal;
