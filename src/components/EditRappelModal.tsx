import React, { useState } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ModeEnvoiQuittance = 'rappel_classique' | 'systematic_preavis_5j';

interface Locataire {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  date_rappel: number;
  heure_rappel?: number;
  minute_rappel?: number;
  mode_envoi_quittance?: ModeEnvoiQuittance | null;
}

interface Props {
  locataire: Locataire;
  bailleurTelephone?: string;
  onClose: () => void;
  onSave: (updated: Partial<Locataire>) => void;
}

const EditRappelModal = ({ locataire, bailleurTelephone, onClose, onSave }: Props) => {
  const [modeEnvoi, setModeEnvoi] = useState<ModeEnvoiQuittance>(
    (locataire.mode_envoi_quittance === 'systematic_preavis_5j' ? 'systematic_preavis_5j' : 'rappel_classique')
  );
  const [dateRappel, setDateRappel] = useState(locataire.date_rappel?.toString() || '1');
  const [heureRappel, setHeureRappel] = useState(locataire.heure_rappel?.toString() || '9');
  const [minuteRappel, setMinuteRappel] = useState(locataire.minute_rappel?.toString() || '0');
  const [saving, setSaving] = useState(false);

  const hasNoEmailLocataire = !locataire.email || !String(locataire.email).trim();
  const hasNoTelBailleur = !bailleurTelephone || !String(bailleurTelephone).trim();
  const hasAlerts = hasNoEmailLocataire || hasNoTelBailleur;

  const handleSave = async () => {
    if (hasAlerts) {
      const parts: string[] = [];
      if (hasNoEmailLocataire) parts.push("l'e-mail du locataire");
      if (hasNoTelBailleur) parts.push('le téléphone du bailleur');
      const msg = `Sans ${parts.join(' et sans ')}, le rappel (SMS) et l'envoi de la quittance ne pourront pas fonctionner. Enregistrer quand même ?`;
      if (!window.confirm(msg)) return;
    }
    setSaving(true);
    try {
      const payloadWithMode = {
        date_rappel: parseInt(dateRappel),
        heure_rappel: parseInt(heureRappel),
        minute_rappel: parseInt(minuteRappel),
        mode_envoi_quittance: modeEnvoi
      };
      const payloadDateOnly = {
        date_rappel: parseInt(dateRappel),
        heure_rappel: parseInt(heureRappel),
        minute_rappel: parseInt(minuteRappel)
      };

      let { error } = await supabase
        .from('locataires')
        .update(payloadWithMode)
        .eq('id', locataire.id);

      if (error) {
        const msg = String(error.message || '');
        const columnMissing = /mode_envoi_quittance|column.*does not exist|42703/i.test(msg);
        if (columnMissing) {
          const res = await supabase
            .from('locataires')
            .update(payloadDateOnly)
            .eq('id', locataire.id);
          error = res.error;
        }
      }

      if (error) throw error;

      onSave({
        date_rappel: parseInt(dateRappel),
        heure_rappel: parseInt(heureRappel),
        minute_rappel: parseInt(minuteRappel),
        mode_envoi_quittance: modeEnvoi
      });
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
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#7CAA89]" />
            <h2 className="text-xl font-bold text-[#2b2b2b]">Paramétrer les rappels</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Locataire:</strong> {locataire.nom} {locataire.prenom}
            </p>
          </div>

          {hasAlerts && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 space-y-1">
                {hasNoEmailLocataire && (
                  <p><strong>E-mail du locataire manquant.</strong> Pour que la quittance soit envoyée au locataire, renseignez son adresse e-mail dans la fiche locataire (modifier le locataire).</p>
                )}
                {hasNoTelBailleur && (
                  <p><strong>Téléphone du bailleur manquant.</strong> Pour recevoir le rappel par SMS, renseignez votre numéro de téléphone dans votre profil (modifier le propriétaire).</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode d'envoi des quittances
            </label>
            <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="modeEnvoi"
                  value="rappel_classique"
                  checked={modeEnvoi === 'rappel_classique'}
                  onChange={() => setModeEnvoi('rappel_classique')}
                  className="mt-1 text-[#7CAA89] focus:ring-[#7CAA89]"
                />
                <div className="text-sm text-gray-800">
                  <strong>Rappel puis clic</strong> – Vous recevez un rappel (SMS/email) à la date programmée, puis vous envoyez la quittance en un clic depuis l’espace ou le lien.
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="modeEnvoi"
                  value="systematic_preavis_5j"
                  checked={modeEnvoi === 'systematic_preavis_5j'}
                  onChange={() => setModeEnvoi('systematic_preavis_5j')}
                  className="mt-1 text-[#7CAA89] focus:ring-[#7CAA89]"
                />
                <div className="text-sm text-gray-800">
                  <strong>Envoi systématique avec préavis 5 jours</strong> – À la date programmée, vous recevez un email avec 3 choix : annuler, relancer le locataire, ou envoyer la quittance tout de suite. Si vous ne faites rien, la quittance part automatiquement au locataire 5 jours plus tard.
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jour du mois pour l'envoi automatique *
            </label>
            <select
              value={dateRappel}
              onChange={(e) => setDateRappel(e.target.value)}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89]"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Le {day} du mois
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              La quittance sera automatiquement envoyée ce jour chaque mois
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure
              </label>
              <select
                value={heureRappel}
                onChange={(e) => setHeureRappel(e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89]"
              >
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <option key={hour} value={hour}>
                    {hour.toString().padStart(2, '0')}h
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minute
              </label>
              <select
                value={minuteRappel}
                onChange={(e) => setMinuteRappel(e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89]/20 focus:border-[#7CAA89]"
              >
                {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                  <option key={minute} value={minute}>
                    {minute.toString().padStart(2, '0')}min
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Résumé:</strong> La quittance sera envoyée automatiquement le <strong>{dateRappel}</strong> de chaque mois à <strong>{heureRappel.padStart(2, '0')}:{minuteRappel.padStart(2, '0')}</strong>
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
            disabled={saving}
            className="px-6 py-2 bg-[#7CAA89] hover:bg-[#6b9378] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRappelModal;
