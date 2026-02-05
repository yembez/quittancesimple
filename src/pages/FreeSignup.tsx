import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateEmail } from '../utils/validation';
import SEOHead from '../components/SEOHead';

interface LocationState {
  email?: string;
  nom?: string;
  locataireName?: string;
  locataireAddress?: string;
  loyer?: string;
  charges?: string;
}

const FreeSignup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillData = (location.state as LocationState) || {};

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: prefillData?.email || '',
    nom: prefillData?.nom || '',
    password: ''
  });

  useEffect(() => {
    if (prefillData) {
      console.log('📋 Données reçues dans FreeSignup:', prefillData);
      setFormData({
        email: prefillData.email || '',
        nom: prefillData.nom || '',
        password: ''
      });
    }
  }, [prefillData]);

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
            lead_statut: 'free_account',
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
            lead_statut: 'free_account',
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

      setTimeout(() => {
        navigate('/dashboard');
      }, 100);

    } catch (error) {
      console.error('Erreur:', error);
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7CAA89]/5 via-white to-[#ed7862]/5">
      <SEOHead
        title="Créer un compte gratuit | Quittance Simple"
        description="Créez votre compte gratuit et commencez à gérer vos quittances de loyer facilement. 1 locataire et 3 quittances conservées gratuitement."
        canonical="https://quittance-simple.fr/inscription"
      />

      <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-35 max-[480px]:py-4 max-[480px]:pt-20">
        <div className="max-w-sm w-full">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center text-[#545454] hover:text-[#7CAA89] transition-colors max-[480px]:mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2 max-[480px]:w-3.5 max-[480px]:h-3.5" />
            <span className="max-[480px]:text-sm">Retour</span>
          </button>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-[480px]:rounded-xl">
            <div className="p-6 max-[480px]:p-4">
              <div className="w-12 h-12 bg-[#7CAA89]/10 rounded-xl flex items-center justify-center mx-auto mb-5 max-[480px]:hidden">
                <CheckCircle className="w-6 h-6 text-[#7CAA89]" />
              </div>

              <h1 className="text-2xl font-bold text-[#2b2b2b] text-center mb-2 max-[480px]:text-xl max-[480px]:mb-1.5">
                Quittance envoyée avec succès !
              </h1>
             
              <div className="bg-[#7CAA89]/10 border border-[#7CAA89]/20 rounded-lg p-4 mb-6 max-[480px]:p-3 max-[480px]:mb-4">
                <h3 className="text-sm font-semibold text-[#2b2b2b] mb-2 max-[480px]:text-xs max-[480px]:mb-1.5">Plan Gratuit inclus :</h3>
                <ul className="space-y-1.5 text-sm text-[#545454] max-[480px]:space-y-1 max-[480px]:text-xs">
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-[#7CAA89] mr-2 flex-shrink-0 max-[480px]:w-3 max-[480px]:h-3" />
                    1 locataire enregistré
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-[#7CAA89] mr-2 flex-shrink-0 max-[480px]:w-3 max-[480px]:h-3" />
                    3 dernières quittances conservées
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-[#7CAA89] mr-2 flex-shrink-0 max-[480px]:w-3 max-[480px]:h-3" />
                    Génération gratuite de quittances PDF
                  </li>
                </ul>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start max-[480px]:mb-3 max-[480px]:p-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0 max-[480px]:w-3.5 max-[480px]:h-3.5" />
                  <p className="text-sm text-red-800 max-[480px]:text-xs">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 max-[480px]:space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#415052] mb-1.5 max-[480px]:text-[11px] max-[480px]:mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 max-[480px]:w-3.5 max-[480px]:h-3.5 max-[480px]:left-2" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all max-[480px]:pl-8 max-[480px]:py-2 max-[480px]:text-xs"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#415052] mb-1.5 max-[480px]:text-[11px] max-[480px]:mb-1">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 max-[480px]:w-3.5 max-[480px]:h-3.5 max-[480px]:left-2" />
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all max-[480px]:pl-8 max-[480px]:py-2 max-[480px]:text-xs"
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#415052] mb-1.5 max-[480px]:text-[11px] max-[480px]:mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 max-[480px]:w-3.5 max-[480px]:h-3.5 max-[480px]:left-2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all max-[480px]:pl-8 max-[480px]:py-2 max-[480px]:text-xs"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors max-[480px]:right-2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 max-[480px]:w-3.5 max-[480px]:h-3.5" /> : <Eye className="w-4 h-4 max-[480px]:w-3.5 max-[480px]:h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 max-[480px]:text-[10px] max-[480px]:mt-0.5">Minimum 6 caractères</p>
                </div>

                <div className="flex flex-row gap-2.5 pt-2 max-[480px]:gap-2 max-[480px]:pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 text-sm rounded-lg bg-[#7CAA89] hover:bg-[#6b9378] text-white font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 max-[480px]:py-2.5 max-[480px]:text-[11px] max-[480px]:leading-tight"
                  >
                    {isLoading ? 'Création...' : 'Créer compte gratuit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 py-3 text-sm rounded-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold transition-all max-[480px]:py-2.5 max-[480px]:text-[11px] max-[480px]:leading-tight"
                  >
                    Non merci
                  </button>
                </div>
              </form>

              <button
                onClick={() => navigate('/pricing')}
                className="hidden max-[480px]:flex w-full mt-3 py-2.5 text-[11px] rounded-lg bg-[#ed7862] hover:bg-[#e56651] text-white font-bold transition-all shadow-md items-center justify-center"
              >
                Voir l'offre automatisation
              </button>

              <div className="mt-5 pt-5 border-t border-gray-200 text-center max-[480px]:mt-3 max-[480px]:pt-3">
                <p className="text-sm text-[#545454] max-[480px]:text-xs">
                  Déjà un compte ?{' '}
                  <button
                    onClick={() => navigate('/automation')}
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
    </div>
  );
};

export default FreeSignup;
