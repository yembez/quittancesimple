import React, { useState } from 'react';
import { X, Check, CreditCard, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'auto' | 'bank';
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, plan }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'account' | 'payment' | 'confirmation'>('account');
  const [numberOfTenants, setNumberOfTenants] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const planDetails = {
    auto: {
      name: 'Mode Tranquillité',
      color: '#ed7862',
      features: [
        'Rappels SMS + e-mail',
        'Génération automatique',
        'Envoi en 1 clic',
        'Historique illimité'
      ]
    },
    bank: {
      name: 'Quittance Connectée+',
      color: '#2D3436',
      features: [
        'Synchronisation bancaire PSD2',
        'Détection automatique paiement',
        '100% automatisé',
        'Suivi encaissements temps réel'
      ]
    }
  };

  const calculatePrice = (tenants: number) => {
    if (tenants >= 1 && tenants <= 2) {
      return 0.99;
    } else if (tenants >= 3 && tenants <= 4) {
      return 1.49;
    } else if (tenants >= 5 && tenants <= 8) {
      return 2.49;
    } else {
      return 2.49;
    }
  };

  const currentPlan = planDetails[plan];
  const monthlyTotal = calculatePrice(numberOfTenants);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const newErrors: string[] = [];

    if (!formData.fullName.trim()) newErrors.push('Le nom complet est requis');
    if (!formData.email.trim()) newErrors.push('L\'email est requis');
    if (!formData.password) newErrors.push('Le mot de passe est requis');
    if (formData.password.length < 6) newErrors.push('Le mot de passe doit contenir au moins 6 caractères');
    if (formData.password !== formData.confirmPassword) newErrors.push('Les mots de passe ne correspondent pas');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from('proprietaires')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUser) {
        setErrors(['Un compte existe déjà avec cet email. Veuillez vous connecter.']);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            plan: plan,
            number_of_tenants: numberOfTenants
          },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      });

      if (error) {
        console.error('Erreur signup:', error);
        if (error.message.includes('already registered')) {
          setErrors(['Un compte existe déjà avec cet email. Veuillez vous connecter.']);
        } else {
          setErrors([error.message || 'Erreur lors de la création du compte']);
        }
        setIsLoading(false);
        return;
      }

      setStep('payment');
    } catch (error) {
      console.error('Erreur création compte:', error);
      setErrors(['Une erreur est survenue. Veuillez réessayer.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const nameParts = formData.fullName.trim().split(' ');
      const prenom = nameParts[0] || '';
      const nom = nameParts.slice(1).join(' ') || nameParts[0];

      const { error: insertError } = await supabase
        .from('proprietaires')
        .upsert({
          email: formData.email,
          nom: nom,
          prenom: prenom,
          adresse: '',
          abonnement_actif: true,
          plan_actuel: plan === 'auto' ? 'Mode Tranquillité' : 'Quittance Connectée+',
          date_inscription: new Date().toISOString()
        }, { onConflict: 'email' });

      if (insertError) {
        console.error('Erreur création propriétaire:', insertError);
      }

      setStep('confirmation');
    } catch (error) {
      setErrors(['Erreur lors du paiement. Veuillez réessayer.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    localStorage.setItem('proprietaireEmail', formData.email);
    localStorage.setItem('userPlan', plan);
    localStorage.setItem('numberOfTenants', numberOfTenants.toString());

    onClose();

    // Plan Connectée+ (bank) -> Configuration complète avec locataires puis synchro bancaire
    // Plan Automatique (auto) -> Configuration locataires classique
    if (plan === 'bank') {
      navigate('/automation-plus-setup');
    } else {
      navigate('/automation-setup');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {step === 'account' && (
            <div className="p-8">
              <div className="mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${currentPlan.color}20` }}
                >
                  <Check className="w-8 h-8" style={{ color: currentPlan.color }} />
                </div>
                <h2 className="text-2xl font-bold text-[#415052] text-center mb-2">
                  {currentPlan.name}
                </h2>
                <p className="text-[#415052] text-center">
                  Créez votre compte pour commencer
                </p>
              </div>

              {errors.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-red-800 text-sm flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="jean.dupont@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-2">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-full font-bold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: currentPlan.color }}
                >
                  {isLoading ? 'Création...' : 'Continuer vers le paiement'}
                </button>
              </form>
            </div>
          )}

          {step === 'payment' && (
            <div className="p-8">
              <div className="mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${currentPlan.color}20` }}
                >
                  <CreditCard className="w-8 h-8" style={{ color: currentPlan.color }} />
                </div>
                <h2 className="text-2xl font-bold text-[#415052] text-center mb-2">
                  Informations de paiement
                </h2>
                <p className="text-[#415052] text-center text-sm">
                  Sans engagement
                </p>
              </div>

              <div className="bg-[#fefdf9] rounded-xl p-6 mb-6">
                <h3 className="font-bold text-[#415052] mb-4">Résumé de votre abonnement</h3>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-[#415052]">
                    <span>Plan sélectionné</span>
                    <span className="font-semibold">{currentPlan.name}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#415052] mb-2">
                      Nombre de logements
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={numberOfTenants}
                      onChange={(e) => setNumberOfTenants(parseInt(e.target.value))}
                      className="w-full"
                      style={{ accentColor: currentPlan.color }}
                    />
                    <div className="flex justify-between text-sm text-[#415052] mt-1">
                      <span>1</span>
                      <span className="font-bold">{numberOfTenants}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#415052] font-semibold">Total mensuel</span>
                    <span className="text-2xl font-bold" style={{ color: currentPlan.color }}>
                      {monthlyTotal.toFixed(2)}€/mois
                    </span>
                  </div>
                  <p className="text-xs text-[#415052] mt-2">
                    {monthlyTotal.toFixed(2)}€/mois
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-semibold text-[#415052]">Paiement sécurisé via Stripe</span>
                </div>
                <p className="text-xs text-[#415052] ml-8">
                  Vos informations bancaires sont cryptées et sécurisées.
                  Nous ne stockons aucune donnée de carte bancaire.
                </p>
              </div>

              <button
                onClick={handlePaymentSubmit}
                disabled={isLoading}
                className="w-full py-4 rounded-full font-bold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: currentPlan.color }}
              >
                {isLoading ? 'Traitement...' : 'Confirmer et souscrire'}
              </button>

              <p className="text-xs text-center text-[#415052] mt-4">
                En confirmant, vous acceptez nos conditions d'utilisation
              </p>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="p-8 text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${currentPlan.color}20` }}
              >
                <Check className="w-10 h-10" style={{ color: currentPlan.color }} />
              </div>

              <h2 className="text-2xl font-bold text-[#415052] mb-3">
                ✅ Votre abonnement est actif !
              </h2>

              <p className="text-[#415052] mb-6">
                {plan === 'bank'
                  ? 'Votre abonnement est activé. Configurez votre synchronisation bancaire pour automatiser vos quittances.'
                  : 'Votre abonnement est activé. Configurez vos locataires pour commencer à automatiser vos quittances.'}
              </p>

              <div className="bg-[#fefdf9] rounded-xl p-6 mb-6 text-left">
                <h3 className="font-bold text-[#415052] mb-3">Ce qui vous attend :</h3>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-[#415052]">
                      <Check className="w-4 h-4 mr-2" style={{ color: currentPlan.color }} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleGoToDashboard}
                className="w-full py-4 rounded-full font-bold text-white transition-all"
                style={{ backgroundColor: currentPlan.color }}
              >
                {plan === 'bank'
                  ? 'Configurer ma synchronisation bancaire'
                  : 'Configurer mes quittances automatiques'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
