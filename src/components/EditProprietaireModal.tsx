import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validatePhone } from '../utils/validation';

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  adresse: string;
  telephone?: string;
  plan_type: string;
}

interface Props {
  proprietaire: Proprietaire;
  onClose: () => void;
  onSave: (updated: Proprietaire) => void;
}

const EditProprietaireModal = ({ proprietaire, onClose, onSave }: Props) => {
  const [formData, setFormData] = useState(proprietaire);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ telephone?: string }>({});

  const handleSave = async () => {
    if (!formData.nom || !formData.adresse) {
      alert('Le nom et l\'adresse sont obligatoires');
      return;
    }

    if (!formData.telephone || !formData.telephone.trim()) {
      alert('Le numéro de téléphone est obligatoire pour pouvoir envoyer les rappels');
      return;
    }

    const phoneValidation = validatePhone(formData.telephone);
    if (!phoneValidation.isValid) {
      setErrors({ telephone: phoneValidation.error });
      alert(phoneValidation.error);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const { error } = await supabase
        .from('proprietaires')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          adresse: formData.adresse,
          telephone: formData.telephone
        })
        .eq('id', proprietaire.id);

      if (error) throw error;

      const updatedProprietaire = {
        ...proprietaire,
        nom: formData.nom,
        prenom: formData.prenom,
        adresse: formData.adresse,
        telephone: formData.telephone
      };

      onSave(updatedProprietaire);
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
          <h2 className="text-xl font-bold text-[#2b2b2b]">Modifier mes informations</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète *</label>
            <input
              type="text"
              value={formData.adresse || ''}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89]"
              placeholder="Numéro, rue, code postal, ville"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
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
              required
            />
            {errors.telephone && (
              <p className="text-xs text-red-600 mt-1">{errors.telephone}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Nécessaire pour recevoir les rappels SMS</p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full font-semibold transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.nom || !formData.adresse || !formData.telephone}
            className="px-8 py-3 bg-[#ed7862] hover:bg-[#e56651] text-white rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProprietaireModal;
