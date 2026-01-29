import React, { useState, useEffect } from 'react';
import { X, Building2, User, CreditCard, Calendar, Info } from 'lucide-react';

interface Locataire {
  id: string;
  nom: string;
  prenom?: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  iban_locataire?: string;
}

interface Props {
  locataire: Locataire;
  bankConnectionId: string;
  onClose: () => void;
  onSave: (config: RentDetectionConfig) => Promise<void>;
}

export interface RentDetectionConfig {
  locataire_id: string;
  bank_connection_id: string;
  expected_amount: number;
  sender_name: string;
  sender_iban: string;
  description_contains: string;
  tolerance_amount: number;
  detection_deadline_day: number;
  auto_generate_receipt: boolean;
  send_mode: 'email' | 'sms' | 'both';
}

const RentDetectionModal: React.FC<Props> = ({ locataire, bankConnectionId, onClose, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    sender_name: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
    sender_iban: locataire.iban_locataire || '',
    description_contains: 'loyer',
    tolerance_amount: '5',
    detection_deadline_day: '10',
    send_mode: 'email' as 'email' | 'sms' | 'both',
  });

  const expectedAmount = locataire.loyer_mensuel + locataire.charges_mensuelles;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const config: RentDetectionConfig = {
        locataire_id: locataire.id,
        bank_connection_id: bankConnectionId,
        expected_amount: expectedAmount,
        sender_name: formData.sender_name,
        sender_iban: formData.sender_iban,
        description_contains: formData.description_contains,
        tolerance_amount: parseFloat(formData.tolerance_amount),
        detection_deadline_day: parseInt(formData.detection_deadline_day),
        auto_generate_receipt: true,
        send_mode: formData.send_mode,
      };

      await onSave(config);
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#7CAA89] rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Configurer la détection de paiement</h2>
              <p className="text-sm text-gray-600">
                {locataire.nom} {locataire.prenom}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Montant attendu */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Montant attendu</p>
                <p className="text-2xl font-bold text-blue-900">{expectedAmount.toFixed(2)} €</p>
                <p className="text-sm text-blue-700 mt-1">
                  Loyer: {(locataire.loyer_mensuel || 0).toFixed(2)} € + Charges: {(locataire.charges_mensuelles || 0).toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          {/* Nom du titulaire */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nom du titulaire attendu
            </label>
            <input
              type="text"
              value={formData.sender_name}
              onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
              placeholder="Ex: Lucie Martin"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89] transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              Aide à identifier le bon émetteur dans les transactions
            </p>
          </div>

          {/* IBAN Locataire */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-2" />
              IBAN Locataire (Optionnel)
            </label>
            <input
              type="text"
              value={formData.sender_iban}
              onChange={(e) => setFormData({ ...formData, sender_iban: e.target.value })}
              placeholder="Ex: FR76 1234 5678 9012 3456 7890 123 ou ****90189"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89] transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vous pouvez saisir l'IBAN complet ou seulement les 4 à 6 derniers chiffres (ex. ****90189)
            </p>
          </div>

          {/* Mots-clés dans le libellé */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mots-clés dans le libellé
            </label>
            <input
              type="text"
              value={formData.description_contains}
              onChange={(e) => setFormData({ ...formData, description_contains: e.target.value })}
              placeholder="Ex: loyer, location, appartement"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89] transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mots à rechercher dans le libellé de la transaction
            </p>
          </div>

          {/* Tolérance de montant */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tolérance de montant (±)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.tolerance_amount}
                onChange={(e) => setFormData({ ...formData, tolerance_amount: e.target.value })}
                className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89] transition-all"
              />
              <span className="text-gray-700 font-medium">€</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Accepte les paiements entre {(expectedAmount - parseFloat(formData.tolerance_amount || '0')).toFixed(2)} € et {(expectedAmount + parseFloat(formData.tolerance_amount || '0')).toFixed(2)} €
            </p>
          </div>

          {/* Date limite de détection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date limite de détection
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">Le</span>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.detection_deadline_day}
                onChange={(e) => setFormData({ ...formData, detection_deadline_day: e.target.value })}
                className="w-20 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89] transition-all"
              />
              <span className="text-gray-700">du mois</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Si aucun paiement n'est détecté avant cette date, vous recevrez une alerte
            </p>
          </div>

          {/* Mode d'envoi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mode d'envoi de la quittance automatique
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="send_mode"
                  value="email"
                  checked={formData.send_mode === 'email'}
                  onChange={(e) => setFormData({ ...formData, send_mode: e.target.value as any })}
                  className="w-4 h-4 text-[#7CAA89]"
                />
                <span className="text-gray-900">Email uniquement</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="send_mode"
                  value="sms"
                  checked={formData.send_mode === 'sms'}
                  onChange={(e) => setFormData({ ...formData, send_mode: e.target.value as any })}
                  className="w-4 h-4 text-[#7CAA89]"
                />
                <span className="text-gray-900">SMS uniquement</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="send_mode"
                  value="both"
                  checked={formData.send_mode === 'both'}
                  onChange={(e) => setFormData({ ...formData, send_mode: e.target.value as any })}
                  className="w-4 h-4 text-[#7CAA89]"
                />
                <span className="text-gray-900">Email + SMS</span>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#7CAA89] hover:bg-[#6a9d7f] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>{saving ? 'Enregistrement...' : '💾 Enregistrer la synchronisation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentDetectionModal;
