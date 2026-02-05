import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateEmail, validatePhone } from '../utils/validation';

interface Locataire {
  id: string;
  proprietaire_id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse_logement: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  actif: boolean;
}

interface Props {
  locataire: Locataire;
  onClose: () => void;
  onSave: (updated: Locataire) => void;
}

const EditLocataireModal = ({ locataire, onClose, onSave }: Props) => {
  const [formData, setFormData] = useState(locataire);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; telephone?: string }>({});

  const handleSave = async () => {
    if (!formData.nom || !formData.adresse_logement) {
      alert('Le nom et l\'adresse du logement sont obligatoires');
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      alert('L\'email est obligatoire pour envoyer les quittances');
      return;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setErrors({ ...errors, email: emailValidation.error });
      alert(emailValidation.error);
      return;
    }

    if (formData.telephone && formData.telephone.trim()) {
      const phoneValidation = validatePhone(formData.telephone);
      if (!phoneValidation.isValid) {
        setErrors({ ...errors, telephone: phoneValidation.error });
        alert(phoneValidation.error);
        return;
      }
    }

    if (isNaN(formData.loyer_mensuel) || formData.loyer_mensuel < 0) {
      alert('Le loyer mensuel doit être un nombre valide');
      return;
    }

    if (isNaN(formData.charges_mensuelles) || formData.charges_mensuelles < 0) {
      alert('Les charges mensuelles doivent être un nombre valide');
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const { error } = await supabase
        .from('locataires')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          adresse_logement: formData.adresse_logement,
          loyer_mensuel: formData.loyer_mensuel,
          charges_mensuelles: formData.charges_mensuelles
        })
        .eq('id', locataire.id);

      if (error) throw error;

      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2b2b2b]">Modifier le locataire</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
              <input
                type="text"
                value={formData.prenom || ''}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors({ ...errors, email: undefined });
                }}
                className={`w-full px-4 py-2 text-base border rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89] ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="locataire@example.com"
                required
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Nécessaire pour l'envoi des quittances</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone (optionnel)</label>
              <input
                type="tel"
                value={formData.telephone || ''}
                onChange={(e) => {
                  setFormData({ ...formData, telephone: e.target.value });
                  setErrors({ ...errors, telephone: undefined });
                }}
                className={`w-full px-4 py-2 text-base border rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89] ${
                  errors.telephone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="06 12 34 56 78"
              />
              {errors.telephone && (
                <p className="text-xs text-red-600 mt-1">{errors.telephone}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Optionnel, utile pour les rappels SMS</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse du logement *</label>
            <input
              type="text"
              value={formData.adresse_logement}
              onChange={(e) => setFormData({ ...formData, adresse_logement: e.target.value })}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89]"
              placeholder="Numéro, rue, code postal, ville"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loyer mensuel (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.loyer_mensuel}
                onChange={(e) => setFormData({ ...formData, loyer_mensuel: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Charges mensuelles (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.charges_mensuelles}
                onChange={(e) => setFormData({ ...formData, charges_mensuelles: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89]"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Total mensuel:</strong> {((formData.loyer_mensuel || 0) + (formData.charges_mensuelles || 0)).toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.nom || !formData.adresse_logement || !formData.email || formData.loyer_mensuel < 0 || formData.charges_mensuelles < 0}
            className="px-6 py-2 bg-[#7CAA89] hover:bg-[#6b9378] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLocataireModal;
