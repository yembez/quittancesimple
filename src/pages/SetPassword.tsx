import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const SetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const isExpiredLink = searchParams.get('expired') === '1';
  const [isRecovery, setIsRecovery] = useState(() => {
    if (searchParams.get('type') === 'recovery') return true;
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.toLowerCase();
      if (h.includes('access_token') || h.includes('type=recovery')) return true;
    }
    return false;
  });

  useEffect(() => {
    if (searchParams.get('type') === 'recovery') {
      setIsRecovery(true);
      return;
    }
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.toLowerCase();
      if (h.includes('access_token') || h.includes('type=recovery')) setIsRecovery(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isRecovery) return;
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    } else {
      setError('Email manquant. Veuillez réessayer.');
    }
  }, [searchParams, isRecovery]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
    return null;
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      if (isRecovery) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
          if (updateError.message?.toLowerCase().includes('session') || updateError.message?.toLowerCase().includes('expired')) {
            setError('Le lien a expiré. Veuillez demander un nouveau lien de réinitialisation depuis la page de connexion.');
          } else {
            setError(updateError.message || 'Erreur lors de la mise à jour du mot de passe.');
          }
          setLoading(false);
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email ?? '';
        await supabase.auth.signOut();
        navigate('/', { state: { openLogin: true, prefilledEmail: userEmail }, replace: true });
        return;
      }

      if (!email) {
        setError('Email manquant');
        setLoading(false);
        return;
      }

      console.log('🔐 Creating account for:', email);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: 'https://www.quittancesimple.fr/dashboard',
        }
      });

      if (signUpError) {
        console.error('❌ SignUp error:', signUpError);
        throw signUpError;
      }

      console.log('✅ Account created:', signUpData);

      const { error: updateError } = await supabase
        .from('proprietaires')
        .update({ password_set: true })
        .eq('email', email);

      if (updateError) {
        console.error('❌ Error updating password_set:', updateError);
      }

      console.log('🔑 Auto sign-in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        console.error('❌ SignIn error:', signInError);
        throw new Error('Compte créé mais connexion échouée. Veuillez vous connecter manuellement.');
      }

      console.log('✅ Signed in:', signInData);
      alert('✅ Compte créé avec succès ! Vous allez être redirigé vers votre tableau de bord.');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ Error setting password:', err);
      let errorMessage = err.message || 'Erreur lors de la création du compte';
      if (err.message?.includes('User already registered')) {
        errorMessage = 'Ce compte existe déjà. Veuillez vous connecter avec votre mot de passe existant.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Permettre de passer cette étape (l'utilisateur pourra créer son mot de passe plus tard)
    alert('⚠️ Vous pourrez créer votre mot de passe plus tard depuis les paramètres de votre compte.');
    navigate('/dashboard');
  };

  if (isExpiredLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fefdf9] to-[#f9fafb] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-[#1a1f20] mb-2">Lien expiré</h1>
            <p className="text-sm text-[#545454]">
              Ce lien de réinitialisation n’est plus valable. Les liens sont valables environ 1 heure. Demandez un nouveau lien pour réinitialiser votre mot de passe.
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 bg-[#7CAA89] hover:bg-[#6a9d7f] text-white rounded-lg font-semibold transition-colors"
            >
              Retour à l’accueil
            </button>
            <p className="text-xs text-center text-[#64748b]">
              Cliquez sur <strong>Connexion</strong>, puis sur <strong>« Mot de passe oublié ? »</strong> pour recevoir un nouveau lien par email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefdf9] to-[#f9fafb] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7CAA89] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1f20] mb-2">
            {isRecovery ? 'Définir un nouveau mot de passe' : 'Sécurisez votre compte'}
          </h1>
          <p className="text-sm text-[#545454]">
            {isRecovery
              ? 'Choisissez un nouveau mot de passe pour vous connecter à votre compte.'
              : 'Créez un mot de passe pour accéder à votre compte'}
          </p>
          {email && !isRecovery && (
            <p className="text-xs text-gray-500 mt-2">
              {email}
            </p>
          )}
        </div>

        <form onSubmit={handleSetPassword} className="space-y-6">
          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89] focus:border-transparent"
                placeholder="Minimum 6 caractères"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7CAA89] focus:border-transparent"
              placeholder="Confirmer le mot de passe"
              required
            />
          </div>

          {/* Critères de sécurité */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-sm">
              <CheckCircle className={`w-4 h-4 mr-2 ${password.length >= 6 ? 'text-green-600' : 'text-gray-300'}`} />
              <span className={password.length >= 6 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                Au moins 6 caractères
              </span>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#7CAA89] hover:bg-[#6a9d7f] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isRecovery ? 'Enregistrement...' : 'Création du compte...') : (isRecovery ? 'Enregistrer le mot de passe' : 'Créer mon mot de passe')}
          </button>

          {/* Passer cette étape
          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Passer cette étape (je le ferai plus tard)
          </button> */}
        </form>

        {!isRecovery && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            En créant un compte, vous acceptez nos{' '}
            <a href="/legal" className="text-[#7CAA89] hover:underline">
              conditions d'utilisation
            </a>
          </p>
        </div>
        )}
      </div>
    </div>
  );
};

export default SetPassword;
