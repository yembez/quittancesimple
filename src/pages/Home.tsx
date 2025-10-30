import React from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Download, Heart, Star, ThumbsUp, Coffee, Users, Calendar, Eye, Home as HomeIcon, Mail, Lock, Clock, User, Euro, Shield, FileText } from 'lucide-react';
import QuittancePreview from '../components/QuittancePreview';
import { sendQuittanceByEmail } from '../utils/emailService';
import SEOHead from '../components/SEOHead';
import { AlertModal } from '../components/AlertModal';

const Home = () => {
  const [searchParams] = useSearchParams();

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Quittance Simple",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2500"
    }
  };

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
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (searchParams.get('from') === 'prorata') {
      const prorataData = localStorage.getItem('prorataData');
      if (prorataData) {
        const data = JSON.parse(prorataData);

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

        setProrataAmounts({
          loyer: data.prorataLoyer || 0,
          charges: data.prorataCharges || 0,
          total: data.prorataTotal || 0
        });

        setShowPreview(true);
        localStorage.removeItem('prorataData');
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

    const mois = dateDebut.getMonth();
    const annee = dateDebut.getFullYear();
    const joursTotal = new Date(annee, mois + 1, 0).getDate();
    const joursPresence = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));

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

    if (name === 'dateDebut' || name === 'dateFin') {
      const updatedFormData = { ...formData, [name]: value };
      if (name === 'dateDebut' && updatedFormData.dateFin) {
        const dateDebut = new Date(value);
        const dateFin = new Date(updatedFormData.dateFin);
        if (dateDebut >= dateFin) {
          updatedFormData.dateFin = '';
        }
      }

      if (name === 'dateFin' && updatedFormData.dateDebut) {
        const dateDebut = new Date(updatedFormData.dateDebut);
        const dateFin = new Date(value);
        if (dateFin <= dateDebut) {
          return;
        }
      }

      setFormData(updatedFormData);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (value.trim().length > 0 || hasAnyContent()) {
      setShowPreview(true);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);

    const errors: string[] = [];
    if (!formData.baillorName.trim()) errors.push('Le nom du bailleur est obligatoire');
    if (!formData.baillorAddress.trim()) errors.push('L\'adresse du bailleur est obligatoire');
    if (!formData.baillorEmail.trim()) errors.push('L\'email du bailleur est obligatoire');
    if (!formData.locataireName.trim()) errors.push('Le nom du locataire est obligatoire');
    if (!formData.logementAddress.trim()) errors.push('L\'adresse du logement est obligatoire');
    if (!formData.loyer.trim()) errors.push('Le montant du loyer est obligatoire');
    if (!formData.charges.trim()) errors.push('Le montant des charges est obligatoire');
    if (!isElectronicSignatureChecked) errors.push('La signature électronique est obligatoire');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.baillorEmail.trim() && !emailRegex.test(formData.baillorEmail)) {
      errors.push('L\'adresse email n\'est pas valide');
    }

    if (formData.loyer.trim() && (isNaN(Number(formData.loyer)) || Number(formData.loyer) <= 0)) {
      errors.push('Le montant du loyer doit être un nombre positif');
    }

    if (formData.charges.trim() && (isNaN(Number(formData.charges)) || Number(formData.charges) < 0)) {
      errors.push('Le montant des charges doit être un nombre positif ou zéro');
    }

    if (formData.isProrata) {
      if (!formData.dateDebut) errors.push('La date de début est obligatoire pour le prorata');
      if (!formData.dateFin) errors.push('La date de fin est obligatoire pour le prorata');
      if (formData.dateDebut && formData.dateFin && new Date(formData.dateDebut) >= new Date(formData.dateFin)) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }

    setValidationErrors(errors);

    if (errors.length > 0) {
      setIsLoading(false);
      setShowErrorModal(true);
      return;
    }

    try {
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

      const result = await sendQuittanceByEmail(quittanceData);

      if (result.success) {
        const messages = result.message.split('\n').filter((m: string) => m.trim());
        setSuccessMessage(messages);
        setShowSuccessModal(true);
      } else {
        if (result.message.includes('Configuration')) {
          const messages = [
            result.message,
            '',
            '🔄 EN ATTENDANT : Le PDF a été téléchargé sur votre ordinateur.',
            '📧 Vous pouvez l\'envoyer manuellement par email.'
          ];
          setSuccessMessage(messages);
          setShowSuccessModal(true);

          const { generateQuittancePDF } = await import('../utils/pdfGenerator');
          const pdfBlob = await generateQuittancePDF({
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
          });

          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `quittance-${formData.locataireName || 'locataire'}-${formData.periode || 'septembre-2025'}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi:', error);
      setValidationErrors([error instanceof Error ? error.message : 'Erreur lors de l\'envoi de la quittance. Veuillez réessayer.']);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    calculateProrata();
  }, [calculateProrata]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-16">
      <SEOHead
        title="Quittance de Loyer Gratuite | Générez vos quittances PDF en 30 secondes"
        description="Créez vos quittances de loyer conformes et gratuites en quelques clics. Outil simple pour propriétaires : génération PDF, envoi automatique, 100% légal. Essai gratuit."
        keywords="quittance loyer gratuite, générer quittance PDF, quittance loyer en ligne, modèle quittance, outil quittance propriétaire, quittance automatique"
        schema={schema}
      />

      <header className="py-10 sm:py-16 lg:py-20 bg-[#fefdf9]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 lg:py-8"
            >
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#415052] leading-tight">
                  Gérez enfin vos<br />quittances sans effort
                </h1>
                <p className="text-base sm:text-lg text-[#415052] leading-snug">
                  Choisissez entre l'envoi automatique ou créez et recevez <span className="font-bold">en moins de 2mn</span> votre quittance gratuite PDF.
                </p>
                <div className="flex items-center gap-2 text-sm sm:text-base text-[#415052]">
                  <span>Créé par des propriétaires, pour des propriétaires</span>
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[#79ae91] fill-[#79ae91] ml-1" />
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 max-w-lg">
                <button
                  onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
                  className="self-start rounded-full px-8 py-3 bg-[#ed7862] text-white text-base sm:text-lg font-semibold hover:bg-[#e56651] transition-colors shadow-sm flex items-center gap-2"
                >
                  Générer quittance gratuite
                  <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-full text-center text-[#415052] text-sm sm:text-base -my-1">
                  ou
                </div>
                <Link
                  to="/automation"
                  className="self-end rounded-full px-8 py-3 bg-[#79ae91] text-white text-base sm:text-lg font-semibold hover:bg-[#6a9d7f] transition-colors shadow-sm flex items-center gap-2"
                >
                  Automatiser l'envoi
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#415052] leading-tight mb-2">
                    L'envoi automatique<br />en 2 offres
                  </h3>
                  <p className="text-lg sm:text-xl text-[#79ae91]">
                    à partir de <span className="font-semibold">1€/mois</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <Link to="/automation" className="flex gap-2 sm:gap-4 items-center hover:opacity-80 transition-opacity">
                    <div className="flex-shrink-0">
                      <img
                        src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/femme_tel_dessin-removebg-preview.png"
                        alt="Femme avec téléphone"
                        className="w-[120px] sm:w-[180px] lg:w-[240px] h-auto object-contain"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base lg:text-lg font-bold text-[#415052] leading-tight">
                        Quittance<br />Automatique
                      </h4>
                      <p className="text-xs sm:text-sm text-[#415052] leading-snug">
                        Configurez 1 fois, recevez un rappel chaque mois. Vous validez en un clic quand le loyer est encaissé.
                      </p>
                    </div>
                  </Link>

                  <Link to="/automation" className="flex gap-2 sm:gap-4 items-center hover:opacity-80 transition-opacity">
                    <div className="flex-shrink-0">
                      <img
                        src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/homme_bras_back_final.png"
                        alt="Homme relaxé"
                        className="w-[110px] sm:w-[160px] lg:w-[220px] h-auto object-contain"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base lg:text-lg font-bold text-[#415052] leading-tight">
                        Quittance<br />Connectée<span className="text-lg sm:text-xl">+</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-[#415052] leading-snug">
                        <span className="font-bold">Synchronisation de votre compte bancaire</span> - Vous n'avez plus rien à faire, tout part automatiquement
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <section id="generator" className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-xl lg:text-3xl font-bold text-[#415052] mb-4">
              Générateur gratuit de quittances
            </h2>
            <p className="text-base lg:text-lg text-[#415052] max-w-2xl mx-auto">
              Remplissez le formulaire ci-dessous et recevez votre quittance PDF conforme.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xl">
              <form className="space-y-8">
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200"
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200"
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200"
                        placeholder="Ex: jean.dupont@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>

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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200"
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200"
                        placeholder="Ex: 45 avenue des Champs, 75008 Paris"
                        required
                      />
                    </div>
                  </div>
                </div>

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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200"
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200"
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

                {formData.isProrata && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#415052] mb-2">Date d'entrée</label>
                      <input
                        type="date"
                        name="dateDebut"
                        value={formData.dateDebut}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200"
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

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
                        className="w-5 h-5 text-[#79ae91] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#79ae91]/20 mt-1"
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

      <footer className="bg-subtle-light border-t border-subtle-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-light">© 2024 Quittance Simple. Tous droits réservés.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link to="/legal" className="text-sm text-muted-light hover:text-[#ed7862] transition-colors">Mentions légales</Link>
              <Link to="/legal" className="text-sm text-muted-light hover:text-[#ed7862] transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>

      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Veuillez corriger les erreurs suivantes"
        messages={validationErrors}
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

export default Home;
