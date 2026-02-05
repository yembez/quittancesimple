import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight, Mail, Lock, Smartphone, AlertCircle } from 'lucide-react';
import SEOHead from '../components/SEOHead';

const QuickPaymentConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const emailParam = searchParams.get('email');

      if (!sessionId) {
        setError('Session invalide');
        setIsProcessing(false);
        return;
      }

      if (emailParam) {
        setEmail(emailParam);
      }

      try {
        console.log('🚀 Calling checkout-success with session_id:', sessionId);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout-success`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          }
        );

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (!response.ok) {
          console.error('❌ API Error Response:', data);
          setError(data.error || 'Une erreur est survenue');
          setIsProcessing(false);
          return;
        }

        // Rediriger vers la page de création de mot de passe
        if (data.redirect_url) {
          console.log('🔄 Redirecting to:', data.redirect_url);
          window.location.href = data.redirect_url;
          return;
        }

        // Fallback si pas de redirect_url
        if (data.email) {
          console.log('🔄 Fallback redirect to set-password');
          window.location.href = `/set-password?email=${encodeURIComponent(data.email)}`;
          return;
        }

        // Si vraiment aucune info, afficher le succès normal
        setPaymentSuccess(true);
        if (data.email) {
          setEmail(data.email);
        }

        setIsProcessing(false);
      } catch (err: any) {
        console.error('❌ Error processing payment:', err);
        console.log('Error details:', { message: err.message, stack: err.stack, session_id: sessionId });
        setError(err.message || 'Une erreur est survenue');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams]);

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email introuvable');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-access-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend email');
      }

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error resending email:', err);
      setError(err.message || 'Erreur lors du renvoi de l\'email');
    } finally {
      setIsResending(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fefdf9] to-[#f9fafb] flex items-center justify-center p-4">
        <SEOHead
          title="Confirmation en cours | Quittance Simple"
          description="Traitement de votre paiement en cours"
        />
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#ed7862] animate-spin mx-auto mb-4" />
          <p className="text-lg text-[#545454]">Traitement en cours...</p>
        </div>
      </div>
    );
  }

  // Écran d'erreur (uniquement si vraiment une erreur critique)
  if (error && !paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fefdf9] to-[#f9fafb] flex items-center justify-center p-4">
        <SEOHead
          title="Erreur | Quittance Simple"
          description="Une erreur est survenue"
        />
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1f20] mb-4">Une erreur est survenue</h1>
          <p className="text-[#545454] mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3 rounded-full bg-[#ed7862] hover:bg-[#e56651] text-white font-bold transition-all"
            >
              Retour aux tarifs
            </button>
            <p className="text-sm text-[#545454]">
              Besoin d'aide ? <a href="mailto:contact@quittance-simple.fr" className="text-[#ed7862] hover:underline">Contactez-nous</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Écran de succès (même si erreur backend, le paiement a réussi)
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefdf9] to-[#f9fafb] flex items-center justify-center p-4">
      <SEOHead
        title="Paiement réussi ! | Quittance Simple"
        description="Votre compte a été créé avec succès"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header Success */}
        <div className="bg-gradient-to-br from-[#7CAA89] to-[#5d9270] p-8 text-center relative overflow-hidden">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <CheckCircle className="w-12 h-12 text-[#7CAA89]" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Paiement réussi !</h1>
          <p className="text-white/90 text-lg">Votre abonnement est activé</p>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Avertissement si erreur backend mais paiement OK */}
          {error && paymentSuccess && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-[#1a1f20] text-sm mb-1">
                    Votre paiement a bien été effectué
                  </h3>
                  <p className="text-xs text-[#545454]">
                    Nous finalisons la configuration de votre compte. Vous recevrez un email de confirmation sous peu.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#fefdf9] border-2 border-[#ed7862]/20 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-[#1a1f20] mb-4 flex items-center">
              <Mail className="w-5 h-5 text-[#ed7862] mr-2" />
              Consultez votre email
            </h2>
            <p className="text-[#545454] mb-3 leading-relaxed">
              {email ? (
                <>Nous venons de vous envoyer un email à <strong className="text-[#1a1f20]">{email}</strong> avec :</>
              ) : (
                <>Vous allez recevoir un email avec :</>
              )}
            </p>
            <ul className="space-y-2 text-[#545454]">
              <li className="flex items-start">
                <span className="text-[#7CAA89] mr-2">✓</span>
                <span>Votre lien de connexion magique</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#7CAA89] mr-2">✓</span>
                <span>L'accès direct à votre tableau de bord</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#7CAA89] mr-2">✓</span>
                <span>Les détails de votre abonnement</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-5 mb-6">
            <h3 className="font-bold text-[#1a1f20] mb-2 flex items-center">
              <Lock className="w-4 h-4 text-blue-500 mr-2" />
              Connexion sécurisée
            </h3>
            <p className="text-sm text-[#545454] leading-relaxed">
              Utilisez le lien magique dans votre email pour vous connecter en toute sécurité. Aucun mot de passe à retenir !
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="font-bold text-[#1a1f20] flex items-center">
              <Smartphone className="w-5 h-5 text-[#ed7862] mr-2" />
              Prochaines étapes
            </h3>
            <ol className="space-y-3 text-sm text-[#545454]">
              <li className="flex items-start">
                <span className="bg-[#ed7862] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">1</span>
                <span>Vérifiez votre boîte mail (et les spams si besoin)</span>
              </li>
              <li className="flex items-start">
                <span className="bg-[#ed7862] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">2</span>
                <span>Cliquez sur le lien magique pour vous connecter</span>
              </li>
              <li className="flex items-start">
                <span className="bg-[#ed7862] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">3</span>
                <span>Ajoutez vos locataires et configurez vos rappels</span>
              </li>
              <li className="flex items-start">
                <span className="bg-[#ed7862] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">4</span>
                <span>Générez votre première quittance automatiquement</span>
              </li>
            </ol>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goToDashboard}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#ed7862] to-[#e56651] hover:from-[#e56651] hover:to-[#d85540] text-white font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Accéder à mon tableau de bord
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {email && (
            <div className="mt-4 text-center">
              <p className="text-sm text-[#545454] mb-3">
                Vous n'avez pas reçu l'email ?
              </p>
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="text-[#ed7862] hover:text-[#e56651] font-semibold text-sm underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Renvoyer l'email de connexion
                  </>
                )}
              </button>
              {resendSuccess && (
                <p className="mt-2 text-sm text-[#7CAA89] font-semibold">
                  ✓ Email renvoyé avec succès !
                </p>
              )}
            </div>
          )}

          <p className="text-center text-xs text-[#545454] mt-4">
            Besoin d'aide ? Contactez-nous à <a href="mailto:contact@quittance-simple.fr" className="text-[#ed7862] hover:underline">contact@quittance-simple.fr</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickPaymentConfirm;
