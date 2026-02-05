import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    handlePaymentSuccess();
  }, []);

  const handlePaymentSuccess = async () => {
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      setError('Session invalide. Veuillez contacter le support.');
      setLoading(false);
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('🚀 Calling checkout-success with session_id:', session_id);

      const response = await fetch(`${supabaseUrl}/functions/v1/checkout-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ session_id }),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        throw new Error(errorData.error || 'Erreur lors de la confirmation du paiement');
      }

      const data = await response.json();
      console.log('✅ Success data:', data);

      setCustomerEmail(data.email);
      setPlanName(data.plan);
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ Error processing payment:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        session_id
      });
      setError(err.message || 'Une erreur est survenue lors de la confirmation. Veuillez contacter le support.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (!customerEmail) {
      alert('Adresse email manquante. Veuillez rafraîchir la page.');
      return;
    }

    setResending(true);
    setResendSuccess(false);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('📧 Resending access link to:', customerEmail);

      const response = await fetch(`${supabaseUrl}/functions/v1/resend-access-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ email: customerEmail }),
      });

      console.log('📡 Resend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Resend API Error:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        throw new Error(errorData.error || 'Erreur lors de l\'envoi du lien');
      }

      console.log('✅ Access link resent successfully');
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      console.error('❌ Error resending link:', err);
      alert(`Erreur: ${err.message}\n\nVeuillez contacter le support à contact@quittancesimple.fr`);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <Loader2 className="w-16 h-16 text-[#7CAA89] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Paiement confirmé
          </h1>
          <p className="text-gray-600">
            Préparation de votre espace...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <Link
                to="/"
                className="block w-full px-6 py-3 bg-[#7CAA89] hover:bg-[#6a9d7f] text-white rounded-lg font-semibold transition-colors"
              >
                Retour à l'accueil
              </Link>
              <a
                href="mailto:contact@quittancesimple.fr"
                className="block w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Paiement confirmé
            </h1>
            <p className="text-lg text-gray-600">
              Bienvenue dans le <span className="font-semibold text-[#7CAA89]">{planName}</span>
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
            <div className="flex items-start">
              <Mail className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Un lien sécurisé vient de vous être envoyé par email
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Vérifiez votre boîte mail <span className="font-semibold">{customerEmail}</span> pour accéder à votre tableau de bord.
                </p>
                <p className="text-xs text-blue-700">
                  Pensez à vérifier vos spams si vous ne le trouvez pas.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-[#7CAA89] hover:bg-[#6a9d7f] text-white rounded-lg font-semibold transition-colors"
            >
              <span>Accéder au tableau de bord</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <button
              onClick={handleResendLink}
              disabled={resending}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi en cours...</span>
                </span>
              ) : (
                'Renvoyer le lien'
              )}
            </button>

            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm text-green-800 font-semibold">
                  Email envoyé avec succès. Vérifiez vos spams.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Le lien d'accès est sécurisé et valable pour une durée limitée.
              <br />
              Pour toute question, contactez-nous à{' '}
              <a href="mailto:contact@quittancesimple.fr" className="text-[#7CAA89] hover:underline">
                contact@quittancesimple.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccess;
