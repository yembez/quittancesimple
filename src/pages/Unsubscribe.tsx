import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const emailFromUrl = (searchParams.get('email') || '').trim();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [formEmail, setFormEmail] = useState('');

  useEffect(() => {
    if (!emailFromUrl) return;

    const run = async () => {
      setStatus('loading');
      try {
        const { data, error } = await supabase.functions.invoke('unsubscribe', {
          body: { email: emailFromUrl },
        });

        if (error) throw error;
        if (data?.success) {
          setStatus('success');
          setMessage(data.message || 'Vous êtes bien désabonné des communications Quittance Simple.');
        } else {
          setStatus('error');
          setMessage(data?.error || 'Une erreur est survenue.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
      }
    };

    run();
  }, [emailFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formEmail.trim();
    if (!email || !email.includes('@')) {
      setMessage('Veuillez entrer une adresse e-mail valide.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('unsubscribe', {
        body: { email },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus('success');
        setMessage(data.message || 'Vous êtes bien désabonné.');
        setFormEmail('');
      } else {
        setStatus('error');
        setMessage(data?.error || 'Une erreur est survenue.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9fc] flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-[#e8e7ef] p-8">
          <h1 className="text-xl font-bold text-[#1e3a5f] mb-6 text-center">
            Désabonnement des communications
          </h1>

          {status === 'loading' && (
            <p className="text-[#6b7280] text-center">Enregistrement en cours…</p>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-[#1e3a5f] font-medium">{message}</p>
              <p className="text-sm text-[#6b7280] mt-2">
                Vous ne recevrez plus nos e-mails de communication (hors e-mails strictement liés à votre compte et à vos quittances).
              </p>
              <Link
                to="/"
                className="inline-block mt-6 text-[#2563eb] font-medium hover:underline"
              >
                Retour à l'accueil
              </Link>
            </div>
          )}

          {status === 'error' && message && (
            <p className="text-red-600 text-center text-sm mb-4">{message}</p>
          )}

          {(!emailFromUrl || status === 'error') && status !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-[#6b7280]">
                Saisissez l'adresse e-mail à désabonner :
              </p>
              <div className="flex gap-2">
                <span className="flex items-center px-3 rounded-lg border border-[#e8e7ef] bg-[#f7f5fa] text-[#6b7280]">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={formEmail || emailFromUrl}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#e8e7ef] focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#2563eb] text-white font-medium hover:bg-[#1d4ed8] transition-colors"
              >
                Me désabonner
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
