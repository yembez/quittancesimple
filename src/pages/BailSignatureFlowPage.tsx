import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type RequestAudit = {
  type: string;
  comment?: string;
  created_at?: string;
  signer_name?: string;
};

type SignatureRequest = {
  id: string;
  bail_id: string;
  status: 'pending' | 'signed' | 'expired' | 'correction_requested';
  created_at: string;
  completed_at: string | null;
  signers: Array<{ name: string; role: string; status: string; signed_at: string | null }>;
  audit?: RequestAudit[];
};

type ValidationPayload = {
  id: string;
  sourcePath: '/bail' | '/bail-meuble';
  ownerName: string;
};

function getPayload(id: string): ValidationPayload | null {
  try {
    const raw = localStorage.getItem(`bail_signature_validation_${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as ValidationPayload;
  } catch {
    return null;
  }
}

export default function BailSignatureFlowPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const payload = useMemo(() => getPayload(id), [id]);
  const [request, setRequest] = useState<SignatureRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('signature_requests')
        .select('*')
        .eq('bail_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (dbError || !data) throw new Error('Demande de signature introuvable.');
      setRequest(data as SignatureRequest);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6 flex items-center gap-2 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement du suivi de signature...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || 'Demande de signature introuvable.'}
        </div>
      </div>
    );
  }

  const modifications = (request.audit ?? []).filter((a) => a.type === 'modification_requested');
  const isCorrectionRequested = request.status === 'correction_requested';
  const isPending = request.status === 'pending';

  const handleCancelSignature = async () => {
    if (!window.confirm('Annuler cette demande de signature ? Les liens envoyés aux signataires ne seront plus valides.')) return;
    setCancelling(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('signatures-cancel', {
        body: { bail_id: id },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      await loadRequest();
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors de l’annulation');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">
          {payload?.ownerName || 'Bail'} — créé le {new Date(request.created_at).toLocaleString('fr-FR')}
        </p>
        <div className="mt-3">
          {isCorrectionRequested ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              <AlertCircle className="w-3 h-3" /> À corriger
            </span>
          ) : request.status === 'pending' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <Clock className="w-3 h-3" /> En attente de signature
            </span>
          ) : request.status === 'signed' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <CheckCircle2 className="w-3 h-3" /> Bail finalisé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <XCircle className="w-3 h-3" /> Demande annulée / expirée
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1e3a5f] mb-3">Signataires</h2>
        <div className="space-y-2">
          {request.signers.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {s.status === 'signed' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
              <span>
                {s.name} ({s.role}) — {s.status === 'signed' ? 'Signé' : 'À signer'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {modifications.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="text-sm font-semibold text-orange-800 mb-3">Demandes de modification locataire</h2>
          <div className="space-y-3">
            {modifications.map((m, idx) => (
              <div key={idx} className="rounded-lg border border-orange-200 bg-white p-3 text-sm">
                <p className="font-medium text-gray-800">{m.signer_name || 'Signataire'}</p>
                <p className="text-gray-600 mt-1">{m.comment || 'Aucun commentaire'}</p>
                <p className="text-xs text-gray-400 mt-1">{m.created_at ? new Date(m.created_at).toLocaleString('fr-FR') : ''}</p>
              </div>
            ))}
          </div>
          {isCorrectionRequested && (
            <button
              type="button"
              onClick={() => navigate(payload?.sourcePath ?? '/bail', { state: { correctionBailId: id } })}
              className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
            >
              Corriger et renvoyer le bail
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isPending && (
          <button
            type="button"
            onClick={handleCancelSignature}
            disabled={cancelling}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
          >
            {cancelling ? 'Annulation...' : 'Annuler cette signature'}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate(payload?.sourcePath ?? '/bail')}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Retour au bail
        </button>
      </div>
    </div>
  );
}
