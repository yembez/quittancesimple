import { useState, useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateEmail, validatePhone } from '../utils/validation';

type ModeEnvoiQuittance = 'rappel_classique' | 'systematic_preavis_5j';

export interface AutomationLocataireRow {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  adresse_logement: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  date_rappel: number;
  heure_rappel?: number;
  minute_rappel?: number;
  mode_envoi_quittance?: ModeEnvoiQuittance | null;
}

export interface AutomationProprietaireBrief {
  id: string;
  adresse?: string | null;
  telephone?: string | null;
  nom?: string | null;
  prenom?: string | null;
}

interface LocataireDraft {
  nom: string;
  prenom: string;
  email: string;
  adresse_logement: string;
  loyer: string;
  charges: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proprietaireId: string;
  proprietaire: AutomationProprietaireBrief;
  /** Mode choisi sur le tableau de bord : on masque le sélecteur dans la modale. */
  hideModeSelection?: boolean;
  /** Mode appliqué (dashboard ou fiche locataire existante). */
  defaultMode: ModeEnvoiQuittance;
  locataires: AutomationLocataireRow[];
  onSuccess: (updates: {
    date_rappel: number;
    heure_rappel: number;
    minute_rappel: number;
    mode_envoi_quittance: ModeEnvoiQuittance;
  }) => void;
  /** Après mise à jour bailleur en base (identité, adresse, téléphone). */
  onProprietaireUpdated?: () => void | Promise<void>;
}

function trim(s: string) {
  return s.trim();
}

function parseMoney(raw: string): { ok: true; n: number } | { ok: false } {
  const t = trim(raw).replace(',', '.');
  if (t === '') return { ok: false };
  const n = parseFloat(t);
  if (Number.isNaN(n) || !Number.isFinite(n)) return { ok: false };
  return { ok: true, n };
}

/** Ligne fictive pour créer le 1er locataire dans la modale (aucune ligne en base). */
export const SYNTHETIC_FIRST_LOCATAIRE_ID = '__qs_automation_first_locataire__';

function isSyntheticFirstLocataire(id: string) {
  return id === SYNTHETIC_FIRST_LOCATAIRE_ID;
}

function syntheticFirstLocataireRow(): AutomationLocataireRow {
  return {
    id: SYNTHETIC_FIRST_LOCATAIRE_ID,
    nom: '',
    prenom: '',
    email: '',
    adresse_logement: '',
    loyer_mensuel: 0,
    charges_mensuelles: 0,
    date_rappel: 5,
    heure_rappel: 9,
    minute_rappel: 0,
    mode_envoi_quittance: null,
  };
}

function locataireLabel(l: AutomationLocataireRow, draft: LocataireDraft) {
  if (isSyntheticFirstLocataire(l.id)) {
    const n = trim(draft.prenom || '') || trim(draft.nom || '');
    return n || 'Premier locataire';
  }
  const n = trim(draft.prenom || '') || trim(draft.nom || '');
  return n || `Locataire ${l.id.slice(0, 8)}…`;
}

const AutomationConfigModal = ({
  isOpen,
  onClose,
  proprietaireId,
  proprietaire,
  hideModeSelection = false,
  defaultMode,
  locataires,
  onSuccess,
  onProprietaireUpdated,
}: Props) => {
  /** Au moins une ligne à éditer : locataires réels ou fiche « premier locataire » si aucun en base. */
  const locatairesFormRows = useMemo(
    () => (locataires.length > 0 ? locataires : [syntheticFirstLocataireRow()]),
    [locataires],
  );
  const first = locatairesFormRows[0];
  const isCreatingFirstLocataire = locataires.length === 0;
  const [mode, setMode] = useState<ModeEnvoiQuittance>(defaultMode);

  useEffect(() => {
    if (!isOpen) return;
    setMode(defaultMode);
  }, [isOpen, defaultMode]);

  const [dateRappel, setDateRappel] = useState(first?.date_rappel?.toString() || '5');
  const [heureRappel, setHeureRappel] = useState(first?.heure_rappel?.toString() || '9');
  const [minuteRappel, setMinuteRappel] = useState(first?.minute_rappel?.toString() || '0');
  const [saving, setSaving] = useState(false);

  const [bailleurNom, setBailleurNom] = useState('');
  const [bailleurPrenom, setBailleurPrenom] = useState('');
  const [bailleurAdresse, setBailleurAdresse] = useState('');
  const [bailleurTel, setBailleurTel] = useState('');
  const [locDrafts, setLocDrafts] = useState<Record<string, LocataireDraft>>({});

  useEffect(() => {
    if (!isOpen) return;
    setDateRappel(first?.date_rappel?.toString() || '5');
    setHeureRappel(first?.heure_rappel?.toString() || '9');
    setMinuteRappel(first?.minute_rappel?.toString() || '0');
    setBailleurNom(String(proprietaire.nom ?? ''));
    setBailleurPrenom(String(proprietaire.prenom ?? ''));
    setBailleurAdresse(String(proprietaire.adresse ?? ''));
    setBailleurTel(String(proprietaire.telephone ?? ''));
    setLocDrafts(
      Object.fromEntries(
        locatairesFormRows.map((l) => [
          l.id,
          {
            nom: l.nom ?? '',
            prenom: l.prenom ?? '',
            email: l.email ?? '',
            adresse_logement: l.adresse_logement ?? '',
            loyer:
              l.loyer_mensuel != null && !Number.isNaN(Number(l.loyer_mensuel))
                ? String(l.loyer_mensuel)
                : '',
            charges:
              l.charges_mensuelles != null && !Number.isNaN(Number(l.charges_mensuelles))
                ? String(l.charges_mensuelles)
                : '',
          },
        ])
      )
    );
  }, [
    isOpen,
    proprietaire.nom,
    proprietaire.prenom,
    proprietaire.adresse,
    proprietaire.telephone,
    locatairesFormRows,
    first?.date_rappel,
    first?.heure_rappel,
    first?.minute_rappel,
  ]);

  const updateLocDraft = useCallback((id: string, patch: Partial<LocataireDraft>) => {
    setLocDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }, []);

  const validationOk = useMemo(() => {
    if (trim(bailleurNom) === '') return false;
    if (trim(bailleurAdresse) === '') return false;
    if (mode === 'rappel_classique') {
      if (trim(bailleurTel) === '') return false;
      if (!validatePhone(bailleurTel).isValid) return false;
    }

    for (const l of locatairesFormRows) {
      const d = locDrafts[l.id];
      if (!d) return false;
      if (!trim(d.nom) && !trim(d.prenom)) return false;
      if (trim(d.adresse_logement) === '') return false;
      if (trim(d.email) === '') return false;
      if (!validateEmail(trim(d.email)).isValid) return false;
      const loyerP = parseMoney(d.loyer);
      if (!loyerP.ok || loyerP.n <= 0) return false;
      const chP = parseMoney(d.charges);
      if (!chP.ok || chP.n < 0) return false;
    }

    return true;
  }, [bailleurNom, bailleurPrenom, bailleurAdresse, bailleurTel, mode, locatairesFormRows, locDrafts]);

  const handleActivate = async () => {
    if (!validationOk) {
      return;
    }

    setSaving(true);
    try {
      const { error: propErr } = await supabase
        .from('proprietaires')
        .update({
          nom: trim(bailleurNom),
          prenom: trim(bailleurPrenom) || null,
          adresse: trim(bailleurAdresse),
          telephone: trim(bailleurTel) || null,
        })
        .eq('id', proprietaire.id);

      if (propErr) throw propErr;
      await onProprietaireUpdated?.();

      const payload = {
        date_rappel: parseInt(dateRappel, 10),
        heure_rappel: parseInt(heureRappel, 10),
        minute_rappel: parseInt(minuteRappel, 10),
        mode_envoi_quittance: mode,
      };

      if (isCreatingFirstLocataire) {
        const d = locDrafts[SYNTHETIC_FIRST_LOCATAIRE_ID];
        if (!d) throw new Error('Données premier locataire manquantes');
        const loyerP = parseMoney(d.loyer);
        const chP = parseMoney(d.charges);
        if (!loyerP.ok || !chP.ok) throw new Error('Montants invalides');

        const { data: inserted, error: insErr } = await supabase
          .from('locataires')
          .insert({
            proprietaire_id: proprietaireId,
            nom: trim(d.nom) || trim(d.prenom) || '—',
            prenom: trim(d.prenom) || null,
            email: trim(d.email),
            telephone: null,
            adresse_logement: trim(d.adresse_logement),
            detail_adresse: null,
            loyer_mensuel: loyerP.n,
            charges_mensuelles: chP.n,
            caution_initiale: null,
            ...payload,
            periodicite: 'mensuel',
            statut: 'en_attente',
            actif: true,
          })
          .select('id')
          .single();

        if (insErr) throw insErr;
        if (!inserted?.id) {
          alert("Le locataire n'a pas pu être créé. Réessayez ou ajoutez un locataire depuis le tableau de bord.");
          return;
        }
      } else {
        for (const l of locataires) {
          const d = locDrafts[l.id];
          if (!d) continue;
          const loyerP = parseMoney(d.loyer);
          const chP = parseMoney(d.charges);
          if (!loyerP.ok || !chP.ok) throw new Error('Montants invalides');

          const { error: locErr } = await supabase
            .from('locataires')
            .update({
              nom: trim(d.nom) || trim(d.prenom) || '—',
              prenom: trim(d.prenom),
              email: trim(d.email),
              adresse_logement: trim(d.adresse_logement),
              loyer_mensuel: loyerP.n,
              charges_mensuelles: chP.n,
            })
            .eq('id', l.id);

          if (locErr) throw locErr;
        }

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl flex flex-col">
        <div className="border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-[#212a3e] pr-2">
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

        <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          <div className="rounded-xl border border-[#e2e8f0] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#0f172a]">Bailleur</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Prénom</label>
                <input
                  value={bailleurPrenom}
                  onChange={(e) => setBailleurPrenom(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                  placeholder="Optionnel"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">
                  Nom <span className="text-red-600">*</span>
                </label>
                <input
                  value={bailleurNom}
                  onChange={(e) => setBailleurNom(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                  placeholder="Nom de famille"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">
                Adresse <span className="text-red-600">*</span>
              </label>
              <textarea
                value={bailleurAdresse}
                onChange={(e) => setBailleurAdresse(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm text-[#0f172a] focus:ring-2 focus:ring-[#E65F3F]/20 focus:border-[#E65F3F]"
                placeholder="Adresse complète du bailleur"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">
                Téléphone {mode === 'rappel_classique' && <span className="text-red-600">*</span>}
              </label>
              <input
                type="tel"
                value={bailleurTel}
                onChange={(e) => setBailleurTel(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm text-[#0f172a] focus:ring-2 focus:ring-[#E65F3F]/20 focus:border-[#E65F3F]"
                placeholder={mode === 'rappel_classique' ? 'Requis pour les SMS de rappel' : 'Optionnel si autre mode'}
              />
              {mode === 'rappel_classique' && (
                <p className="text-[11px] text-[#64748b] mt-0.5">Indispensable pour le mode « validation en un clic ».</p>
              )}
            </div>
          </div>

          {locatairesFormRows.map((l) => {
            const d = locDrafts[l.id];
            if (!d) return null;
            return (
              <div key={l.id} className="rounded-xl border border-[#e2e8f0] p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#0f172a]">
                    {isSyntheticFirstLocataire(l.id) ? 'Premier locataire' : `Locataire — ${locataireLabel(l, d)}`}
                  </h3>
                  {isSyntheticFirstLocataire(l.id) && (
                    <p className="text-xs text-[#64748b] mt-1">
                      Aucun locataire enregistré : saisissez les informations du premier locataire (identité, logement,
                      loyer). Elles seront enregistrées avec la programmation du rappel.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">Prénom</label>
                    <input
                      value={d.prenom}
                      onChange={(e) => updateLocDraft(l.id, { prenom: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">Nom</label>
                    <input
                      value={d.nom}
                      onChange={(e) => updateLocDraft(l.id, { nom: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Adresse du logement</label>
                  <input
                    value={d.adresse_logement}
                    onChange={(e) => updateLocDraft(l.id, { adresse_logement: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">E-mail</label>
                  <input
                    type="email"
                    value={d.email}
                    onChange={(e) => updateLocDraft(l.id, { email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">Loyer mensuel (€)</label>
                    <input
                      inputMode="decimal"
                      value={d.loyer}
                      onChange={(e) => updateLocDraft(l.id, { loyer: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748b] mb-1">Charges mensuelles (€)</label>
                    <input
                      inputMode="decimal"
                      value={d.charges}
                      onChange={(e) => updateLocDraft(l.id, { charges: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {hideModeSelection ? (
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">Mode sélectionné</p>
              <p className="text-sm font-semibold text-[#0f172a] mt-1">
                {mode === 'systematic_preavis_5j'
                  ? '100 % automatique (préavis 5 jours)'
                  : 'Validation en un clic (SMS + e-mail)'}
              </p>
              <p className="text-xs text-[#64748b] mt-1">
                Pour changer de mode, fermez cette fenêtre et modifiez le choix sur le tableau de bord.
              </p>
            </div>
          ) : (
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
          )}

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

        <div className="border-t border-[#e2e8f0] px-6 py-4 rounded-b-2xl flex-shrink-0">
          <button
            type="button"
            onClick={handleActivate}
            disabled={saving || !validationOk}
            className="w-full py-3 px-6 rounded-xl bg-[#E65F3F] hover:bg-[#d95530] text-white font-semibold text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer et activer l\'automatisation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationConfigModal;
