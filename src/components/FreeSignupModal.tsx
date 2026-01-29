import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateEmail } from '../utils/validation';

interface FreeSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillData?: {
    email?: string;
    nom?: string;
    locataireName?: string;
    locataireAddress?: string;
    loyer?: string;
    charges?: string;
  };
}

const FreeSignupModal: React.FC<FreeSignupModalProps> = ({ isOpen, onClose, prefillData }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: prefillData?.email || '',
    nom: prefillData?.nom || '',
    password: ''
  });

  React.useEffect(() => {
    if (isOpen && prefillData) {
      console.log('📋 Données reçues dans FreeSignupModal:', prefillData);
      setFormData({
        email: prefillData.email || '',
        nom: prefillData.nom || '',
        password: ''
      });
    }
  }, [isOpen, prefillData]);

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
        if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
          setError('Vous avez déjà un compte, connectez-vous');
        } else {
          setError(signUpError.message || 'Erreur lors de la création du compte');
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erreur lors de la création du compte');
        setIsLoading(false);
        return;
      }

      const nameParts = formData.nom.trim().split(' ');
      const prenom = nameParts.length > 1 ? nameParts[0] : '';
      const nom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : formData.nom;

      const { data: existingProp } = await supabase
        .from('proprietaires')
        .select('id, email, user_id')
        .eq('email', formData.email)
        .maybeSingle();

      let propData;

      if (existingProp) {
        console.log('✅ Propriétaire existant trouvé, mise à jour du profil...');
        const { data: updateData, error: updateError } = await supabase
          .from('proprietaires')
          .update({
            user_id: authData.user.id,
            nom: nom,
            prenom: prenom,
            plan_type: 'free',
            plan_actuel: 'Plan Gratuit',
            abonnement_actif: true,
            max_locataires: 1,
            max_quittances: 3,
            features_enabled: {
              auto_send: false,
              reminders: false,
              bank_sync: false
            }
          })
          .eq('email', formData.email)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Erreur mise à jour propriétaire:', updateError);
          setError('Erreur lors de la mise à jour du profil');
          setIsLoading(false);
          return;
        }
        propData = updateData;
      } else {
        console.log('✅ Création nouveau propriétaire...');
        const { data: insertData, error: insertError } = await supabase
          .from('proprietaires')
          .insert({
            user_id: authData.user.id,
            email: formData.email,
            nom: nom,
            prenom: prenom,
            adresse: '',
            plan_type: 'free',
            plan_actuel: 'Plan Gratuit',
            abonnement_actif: true,
            max_locataires: 1,
            max_quittances: 3,
            features_enabled: {
              auto_send: false,
              reminders: false,
              bank_sync: false
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Erreur création propriétaire:', insertError);
          setError('Erreur lors de la création du profil');
          setIsLoading(false);
          return;
        }
        propData = insertData;
      }

      if (!propData) {
        setError('Erreur lors de la création du profil');
        setIsLoading(false);
        return;
      }

      console.log('✅ Propriétaire créé/mis à jour:', propData);

      if (prefillData?.locataireName && prefillData?.locataireAddress && prefillData?.loyer) {
        const { error: locataireError } = await supabase
          .from('locataires')
          .insert({
            proprietaire_id: propData.id,
            nom: prefillData.locataireName,
            email: '',
            adresse_logement: prefillData.locataireAddress,
            loyer_mensuel: parseFloat(prefillData.loyer),
            charges_mensuelles: parseFloat(prefillData.charges || '0'),
            date_rappel: 1,
            heure_rappel: 9,
            minute_rappel: 0,
            periodicite: 'mensuel',
            statut: 'paye',
            actif: true
          });

        if (locataireError) {
          console.error('Erreur ajout locataire:', locataireError);
        }
      }

      localStorage.setItem('proprietaireEmail', formData.email);
      localStorage.setItem('userPlan', 'free');

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        console.log('📧 Tentative d\'envoi de l\'email de bienvenue à:', formData.email);

        const welcomeEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            nom: nameParts.length > 1 ? nameParts.slice(1).join(' ') : formData.nom,
            prenom: nameParts.length > 1 ? nameParts[0] : ''
          })
        });

        if (welcomeEmailResponse.ok) {
          const result = await welcomeEmailResponse.json();
          console.log('✅ Email de bienvenue envoyé:', result);
        } else {
          const error = await welcomeEmailResponse.text();
          console.error('❌ Erreur envoi email de bienvenue (HTTP', welcomeEmailResponse.status, '):', error);
        }
      } catch (emailError) {
        console.error('❌ Exception lors de l\'envoi de l\'email de bienvenue:', emailError);
      }

      setIsLoading(false);
      onClose();

      setTimeout(() => {
        navigate('/dashboard');
      }, 100);

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
            <div className="w-16 h-16 bg-[#7CAA89]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#7CAA89]" />
            </div>

            <h2 className="text-2xl font-bold text-[#2b2b2b] text-center mb-2">
              Quittance envoyée avec succès !
            </h2>
            <p className="text-[#545454] text-center mb-6">
              Souhaitez-vous enregistrer gratuitement votre locataire ?
            </p>

            <div className="bg-[#7CAA89]/10 border border-[#7CAA89]/20 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-[#2b2b2b] mb-2">Plan Gratuit inclus :</h3>
              <ul className="space-y-1 text-sm text-[#545454]">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-[#7CAA89] mr-2 flex-shrink-0" />
                  1 locataire enregistré
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-[#7CAA89] mr-2 flex-shrink-0" />
                  3 dernières quittances conservées
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-[#7CAA89] mr-2 flex-shrink-0" />
                  Génération gratuite de quittances PDF
                </li>
              </ul>
            </div>

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
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#415052] mb-2">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all"
                    placeholder="Jean Dupont"
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
                    className="w-full pl-11 pr-12 py-3 rounded-lg border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all"
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
                <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-4 rounded-xl bg-[#7CAA89] hover:bg-[#6b9378] text-white font-bold transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Création...' : 'Créer mon compte gratuit'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-4 rounded-xl border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold transition-all"
                >
                  Non merci
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-[#545454]">
                Déjà un compte ?{' '}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/automation');
                  }}
                  className="text-[#7CAA89] font-semibold hover:underline"
                >
                  Se connecter
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

export default FreeSignupModal;
