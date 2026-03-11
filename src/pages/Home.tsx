import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Download, Heart, Star, ThumbsUp, Coffee, Users, Calendar, Eye, Home as HomeIcon, Mail, Lock, Clock, User, Euro, Shield, FileText, Zap, Check } from 'lucide-react';
import QuittancePreview from '../components/QuittancePreview';
import { sendQuittanceByEmail } from '../utils/emailService';
import SEOHead from '../components/SEOHead';
import { AlertModal } from '../components/AlertModal';
import { useEmailCapture } from '../hooks/useEmailCapture';
import { useIsMobile } from '../hooks/useIsMobile';
import { supabase } from '../lib/supabase';
import { trackQuittanceGenerated, trackPdfDownload, trackCtaClick } from '../utils/analytics';

const AVIS_MOBILE = [
  { text: "J'ai automatisé mes quittances, je ne m'en occupe plus ! C'est trop bien :)", author: 'Julie, propriétaire coloc 5 chambres' },
  { text: "Yes, Enfin un outil simple ! On automatise hyper facilement", author: 'Thomas, bailleur' },
  { text: "L'idée est super, c'est automatisé mais j'ai le contrôle ", author: 'Marie, propriétaire' },
];

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
  const [formUnlocked, setFormUnlocked] = React.useState(false);

  // Email capture hook
  const { handleEmailChange: captureEmail, markComplete } = useEmailCapture({
    pageSource: 'home',
    formType: 'quittance_generation'
  });

  // Device detection hook
  const isMobile = useIsMobile();

  // Carrousel d'avis mobile
  const [avisIndex, setAvisIndex] = React.useState(0);
  React.useEffect(() => {
    if (!isMobile) return;
    const t = setInterval(() => {
      setAvisIndex((i) => (i + 1) % AVIS_MOBILE.length);
    }, 4500);
    return () => clearInterval(t);
  }, [isMobile]);

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
      }
    };
  }, []);

  // Au retour du calculateur prorata gratuit : reporter les montants dans le générateur (fonctionnalité gratuite conservée).
  // En visite sans ?from=prorata : supprimer toute donnée prorata résiduelle pour ne pas pré-remplir au retour mois suivant.
  React.useEffect(() => {
    if (searchParams.get('from') === 'prorata') {
      const prorataData = localStorage.getItem('prorataData');
      if (prorataData) {
        const data = JSON.parse(prorataData);
        setFormData(prev => ({
          ...prev,
          loyer: data.loyer,
          charges: data.charges,
          periode: data.periode,
          isProrata: data.isProrata || false,
          dateDebut: data.dateDebut || '',
          dateFin: data.dateFin || '',
          typeCalcul: data.typeCalcul || ''
        }));
        const l = parseFloat(data.loyer) || 0;
        const c = parseFloat(data.charges) || 0;
        setProrataAmounts({ loyer: l, charges: c, total: l + c });
        setShowPreview(true);
        setFormUnlocked(true);
        localStorage.removeItem('prorataData');
        setTimeout(() => {
          document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      localStorage.removeItem('prorataData');
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
    <div className="min-h-screen bg-[#fefefe] sm:bg-white font-sans text-[#212a3e]">
      <SEOHead
        title="Quittance Simple – Quittance de loyer gratuite ou automatique"
        description="Générez une quittance de loyer PDF gratuite en qques secondes ou automatisez vos envois mensuels. Ultra simple, conforme et sans engagement."
        keywords="quittance de loyer gratuite, générer quittance PDF, quittance loyer en ligne, modèle quittance, outil quittance propriétaire, quittance automatique"
        canonical="https://www.quittancesimple.fr/"
        robots="index, follow"
        schema={schema}
      />

      <header className="min-h-[100vh] pt-20 sm:pt-28 lg:pt-32 pb-0 bg-[#fefefe] sm:bg-[#efeef3] border-b border-[#e5e7f3] max-[480px]:min-h-[100dvh] max-[480px]:py-0 max-[480px]:flex max-[480px]:items-start max-[480px]:pb-6 flex flex-col">
        <div
          className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10 max-[480px]:w-full flex flex-col"
          style={{
            paddingTop: window.innerWidth <= 480 ? 'var(--mobile-header-spacing)' : undefined,
            paddingBottom: window.innerWidth <= 480 ? '0' : undefined
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.05fr] gap-8 lg:gap-10 items-center">
            {/* Colonne texte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1 sm:space-y-5 max-[480px]:flex max-[480px]:flex-col max-[480px]:justify-start"
              style={{
                gap: window.innerWidth <= 480 ? 'var(--mobile-section-spacing)' : undefined
              }}
            >
              <div
                className="text-center sm:text-left"
                style={{
                  marginBottom: window.innerWidth <= 480 ? 'var(--mobile-title-bottom-spacing)' : undefined
                }}
              >
                <h1 className="font-semibold sm:font-bold text-[#212a3e] leading-[1.12] hidden sm:block">
                  <span className="!text-[32px] sm:!text-[40px] lg:!text-[46px] block">
                    Votre quittance de loyer<br />
                    tout de suite.
                  </span>
                  <span className="!text-[26px] sm:!text-[30px] lg:!text-[34px] block mt-0.5">Enfin simple et fiable.</span>
                </h1>
                <h1 className="font-semibold text-[#212a3e] leading-[1.16] block sm:hidden px-2">
                  <span className="!text-[22px] block">
                    Votre quittance de loyer<br />
                    tout de suite
                  </span>
                </h1>
                {/* Illustration mobile sous le titre */}
                <div className="block sm:hidden mt-8 px-6">
                  <div className="w-full max-w-[340px] h-[200px] mx-auto flex items-center justify-center rounded-2xl bg-[#fefefe]">
                    <img
                      src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/quittance_stamp_mobile_4_resized.png"
                      alt="Illustration de quittances tamponnées"
                      className="max-h-[240px] w-auto max-w-full object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-[15px] lg:text-[17px] text-[#5e6478] font-normal leading-snug mt-3 hidden sm:block lg:block max-w-xl">
                 Générez vos quittances PDF conformes à la loi ALUR, ou automatisez l’envoi et l’archivage, les calculs IRL, le reporting fiscal, sans y penser.
                </h2>
              </div>

              {/* CTA - Version mobile UNIQUEMENT */}
              <div
                className="block sm:hidden px-3 flex flex-col"
                style={{
                  gap: window.innerWidth <= 480 ? 'var(--mobile-cta-spacing)' : undefined
                }}
              >
              <Link
  to="/generator"
  className="
    block w-full
    rounded-[14px]
    px-3.5 min-h-[52px] flex items-center justify-center
    bg-[#f4663b] hover:bg-[#e25830]
    text-white text-center
    transition-all duration-150 ease-out
    shadow-[0_2px_8px_rgba(15,23,42,0.12)]
    active:translate-y-[1px]
    active:scale-[0.985]
  "
>
  <div className="text-[15px] font-semibold leading-tight">
    Créer une quittance gratuite
  </div>
</Link>


                {/* Séparateur "ou" avec lignes */}
                <div className="flex items-center gap-2 py-0">
                  <div className="flex-1 h-[1px] bg-slate-200"></div>
                  <span className="text-[11px] text-slate-500 font-medium">ou</span>
                  <div className="flex-1 h-[1px] bg-slate-200"></div>
                </div>

                {/* CTA secondaire - Outline comme maquette */}
                <Link
                  to="/automation"
                  onClick={() => trackCtaClick('decouvrir_automatisation_mobile', 'home', '/automation')}
                  className="block w-full rounded-[14px] px-3.5 min-h-[52px] flex flex-col items-center justify-center border-2 border-[#212a3e] bg-white hover:bg-[#212a3e] hover:text-white text-[#212a3e] text-center transition-all shadow-[0_2px_8px_rgba(15,23,42,0.08)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.1)]"
                >
                  <div className="text-[15px] font-semibold leading-tight">Découvrir le Pack Automatique</div>
                  <div className="text-[11px] font-normal text-slate-500 mt-0.5">Automatisation : quittances, rappels, calcul IRL, rapport fiscal, courriers, archivage. </div>
                </Link>

                {/* Bloc avis mobile - carrousel, même taille fixe */}
                <div className="block sm:hidden mt-3 w-full">
                  <div className="w-full h-[68px] bg-white/90 backdrop-blur-sm border border-[#e8e7ef] rounded-2xl px-3 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.08)] overflow-hidden relative flex items-center">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={avisIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 px-3 py-2.5 flex flex-col justify-center"
                      >
                        <p className="text-[11px] leading-snug text-[#212a3e] italic line-clamp-2">
                          « {AVIS_MOBILE[avisIndex].text} »
                        </p>
                        <span className="text-[9px] text-[#8b90a3] mt-1 shrink-0">{AVIS_MOBILE[avisIndex].author}</span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* CTA - Version DESKTOP/TABLET */}
              <div className="hidden sm:block space-y-10">
                {/* Texte explicatif */}
                <div className="space-y-3 max-w-xl">
                  <p className="text-[14px] sm:text-base text-[#5e6478] leading-relaxed">
                    Nous avons voulu un outil pour nous, bailleurs, vraiment simple à utiliser et ultra conforme.
                  </p>
                  
                </div>

                {/* CTA comme maquette : l'un au-dessus de l'autre, secondaire fond blanc + outline */}
                <div className="flex flex-col items-start gap-3 mt-2">
                  <Link
                    to="/generator"
                    className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-[#E65F3F] hover:bg-[#d95530] text-white text-sm font-semibold transition-colors shadow-[0_2px_6px_rgba(15,23,42,0.1)]"
                    onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Créer une quittance gratuite
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                  <Link
                    to="/automation"
                    onClick={() => trackCtaClick('decouvrir_pack_automatique_desktop', 'home', '/automation')}
                    className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[#212a3e] text-xs sm:text-sm font-semibold transition-colors bg-white border-2 border-[#212a3e] hover:bg-[#212a3e] hover:text-white"
                  >
                    Découvrir le Pack Automatique
                  </Link>
                </div>
              </div>

            </motion.div>

            {/* Hero : bloc image avec angles arrondis, ombre légère ; PDF en superposition qui sort du cadre, penché à droite, ombre marquée */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2 hidden sm:block relative overflow-visible"
            >
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
                <img
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/generator_screen_2.png"
                  alt="Aperçu quittance générée"
                  className="w-full h-auto object-contain object-center"
                />
              </div>
              {/* Quittance PDF : sort du cadre en bas à droite, penchée vers la droite, ombre portée marquée */}
              <img
                src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/pdf_quittance.png"
                alt="Quittance PDF finale"
                className="absolute right-0 bottom-0 w-[30%] max-w-[200px] h-auto object-contain origin-bottom-right translate-x-[15%] translate-y-[12%] rotate-[8deg] rounded-md shadow-[0_12px_32px_rgba(15,23,42,0.35),0_4px_12px_rgba(15,23,42,0.2)]"
              />
            </motion.div>
          </div>
        </div>
        {/* Bandeau pleine largeur, même bg que bloc Pack Automatique en dessous */}
        <div className="w-full mt-20 sm:mt-24 pt-12 pb-12 sm:pt-14 sm:pb-10 bg-[#f6f5f9] border-t border-[#e8e7ef] hidden sm:block">
          <div className="max-w-[1250px] mx-auto px-8 sm:px-5 lg:px-7 xl:px-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0f9f6e] shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
                <div>
                  <p className="font-semibold text-[#212a3e] text-base">Conforme loi ALUR (2026)</p>
                  <p className="text-[#5e6478] text-sm">Montants en lettres et chiffres.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0f9f6e] shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
                <div>
                  <p className="font-semibold text-[#212a3e] text-base">Calcul prorata inclus</p>
                  <p className="text-[#5e6478] text-sm">Module inclus.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0f9f6e] shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
                <div>
                  <p className="font-semibold text-[#212a3e] text-base">Signature électronique conforme</p>
                  <p className="text-[#5e6478] text-sm">Avec mentions légales.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0f9f6e] shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
                <div>
                  <p className="font-semibold text-[#212a3e] text-base">Déjà utilisé par plus de 1300 bailleurs</p>
                  <p className="text-[#5e6478] text-sm">En quelques semaines.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Zone sous le bandeau : même bg que le bloc Pack Automatique (évite le retour au bg hero) */}
        <div className="flex-1 min-h-[1px] w-full bg-[#f7f5fa] hidden sm:block" aria-hidden="true" />
      </header>
      {/* Section Pack Automatique */}
      <section className="mt-10 sm:mt-0 bg-[#f7f5fa] pt-10 sm:pt-12 pb-16 sm:pb-20 border-t border-b border-[#e8e7ef]">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <div className="space-y-5">
              <h2 className="section-pack-title font-bold text-[#212a3e] leading-tight">
                Simplifiez votre gestion locative<br className="hidden sm:block" /> avec le Pack Automatique
              </h2>
              <p className="text-sm sm:text-base text-[#212a3e]">
                À partir de <span className="font-bold text-[20px] sm:text-[22px]">3,25&nbsp;€/mois</span>
              </p>
              <p className="text-sm sm:text-base text-[#5e6478] max-w-xl">
                Le Pack Automatique automatise l’envoi de vos quittances, calcule vos IRL au bon moment, crée le courrier pour vos locataires, crée vos annonces avec IA, vous aide à remplir vos baux et état des lieux, vous donne accès à la signature électronique simplifiée de vos baux, calcule votre reporting fiscal, etc. Fini l’administratif locatif compliqué, oublié ou en retard.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/automation"
                  onClick={() => trackCtaClick('tester_pack_automatique_section', 'home', '/automation')}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-[#E65F3F] hover:bg-[#d95530] text-white text-sm font-semibold transition-colors shadow-[0_2px_6px_rgba(15,23,42,0.1)]"
                >
                  Tester gratuitement le Pack Automatique
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
                <span className="text-[11px] sm:text-xs text-[#8b90a3]">
                  Sans engagement, annulation possible à tout moment
                </span>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/Ordinateur_Fleur_HD_3.jpg"
                alt="Pack Automatique sur ordinateur"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#212a3e] mb-1">Quittances automatiques</h3>
              <p className="text-[11px] sm:text-xs text-slate-600">
                Envoi programmé chaque mois à vos locataires, ou rappel si loyer impayé.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#212a3e] mb-1">Calcul du loyer IRL</h3>
              <p className="text-[11px] sm:text-xs text-slate-600">
                Indices à jour et calculs prêts pour vos révisions de loyers au bon moment. Courrier remplis prêt à envoyer.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#212a3e] mb-1">Reporting fiscal avancé</h3>
              <p className="text-[11px] sm:text-xs text-slate-600">
                Bilan annuel synthétique pour préparer plus sereinement votre déclaration.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#212a3e] mb-1">Archivage sécurisé</h3>
              <p className="text-[11px] sm:text-xs text-slate-600">
                Historique centralisé de vos loyers et quittances, accessible en cas de contrôle ou de litige.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Générateur masqué sur mobile car CTA redirige vers /generator */}
      <section id="generator" className="pt-28 sm:pt-36 pb-8 sm:pb-14 bg-slate-50 hidden sm:block">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-5 lg:px-7 xl:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <h2 className="text-base lg:text-xl font-semibold text-[#212a3e] mb-2">
              Générateur gratuit de quittances de loyer
            </h2>
            <p className="text-xs lg:text-sm text-slate-600 max-w-2xl mx-auto">
              Remplissez les informations de votre bail et recevez votre quittance PDF conforme à la loi ALUR, prête à être envoyée à votre locataire.
            </p>

            <div className="mt-4 mx-auto max-w-3xl bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-[#212a3e]">Plus fiable qu’un modèle Word ou Excel</span> : calculs automatisés, mises en page stables, envoi par email intégré. Vous gagnez du temps tout en restant parfaitement conforme.
              </p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.12)]" onFocus={() => setFormUnlocked(true)}>
              <form className="space-y-5" autoComplete="off">
                <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                    <div className="w-8 h-8 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
                      <User className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-semibold text-[#212a3e]">Informations bailleur</h3>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Nom complet</label>
                      <input
                        type="text"
                        name="baillorName"
                        autoComplete="off"
                        readOnly={!formUnlocked}
                        value={formData.baillorName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: Jean Dupont"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Adresse complète</label>
                      <input
                        type="text"
                        name="baillorAddress"
                        autoComplete="off"
                        readOnly={!formUnlocked}
                        value={formData.baillorAddress}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: 123 rue de la République, 75001 Paris"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Email</label>
                      <input
                        type="email"
                        name="baillorEmail"
                        autoComplete="off"
                        readOnly={!formUnlocked}
                        value={formData.baillorEmail}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: jean.dupont@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                    <div className="w-8 h-8 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
                      <HomeIcon className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-semibold text-[#212a3e]">Informations locataire</h3>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Nom du locataire</label>
                      <input
                        type="text"
                        name="locataireName"
                        autoComplete="off"
                        readOnly={!formUnlocked}
                        value={formData.locataireName}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: Marie Martin"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Adresse du logement</label>
                      <input
                        type="text"
                        name="logementAddress"
                        autoComplete="off"
                        readOnly={!formUnlocked}
                        value={formData.logementAddress}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                        placeholder="Ex: 45 avenue des Champs, 75008 Paris"
                        required
                      />
                    </div>

                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-2">
                      <label className="flex items-start space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasDifferentDomicile}
                          onChange={(e) => setFormData(prev => ({ ...prev, hasDifferentDomicile: e.target.checked, locataireDomicileAddress: e.target.checked ? prev.locataireDomicileAddress : '' }))}
                          className="w-3.5 h-3.5 text-[#2563eb] border-2 border-slate-300 rounded focus:ring-2 focus:ring-[#2563eb]/20 mt-0.5"
                        />
                        <div>
                          <div className="font-semibold text-slate-700 mb-0.5 text-[10px]">
                            Adresse de domicile du locataire différente du bien loué
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Cochez si le locataire habite à une autre adresse
                          </div>
                        </div>
                      </label>
                    </div>

                    {formData.hasDifferentDomicile && (
                      <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Adresse du domicile du locataire</label>
                        <input
                          type="text"
                          name="locataireDomicileAddress"
                          autoComplete="off"
                          readOnly={!formUnlocked}
                          value={formData.locataireDomicileAddress}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                          placeholder="Ex: 12 rue Victor Hugo, 75016 Paris"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                    <div className="w-8 h-8 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
                      <Euro className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-semibold text-[#212a3e]">Montants</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Loyer mensuel (€)</label>
                      <input
                        type="number"
                        name="loyer"
                        autoComplete="off"
                        readOnly={!formUnlocked}
                        value={formData.loyer}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                        placeholder="800"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Charges mensuelles (€)</label>
                      <input
                        type="number"
                        name="charges"
                        autoComplete="off"
                        readOnly={!formUnlocked}
                        value={formData.charges}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                        placeholder="100"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {!formData.isProrata && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Période</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <select
                          name="periode"
                          autoComplete="off"
                          value={formData.periode}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 appearance-none bg-white text-xs"
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

                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-2">
                    <label className="flex items-start space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isProrata}
                        onChange={(e) => setFormData(prev => ({ ...prev, isProrata: e.target.checked }))}
                        className="w-3.5 h-3.5 text-[#2563eb] border-2 border-slate-300 rounded focus:ring-2 focus:ring-[#2563eb]/20 mt-0.5"
                      />
                      <div>
                        <div className="font-semibold text-slate-700 mb-0.5 text-[10px]">
                          Calculer le prorata pour une période spécifique
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Le montant sera ajusté selon la période exacte du séjour
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.isProrata && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Date d'entrée</label>
                      <input
                        type="date"
                        name="dateDebut"
                        autoComplete="off"
                        readOnly={!formUnlocked}
                        value={formData.dateDebut}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Date de sortie</label>
                      <input
                        type="date"
                        name="dateFin"
                        autoComplete="off"
                        readOnly={!formUnlocked}
                        value={formData.dateFin}
                        onChange={handleInputChange}
                        min={formData.dateDebut || undefined}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                {formData.isProrata && prorataAmounts.total > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[#212a3e]">Total prorata calculé&nbsp;:</span>
                      <span className="text-xs font-bold text-slate-700">
                        {prorataAmounts.loyer.toFixed(2)}€ + {prorataAmounts.charges.toFixed(2)}€ = {prorataAmounts.total.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                    <div className="w-8 h-8 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-semibold text-[#212a3e]">Validation</h3>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isElectronicSignatureChecked}
                        onChange={(e) => setIsElectronicSignatureChecked(e.target.checked)}
                        className="w-3.5 h-3.5 text-[#2563eb] border-2 border-slate-300 rounded focus:ring-2 focus:ring-[#2563eb]/20 mt-0.5"
                        required
                      />
                      <div>
                        <div className="text-sm font-semibold text-[#212a3e] mb-0.5">
                          Signature électronique *
                        </div>
                        <div className="text-[10px] text-slate-600 leading-relaxed">
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
                  className="w-full px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 transform shadow-lg flex items-center justify-center space-x-1.5 bg-[#1e3a5f] hover:bg-[#16304a] text-white hover:-translate-y-1 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
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
                    className="w-full border border-slate-300 hover:border-[#618e82] text-slate-600 hover:text-[#618e82] px-4 py-2 rounded-xl font-semibold text-xs transition-all duration-200 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm flex items-center justify-center space-x-1.5"
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
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowPreview(true);
                      }}
                      className="w-14 h-14 bg-[#618e82] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <FileText className="w-7 h-7 text-white" />
                    </button>
                    <h3 className="text-lg font-semibold text-[#212a3e] mb-2">Quittance conforme</h3>
                    <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                      La quittance est générée selon les normes légales françaises, avec toutes les mentions obligatoires et une présentation claire pour votre locataire.
                    </p>

                    <button
                      onClick={() => {
                        setShowPreview(true);
                      }}
                      className="mb-3 inline-flex items-center justify-center bg-[#618e82] hover:bg-[#527a70] text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 transform hover:-translate-y-1 shadow-lg"
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
              className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-[#2563eb]/10 rounded-lg p-1.5 group-hover:scale-105 transition-transform flex-shrink-0">
                    <Zap className="w-4 h-4 text-[#E65F3F]" />
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="block sm:inline text-[#212a3e] font-semibold">Fatigué de perdre du temps ? Essayez le pack automatique.</span>
                    <span className="hidden sm:inline"> </span>
                    <span className="block sm:inline text-slate-600">À partir de <strong className="text-[#E65F3F]">3,25&nbsp;€/mois</strong>, les quittances sont automatiques.</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="bg-[#E65F3F] text-white px-4 py-2 rounded-lg font-medium text-sm group-hover:bg-[#d95530] transition-colors flex items-center space-x-1.5">
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
            <p className="text-[10px] text-muted-light">© 2026 Quittance Simple. Tous droits réservés.</p>
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
