import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import LoginModal from '../components/LoginModal';

type PageAction = 'send_manual' | 'cancel' | null;

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL || (typeof window !== 'undefined' && (window as unknown as { __ENV__?: { VITE_SUPABASE_URL?: string } }).__ENV__?.VITE_SUPABASE_URL);
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof window !== 'undefined' && (window as unknown as { __ENV__?: { VITE_SUPABASE_ANON_KEY?: string } }).__ENV__?.VITE_SUPABASE_ANON_KEY);
  return { supabaseUrl: url || '', anonKey: key || '' };
}

const SendQuittanceManual = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const actionParam = searchParams.get('action');
  const idParam = searchParams.get('id');

  const action: PageAction =
    actionParam === 'cancel' && idParam ? 'cancel' : token ? 'send_manual' : null;

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');
  const [locataireName, setLocataireName] = useState<string>('');
  const [periode, setPeriode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [loginHint, setLoginHint] = useState<string>('');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const prefilledLoginEmail = loginHint.trim() || undefined;

  useEffect(() => {
    if (action === null) {
      setStatus('error');
      setErrorMessage('Lien invalide : paramètres manquants.');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    const { supabaseUrl, anonKey } = getSupabaseConfig();
    if (!supabaseUrl || !anonKey) {
      setStatus('error');
      setErrorMessage('Configuration manquante. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY au build.');
      return;
    }

    const run = async () => {
      try {
        if (action === 'cancel' && idParam) {
          const res = await fetch(
            `${supabaseUrl}/functions/v1/quittances-systematic-action?action=cancel&id=${encodeURIComponent(idParam)}`,
            { method: 'GET', headers: { Authorization: `Bearer ${anonKey}` } }
          );
          if (cancelled) return;
          if (res.ok) {
            setCancelSuccess(true);
            setStatus('success');
          } else {
            const data = await res.json().catch(() => ({}));
            setStatus('error');
            setErrorMessage(data?.error || `Erreur ${res.status}`);
          }
          return;
        }

        if (action === 'send_manual' && token) {
          const res = await fetch(`${supabaseUrl}/functions/v1/quittances-systematic-action`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ action: 'send_manual', token }),
          });

          const data = await res.json().catch(() => ({}));

          if (cancelled) return;

          if (!res.ok) {
            setStatus('error');
            setErrorMessage(data?.error || `Erreur ${res.status}`);
            return;
          }

          if (data.success) {
            setLocataireName(data.locataireName || 'votre locataire');
            setPeriode(data.periode || '');
            const hint = typeof data.loginHint === 'string' ? data.loginHint.trim() : '';
            setLoginHint(hint);
            setStatus('success');
          } else {
            setStatus('error');
            setErrorMessage(data?.error || 'Une erreur est survenue.');
          }
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage((e as Error).message || 'Erreur réseau.');
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [action, token, idParam]);

  const confirmationBody =
    status === 'success' ? (
      <>
        <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />
        {cancelSuccess ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Envoi automatique annulé</h1>
            <p className="text-gray-700 mb-6">
              L'envoi automatique a été annulé. Un email de confirmation vous a été envoyé avec un lien pour envoyer la quittance en manuel quand vous le souhaitez.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Quittance envoyée</h1>
            <p className="text-gray-700 mb-6">
              Votre quittance a bien été envoyée à <strong>{locataireName}</strong>
              {periode ? ` pour la période ${periode}` : ''}. Une copie vous a été adressée.
            </p>
          </>
        )}
      </>
    ) : status === 'error' ? (
      <>
        <AlertCircle className="w-14 h-14 text-amber-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h1>
        <p className="text-gray-700 mb-6">{errorMessage}</p>
      </>
    ) : null;

  const confirmationActions =
    status === 'success' || status === 'error' ? (
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch">
        <button
          type="button"
          onClick={() => setLoginModalOpen(true)}
          className="inline-block px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-center"
        >
          Me connecter à mon espace
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="inline-block px-5 py-2.5 border border-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-50 transition text-center"
        >
          Fermer cette fenêtre
        </button>
      </div>
    ) : null;

  const fermerNote =
    status === 'success' || status === 'error' ? (
      <p className="text-xs text-gray-500 mt-3">
        Pour retrouver votre espace bailleur en étant connecté, utilisez « Me connecter à mon espace ». Vous pouvez aussi
        fermer cet onglet.
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6" data-page="send-quittance-manual">
      {(status === 'loading' || status === 'idle') && (
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-4">Quittance Simple</h1>
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">
            {action === 'cancel' ? 'Annulation en cours…' : 'Envoi de la quittance en cours…'}
          </p>
        </div>
      )}

      {(status === 'success' || status === 'error') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-gray-200 p-8 text-center max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="send-quittance-manual-title"
          >
            <div id="send-quittance-manual-title">{confirmationBody}</div>
            {confirmationActions}
            {fermerNote}
          </div>
        </div>
      )}

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        mode="login"
        initialEmail={prefilledLoginEmail}
      />
    </div>
  );
};

export default SendQuittanceManual;
