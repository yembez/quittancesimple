import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight, Mail, Lock, Smartphone } from 'lucide-react';
import SEOHead from '../components/SEOHead';

const QuickPaymentConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

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

      setIsProcessing(false);
    };

    processPayment();
  }, [searchParams]);

  const goToDashboard = () => {
    navigate('/dashboard');
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

  if (error) {
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
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-3 rounded-full bg-[#ed7862] hover:bg-[#e56651] text-white font-bold transition-all"
          >
            Retour aux tarifs
          </button>
        </div>
      </div>
    );
  }

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
          <p className="text-white/90 text-lg">Votre compte est activé</p>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="bg-[#fefdf9] border-2 border-[#ed7862]/20 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-[#1a1f20] mb-4 flex items-center">
              <Mail className="w-5 h-5 text-[#ed7862] mr-2" />
              Consultez votre email
            </h2>
            <p className="text-[#545454] mb-3 leading-relaxed">
              Nous venons de vous envoyer un email à <strong className="text-[#1a1f20]">{email || 'votre adresse'}</strong> avec :
            </p>
            <ul className="space-y-2 text-[#545454]">
              <li className="flex items-start">
                <span className="text-[#7CAA89] mr-2">✓</span>
                <span>Vos identifiants de connexion</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#7CAA89] mr-2">✓</span>
                <span>Votre mot de passe temporaire</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#7CAA89] mr-2">✓</span>
                <span>Le lien vers votre tableau de bord</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-5 mb-6">
            <h3 className="font-bold text-[#1a1f20] mb-2 flex items-center">
              <Lock className="w-4 h-4 text-blue-500 mr-2" />
              Mot de passe temporaire
            </h3>
            <p className="text-sm text-[#545454] leading-relaxed">
              Pour votre sécurité, nous avons généré un mot de passe automatique. Vous pourrez le modifier depuis votre tableau de bord après connexion.
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
                <span>Connectez-vous avec vos identifiants</span>
              </li>
              <li className="flex items-start">
                <span className="bg-[#ed7862] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">3</span>
                <span>Ajoutez vos locataires et configurez vos rappels</span>
              </li>
              <li className="flex items-start">
                <span className="bg-[#ed7862] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">4</span>
                <span>Générez votre première quittance en 1 clic</span>
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

          <p className="text-center text-xs text-[#545454] mt-4">
            Besoin d'aide ? Contactez-nous à <a href="mailto:contact@quittance-simple.fr" className="text-[#ed7862] hover:underline">contact@quittance-simple.fr</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickPaymentConfirm;
