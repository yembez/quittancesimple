import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, ShieldCheck, Stamp, ExternalLink } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Signer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'locataire' | 'co-locataire' | 'garant';
  status: 'pending' | 'signed';
  otp_attempts: number;
  signed_at: string | null;
};

type RequestData = {
  id: string;
  document_url: string;
  status: 'pending' | 'signed' | 'expired';
  signers: Signer[];
  token_expires_at: string;
  owner_signature?: {
    owner_name?: string;
  };
};

const CONSENT_TEXT = `Je déclare avoir pris connaissance de l’intégralité de ce bail et en accepter pleinement les termes. Je reconnais que cette validation constitue une signature électronique ayant la même valeur juridique qu’une signature manuscrite, conformément aux articles 1366 et 1367 du Code civil.`;

const extractSurname = (fullName?: string) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(' ').filter(Boolean);
  return parts[parts.length - 1];
};

export default function SignatureSignPage() {
  const { token = '' } = useParams();
  const [params] = useSearchParams();
  const signerIdFromUrl = params.get('signerId') ?? '';

  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState('');
  const [selectedSignerId, setSelectedSignerId] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [signing, setSigning] = useState(false);
  const [requestingModification, setRequestingModification] = useState(false);
  const [modificationComment, setModificationComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  /** Signer pour lequel un code OTP a déjà été envoyé (affiche "Renvoyer le code" et message persistant) */
  const [otpSentForSignerId, setOtpSentForSignerId] = useState<string | null>(null);

  const selectedSigner = useMemo(
    () => (request?.signers ?? []).find((s) => s.id === selectedSignerId) ?? null,
    [request, selectedSignerId]
  );

  const bailTitle = useMemo(() => {
    const ownerSurname = extractSurname(request?.owner_signature?.owner_name);
    const signerSurnames = (request?.signers ?? [])
      .map((s) => extractSurname(s.name))
      .filter((name) => name && name !== ownerSurname);
    const allNames = [ownerSurname, ...signerSurnames].filter(Boolean);
    return allNames.length ? `Signature électronique du bail ${allNames.join(' - ')}` : 'Signature électronique du bail';
  }, [request]);

  const loadRequest = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signatures-get?token=${encodeURIComponent(token)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );
      const payload = await res.json();
      if (!res.ok || !payload || payload.error) throw new Error(payload?.error || 'Demande introuvable');
      setRequest(payload as RequestData);

      const signers = payload.signers ?? [];
      const nextSigner =
        signers.find((s: Signer) => s.id === signerIdFromUrl) ||
        signers.find((s: Signer) => s.status === 'pending') ||
        signers[0];
      setSelectedSignerId(nextSigner?.id ?? '');
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSendOtp = async () => {
    if (!token || !selectedSignerId) return;
    setSendingOtp(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('signatures-send-otp', {
        body: { token, signer_id: selectedSignerId },
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
      setSuccess('Code SMS envoyé.');
      setOtpSentForSignerId(selectedSignerId);
    } catch (e: any) {
      setError(e?.message || 'Impossible d’envoyer le code OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSign = async () => {
    if (!token || !selectedSignerId || !otp.trim()) return;
    if (!consent) {
      setError('Le consentement est obligatoire pour signer.');
      return;
    }
    setSigning(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('signatures-sign', {
        body: {
          token,
          signer_id: selectedSignerId,
          otp: otp.trim(),
          consent: true,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setSuccess(data?.all_signed ? 'Signature enregistrée. Document final en génération.' : 'Signature enregistrée.');
      setOtp('');
      setOtpSentForSignerId(null);
      await loadRequest();
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  const handleRequestModification = async () => {
    if (!token || !selectedSignerId) return;
    if (!modificationComment.trim()) {
      setError('Veuillez préciser la modification demandée.');
      return;
    }
    setRequestingModification(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('signatures-request-modification', {
        body: {
          token,
          signer_id: selectedSignerId,
          comment: modificationComment.trim(),
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
      setSuccess('Demande de modification envoyée au bailleur.');
      setModificationComment('');
    } catch (e: any) {
      setError(e?.message || 'Impossible d’envoyer la demande de modification');
    } finally {
      setRequestingModification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#1e3a5f]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement de la demande...</span>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Lien de signature invalide</p>
          <p className="mt-1 text-sm">{error}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-[#1e3a5f] underline">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-[#1e3a5f]">
            <ShieldCheck className="h-5 w-5" />
            <h1 className="text-lg font-semibold">{bailTitle}</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Validation par SMS OTP, maximum 3 tentatives, lien valable 30 jours.
          </p>
          <p className="mt-1 text-xs text-gray-500">Expiration: {new Date(request?.token_expires_at || '').toLocaleString('fr-FR')}</p>
          {request?.document_url && (
            <a
              href={request.document_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-[#1e3a5f] bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] transition hover:bg-[#1e3a5f] hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
              Voir / télécharger le bail
            </a>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Signataire</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={selectedSignerId}
              onChange={(e) => setSelectedSignerId(e.target.value)}
            >
              {request?.signers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role}) - {s.status === 'signed' ? 'signé' : 'à signer'}
                </option>
              ))}
            </select>
            {selectedSigner && (
              <p className="mt-2 text-xs text-gray-500">
                Téléphone: {selectedSigner.phone} • Tentatives OTP: {selectedSigner.otp_attempts}/3
              </p>
            )}
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 cursor-pointer font-serif leading-relaxed tracking-wide">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f] flex-shrink-0"
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-amber-700">
                <Stamp className="w-4 h-4" /> validation signature
              </div>
              <span className="font-serif italic text-sm leading-relaxed tracking-wide text-gray-900">{CONSENT_TEXT}</span>
            </div>
          </label>

          <p className="mt-3 text-sm text-gray-600">
            {otpSentForSignerId === selectedSignerId
              ? 'Reportez le code reçu par SMS dans le champ « Code OTP » ci-dessous pour finaliser la signature.'
              : 'Cliquez sur « Recevoir code SMS » et reportez le code reçu dans le champ « Code OTP » pour finaliser la signature.'}
          </p>

          {otpSentForSignerId === selectedSignerId && selectedSigner?.status === 'pending' && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2 text-green-800 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>Code SMS envoyé. S’il ne vous est pas parvenu ou en cas d’expiration, cliquez sur « Renvoyer le code ».</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || !selectedSignerId}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              {sendingOtp ? 'Envoi...' : otpSentForSignerId === selectedSignerId ? 'Renvoyer le code' : 'Recevoir code SMS'}
            </button>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Code OTP"
              className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSign}
              disabled={signing || !consent || !otp.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{signing ? 'Signature...' : 'Confirmer la signature'}</span>
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 p-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Besoin d’une correction ?</p>
            <textarea
              value={modificationComment}
              onChange={(e) => setModificationComment(e.target.value)}
              placeholder="Décrivez la modification demandée..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleRequestModification}
              disabled={requestingModification || !selectedSignerId || !modificationComment.trim()}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              {requestingModification ? 'Envoi...' : 'Demander une modification'}
            </button>
          </div>

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2 text-green-800 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
