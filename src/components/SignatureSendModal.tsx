import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Send, Stamp, X } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type SignerRole = 'locataire' | 'co-locataire' | 'garant';

interface SignerForm {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: SignerRole;
}

interface SignatureSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  bailId: string;
  documentUrl: string;
  ownerName?: string;
  initialSigners?: Array<Partial<SignerForm>>;
}

const CONSENT_TEXT = `Je déclare avoir pris connaissance de l’intégralité de ce bail et en accepter pleinement les termes. Je reconnais que cette validation constitue une signature électronique ayant la même valeur juridique qu’une signature manuscrite, conformément aux articles 1366 et 1367 du Code civil.`;

export default function SignatureSendModal({
  isOpen,
  onClose,
  bailId,
  documentUrl,
  ownerName,
  initialSigners = [],
}: SignatureSendModalProps) {
  const [sending, setSending] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [signers, setSigners] = useState<SignerForm[]>(() => {
    const seeded = initialSigners.slice(0, 3).map((s, idx) => ({
      id: crypto.randomUUID(),
      name: s.name ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      role: (s.role as SignerRole) ?? (idx === 0 ? 'locataire' : 'co-locataire'),
    }));
    if (seeded.length > 0) return seeded;
    return [{ id: crypto.randomUUID(), name: '', email: '', phone: '', role: 'locataire' }];
  });

  const canAddSigner = signers.length < 3;
  const hasValidSigners = useMemo(
    () =>
      signers.length >= 1 &&
      signers.every(
        (s) =>
          s.name.trim().length > 0 &&
          s.phone.trim().length > 0 &&
          s.email.trim().length > 0
      ),
    [signers]
  );

  if (!isOpen) return null;

  const updateSigner = (id: string, patch: Partial<SignerForm>) => {
    setSigners((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addSigner = () => {
    if (!canAddSigner) return;
    setSigners((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', email: '', phone: '', role: 'garant' },
    ]);
  };

  const removeSigner = (id: string) => {
    setSigners((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
  };

  const handleSend = async () => {
    setError(null);
    setSuccess(null);

    if (!consentChecked) {
      setError('Vous devez confirmer le consentement de signature.');
      return;
    }
    if (!hasValidSigners) {
      setError('Chaque signataire doit avoir un nom, un e-mail et un téléphone.');
      return;
    }

    try {
      setSending(true);
      const payload = {
        bail_id: bailId,
        document_url: documentUrl,
        owner_name: ownerName ?? '',
        owner_consent: true,
        consent_version: 'v1_2026',
        signers: signers.map((s) => ({
          name: s.name.trim(),
          email: s.email.trim(),
          phone: s.phone.trim(),
          role: s.role,
        })),
      };

      const { data, error: fnError } = await supabase.functions.invoke('signatures-create', {
        body: payload,
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
      setSuccess('Demande de signature créée. Les signataires ont été notifiés.');
    } catch (e: any) {
      const errMsg = e?.message ?? "Erreur lors de l'envoi pour signature";
      setError(errMsg);
      console.error("[SignatureSendModal] signatures-create error:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Envoyer pour signature électronique</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <label className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 cursor-pointer font-serif leading-relaxed tracking-wide">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f] flex-shrink-0"
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-amber-700">
                <Stamp className="w-4 h-4" /> validation signature
              </div>
              <span className="font-serif italic text-sm leading-relaxed tracking-wide text-gray-900">{CONSENT_TEXT}</span>
            </div>
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1e3a5f]">Signataires (max 3)</h3>
              <button
                type="button"
                disabled={!canAddSigner}
                onClick={addSigner}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-50"
              >
                + Ajouter
              </button>
            </div>

            {signers.map((signer, index) => (
              <div key={signer.id} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-5">
                <input
                  value={signer.name}
                  onChange={(e) => updateSigner(signer.id, { name: e.target.value })}
                  placeholder="Nom complet"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm md:col-span-2"
                />
                <input
                  value={signer.email}
                  onChange={(e) => updateSigner(signer.id, { email: e.target.value })}
                  placeholder="Email"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={signer.phone}
                  onChange={(e) => updateSigner(signer.id, { phone: e.target.value })}
                  placeholder="Téléphone (SMS OTP)"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={signer.role}
                    onChange={(e) => updateSigner(signer.id, { role: e.target.value as SignerRole })}
                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
                  >
                    <option value="locataire">Locataire</option>
                    <option value="co-locataire">Co-locataire</option>
                    <option value="garant">Garant</option>
                  </select>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeSigner(signer.id)}
                      className="rounded border border-red-200 px-2 py-2 text-xs text-red-700"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !consentChecked}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{sending ? 'Envoi...' : 'Envoyer pour signature'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
