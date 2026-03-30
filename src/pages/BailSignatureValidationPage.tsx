import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type SignerRole = 'locataire' | 'co-locataire' | 'garant';

type ValidationSigner = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: SignerRole;
};

type ValidationPayload = {
  id: string;
  sourcePath: '/bail' | '/bail-meuble';
  ownerName: string;
  documentUrl: string;
  summary: {
    title: string;
    noms: string;
    adresse: string;
    adresseBailleur?: string;
    loyer: string;
    charges: string;
    dateEffet: string;
    typeBail: string;
  };
  signers: ValidationSigner[];
};

const CONSENT_TEXT = `Je déclare avoir pris connaissance de l’intégralité de ce bail et en accepter pleinement les termes. Je reconnais que cette validation constitue une signature électronique ayant la même valeur juridique qu’une signature manuscrite, conformément aux articles 1366 et 1367 du Code civil.`;

function getPayload(id: string): ValidationPayload | null {
  try {
    const raw = localStorage.getItem(`bail_signature_validation_${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as ValidationPayload;
  } catch {
    return null;
  }
}

function getFallbackAdresse(payload: ValidationPayload | null): string | null {
  if (!payload?.id) return null;
  try {
    const key =
      payload.sourcePath === '/bail' ? `bail_vide_data_${payload.id}` : `bail_meuble_data_${payload.id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as { logement_adresse?: string };
    const addr = (data?.logement_adresse ?? '').trim();
    return addr || null;
  } catch {
    return null;
  }
}

function getFallbackAdresseBailleur(payload: ValidationPayload | null): string | null {
  if (!payload?.id) return null;
  try {
    const key =
      payload.sourcePath === '/bail' ? `bail_vide_data_${payload.id}` : `bail_meuble_data_${payload.id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as { bailleur_adresse?: string };
    const addr = (data?.bailleur_adresse ?? '').trim();
    return addr || null;
  } catch {
    return null;
  }
}

export default function BailSignatureValidationPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const payload = useMemo(() => getPayload(id), [id]);

  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signers, setSigners] = useState<ValidationSigner[]>(payload?.signers ?? []);

  if (!payload) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Demande introuvable. Reprenez le flux depuis le bail.
        </div>
      </div>
    );
  }

  const updateSigner = (signerId: string, patch: Partial<ValidationSigner>) => {
    setSigners((prev) => prev.map((s) => (s.id === signerId ? { ...s, ...patch } : s)));
  };

  const signerIssues = useMemo(() => {
    return signers.map((s) => ({
      id: s.id,
      missingName: !s.name.trim(),
      missingEmail: !s.email.trim(),
      missingPhone: !s.phone.trim(),
    }));
  }, [signers]);

  const canSend =
    consent &&
    signers.length > 0 &&
    signers.every((s) => s.name.trim() && s.email.trim() && s.phone.trim());

  const helperText = useMemo(() => {
    const missingConsent = !consent;
    const missingAnySigner = signerIssues.some((i) => i.missingName || i.missingEmail || i.missingPhone);
    if (!missingConsent && !missingAnySigner) return null;
    const parts: string[] = [];
    if (missingConsent) parts.push('cocher la déclaration');
    if (missingAnySigner) parts.push('renseigner nom, e-mail et téléphone pour chaque signataire');
    return `Pour envoyer : ${parts.join(' + ')}.`;
  }, [consent, signerIssues]);

  const handleSend = async () => {
    setError(null);
    if (!canSend) {
      setError('Veuillez compléter tous les signataires (nom, e-mail, téléphone) et valider la déclaration.');
      return;
    }
    try {
      setSending(true);
      const { data, error: fnError } = await supabase.functions.invoke('signatures-create', {
        body: {
          bail_id: payload.id,
          document_url: payload.documentUrl,
          owner_name: payload.ownerName,
          owner_consent: true,
          consent_version: 'v1_2026',
          signers: signers.map((s) => ({
            name: s.name.trim(),
            email: s.email.trim(),
            phone: s.phone.trim(),
            role: s.role,
          })),
        },
      });

      if (fnError) {
        let msg = fnError.message;
        if (fnError instanceof FunctionsHttpError && fnError.context) {
          try {
            const body = await fnError.context.json();
            if (typeof body?.error === 'string') msg = body.error;
          } catch (_) {}
        } else if (typeof data?.error === 'string') {
          msg = data.error;
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      // Vider le brouillon et le lien bail du WebMirror pour que le prochain passage soit vierge
      if (payload.sourcePath === '/bail') {
        localStorage.removeItem('bail_web_draft');
        localStorage.removeItem('bail_vide_signature_bail_id');
      } else {
        localStorage.removeItem('bail_meuble_draft');
        localStorage.removeItem('bail_meuble_signature_bail_id');
      }

      navigate(`/dashboard/baux/${payload.id}/signature`);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors de l’envoi');
    } finally {
      setSending(false);
    }
  };

  const handleModify = () => {
    navigate(payload.sourcePath);
  };

  const handleCancel = () => {
    localStorage.removeItem(`bail_signature_validation_${payload.id}`);
    navigate(payload.sourcePath);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">{payload.summary.title}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1e3a5f] mb-3">Résumé du bail</h2>
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-medium">Noms :</span> {payload.summary.noms || '-'}</p>
              <p>
                <span className="font-medium">Adresse du logement :</span>{' '}
                {payload.summary.adresse?.trim() || getFallbackAdresse(payload) || '-'}
              </p>
              <p>
                <span className="font-medium">Adresse du bailleur :</span>{' '}
                {payload.summary.adresseBailleur?.trim() || getFallbackAdresseBailleur(payload) || '-'}
              </p>
              <p><span className="font-medium">Loyer :</span> {payload.summary.loyer || '-'}</p>
              <p><span className="font-medium">Charges :</span> {payload.summary.charges || '-'}</p>
              <p><span className="font-medium">Date d’effet :</span> {payload.summary.dateEffet || '-'}</p>
              <p><span className="font-medium">Type de bail :</span> {payload.summary.typeBail || '-'}</p>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1e3a5f] mb-3">Signataires</h2>
            <div className="space-y-3">
              {signers.map((s) => {
                const issue = signerIssues.find((i) => i.id === s.id);
                const nameBad = !!issue?.missingName;
                const emailBad = !!issue?.missingEmail;
                const phoneBad = !!issue?.missingPhone;
                return (
                <div key={s.id} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <input
                    value={s.name}
                    onChange={(e) => updateSigner(s.id, { name: e.target.value })}
                    className={`rounded-md border px-3 py-2 text-sm ${nameBad ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Nom"
                  />
                  <input
                    value={s.email}
                    onChange={(e) => updateSigner(s.id, { email: e.target.value })}
                    className={`rounded-md border px-3 py-2 text-sm ${emailBad ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="E-mail"
                  />
                  <input
                    value={s.phone}
                    onChange={(e) => updateSigner(s.id, { phone: e.target.value })}
                    className={`rounded-md border px-3 py-2 text-sm ${phoneBad ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Téléphone"
                  />
                  <select
                    value={s.role}
                    onChange={(e) => updateSigner(s.id, { role: e.target.value as SignerRole })}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="locataire">Locataire</option>
                    <option value="co-locataire">Co-locataire</option>
                    <option value="garant">Garant</option>
                  </select>
                </div>
              )})}
            </div>
          </section>

          <label className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f] flex-shrink-0"
            />
            <span className="italic">{CONSENT_TEXT}</span>
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {helperText && !error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{helperText}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || sending}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Envoyer pour signature
            </button>
            <button
              type="button"
              onClick={handleModify}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Modifier le bail
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm min-h-[70vh]">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1e3a5f]">Prévisualisation PDF</h2>
            <a href={payload.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#1e3a5f]">
              <ExternalLink className="w-3 h-3" />
              Ouvrir
            </a>
          </div>
          <iframe title="Aperçu bail" src={payload.documentUrl} className="h-[65vh] w-full rounded-md border border-gray-200" />
        </div>
      </div>
    </div>
  );
}

