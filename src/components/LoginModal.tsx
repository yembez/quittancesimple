import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateEmail } from '../utils/validation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'signup';
  onModeChange?: (mode: 'login' | 'signup') => void;
  selectedPlan?: 'auto' | 'plus';
  billingCycle?: 'monthly' | 'yearly';
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, mode = 'login', onModeChange, selectedPlan = 'auto', billingCycle = 'monthly' }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        setError(emailValidation.error || 'Email invalide');
        setIsLoading(false);
        return;
      }

      if (mode === 'signup') {
        if (!acceptTerms) {
          setError('Vous devez accepter les CGU et la politique de confidentialité');
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          setIsLoading(false);
          return;
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        });

        if (signUpError) {
          setError(signUpError.message || 'Erreur lors de la création du compte');
          setIsLoading(false);
          return;
        }

        if (!authData.user) {
          setError('Erreur lors de la création du compte');
          setIsLoading(false);
          return;
        }

        const planName = selectedPlan === 'plus' ? 'Quittance Connectée+' : 'Pack Automatique';

        const { error: propError } = await supabase
          .from('proprietaires')
          .upsert({
            user_id: authData.user.id,
            email: formData.email,
            nom: '',
            prenom: '',
            adresse: '',
            telephone: '',
            nombre_locataires: 0,
            abonnement_actif: false,
            plan_actuel: planName,
            lead_statut: 'QA_1st_interested',
            source: 'website'
          }, {
            onConflict: 'email',
            ignoreDuplicates: false
          });

        if (propError) {
          console.error('Erreur création propriétaire:', propError);
          setError('Erreur lors de la création du compte');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('proprietaireEmail', formData.email);
        localStorage.setItem('selectedPlan', selectedPlan);
        localStorage.setItem('billingCycle', billingCycle);

        setIsLoading(false);
        onClose();

        navigate('/dashboard');
      } else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (signInError) {
          setError('Email ou mot de passe incorrect');
          setIsLoading(false);
          return;
        }

        const { data: propData, error: propError } = await supabase
          .from('proprietaires')
          .select('*')
          .eq('email', formData.email)
          .maybeSingle();

        if (propError) {
          console.error('Erreur récupération propriétaire:', propError);
          setError('Erreur lors de la récupération du compte');
          setIsLoading(false);
          return;
        }

        if (!propData) {
          setError('Aucun compte propriétaire trouvé. Veuillez vous inscrire.');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('proprietaireEmail', formData.email);
        localStorage.setItem('userPlan', propData.plan_actuel || 'auto');

        setIsLoading(false);
        onClose();

        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            <div className="w-16 h-16 bg-[#2D3436]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-[#2D3436]" />
            </div>

            <h2 className="text-2xl font-bold text-[#415052] text-center mb-2">
              {mode === 'signup' ? 'Créer un compte' : 'Connexion'}
            </h2>
            <p className="text-[#415052] text-center mb-6">
              {mode === 'signup' ? 'Commencez votre abonnement' : 'Accédez à votre tableau de bord'}
            </p>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#415052] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#415052] mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-11 pr-12 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                )}
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#415052] mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 text-[#2D3436] border-gray-300 rounded focus:ring-[#2D3436] cursor-pointer"
                        required
                      />
                      <span className="ml-3 text-sm text-gray-600 leading-relaxed">
                        J'accepte les{' '}
                        <Link to="/terms" className="text-[#2D3436] hover:underline font-semibold" target="_blank">
                          Conditions Générales d'Utilisation
                        </Link>
                        {' '}et la{' '}
                        <Link to="/privacy" className="text-[#2D3436] hover:underline font-semibold" target="_blank">
                          Politique de confidentialité
                        </Link>
                        . Je comprends que mes données seront traitées conformément au RGPD.
                      </span>
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full bg-[#2D3436] hover:bg-[#6a9d7f] text-white font-bold transition-all disabled:opacity-50"
              >
                {isLoading ? (mode === 'signup' ? 'Création...' : 'Connexion...') : (mode === 'signup' ? 'Créer mon compte' : 'Se connecter')}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-[#415052]">
                {mode === 'signup' ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
                <button
                  onClick={() => {
                    setError('');
                    if (onModeChange) {
                      onModeChange(mode === 'signup' ? 'login' : 'signup');
                    }
                  }}
                  className="text-[#2D3436] font-semibold hover:underline"
                >
                  {mode === 'signup' ? 'Se connecter' : "S'inscrire"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default LoginModal;
