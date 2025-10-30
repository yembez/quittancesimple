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
  
  const [formData, setFormData] = React.useState({
    baillorName: '',
    baillorAddress: '',
    baillorEmail: '',
    locataireName: '',
    logementAddress: '',
    loyer: '',
    charges: '',
    periode: 'Septembre 2025',
    isProrata: false,
    dateDebut: '',
    dateFin: '',
    typeCalcul: ''
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
      setFormData(prev => ({ ...prev, [name]: value }));
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
        setSuccessMessage([result.message || 'Votre quittance a été envoyée avec succès !']);
        setShowSuccessModal(true);
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
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#79ae91] to-[#6b9d82]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg mb-8">
              <Shield className="w-5 h-5 text-white mr-3" />
              <span className="text-sm font-semibold text-white">100% Gratuit - Aucune inscription requise</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Vos quittances de loyer en moins de 2 mn
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Créez gratuitement vos quittances et recevez-les en PDF. Simple, rapide, et conforme à la loi française.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Générateur gratuit intégré */}
      <section id="generator" className="py-16 lg:py-24 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl lg:text-3xl font-bold text-[#415052] mb-4">
              Générateur gratuit de quittances
            </h2>
            <p className="text-base lg:text-lg text-[#415052] max-w-2xl mx-auto">
              Remplissez le formulaire ci-dessous et recevez votre quittance PDF conforme.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Form */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xl">
              <form className="space-y-8">
                {/* Messages d'erreur */}
                {validationErrors.length > 0 && (
                  <div id="validation-errors" className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm font-bold">!</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-red-900 mb-3">
                          Veuillez corriger les erreurs suivantes :
                        </h3>
                        <ul className="space-y-2">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="text-red-800 flex items-center space-x-2">
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
                <div className="space-y-6 bg-[#79ae91]/10 rounded-2xl p-6 border border-[#79ae91]/20">
                  <div className="flex items-center space-x-3 pb-4 border-b border-[#79ae91]/20">
                    <div className="w-12 h-12 bg-[#79ae91] rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#415052]">Informations Bailleur</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Nom complet</label>
                      <input
                        type="text"
                        name="baillorName"
                        value={formData.baillorName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.some(error => error.includes('nom du bailleur'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20'
                        }`}
                        placeholder="Ex: Jean Dupont"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Adresse complète</label>
                      <input
                        type="text"
                        name="baillorAddress"
                        value={formData.baillorAddress}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.some(error => error.includes('adresse du bailleur'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20'
                        }`}
                        placeholder="Ex: 123 rue de la République, 75001 Paris"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Email</label>
                      <input
                        type="email"
                        name="baillorEmail"
                        value={formData.baillorEmail}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.some(error => error.includes('email'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20'
                        }`}
                        placeholder="Ex: jean.dupont@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Locataire Section */}
                <div className="space-y-6 bg-[#79ae91]/10 rounded-2xl p-6 border border-[#79ae91]/20">
                  <div className="flex items-center space-x-3 pb-4 border-b border-[#79ae91]/20">
                    <div className="w-12 h-12 bg-[#79ae91] rounded-xl flex items-center justify-center">
                      <HomeIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#415052]">Informations Locataire</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Nom du locataire</label>
                      <input
                        type="text"
                        name="locataireName"
                        value={formData.locataireName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.some(error => error.includes('nom du locataire'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20'
                        }`}
                        placeholder="Ex: Marie Martin"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Adresse du logement</label>
                      <input
                        type="text"
                        name="logementAddress"
                        value={formData.logementAddress}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.some(error => error.includes('adresse du logement'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20'
                        }`}
                        placeholder="Ex: 45 avenue des Champs, 75008 Paris"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Montants Section */}
                <div className="space-y-6 bg-[#79ae91]/10 rounded-2xl p-6 border border-[#79ae91]/20">
                  <div className="flex items-center space-x-3 pb-4 border-b border-[#79ae91]/20">
                    <div className="w-12 h-12 bg-[#79ae91] rounded-xl flex items-center justify-center">
                      <Euro className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#415052]">Montants</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Loyer mensuel (€)</label>
                      <input
                        type="number"
                        name="loyer"
                        value={formData.loyer}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.some(error => error.includes('loyer'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20'
                        }`}
                        placeholder="800"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Charges mensuelles (€)</label>
                      <input
                        type="number"
                        name="charges"
                        value={formData.charges}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.some(error => error.includes('charges'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20'
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
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Période</label>
                      
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          name="periode"
                          value={formData.periode}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200 appearance-none bg-white"
                        >
                          <option value="Septembre 2025">Septembre 2025</option>
                          <option value="Août 2025">Août 2025</option>
                          <option value="Juillet 2025">Juillet 2025</option>
                          <option value="Juin 2025">Juin 2025</option>
                          <option value="Mai 2025">Mai 2025</option>
                          <option value="Avril 2025">Avril 2025</option>
                          <option value="Mars 2025">Mars 2025</option>
                          <option value="Février 2025">Février 2025</option>
                          <option value="Janvier 2025">Janvier 2025</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Case à cocher pour le prorata */}
                  <div className="bg-[#79ae91]/10 border border-[#79ae91]/20 rounded-xl p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isProrata}
                        onChange={(e) => setFormData(prev => ({ ...prev, isProrata: e.target.checked }))}
                        className="w-5 h-5 text-[#79ae91] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#79ae91]/20 mt-1"
                      />
                      <div>
                        <div className="font-semibold text-[#415052] mb-1">
                          Calculer le prorata pour une période spécifique
                        </div>
                        <div className="text-sm text-[#415052]">
                          Le montant sera ajusté selon la période exacte du séjour
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Champs de dates si prorata activé */}
                {formData.isProrata && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Date d'entrée</label>
                      <input
                        type="date"
                        name="dateDebut"
                        value={formData.dateDebut}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.some(error => error.includes('date de début'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Date de sortie</label>
                      <input
                        type="date"
                        name="dateFin"
                        value={formData.dateFin}
                        onChange={handleInputChange}
                        min={formData.dateDebut || undefined}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.some(error => error.includes('date de fin'))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20'
                        }`}
                      />
                    </div>
                  </div>
                )}
                

                {/* Affichage du total prorata */}
                {formData.isProrata && prorataAmounts.total > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-green-900">Total prorata calculé:</span>
                      <span className="text-lg font-bold text-green-600">
                        {prorataAmounts.loyer.toFixed(2)}€ + {prorataAmounts.charges.toFixed(2)}€ = {prorataAmounts.total.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}

                {/* Signature électronique */}
                <div className="space-y-6 bg-[#79ae91]/10 rounded-2xl p-6 border border-[#79ae91]/20">
                  <div className="flex items-center space-x-3 pb-4 border-b border-[#79ae91]/20">
                    <div className="w-12 h-12 bg-[#79ae91] rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#415052]">Validation</h3>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <label className="flex items-start space-x-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isElectronicSignatureChecked}
                        onChange={(e) => setIsElectronicSignatureChecked(e.target.checked)}
                        className={`w-5 h-5 text-[#79ae91] border-2 rounded focus:ring-2 mt-1 ${
                          validationErrors.some(error => error.includes('signature électronique'))
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-[#79ae91]/20'
                        }`}
                        required
                      />
                      <div>
                        <div className="text-lg font-bold text-[#415052] mb-2">
                          Signature électronique *
                        </div>
                        <div className="text-sm text-[#415052] leading-relaxed">
                          Je certifie que le paiement a été encaissé et j'approuve l'émission de la quittance.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </form>

              {/* Actions */}
              <div className="mt-8 space-y-4">
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform shadow-lg flex items-center justify-center space-x-3 bg-[#ed7862] hover:bg-[#e56651] text-white hover:-translate-y-1 hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-6 h-6" />
                      <span>Recevoir ma quittance PDF</span>
                    </>
                  )}
                </button>
                
                {hasContent() && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full border-2 border-gray-300 hover:border-orange-400 text-[#415052] hover:text-[#79ae91] px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-5 h-5" />
                    <span>{showPreview ? 'Masquer l\'aperçu' : 'Aperçu de la quittance'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Preview or Info */}
            <div className="lg:sticky lg:top-32">
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
                <div className="bg-gradient-to-br bg-[#fefdf9] rounded-3xl p-8 border border-gray-200 shadow-xl">
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowPreview(true);
                      }}
                      className="w-20 h-20 bg-[#ed7862] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <FileText className="w-10 h-10 text-white" />
                    </button>
                    <h3 className="text-2xl font-bold text-[#415052] mb-4">Quittance conforme</h3>
                    <p className="text-[#415052] mb-8 leading-relaxed">
                      Votre quittance sera générée selon les normes légales françaises avec toutes les mentions obligatoires.
                    </p>

                    <button
                      onClick={() => {
                        setShowPreview(true);
                      }}
                      className="mb-6 inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-1 shadow-lg animate-pulse"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      <span>Voir l'aperçu</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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