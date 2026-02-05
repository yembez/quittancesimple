import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown, ArrowLeft, FileText, Zap, Users, CheckCircle, Download, User, HomeIcon, Euro, Calendar, Eye, Star, Shield, Clock, Calculator } from 'lucide-react';
import QuittancePreview from '../components/QuittancePreview';
import { sendQuittanceByEmail } from '../utils/emailService';
import SEOHead from '../components/SEOHead';
import { AlertModal } from '../components/AlertModal';
import Header from '../components/Header';
import MobileMultiStepForm from '../components/MobileMultiStepForm';
import { useEmailCapture } from '../hooks/useEmailCapture';
import { trackQuittanceGenerated, trackPdfDownload, trackCtaClick } from '../utils/analytics';
import { supabase } from '../lib/supabase';

const Generator = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Générateur de Quittance de Loyer Gratuit",
    "description": "Créez vos quittances de loyer conformes gratuitement en 30 secondes",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    }
  };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const getCurrentPeriod = () => {
    const now = new Date();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const periode = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    console.log('📅 getCurrentPeriod:', periode, 'Index mois:', now.getMonth());
    return periode;
  };

  const [formData, setFormData] = React.useState(() => {
    const now = new Date();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const currentPeriode = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    console.log('🔄 Initialisation formData avec période:', currentPeriode);

    return {
      baillorName: '',
      baillorAddress: '',
      baillorEmail: '',
      locataireName: '',
      logementAddress: '',
      locataireDomicileAddress: '',
      hasDifferentDomicile: false,
      loyer: '',
      charges: '',
      periode: currentPeriode,
      isProrata: false,
      dateDebut: '',
      dateFin: '',
      typeCalcul: ''
    };
  });

  const [isElectronicSignatureChecked, setIsElectronicSignatureChecked] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [prorataAmounts, setProrataAmounts] = React.useState({ loyer: 0, charges: 0, total: 0 });
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string[]>([]);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Email capture hook
  const { handleEmailChange: captureEmail, markComplete } = useEmailCapture({
    pageSource: 'generator',
    formType: 'quittance_generation'
  });

  // Debounce timer for auto-capture
  const captureTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-capture proprietaire data to database
  const autoCaptureProprietaireData = React.useCallback(async (data: typeof formData) => {
    // Only capture if we have at least email (required for upsert)
    if (!data.baillorEmail || !data.baillorEmail.includes('@')) {
      return;
    }

    try {
      const deviceType = isMobile ? 'mobile' : 'desktop';

      const proprietaireData: any = {
        email: data.baillorEmail.trim(),
        source: 'website',
        lead_statut: 'form_started',
        device_type: deviceType,
        device_detected_at: new Date().toISOString()
      };

      // Parse name if available
      if (data.baillorName && data.baillorName.trim()) {
        const nameParts = data.baillorName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          proprietaireData.prenom = nameParts[0];
          proprietaireData.nom = nameParts.slice(1).join(' ');
        } else {
          proprietaireData.nom = data.baillorName.trim();
        }
      }

      // Add address if available
      if (data.baillorAddress && data.baillorAddress.trim()) {
        proprietaireData.adresse = data.baillorAddress.trim();
      }

      // Upsert to database (will update existing or create new)
      await supabase.from('proprietaires').upsert(proprietaireData, {
        onConflict: 'email',
        ignoreDuplicates: false
      });

      console.log('✅ Auto-captured proprietaire data (Generator):', {
        email: proprietaireData.email,
        hasName: !!proprietaireData.nom,
        hasAddress: !!proprietaireData.adresse,
        device: deviceType
      });
    } catch (error) {
      console.error('❌ Error auto-capturing proprietaire data:', error);
    }
  }, [isMobile]);

  // Handle blur events to capture data when user leaves field
  const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;

    // Capture immediately on blur for important fields
    if (name === 'baillorEmail' || name === 'baillorName' || name === 'baillorAddress') {
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
      }
      autoCaptureProprietaireData(formData);
    }
  }, [formData, autoCaptureProprietaireData]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      // Cleanup debounce timer
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
      }
    };
  }, []);

  // Récupérer les données du prorata si on vient de cette page
  React.useEffect(() => {
    if (searchParams.get('from') === 'prorata') {
      const prorataData = localStorage.getItem('prorataData');
      if (prorataData) {
        const data = JSON.parse(prorataData);
        
        // Mise à jour directe de chaque champ
        setFormData(prev => {
          const newFormData = {
            ...prev,
            loyer: data.loyer,
            charges: data.charges,
            periode: data.periode,
            isProrata: data.isProrata || false,
            dateDebut: data.dateDebut || '',
            dateFin: data.dateFin || '',
            typeCalcul: data.typeCalcul || ''
          };
          return newFormData;
        });
        
        setShowPreview(true);
        // Nettoyer le localStorage
        localStorage.removeItem('prorataData');
        // Scroll vers le générateur
        setTimeout(() => {
          document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [searchParams]);

  const calculateProrata = React.useCallback(() => {
    if (!formData.isProrata || !formData.dateDebut || !formData.dateFin || !formData.loyer) {
      setProrataAmounts({ loyer: 0, charges: 0, total: 0 });
      return;
    }

    const dateDebut = new Date(formData.dateDebut);
    const dateFin = new Date(formData.dateFin);
    
    if (dateDebut >= dateFin) {
      setProrataAmounts({ loyer: 0, charges: 0, total: 0 });
      return;
    }

    // Calculer le nombre de jours dans le mois
    const mois = dateDebut.getMonth();
    const annee = dateDebut.getFullYear();
    const joursTotal = new Date(annee, mois + 1, 0).getDate();
    
    // Calculer le nombre de jours de présence
    const joursPresence = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
    
    // Calculer les montants prorata
    const loyerMensuel = parseFloat(formData.loyer) || 0;
    const chargesMensuelles = parseFloat(formData.charges) || 0;
    
    const loyerProrata = (loyerMensuel * joursPresence) / joursTotal;
    const chargesProrata = (chargesMensuelles * joursPresence) / joursTotal;
    const totalProrata = loyerProrata + chargesProrata;
    
    setProrataAmounts({
      loyer: loyerProrata,
      charges: chargesProrata,
      total: totalProrata
    });
  }, [formData.isProrata, formData.dateDebut, formData.dateFin, formData.loyer, formData.charges]);

  const hasContent = () => {
    return formData.baillorName || formData.locataireName || formData.loyer || formData.charges;
  };

  const hasAnyContent = () => {
    return Object.values(formData).some(value => value && value.toString().trim().length > 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Validation des dates pour le prorata
    if (name === 'dateDebut' || name === 'dateFin') {
      const updatedFormData = { ...formData, [name]: value };

      // Si on modifie la date de début et qu'il y a déjà une date de fin
      if (name === 'dateDebut' && updatedFormData.dateFin) {
        const dateDebut = new Date(value);
        const dateFin = new Date(updatedFormData.dateFin);
        if (dateDebut >= dateFin) {
          // Réinitialiser la date de fin si elle devient antérieure ou égale à la date de début
          updatedFormData.dateFin = '';
        }
      }

      // Si on modifie la date de fin, vérifier qu'elle soit postérieure à la date de début
      if (name === 'dateFin' && updatedFormData.dateDebut) {
        const dateDebut = new Date(updatedFormData.dateDebut);
        const dateFin = new Date(value);
        if (dateFin <= dateDebut) {
          // Ne pas mettre à jour si la date de fin n'est pas postérieure
          return;
        }
      }

      setFormData(updatedFormData);
    } else {
      const updatedFormData = { ...formData, [name]: value };
      setFormData(updatedFormData);

      // Auto-capture proprietaire data when key fields change (debounced)
      if (name === 'baillorEmail' || name === 'baillorName' || name === 'baillorAddress') {
        if (captureTimerRef.current) {
          clearTimeout(captureTimerRef.current);
        }

        captureTimerRef.current = setTimeout(() => {
          autoCaptureProprietaireData(updatedFormData);
        }, 1500); // Wait 1.5s after last keystroke
      }
    }

    // Capture email immediately for email_captures table
    if (name === 'baillorEmail' && value) {
      captureEmail(value);
    }

    // Capture email immediately when baillorEmail is entered
    if (name === 'baillorEmail' && value) {
      captureEmail(value);
    }

    // Afficher l'aperçu automatiquement dès qu'un champ contient au moins un caractère
    if (value.trim().length > 0 || hasAnyContent()) {
      setShowPreview(true);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    
    // Validation des champs obligatoires
    const errors: string[] = [];
    
    if (!formData.baillorName.trim()) {
      errors.push('Le nom du bailleur est obligatoire');
    }
    if (!formData.baillorAddress.trim()) {
      errors.push('L\'adresse du bailleur est obligatoire');
    }
    if (!formData.baillorEmail.trim()) {
      errors.push('L\'email du bailleur est obligatoire');
    }
    if (!formData.locataireName.trim()) {
      errors.push('Le nom du locataire est obligatoire');
    }
    if (!formData.logementAddress.trim()) {
      errors.push('L\'adresse du logement est obligatoire');
    }
    if (!formData.loyer.trim()) {
      errors.push('Le montant du loyer est obligatoire');
    }
    if (!formData.charges.trim()) {
      errors.push('Le montant des charges est obligatoire');
    }
    if (!isElectronicSignatureChecked) {
      errors.push('La signature électronique est obligatoire');
    }
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.baillorEmail.trim() && !emailRegex.test(formData.baillorEmail)) {
      errors.push('L\'adresse email n\'est pas valide');
    }
    
    // Validation montants
    if (formData.loyer.trim() && (isNaN(Number(formData.loyer)) || Number(formData.loyer) <= 0)) {
      errors.push('Le montant du loyer doit être un nombre positif');
    }
    if (formData.charges.trim() && (isNaN(Number(formData.charges)) || Number(formData.charges) < 0)) {
      errors.push('Le montant des charges doit être un nombre positif ou zéro');
    }
    
    // Validation dates prorata
    if (formData.isProrata) {
      if (!formData.dateDebut) {
        errors.push('La date de début est obligatoire pour le prorata');
      }
      if (!formData.dateFin) {
        errors.push('La date de fin est obligatoire pour le prorata');
      }
      if (formData.dateDebut && formData.dateFin && new Date(formData.dateDebut) >= new Date(formData.dateFin)) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }
    
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      setIsLoading(false);
      // Scroll vers le premier message d'erreur
      document.getElementById('validation-errors')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    try {
      console.log('🚀 Début envoi quittance...');
      console.log('📋 Données du formulaire avant envoi:', formData);
      
      const quittanceData = {
        baillorName: formData.baillorName,
        baillorAddress: formData.baillorAddress,
        baillorEmail: formData.baillorEmail,
        locataireName: formData.locataireName,
        logementAddress: formData.logementAddress,
        locataireDomicileAddress: formData.hasDifferentDomicile ? formData.locataireDomicileAddress : '',
        loyer: formData.isProrata && prorataAmounts.loyer > 0 ? prorataAmounts.loyer.toFixed(2) : formData.loyer,
        charges: formData.isProrata && prorataAmounts.charges > 0 ? prorataAmounts.charges.toFixed(2) : formData.charges,
        periode: formData.periode,
        isProrata: formData.isProrata,
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin,
        typeCalcul: formData.typeCalcul,
        isElectronicSignature: isElectronicSignatureChecked
      };

      console.log('📧 Données envoyées au service:', quittanceData);
      console.log('📧 Appel du service d\'envoi réel...');
      const result = await sendQuittanceByEmail(quittanceData);

      if (result.success) {
        // Track quittance generation and PDF download
        trackQuittanceGenerated('generator', {
          is_prorata: formData.isProrata,
          loyer: parseFloat(formData.loyer),
        });
        trackPdfDownload('generator');

        // Mark email capture as form completed
        markComplete();

        setSuccessMessage([result.message || 'Votre quittance a été envoyée avec succès !']);
        navigate('/quittance-success', {
          state: {
            email: formData.baillorEmail,
            nom: formData.baillorName,
            locataireName: formData.locataireName,
            locataireAddress: formData.logementAddress,
            loyer: formData.loyer,
            charges: formData.charges
          }
        });
      } else {
        setErrorMessage([result.message || 'Erreur lors de l\'envoi de la quittance. Veuillez réessayer.']);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi:', error);
      setErrorMessage(['Erreur lors de l\'envoi de la quittance. Veuillez réessayer.']);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    calculateProrata();
  }, [calculateProrata]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Générateur de Quittance de Loyer Gratuit | PDF en 30 secondes"
        description="Créez gratuitement vos quittances de loyer conformes à la loi française. Génération PDF instantanée, envoi par email, 100% gratuit. Aucune inscription requise."
        keywords="générateur quittance loyer gratuit, créer quittance PDF, quittance loyer en ligne gratuite, modèle quittance automatique, outil quittance propriétaire"
        schema={schema}
        canonical="https://quittance-simple.fr/generator"
      />
      <Header />

      {/* Hero Section */}


      {/* Générateur gratuit intégré */}
      <section id="generator" className="pt-24 sm:pt-28 pb-12 lg:pb-18 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 lg:px-7">
          {!isMobile && (
            <div className="text-center mb-6">
              <h2 className="text-lg lg:text-2xl font-bold text-[#2b2b2b] mb-3">
                Générateur gratuit de quittances
              </h2>
              <p className="text-sm lg:text-base text-[#415052] max-w-2xl mx-auto">
                Remplissez le formulaire ci-dessous et recevez votre quittance PDF conforme.
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Form - Mobile Multi-Step ou Desktop Single-Form */}
            {isMobile ? (
              <MobileMultiStepForm
                formData={formData}
                setFormData={setFormData}
                isElectronicSignatureChecked={isElectronicSignatureChecked}
                setIsElectronicSignatureChecked={setIsElectronicSignatureChecked}
                prorataAmounts={prorataAmounts}
                handleInputChange={handleInputChange}
                handleBlur={handleBlur}
                handleSubmit={handleDownload}
                isLoading={isLoading}
                validationErrors={validationErrors}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xl">
              <form className="space-y-6">
                {/* Messages d'erreur */}
                {validationErrors.length > 0 && (
                  <div id="validation-errors" className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-red-900 mb-2">
                          Veuillez corriger les erreurs suivantes :
                        </h3>
                        <ul className="space-y-1.5">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="text-sm text-red-800 flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bailleur Section */}
                <div className="space-y-5 bg-[#7CAA89]/10 rounded-2xl p-5 border border-[#7CAA89]/20">
                  <div className="flex items-center space-x-2.5 pb-3 border-b border-[#7CAA89]/20">
                    <div className="w-10 h-10 bg-[#7CAA89] rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#2b2b2b]">Informations Bailleur</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">Nom complet</label>
                      <input
                        type="text"
                        name="baillorName"
                        value={formData.baillorName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
                          validationErrors.some(error => error.includes('nom du bailleur'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20'
                        }`}
                        placeholder="Ex: Jean Dupont"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">Adresse complète</label>
                      <input
                        type="text"
                        name="baillorAddress"
                        value={formData.baillorAddress}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
                          validationErrors.some(error => error.includes('adresse du bailleur'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20'
                        }`}
                        placeholder="Ex: 123 rue de la République, 75001 Paris"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">Email</label>
                      <input
                        type="email"
                        name="baillorEmail"
                        value={formData.baillorEmail}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
                          validationErrors.some(error => error.includes('email'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20'
                        }`}
                        placeholder="Ex: jean.dupont@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Locataire Section */}
                <div className="space-y-5 bg-[#7CAA89]/10 rounded-2xl p-5 border border-[#7CAA89]/20">
                  <div className="flex items-center space-x-2.5 pb-3 border-b border-[#7CAA89]/20">
                    <div className="w-10 h-10 bg-[#7CAA89] rounded-xl flex items-center justify-center">
                      <HomeIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#2b2b2b]">Informations Locataire</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">Nom du locataire</label>
                      <input
                        type="text"
                        name="locataireName"
                        value={formData.locataireName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
                          validationErrors.some(error => error.includes('nom du locataire'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20'
                        }`}
                        placeholder="Ex: Marie Martin"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">Adresse du logement</label>
                      <input
                        type="text"
                        name="logementAddress"
                        value={formData.logementAddress}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
                          validationErrors.some(error => error.includes('adresse du logement'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20'
                        }`}
                        placeholder="Ex: 45 avenue des Champs, 75008 Paris"
                        required
                      />
                    </div>

                    <div className="bg-[#7CAA89]/10 border border-[#7CAA89]/20 rounded-xl p-3">
                      <label className="flex items-start space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasDifferentDomicile}
                          onChange={(e) => setFormData(prev => ({ ...prev, hasDifferentDomicile: e.target.checked, locataireDomicileAddress: e.target.checked ? prev.locataireDomicileAddress : '' }))}
                          className="w-4 h-4 text-[#7CAA89] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#7CAA89]/20 mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-semibold text-[#415052] mb-0.5">
                            Adresse de domicile du locataire différente du bien loué
                          </div>
                          <div className="text-xs text-[#545454]">
                            Cochez si le locataire habite à une autre adresse
                          </div>
                        </div>
                      </label>
                    </div>

                    {formData.hasDifferentDomicile && (
                      <div>
                        <label className="block text-xs font-semibold text-[#415052] mb-1.5">Adresse du domicile du locataire</label>
                        <input
                          type="text"
                          name="locataireDomicileAddress"
                          value={formData.locataireDomicileAddress}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-sm"
                          placeholder="Ex: 12 rue Victor Hugo, 75016 Paris"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Montants Section */}
                <div className="space-y-5 bg-[#7CAA89]/10 rounded-2xl p-5 border border-[#7CAA89]/20">
                  <div className="flex items-center space-x-2.5 pb-3 border-b border-[#7CAA89]/20">
                    <div className="w-10 h-10 bg-[#7CAA89] rounded-xl flex items-center justify-center">
                      <Euro className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#2b2b2b]">Montants</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">Loyer mensuel (€)</label>
                      <input
                        type="number"
                        name="loyer"
                        value={formData.loyer}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
                          validationErrors.some(error => error.includes('loyer'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20'
                        }`}
                        placeholder="800"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">Charges mensuelles (€)</label>
                      <input
                        type="number"
                        name="charges"
                        value={formData.charges}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
                          validationErrors.some(error => error.includes('charges'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20'
                        }`}
                        placeholder="100"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {!formData.isProrata && (
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">
                        Période
                        <span className="ml-2 text-[10px] text-gray-500">
                          (Date système: {new Date().toLocaleDateString('fr-FR')})
                        </span>
                      </label>

                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          name="periode"
                          value={formData.periode}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 appearance-none bg-white text-sm"
                        >
                          {(() => {
                            const now = new Date();
                            console.log('🗓️ Génération des options période - Date actuelle:', now, 'Mois:', now.getMonth());
                            const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                                               'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                            const options = [];
                            for (let i = -12; i <= 12; i++) {
                              const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
                              const period = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                              if (i === 0) {
                                console.log('📍 Période actuelle sélectionnée:', period);
                              }
                              options.push(<option key={i} value={period}>{period}</option>);
                            }
                            return options;
                          })()}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Case à cocher pour le prorata */}
                  <div className="bg-[#7CAA89]/10 border border-[#7CAA89]/20 rounded-xl p-3">
                    <label className="flex items-start space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isProrata}
                        onChange={(e) => setFormData(prev => ({ ...prev, isProrata: e.target.checked }))}
                        className="w-4 h-4 text-[#2D3436] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#7CAA89]/20 mt-0.5"
                      />
                      <div>
                        <div className="text-sm font-semibold text-[#415052] mb-0.5">
                          Calculer le prorata pour une période spécifique
                        </div>
                        <div className="text-xs text-[#415052]">
                          Le montant sera ajusté selon la période exacte du séjour
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Champs de dates si prorata activé */}
                {formData.isProrata && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">Date d'entrée</label>
                      <input
                        type="date"
                        name="dateDebut"
                        value={formData.dateDebut}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
                          validationErrors.some(error => error.includes('date de début'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#415052] mb-1.5">Date de sortie</label>
                      <input
                        type="date"
                        name="dateFin"
                        value={formData.dateFin}
                        onChange={handleInputChange}
                        min={formData.dateDebut || undefined}
                        className={`w-full px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
                          validationErrors.some(error => error.includes('date de fin'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20'
                        }`}
                      />
                    </div>
                  </div>
                )}


                {/* Affichage du total prorata */}
                {formData.isProrata && prorataAmounts.total > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#2b2b2b]">Total prorata calculé:</span>
                      <span className="text-base font-bold text-gray-600">
                        {prorataAmounts.loyer.toFixed(2)}€ + {prorataAmounts.charges.toFixed(2)}€ = {prorataAmounts.total.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}

                {/* Signature électronique */}
                <div className="space-y-5 bg-[#7CAA89]/10 rounded-2xl p-5 border border-[#7CAA89]/20">
                  <div className="flex items-center space-x-2.5 pb-3 border-b border-[#7CAA89]/20">
                    <div className="w-10 h-10 bg-[#7CAA89] rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#2b2b2b]">Validation</h3>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isElectronicSignatureChecked}
                        onChange={(e) => setIsElectronicSignatureChecked(e.target.checked)}
                        className={`w-4 h-4 text-[#2D3436] border-2 rounded focus:ring-2 mt-0.5 ${
                          validationErrors.some(error => error.includes('signature électronique'))
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-[#7CAA89]/20'
                        }`}
                        required
                      />
                      <div>
                        <div className="text-base font-bold text-[#2b2b2b] mb-1.5">
                          Signature électronique *
                        </div>
                        <div className="text-xs text-[#415052] leading-relaxed">
                          Je certifie que le paiement a été encaissé et j'approuve l'émission de la quittance.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </form>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="w-full px-5 py-3 rounded-xl font-bold text-base transition-all duration-200 transform shadow-lg flex items-center justify-center space-x-2.5 bg-[#ed7862] hover:bg-[#e56651] text-white hover:-translate-y-1 hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Recevoir ma quittance PDF</span>
                    </>
                  )}
                </button>

                {hasContent() && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full bg-[#7CAA89] hover:bg-[#6b9378] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showPreview ? 'Masquer l\'aperçu' : 'Aperçu de la quittance'}</span>
                  </button>
                )}
              </div>
            </div>
            )}

            {/* Preview or Info - Hidden on mobile with multi-step form */}
            {!isMobile && (
            <div className="lg:sticky lg:top-24">
              {showPreview && hasAnyContent() ? (
                <QuittancePreview
                  formData={{
                    ...formData,
                    loyer: formData.isProrata && prorataAmounts.loyer > 0 ? prorataAmounts.loyer.toFixed(2) : formData.loyer,
                    charges: formData.isProrata && prorataAmounts.charges > 0 ? prorataAmounts.charges.toFixed(2) : formData.charges
                  }}
                  isElectronicSignatureChecked={isElectronicSignatureChecked}
                  onClose={() => setShowPreview(false)}
                />
              ) : (
                <div className="bg-gradient-to-br bg-[#fefdf9] rounded-3xl p-6 border border-gray-200 shadow-xl">
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowPreview(true);
                      }}
                      className="w-16 h-16 bg-[#ed7862] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <FileText className="w-8 h-8 text-white" />
                    </button>
                    <h3 className="text-xl font-bold text-[#2b2b2b] mb-3">Quittance conforme</h3>
                    <p className="text-sm text-[#415052] mb-6 leading-relaxed">
                      Votre quittance sera générée selon les normes légales françaises avec toutes les mentions obligatoires.
                    </p>

                    <button
                      onClick={() => {
                        setShowPreview(true);
                      }}
                      className="mb-5 inline-flex items-center justify-center bg-[#7CAA89] hover:bg-[#6b9378] text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 transform hover:-translate-y-1 shadow-lg animate-pulse"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      <span>Voir l'aperçu</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Bannière Premium - Conversion */}
          <div className="hidden md:block mt-4 max-w-4xl mx-auto px-4">
            <button
              onClick={() => navigate('/pricing')}
              className="w-full bg-gradient-to-r from-[#ed7862]/10 to-[#e56651]/10 border border-[#ed7862]/20 rounded-xl p-2 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-0">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-[#ed7862]/20 rounded-lg p-1.5 group-hover:scale-105 transition-transform flex-shrink-0">
                 
                  </div>
                  <div className="text-sm text-[#2b2b2b] text-left">
                    <span className="font-semibold">Ne plus jamais y penser ?</span>
                    <span className="hidden sm:inline"> — </span>
                    <span className="block sm:inline text-[#545454]">Automatisez tout pour <strong className="text-[#ed7862]">0,82€/mois</strong></span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="bg-[#ed7862] text-white px-4 py-2 rounded-lg font-medium text-sm group-hover:bg-[#e56651] transition-colors flex items-center space-x-1.5">
                    <span>Découvrir</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Erreur"
        messages={errorMessage}
      />

      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Succès"
        messages={successMessage}
      />
    </div>
  );
};

export default Generator;