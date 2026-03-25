import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateEmail } from '../utils/validation';

export interface PrefillProprietaire {
  nom?: string;
  prenom?: string;
  adresse?: string;
  telephone?: string;
}

export interface PrefillLocataire {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse_logement?: string;
  loyer_mensuel?: number;
  charges_mensuelles?: number;
}

interface PackActivationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  prefillEmail?: string;
  prefillProprietaire?: PrefillProprietaire;
  prefillLocataire?: PrefillLocataire;
}

const PackActivationFlow: React.FC<PackActivationFlowProps> = ({
  isOpen,
  onClose,
  prefillEmail = '',
  prefillProprietaire,
  prefillLocataire
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: prefillEmail,
    password: '',
    confirmPassword: ''
  });

  const [proprietaireData, setProprietaireData] = useState({
    nom: prefillProprietaire?.nom ?? '',
    prenom: prefillProprietaire?.prenom ?? '',
    adresse: prefillProprietaire?.adresse ?? '',
    telephone: prefillProprietaire?.telephone ?? ''
  });

  const [locataireData, setLocataireData] = useState({
    nom: prefillLocataire?.nom ?? '',
    prenom: prefillLocataire?.prenom ?? '',
    email: prefillLocataire?.email ?? '',
    telephone: prefillLocataire?.telephone ?? '',
    adresse_logement: prefillLocataire?.adresse_logement ?? '',
    loyer_mensuel: prefillLocataire?.loyer_mensuel ?? '',
    charges_mensuelles: prefillLocataire?.charges_mensuelles ?? ''
  });

  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    if (isOpen && prefillEmail) {
      setFormData(prev => ({ ...prev, email: prefillEmail }));
    }
  }, [isOpen, prefillEmail]);

  useEffect(() => {
    if (isOpen && prefillProprietaire) {
      setProprietaireData(prev => ({
        nom: prefillProprietaire.nom ?? prev.nom,
        prenom: prefillProprietaire.prenom ?? prev.prenom,
        adresse: prefillProprietaire.adresse ?? prev.adresse,
        telephone: prefillProprietaire.telephone ?? prev.telephone
      }));
    }
  }, [isOpen, prefillProprietaire]);

  useEffect(() => {
    if (isOpen && prefillLocataire) {
      setLocataireData(prev => ({
        nom: prefillLocataire.nom ?? prev.nom,
        prenom: prefillLocataire.prenom ?? prev.prenom,
        email: prefillLocataire.email ?? prev.email,
        telephone: prefillLocataire.telephone ?? prev.telephone,
        adresse_logement: prefillLocataire.adresse_logement ?? prev.adresse_logement,
        loyer_mensuel: prefillLocataire.loyer_mensuel ?? prev.loyer_mensuel,
        charges_mensuelles: prefillLocataire.charges_mensuelles ?? prev.charges_mensuelles
      }));
    }
  }, [isOpen, prefillLocataire]);

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

      // Créer le compte Supabase Auth
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

      // Calculer la date de fin d'essai (30 jours)
      const dateFinEssai = new Date();
      dateFinEssai.setDate(dateFinEssai.getDate() + 30);

      const hasLocataire = locataireData.nom.trim() && locataireData.adresse_logement.trim();

      // Créer le propriétaire avec essai gratuit de 30 jours + infos remplies
      const proprietairePayload: any = {
        user_id: authData.user.id,
        email: formData.email,
        nom: (proprietaireData.nom || '').trim(),
        prenom: (proprietaireData.prenom || '').trim(),
        adresse: (proprietaireData.adresse || '').trim(),
        telephone: (proprietaireData.telephone || '').trim(),
        nombre_locataires: hasLocataire ? 1 : 0,
        abonnement_actif: true, // Actif pendant l'essai
        plan_actuel: 'Pack Automatique',
        plan_type: 'auto',
        date_inscription: new Date().toISOString(),
        lead_statut: 'QA_1st_interested',
        source: 'website'
      };

      // Ajouter date_fin_essai si la colonne existe
      try {
        proprietairePayload.date_fin_essai = dateFinEssai.toISOString();
      } catch (e) {
        // Colonne non disponible, on continue sans
      }

      const { data: propData, error: propError } = await supabase
        .from('proprietaires')
        .upsert(proprietairePayload, {
          onConflict: 'email',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (propError) {
        // Si l'erreur concerne date_fin_essai, réessayer sans cette colonne
        if (propError.message && propError.message.includes('date_fin_essai')) {
          delete proprietairePayload.date_fin_essai;
          
          const { data: retryData, error: retryError } = await supabase
            .from('proprietaires')
            .upsert(proprietairePayload, {
              onConflict: 'email',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (retryError) {
            console.error('Erreur création propriétaire:', retryError);
            setError('Erreur lors de la création du profil');
            setIsLoading(false);
            return;
          }
          const dataToUse = retryData;
          if (dataToUse && hasLocataire) {
            const loyer = typeof locataireData.loyer_mensuel === 'number' ? locataireData.loyer_mensuel : parseFloat(String(locataireData.loyer_mensuel)) || 0;
            const charges = typeof locataireData.charges_mensuelles === 'number' ? locataireData.charges_mensuelles : parseFloat(String(locataireData.charges_mensuelles)) || 0;
            const { error: locError } = await supabase.from('locataires').insert({
              proprietaire_id: dataToUse.id,
              nom: locataireData.nom.trim(),
              prenom: (locataireData.prenom || '').trim() || null,
              email: (locataireData.email || '').trim() || null,
              telephone: (locataireData.telephone || '').trim() || null,
              adresse_logement: locataireData.adresse_logement.trim(),
              loyer_mensuel: loyer,
              charges_mensuelles: charges
            });
            if (locError) console.warn('Création locataire reportée:', locError.message);
          }
          localStorage.setItem('proprietaireEmail', formData.email);
          setIsLoading(false);
          onClose();
          navigate('/dashboard');
          return;
        }

        console.error('Erreur création propriétaire:', propError);
        setError('Erreur lors de la création du profil');
        setIsLoading(false);
        return;
      }

      if (propData && hasLocataire) {
        const loyer = typeof locataireData.loyer_mensuel === 'number' ? locataireData.loyer_mensuel : parseFloat(String(locataireData.loyer_mensuel)) || 0;
        const charges = typeof locataireData.charges_mensuelles === 'number' ? locataireData.charges_mensuelles : parseFloat(String(locataireData.charges_mensuelles)) || 0;
        const { error: locError } = await supabase.from('locataires').insert({
          proprietaire_id: propData.id,
          nom: locataireData.nom.trim(),
          prenom: (locataireData.prenom || '').trim() || null,
          email: (locataireData.email || '').trim() || null,
          telephone: (locataireData.telephone || '').trim() || null,
          adresse_logement: locataireData.adresse_logement.trim(),
          loyer_mensuel: loyer,
          charges_mensuelles: charges
        });
        if (locError) console.warn('Création locataire reportée (possible depuis l’espace après connexion):', locError.message);
      }

      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email,
            nom: (proprietaireData.nom || '').trim() || undefined,
            prenom: (proprietaireData.prenom || '').trim() || undefined,
          },
        });
      } catch (e) {
        console.warn('Envoi email de bienvenue (non bloquant):', e);
      }

      // Marquer le mot de passe comme défini pour ce propriétaire
      try {
        await supabase
          .from('proprietaires')
          .update({ password_set: true })
          .eq('email', formData.email);
      } catch (e) {
        console.warn('⚠️ Impossible de mettre à jour password_set pour', formData.email, e);
      }

      localStorage.setItem('proprietaireEmail', formData.email);
      setIsLoading(false);
      onClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur:', error);
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Vérifier que document.body existe avant de créer le portal
  if (typeof document === 'undefined' || !document.body) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-start sm:items-center justify-center min-h-full px-3 pt-3 pb-3 sm:p-0 sm:pb-20">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div
          className="relative z-10 w-full bg-white rounded-2xl sm:rounded-3xl text-left overflow-hidden shadow-2xl sm:my-8 sm:max-w-md sm:w-full max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col"
        >
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 min-h-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex-1 pr-2">
                <h2 className="text-xl sm:text-2xl font-bold text-[#212a3e] leading-tight">
                  Accès à votre Espace Bailleur gratuit
                </h2>
                <p className="text-sm sm:text-base font-semibold text-[#212a3e]/90 mt-1">
                  Pack Automatique gratuit*
                </p>
                <p className="text-xs sm:text-sm text-[#5e6478] mt-1">
                Mot de passe + e-mail et c'est tout !
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-[#5e6478] hover:text-[#212a3e] transition-colors p-1.5 sm:p-2 hover:bg-[#f7f5fa] rounded-xl flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badge essai gratuit */}
           

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form id="pack-activation-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#212a3e] mb-1.5 sm:mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#5e6478]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border border-[#e8e7ef] focus:border-[#E65F3F] focus:ring-2 focus:ring-[#E65F3F]/20 transition-all bg-white"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#212a3e] mb-1.5 sm:mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#5e6478]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border border-[#e8e7ef] focus:border-[#E65F3F] focus:ring-2 focus:ring-[#E65F3F]/20 transition-all bg-white"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#5e6478] hover:text-[#212a3e] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                <p className="text-xs text-[#5e6478] mt-1 sm:mt-1.5">Minimum 6 caractères</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#212a3e] mb-1.5 sm:mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#5e6478]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border border-[#e8e7ef] focus:border-[#E65F3F] focus:ring-2 focus:ring-[#E65F3F]/20 transition-all bg-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#f7f5fa] border border-[#e8e7ef] rounded-xl p-3 sm:p-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 sm:mt-1 w-4 h-4 text-[#E65F3F] border-[#e8e7ef] rounded focus:ring-[#E65F3F] cursor-pointer flex-shrink-0"
                    required
                  />
                  <span className="ml-2 sm:ml-3 text-xs text-[#5e6478] leading-relaxed">
                    J'accepte les{' '}
                    <Link to="/terms" className="text-[#E65F3F] hover:underline font-semibold" target="_blank">
                      CGU
                    </Link>
                    {' '}et la{' '}
                    <Link to="/privacy" className="text-[#E65F3F] hover:underline font-semibold" target="_blank">
                      Politique de confidentialité
                    </Link>
                  </span>
                </label>
              </div>
            </form>
          </div>
          
          {/* CTA fixe en bas sur mobile */}
          <div className="border-t border-[#e8e7ef] bg-white p-4 sm:p-8 sm:border-t-0 sm:pt-0 sticky bottom-0 sm:static">
            <button
              type="submit"
              form="pack-activation-form"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 rounded-xl bg-[#E65F3F] hover:bg-[#d95530] text-white font-semibold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? 'Création...' : 'Mon espace gratuit'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="mt-2 text-center text-[10px] sm:text-[11px] text-[#5e6478]/60">
              *pendant 30 jours, sans aucun engagement
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const portalRoot = typeof document !== 'undefined' ? document.body : null;
  if (!portalRoot) return null;
  
  return createPortal(modalContent, portalRoot);
};

export default PackActivationFlow;
