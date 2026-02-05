import React from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Download, Heart, Star, ThumbsUp, Coffee, Users, Calendar, Eye, Home as HomeIcon, Mail, Lock, Clock, User, Euro, Shield, FileText, Zap, CheckCircle } from 'lucide-react';
import QuittancePreview from '../components/QuittancePreview';
import { sendQuittanceByEmail } from '../utils/emailService';
import SEOHead from '../components/SEOHead';
import { AlertModal } from '../components/AlertModal';
import { useEmailCapture } from '../hooks/useEmailCapture';
import { useIsMobile } from '../hooks/useIsMobile';
import { supabase } from '../lib/supabase';
import { trackQuittanceGenerated, trackPdfDownload, trackCtaClick } from '../utils/analytics';

const Home = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

  const getCurrentPeriod = () => {
    const now = new Date();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  const [formData, setFormData] = React.useState({
    baillorName: '',
    baillorAddress: '',
    baillorEmail: '',
    locataireName: '',
    logementAddress: '',
    locataireDomicileAddress: '',
    hasDifferentDomicile: false,
    loyer: '',
    charges: '',
    periode: getCurrentPeriod(),
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

  // Email capture hook
  const { handleEmailChange: captureEmail, markComplete } = useEmailCapture({
    pageSource: 'home',
    formType: 'quittance_generation'
  });

  // Device detection hook
  const isMobile = useIsMobile();

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
      }
    };
  }, []);

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

      console.log('✅ Auto-captured proprietaire data:', {
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

      const result = await sendQuittanceByEmail(quittanceData);

      if (result.success) {
        // Track quittance generation
        trackQuittanceGenerated('home', {
          is_prorata: formData.isProrata,
          loyer: parseFloat(formData.loyer),
        });

        // Mark email capture as form completed
        markComplete();

        const messages = result.message.split('\n').filter((m: string) => m.trim());
        setSuccessMessage(messages);
        navigate('/quittance_success', {
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
            locataireDomicileAddress: formData.hasDifferentDomicile ? formData.locataireDomicileAddress : '',
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
          const periodForFilename = formData.periode || getCurrentPeriod();
          a.download = `quittance-${formData.locataireName || 'locataire'}-${periodForFilename.toLowerCase().replace(/\s+/g, '-')}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Track PDF download
          trackPdfDownload('home');
          trackQuittanceGenerated('home', { is_prorata: formData.isProrata });
          markComplete();

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
    <div className="min-h-screen bg-gray-50 font-sans text-[#2b2b2b] pt-14 max-[480px]:pt-[56px]">
      <SEOHead
        title="Quittance Simple – Quittance de loyer gratuite ou automatique en 1 clic"
        description="Générez une quittance de loyer PDF gratuite en qques secondes ou automatisez vos envois mensuels. Ultra simple, conforme et sans engagement."
        keywords="quittance de loyer gratuite, générer quittance PDF, quittance loyer en ligne, modèle quittance, outil quittance propriétaire, quittance automatique"
        canonical="https://www.quittancesimple.fr/"
        robots="index, follow"
        schema={schema}
      />

      <header className="py-3 sm:py-8 lg:py-10 bg-[#fefdf9] max-[480px]:h-[100dvh] max-[480px]:py-0 max-[480px]:flex max-[480px]:items-start max-[480px]:overflow-hidden">
        <div
          className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10 max-[480px]:w-full"
          style={{
            paddingTop: window.innerWidth <= 480 ? 'var(--mobile-header-spacing)' : undefined,
            paddingBottom: window.innerWidth <= 480 ? '0' : undefined
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5 lg:gap-10 items-center">
            {/* VERSION MOBILE UNIQUEMENT - Ultra-compact sans scroll - MAQUETTE EXACTE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1 sm:space-y-3 max-[480px]:flex max-[480px]:flex-col max-[480px]:justify-start"
              style={{
                gap: window.innerWidth <= 480 ? 'var(--mobile-section-spacing)' : undefined
              }}
            >
              {/* Titre mobile ultra-court */}
              <div
                className="text-center sm:text-left"
                style={{
                  marginBottom: window.innerWidth <= 480 ? 'var(--mobile-title-bottom-spacing)' : undefined
                }}
              >
                <h1 className="text-xl font-bold text-[#2b2b2b] leading-tight hidden sm:block sm:text-4xl lg:text-5xl">
                 La quittance de loyer,<br />enfin simple.
                </h1>
                <h1 className="text-[25px] font-bold text-[#2b2b2b] leading-[1.08] block sm:hidden px-2">
                 Votre quittance de <br />loyer, tout de suite.
                </h1>
                <h2 className="text-[20px] lg:text-0xl text-[#545454] font-medium leading-snug mt-2 hidden sm:block lg:block">
                 Générez votre PDF gratuit conforme en quelques secondes <span className="text-base sm:text-xl lg:text-2xl text-[#ed7862] font-medium leading-snug">ou </span> passez au Mode Tranquilité et automatisez votre gestion locative ( dont l'envoi de quittances ) pour <span className="text-base sm:text-xl lg:text-2xl text-[#ed7862] font-medium leading-snug">0,82€/mois</span><span className="text-[20px] lg:text-0xl text-[#545454] font-medium leading-snug"></span>.
                </h2>
              </div>

              {/* Visuel femme - mobile uniquement - comme maquette */}
              <div
                className="block sm:hidden"
                style={{
                  marginBottom: window.innerWidth <= 480 ? 'var(--mobile-visual-bottom-spacing)' : undefined
                }}
              >
                <img
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/femme_orange_resized.png"
                  alt="Quittance de loyer simple"
                  className="w-[225px] h-[140px] object-contain mx-auto"
                />
              </div>

              {/* CTA - Version mobile UNIQUEMENT */}
              <div
                className="block sm:hidden px-3 flex flex-col"
                style={{
                  gap: window.innerWidth <= 480 ? 'var(--mobile-cta-spacing)' : undefined
                }}
              >
                {/* CTA principal - Vert massif arrondi */}
              <Link
  to="/generator"
  className="
    block w-full
    rounded-[15px]
    px-3.5 py-1.5
    bg-[#7CAA89] hover:bg-[#6b9378]
    text-white text-center
    transition-all duration-150 ease-out

    /* Ombre par défaut (flottant) */
    shadow-[0_6px_18px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.12)]

    /* Hover (desktop & mobile hover simulé) */
    hover:shadow-[0_10px_28px_rgba(0,0,0,0.22),0_4px_10px_rgba(0,0,0,0.14)]

    /* Feedback tactile mobile */
    active:translate-y-[1px]
    active:scale-[0.985]
    active:shadow-[0_4px_12px_rgba(0,0,0,0.18)]
  "
>
  <div className="text-[15px] font-bold leading-tight">
    Créer quittance gratuite
  </div>

  <div className="text-[11px] font-normal opacity-90 mt-0.5">
    En moins de 2 minutes · PDF conforme
  </div>
</Link>


                {/* Séparateur "ou" avec lignes */}
                <div className="flex items-center gap-2 py-0">
                  <div className="flex-1 h-[1px] bg-gray-300"></div>
                  <span className="text-[11px] text-[#545454] font-medium">ou</span>
                  <div className="flex-1 h-[1px] bg-gray-300"></div>
                </div>

                {/* CTA secondaire - Outline vert avec border */}
                <Link
                  to="/automation"
                  onClick={() => trackCtaClick('decouvrir_automatisation_mobile', 'home', '/automation')}
                  className="block w-full rounded-[15px] px-3.5 py-1.5 border-[2px] border-[#5a8167] bg-white hover:bg-gray-50 text-[#2b2b2b] text-center transition-all shadow-[0_6px_18px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.30)]"
                >
                  <div className="text-[15px] font-bold leading-tight">Découvrir le Mode Tranquilité</div>
                  <div className="text-[11px] font-normal opacity-75 mt-0.5">Et ne pensez plus à l'administratif locatif</div>
                </Link>
              </div>

              {/* CTA - Version DESKTOP/TABLET comme screenshot */}
              <div className="hidden sm:block space-y-6">
                {/* Texte explicatif */}
                <div className="space-y-4">
                  <p className="text-base text-[#545454] leading-relaxed">
                    Avec nous outils ultra simples du Mode Tranquilité, on envoie vos quittances (ou vos rappel de loyer), on calcule vos bilans annuels, vos IRL pour vous, et vous n'y pensez plus !<br />
                    Nous sommes aussi des "petits" bailleurs, notre priorité : nous (vous) simplifier vraiment la vie !
                  </p>
                </div>

                {/* Les 2 CTA empilés comme screenshot */}
               <div className="flex flex-col items-end gap-3">
                <Link
                  to="/automation"
                  onClick={() => trackCtaClick('automatiser_envoi_desktop', 'home', '/automation')}
                  className="rounded-full px-5 py-2 bg-[#ed7862] hover:bg-[#e56651] text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  Automatiser l'envoi de quittances
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex flex-col items-center gap-3">
                  <span className="text-xs text-[#545454] font-medium whitespace-nowrap">ou</span>

                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
                      className="rounded-full px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      Créer une quittance gratuite
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[12px] text-[#545454] font-medium whitespace-nowrap">En moins de 2 mn !</span>
                  </div>
                </div>
              </div>
              </div>

              {/* Visuel femme orange mobile - desktop */}
              <div className="mt-0 px-20 lg:mt-0 flex justify-start hidden sm:flex">
                <img
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/femme_orange_resized.png"
                  alt="Quittance de loyer simple - Propriétaire satisfait"
                  className="w-[120px] sm:w-[160px] lg:w-[150px] h-auto object-contain"
                />
              </div>

            </motion.div>

            {/* Bloc "Mode Tranquillité" - MASQUÉ sur mobile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2 hidden sm:block"
            >
              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8 space-y-5">
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#2b2b2b] leading-tight mb-1.5">
                    Outils automatisés pour bailleurs <br />zéro usine à gaz
                  </h3>
                  <div className="space-y-0.5">
                    <p className="text-lg sm:text-xl lg:text-xl text-[#2b2b2b] font-semibold">
                      À partir de 0,82€/mois  <span className="text-[25px] sm:text-sm text-[#545454]">
                
                    soit 9,90€/an (offre de lancement)</span>  <p className="text-lg sm:text-xl lg:text-xl text-[#2b2b2b]">
                      
                  Votre gestion locative en pilote automatique. </p>
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#545454]">
                      
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#545454]">
                      2 mois offerts par rapport au mensuel
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/automation"
                    onClick={() => trackCtaClick('quittance_automatique_banner', 'home', '/automation')}
                    className="flex gap-2 sm:gap-3 items-center hover:opacity-80 transition-opacity"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/homme_bras_back_final.png"
                        alt="Quittance de loyer simple - Notification loyer reçu automatique"
                        className="w-[120px] sm:w-[150px] lg:w-[240px] h-auto object-contain"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0 text-xs sm:text-sm lg:text-base text-[#2b2b2b] font-medium"> Avec
                      <h4 className="text-sm sm:text-base lg:text-xl font-bold text-[#ed7862] leading-tight">
                       Le Mode Tranquilité
                      </h4>
                      <p className="text-xs sm:text-sm lg:text-sm text-[#2b2b2b] font-medium leading-snug">
                        Rien de plus simple, <strong>on s'occupe de tout. </strong>Vos quittances, vos calculs de bilans annuels, votre calcul IRL etc. On s'en charge, avec nos outils c'est automatique, ultra simple mais surtout vous gardez le contrôle.
                      </p>
                    </div>
                  </Link>
  {/* Card Locataire <br />
             <br />       
     
                  <div className="flex gap-4 sm:gap-6 items-center relative bg-gray-100 rounded-xl px-3 py-5">
                    <div className="absolute top-0 right-0 bg-[#545454] text-white px-3 py-1 text-xs rounded-xl font-bold shadow-md z-10">
                      Bientôt disponible
                    </div>
                    <div className="flex-shrink-0 ml-3 sm:ml-5 lg:ml-6 opacity-60">
                      <img
                        src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/homme_bras_back_final.png"
                        alt="Quittance de loyer simple - Automatisation complète"
                        className="w-[150px] sm:w-[180px] lg:w-[260px] h-auto object-contain"
                      />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0 opacity-80">
                      <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-500 leading-tight">
                        Et bientôt : <br />Quittance Connectée<span className="text-[#2b2b2b] text-xl sm:text-2xl lg:text-3xl">+</span>
                      </h4>
                      <p className="text-base sm:text-base lg:text-base text-[#545454] font-medium leading-snug">
                        <span className="font-bold text-[#545454]">Synchronisation de votre compte bancaire</span> - Vous n'aurez plus rien à faire, tout partira automatiquement !
                      </p>
                    </div>
                  </div> */}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-[#545454] pt-3 border-t border-gray-200 mt-3">
                  <span className="whitespace-nowrap">Créé par des propriétaires, pour des propriétaires</span>
                  <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" style={{
                    background: 'linear-gradient(135deg, #FFD76F 0%, #FF7A7F 50%, #A46BFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }} />
                </div>
              </div><br /><br />
            </motion.div>
          </div>
        </div>
      </header>
      {/* Section supprimée sur mobile car CTA redirige vers /generator */}
      <div className="bg-[#fefdf9] border-t border-gray-200 hidden sm:block">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10 py-5">
          <div className="space-y-2 flex flex-col items-center text-center">
            <p className="text-xs sm:text-sm text-[#2b2b2b]"><br /><br />
              <span className="font-semibold">Besoin d'une quittance ?</span>
              <br />
              <span className="font-normal">Recevez votre quittance gratuite remplie en moins de 2mn, avec le générateur le plus rapide du marché, <br />avec calculateur de prorata inclus et entièrement gratuit !</span>
            </p>
            <button
              onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-full px-4 py-1.5 bg-gray-700 hover:bg-gray-800 text-white text-[10px] sm:text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              Quittance gratuite
              <ArrowDown className="w-3 h-3" />
            </button><br /><br />
          </div>
        </div>
      </div>
      {/* Générateur masqué sur mobile car CTA redirige vers /generator */}
      <section id="generator" className="py-8 sm:py-12 bg-gray-50 hidden sm:block">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-5"
          >
            <h2 className="text-base lg:text-xl font-bold text-[#2b2b2b] mb-2">
              Générateur gratuit de quittances
            </h2>
            <p className="text-xs lg:text-sm text-[#545454] max-w-2xl mx-auto">
              Remplissez le formulaire ci-dessous et recevez votre quittance PDF conforme.
            </p>

            <div className="mt-4 mx-auto max-w-3xl bg-gradient-to-r from-[#7CAA89]/5 to-[#ed7862]/5 border border-[#7CAA89]/20 rounded-2xl px-4 py-3">
              <p className="text-[11px] sm:text-xs text-[#545454] leading-relaxed">
                <span className="font-semibold text-[#2b2b2b]">L'alternative moderne aux modèles Word et Excel</span> : plus rapide, calculs automatiques et envoi par email inclus. Fini les formules Excel qui cassent, les mises en page Word qui sautent !
              </p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xl">
              <form className="space-y-5">
                <div className="space-y-3 bg-[#7CAA89]/10 rounded-2xl p-4 border border-[#7CAA89]/20">
                  <div className="flex items-center space-x-2 pb-2 border-b border-[#7CAA89]/20">
                    <div className="w-8 h-8 bg-[#7CAA89] rounded-xl flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-[#2b2b2b]">Informations Bailleur</h3>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Nom complet</label>
                      <input
                        type="text"
                        name="baillorName"
                        value={formData.baillorName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: Jean Dupont"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Adresse complète</label>
                      <input
                        type="text"
                        name="baillorAddress"
                        value={formData.baillorAddress}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: 123 rue de la République, 75001 Paris"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Email</label>
                      <input
                        type="email"
                        name="baillorEmail"
                        value={formData.baillorEmail}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: jean.dupont@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-[#7CAA89]/10 rounded-2xl p-4 border border-[#7CAA89]/20">
                  <div className="flex items-center space-x-2 pb-2 border-b border-[#7CAA89]/20">
                    <div className="w-8 h-8 bg-[#7CAA89] rounded-xl flex items-center justify-center">
                      <HomeIcon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-[#2b2b2b]">Informations Locataire</h3>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Nom du locataire</label>
                      <input
                        type="text"
                        name="locataireName"
                        value={formData.locataireName}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: Marie Martin"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Adresse du logement</label>
                      <input
                        type="text"
                        name="logementAddress"
                        value={formData.logementAddress}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: 45 avenue des Champs, 75008 Paris"
                        required
                      />
                    </div>

                    <div className="bg-[#7CAA89]/10 border border-[#7CAA89]/20 rounded-xl p-2">
                      <label className="flex items-start space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasDifferentDomicile}
                          onChange={(e) => setFormData(prev => ({ ...prev, hasDifferentDomicile: e.target.checked, locataireDomicileAddress: e.target.checked ? prev.locataireDomicileAddress : '' }))}
                          className="w-3.5 h-3.5 text-[#7CAA89] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#7CAA89]/20 mt-0.5"
                        />
                        <div>
                          <div className="font-semibold text-[#415052] mb-0.5 text-[10px]">
                            Adresse de domicile du locataire différente du bien loué
                          </div>
                          <div className="text-[10px] text-[#545454]">
                            Cochez si le locataire habite à une autre adresse
                          </div>
                        </div>
                      </label>
                    </div>

                    {formData.hasDifferentDomicile && (
                      <div>
                        <label className="block text-[10px] font-semibold text-[#545454] mb-1">Adresse du domicile du locataire</label>
                        <input
                          type="text"
                          name="locataireDomicileAddress"
                          value={formData.locataireDomicileAddress}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                          placeholder="Ex: 12 rue Victor Hugo, 75016 Paris"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 bg-[#7CAA89]/10 rounded-2xl p-4 border border-[#7CAA89]/20">
                  <div className="flex items-center space-x-2 pb-2 border-b border-[#7CAA89]/20">
                    <div className="w-8 h-8 bg-[#7CAA89] rounded-xl flex items-center justify-center">
                      <Euro className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-[#2b2b2b]">Montants</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Loyer mensuel (€)</label>
                      <input
                        type="number"
                        name="loyer"
                        value={formData.loyer}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                        placeholder="800"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Charges mensuelles (€)</label>
                      <input
                        type="number"
                        name="charges"
                        value={formData.charges}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                        placeholder="100"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {!formData.isProrata && (
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Période</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <select
                          name="periode"
                          value={formData.periode}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 appearance-none bg-white text-xs"
                        >
                          {(() => {
                            const now = new Date();
                            const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                                               'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                            const options = [];
                            for (let i = -12; i <= 12; i++) {
                              const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
                              const period = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                              options.push(<option key={i} value={period}>{period}</option>);
                            }
                            return options;
                          })()}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#7CAA89]/10 border border-[#7CAA89]/20 rounded-xl p-2">
                    <label className="flex items-start space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isProrata}
                        onChange={(e) => setFormData(prev => ({ ...prev, isProrata: e.target.checked }))}
                        className="w-3.5 h-3.5 text-[#7CAA89] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#7CAA89]/20 mt-0.5"
                      />
                      <div>
                        <div className="font-semibold text-[#415052] mb-0.5 text-[10px]">
                          Calculer le prorata pour une période spécifique
                        </div>
                        <div className="text-[10px] text-[#545454]">
                          Le montant sera ajusté selon la période exacte du séjour
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.isProrata && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Date d'entrée</label>
                      <input
                        type="date"
                        name="dateDebut"
                        value={formData.dateDebut}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#545454] mb-1">Date de sortie</label>
                      <input
                        type="date"
                        name="dateFin"
                        value={formData.dateFin}
                        onChange={handleInputChange}
                        min={formData.dateDebut || undefined}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all duration-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                {formData.isProrata && prorataAmounts.total > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[#2b2b2b]">Total prorata calculé:</span>
                      <span className="text-xs font-bold text-gray-600">
                        {prorataAmounts.loyer.toFixed(2)}€ + {prorataAmounts.charges.toFixed(2)}€ = {prorataAmounts.total.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 bg-[#7CAA89]/10 rounded-2xl p-4 border border-[#7CAA89]/20">
                  <div className="flex items-center space-x-2 pb-2 border-b border-[#7CAA89]/20">
                    <div className="w-8 h-8 bg-[#7CAA89] rounded-xl flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-[#2b2b2b]">Validation</h3>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isElectronicSignatureChecked}
                        onChange={(e) => setIsElectronicSignatureChecked(e.target.checked)}
                        className="w-3.5 h-3.5 text-[#7CAA89] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#7CAA89]/20 mt-0.5"
                        required
                      />
                      <div>
                        <div className="text-sm font-bold text-[#2b2b2b] mb-0.5">
                          Signature électronique *
                        </div>
                        <div className="text-[10px] text-[#415052] leading-relaxed">
                          Je certifie que le paiement a été encaissé et j'approuve l'émission de la quittance.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </form>

              <div className="mt-5 space-y-2">
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 transform shadow-lg flex items-center justify-center space-x-1.5 bg-[#ed7862] hover:bg-[#e56651] text-white hover:-translate-y-1 hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Recevoir ma quittance PDF</span>
                    </>
                  )}
                </button>

                {hasContent() && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full border-2 border-gray-300 hover:border-[#ed7862] text-[#545454] hover:text-[#ed7862] px-4 py-2 rounded-xl font-semibold text-xs transition-all duration-200 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm flex items-center justify-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showPreview ? 'Masquer l\'aperçu' : 'Aperçu de la quittance'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-20">
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
                <div className="bg-gradient-to-br bg-[#fefdf9] rounded-3xl p-5 border border-gray-200 shadow-xl">
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowPreview(true);
                      }}
                      className="w-14 h-14 bg-[#ed7862] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <FileText className="w-7 h-7 text-white" />
                    </button>
                    <h3 className="text-lg font-bold text-[#2b2b2b] mb-2">Quittance conforme</h3>
                    <p className="text-xs text-[#545454] mb-5 leading-relaxed">
                      Votre quittance sera générée selon les normes légales françaises avec toutes les mentions obligatoires.
                    </p>

                    <button
                      onClick={() => {
                        setShowPreview(true);
                      }}
                      className="mb-3 inline-flex items-center justify-center bg-[#ed7862] hover:bg-[#e56651] text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 transform hover:-translate-y-1 shadow-lg"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      <span>Voir l'aperçu</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bannière Premium - Conversion - MASQUÉ sur mobile */}
          <div className="mt-8 max-w-4xl mx-auto hidden sm:block">
            <Link
              to="/pricing"
              className="block bg-gradient-to-r from-[#ed7862]/10 to-[#e56651]/10 border border-[#ed7862]/20 rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-[#ed7862]/20 rounded-lg p-1.5 group-hover:scale-105 transition-transform flex-shrink-0">
                    <Zap className="w-4 h-4 text-[#ed7862]" />
                  </div>
                  <div className="text-sm text-[#2b2b2b]">
                    
                    <span className="hidden sm:inline"> — </span>
                    <span className="block sm:inline text-[#545454] font-semibold">Vous pouvez aussi tout automatiser pour <strong className="text-[#ed7862]">0,82€/mois</strong></span><span className="font-semibold"> et vous n'aurez même plus à remplir ce formulaire.</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="bg-[#ed7862] text-white px-4 py-2 rounded-lg font-medium text-sm group-hover:bg-[#e56651] transition-colors flex items-center space-x-1.5">
                    <span>Découvrir</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - MASQUÉ sur mobile */}
      <footer className="bg-subtle-light border-t border-subtle-light hidden sm:block">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[10px] text-muted-light">© 2024 Quittance Simple. Tous droits réservés.</p>
            <div className="flex gap-2 mt-2 md:mt-0">
              <Link to="/legal" className="text-[10px] text-muted-light hover:text-[#ed7862] transition-colors">Mentions légales</Link>
              <Link to="/legal" className="text-[10px] text-muted-light hover:text-[#ed7862] transition-colors">Confidentialité</Link>
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
