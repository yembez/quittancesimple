import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ModeEnvoiQuittance = 'rappel_classique' | 'systematic_preavis_5j';

interface Locataire {
  id: string;
  date_rappel: number;
  heure_rappel?: number;
  minute_rappel?: number;
  mode_envoi_quittance?: ModeEnvoiQuittance | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proprietaireId: string;
  proprietaireTelephone?: string | null;
  locataires: Locataire[];
  onSuccess: (updates: {
    date_rappel: number;
    heure_rappel: number;
    minute_rappel: number;
    mode_envoi_quittance: ModeEnvoiQuittance;
  }) => void;
}

const AutomationConfigModal = ({
  isOpen,
  onClose,
  proprietaireId,
  proprietaireTelephone,
  locataires,
  onSuccess,
}: Props) => {
  const first = locataires[0];
  const [mode, setMode] = useState<ModeEnvoiQuittance>(
    first?.mode_envoi_quittance === 'systematic_preavis_5j' ? 'systematic_preavis_5j' : 'rappel_classique'
  );
  const [dateRappel, setDateRappel] = useState(first?.date_rappel?.toString() || '5');
  const [heureRappel, setHeureRappel] = useState(first?.heure_rappel?.toString() || '9');
  const [minuteRappel, setMinuteRappel] = useState(first?.minute_rappel?.toString() || '0');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async () => {
    // Règles demandées :
    // - toujours exiger l'e-mail locataire
    // - si mode "Validation 1 clic" (= rappel_classique), exiger le téléphone bailleur
    const missingLocataireEmail = locataires.some((l) => !(l as any)?.email || !String((l as any).email).trim());
    if (missingLocataireEmail) {
      alert("Veuillez renseigner l'e-mail du locataire avant d'activer l'automatisation.");
      return;
    }
    if (mode === 'rappel_classique' && !String(proprietaireTelephone ?? '').trim()) {
      alert("Veuillez renseigner votre numéro de téléphone (bailleur) pour le mode « Validation 1 clic ».");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date_rappel: parseInt(dateRappel, 10),
        heure_rappel: parseInt(heureRappel, 10),
        minute_rappel: parseInt(minuteRappel, 10),
        mode_envoi_quittance: mode,
      };

      const { data: updatedRows, error } = await supabase
        .from('locataires')
        .update(payload)
        .eq('proprietaire_id', proprietaireId)
        .select('id');

      if (error) throw error;
      if (!updatedRows?.length) {
        alert(
          "Aucun locataire n'a été mis à jour. Vérifiez que vous avez au moins un locataire actif, ou réessayez après rechargement de la page."
        );
        return;
      }

      onSuccess(payload);
      onClose();
    } catch (err: unknown) {
      console.error('AutomationConfigModal save error:', err);
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Erreur inconnue';
      alert(`Erreur lors de l'enregistrement.\n\n${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const hourStr = heureRappel.padStart(2, '0');
  const minuteStr = minuteRappel.padStart(2, '0');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#212a3e]">
            Configurer l'automatisation des quittances
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748b] hover:text-[#0f172a] transition-colors p-1"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-[#334155] mb-3">Choix du mode d'automatisation :</p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="automationMode"
                  checked={mode === 'systematic_preavis_5j'}
                  onChange={() => setMode('systematic_preavis_5j')}
                  className="mt-1 w-4 h-4 text-[#E65F3F] focus:ring-[#E65F3F]"
                />
                <div className="text-sm text-[#334155]">
                  <span className="font-semibold">100% Automatique (recommandé)</span>
                  <p className="text-[#64748b] mt-0.5">
                    La quittance sera envoyée automatiquement 5 jours aprés le rappel.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="automationMode"
                  checked={mode === 'rappel_classique'}
                  onChange={() => setMode('rappel_classique')}
                  className="mt-1 w-4 h-4 text-[#E65F3F] focus:ring-[#E65F3F]"
                />
                <div className="text-sm text-[#334155]">
                  <span className="font-semibold">Validation 1 clic</span>
                  <p className="text-[#64748b] mt-0.5">
                    Vous recevez un SMS + email de rappel pour valider l'envoi.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">Date d'envoi du rappel</label>
            <select
              value={dateRappel}
              onChange={(e) => setDateRappel(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg text-[#0f172a] focus:ring-2 focus:ring-[#E65F3F]/20 focus:border-[#E65F3F]"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Le {day} du mois
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">Heure</label>
            <div className="flex gap-3">
              <select
                value={heureRappel}
                onChange={(e) => setHeureRappel(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-[#e2e8f0] rounded-lg text-[#0f172a] focus:ring-2 focus:ring-[#E65F3F]/20 focus:border-[#E65F3F]"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
              <select
                value={minuteRappel}
                onChange={(e) => setMinuteRappel(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-[#e2e8f0] rounded-lg text-[#0f172a] focus:ring-2 focus:ring-[#E65F3F]/20 focus:border-[#E65F3F]"
              >
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')} min
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-[#64748b] mt-1">
              Rappel envoyé le {dateRappel} de chaque mois à {hourStr}:{minuteStr}
            </p>
          </div>
        </div>

        <div className="border-t border-[#e2e8f0] px-6 py-4 rounded-b-2xl">
          <button
            type="button"
            onClick={handleActivate}
            disabled={saving}
            className="w-full py-3 px-6 rounded-xl bg-[#E65F3F] hover:bg-[#d95530] text-white font-semibold text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Activer l\'automatisation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationConfigModal;
