import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Home, FileText, Download, Settings, Edit2, CreditCard, Bell, UserPlus, Building2, Lock, CheckCircle, Info, TrendingUp, Euro } from 'lucide-react';
import { supabase } from '../lib/supabase';
import QuittancePreview from '../components/QuittancePreview';
import EditProprietaireModal from '../components/EditProprietaireModal';
import EditLocataireModal from '../components/EditLocataireModal';
import EditRappelModal from '../components/EditRappelModal';
import ReminderPreviewModal from '../components/ReminderPreviewModal';
import LocatairesTable from '../components/LocatairesTable';
import AddLocataireForm from '../components/AddLocataireForm';
import RentDetectionModal, { RentDetectionConfig } from '../components/RentDetectionModal';
import BillingCycleModal from '../components/BillingCycleModal';
import PaymentWarningModal from '../components/PaymentWarningModal';
import BilanAnnuel from '../components/BilanAnnuel';
import { bankAggregationService } from '../services/bankAggregation';
import { validateEmail, validatePhone } from '../utils/validation';

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  adresse: string;
  telephone?: string;
  plan_actuel?: string;
  abonnement_actif: boolean;
}

interface Locataire {
  id: string;
  proprietaire_id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse_logement: string;
  detail_adresse?: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  caution_initiale?: number;
  date_rappel: number;
  heure_rappel?: number;
  minute_rappel?: number;
  periodicite: string;
  statut: 'en_attente' | 'paye';
  actif: boolean;
}

interface Quittance {
  id: string;
  proprietaire_id: string;
  locataire_id: string;
  periode: string;
  loyer: number;
  charges: number;
  total: number;
  date_generation: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewQuittance, setPreviewQuittance] = useState<any>(null);
  const [showEditProprietaire, setShowEditProprietaire] = useState(false);
  const [editingLocataire, setEditingLocataire] = useState<Locataire | null>(null);
  const [editingRappel, setEditingRappel] = useState<Locataire | null>(null);
  const [showReminderPreview, setShowReminderPreview] = useState(false);
  const [selectedLocataireForReminder, setSelectedLocataireForReminder] = useState<Locataire | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showAddLocataire, setShowAddLocataire] = useState(false);
  const [bankConnection, setBankConnection] = useState<any>(null);
  const [latestTransactions, setLatestTransactions] = useState<any[]>([]);

  // Transactions récentes détectées
const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const [connectingBank, setConnectingBank] = useState(false);
  const [configuringDetection, setConfiguringDetection] = useState<Locataire | null>(null);
  const [rentRules, setRentRules] = useState<Record<string, any>>({});
  const [addLocataireForm, setAddLocataireForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse_logement: '',
    detail_adresse: '',
    loyer_mensuel: '',
    charges_mensuelles: '',
    date_rappel: '5',
    heure_rappel: '9',
    minute_rappel: '0'
  });
  const [bankSuccessMessage, setBankSuccessMessage] = useState('');
  const [showBillingCycleModal, setShowBillingCycleModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [pendingBillingCycle, setPendingBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Vérifier si les informations du propriétaire sont complètes
  const isProprietaireInfoComplete = (prop: Proprietaire | null): boolean => {
    if (!prop) return false;
    return !!(
      prop.nom &&
      prop.prenom &&
      prop.adresse &&
      prop.email &&
      prop.telephone
    );
  };

  // Obtenir le message des champs manquants
  const getMissingFieldsMessage = (prop: Proprietaire | null): string => {
    if (!prop) return "Veuillez compléter vos informations";

    const missingFields: string[] = [];

    if (!prop.nom || !prop.prenom) missingFields.push("le nom complet");
    if (!prop.adresse) missingFields.push("l'adresse complète");
    if (!prop.email) missingFields.push("l'email");
    if (!prop.telephone) missingFields.push("le numéro de téléphone");

    if (missingFields.length === 0) return "";

    if (missingFields.length === 1) {
      return `Il manque ${missingFields[0]} pour pouvoir automatiser les envois de quittances`;
    }

    const lastField = missingFields.pop();
    return `Il manque ${missingFields.join(", ")} et ${lastField} pour pouvoir automatiser les envois de quittances`;
  };

  useEffect(() => {
    checkAuthAndLoadDashboard();
  }, []);

  const checkAuthAndLoadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const email = session.user.email;
      if (!email) {
        console.error('No email in session');
        setLoading(false);
        return;
      }

      await loadDashboardData(email);
    } catch (error) {
      console.error('Error checking auth:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handlePowensCallback = async () => {
      const code = searchParams.get('code');

      if (!code) return;

      try {
        console.log('Powens callback détecté sur dashboard');

        // Vérifier la session en premier
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('Aucune session trouvée');
          return;
        }

        const result = await bankAggregationService.exchangePublicToken(code, session.user.id);
        console.log('Connexion bancaire réussie:', result);

        setBankSuccessMessage(`✅ Banque ${result.institution_name} connectée avec succès via Powens. Vous pouvez maintenant détecter les paiements de vos locataires.`);

        // Créer les règles automatiquement si config existe
        const tenantConfigsStr = localStorage.getItem('tenantDetectionConfigs');
        if (tenantConfigsStr && result.connection_id) {
          try {
            const configs = JSON.parse(tenantConfigsStr);
            if (configs && typeof configs === 'object') {
              const rulesPromises = Object.values(configs).map(async (config: any) => {
                return supabase
                  .from('rent_payment_rules')
                  .insert({
                    user_id: session.user.id,
                    bank_connection_id: result.connection_id,
                    locataire_id: config.locataire_id,
                    expected_amount: parseFloat(config.expected_amount),
                    sender_iban: config.sender_iban || null,
                    sender_name: config.sender_name || null,
                    description_contains: config.description_contains || null,
                    tolerance_amount: parseFloat(config.tolerance_amount),
                    auto_generate_receipt: true,
                    send_mode: config.send_mode,
                  });
              });

              await Promise.all(rulesPromises);
              localStorage.removeItem('tenantDetectionConfigs');
              console.log('Règles de paiement créées automatiquement');
            }
          } catch (configError) {
            console.error('Erreur création règles:', configError);
          }
        }

        // Recharger les données pour mettre à jour l'affichage
        const email = searchParams.get('email') || localStorage.getItem('proprietaireEmail');
        if (email) {
          await loadDashboardData(email);
        }

        // Nettoyer l'URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('code');
        newUrl.searchParams.delete('state');
        newUrl.searchParams.delete('id_connection');
        window.history.replaceState({}, '', newUrl.toString());

        // Masquer le message après 10 secondes
        setTimeout(() => setBankSuccessMessage(''), 10000);
      } catch (err) {
        console.error('Erreur callback Powens:', err);
      }
    };

    handlePowensCallback();
  }, [searchParams]);

  const loadDashboardData = async (email: string) => {
    try {
      setLoading(true);

      const { data: propData, error: propError } = await supabase
        .from('proprietaires')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (propError || !propData) {
        console.error('Erreur propriétaire:', propError);
        navigate('/');
        return;
      }

      // Rediriger vers free dashboard si plan gratuit
      if (propData.plan_type === 'free') {
        navigate(`/free-dashboard?email=${email}`);
        return;
      }

      setProprietaire(propData);

      const { data: locatairesData } = await supabase
        .from('locataires')
        .select('*')
        .eq('proprietaire_id', propData.id)
        .eq('actif', true);

      if (locatairesData) {
        setLocataires(locatairesData);
      }

      const { data: quittancesData } = await supabase
        .from('quittances')
        .select('*')
        .eq('proprietaire_id', propData.id)
        .order('date_generation', { ascending: false })
        .limit(10);

      if (quittancesData) {
        setQuittances(quittancesData);
      }

      // Charger la connexion bancaire si elle existe
     const { data: { session } } = await supabase.auth.getSession();

const { data: bankConnData } = await supabase
  .from('bank_connections')
  .select('*')
  .eq('user_id', session.user.id)   // <-- FIX ICI
  .in('status', ['active', 'connected'])
  .maybeSingle();


      if (bankConnData) {
        setBankConnection(bankConnData);
// 🔥 Charger les transactions récentes pour monitoring
const { data: txData } = await supabase
  .from("bank_transactions")
  .select("*")
  .eq("bank_connection_id", bankConnData.id)
  .order("date", { ascending: false })
  .limit(5);

setRecentTransactions(txData || []);
        // Charger les règles de détection pour chaque locataire
        const { data: rulesData } = await supabase
          .from('rent_payment_rules')
          .select('*')
          .eq('user_id', propData.id);

        if (rulesData && Array.isArray(rulesData)) {
          const rulesMap: Record<string, any> = {};
          rulesData.forEach(rule => {
            if (rule?.locataire_id) {
              rulesMap[rule.locataire_id] = rule;
            }
          });
          setRentRules(rulesMap);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setLoading(false);
    }
  };

  const handleSendQuittanceClick = (locataire: Locataire) => {
    if (!proprietaire) return;

    const currentDate = new Date();
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const periode = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    console.log('📅 Période générée:', periode, 'Mois actuel:', currentDate.getMonth());

    const quittanceData = {
      proprietaireNom: `${proprietaire.nom} ${proprietaire.prenom || ''}`.trim(),
      proprietaireAdresse: proprietaire.adresse,
      locataireNom: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
      locataireAdresse: locataire.adresse_logement,
      locataireDetailAdresse: locataire.detail_adresse || '',
      periode: periode,
      loyer: locataire.loyer_mensuel.toString(),
      charges: locataire.charges_mensuelles.toString(),
      caution: locataire.caution_initiale?.toString() || '0',
      locataireData: locataire
    };

    setPreviewQuittance(quittanceData);
  };

  const handleSendReminderClick = (locataire: Locataire) => {
    setSelectedLocataireForReminder(locataire);
    setShowReminderPreview(true);
  };

  const handleConnectBank = async () => {
    try {
      setConnectingBank(true);
      console.log('🏦 Connexion bancaire - Création du lien Powens...');

      // Utiliser session.user.id au lieu de proprietaire.id
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Veuillez vous reconnecter');
        setConnectingBank(false);
        return;
      }

      const { link_token } = await bankAggregationService.createLinkToken(session.user.id);
      console.log('✅ Lien Powens créé:', link_token);

      // Rediriger vers Powens pour l'authentification
      window.location.href = link_token;
    } catch (error) {
      console.error('❌ Erreur connexion bancaire:', error);
      alert('Erreur lors de la connexion bancaire. Veuillez réessayer.');
      setConnectingBank(false);
    }
  };

  const handleConfigureDetection = (locataire: Locataire) => {
    setConfiguringDetection(locataire);
  };

  const handleSaveDetectionConfig = async (config: RentDetectionConfig) => {
    if (!proprietaire) return;

    try {
      console.log('💾 Sauvegarde configuration détection:', config);

      const { error } = await supabase
        .from('rent_payment_rules')
        .insert({
          user_id: proprietaire.id,
          ...config,
        });

      if (error) throw error;

      console.log('✅ Configuration sauvegardée');
      alert('✅ Configuration de détection enregistrée avec succès !');

      // Recharger les données
      if (proprietaire) {
        loadDashboardData(proprietaire.email);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde config:', error);
      throw error;
    }
  };

  const handleDeleteLocataire = async (locataire: Locataire) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${locataire.nom} ${locataire.prenom || ''} ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('locataires')
        .update({ actif: false })
        .eq('id', locataire.id);

      if (error) throw error;

      alert('✅ Locataire supprimé avec succès');
      if (proprietaire) {
        loadDashboardData(proprietaire.email);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleConfirmReminder = async (customMessage?: string) => {
    if (!selectedLocataireForReminder || !proprietaire) return;

    try {
      setIsSending(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          locataireEmail: selectedLocataireForReminder.email,
          locataireName: `${selectedLocataireForReminder.nom} ${selectedLocataireForReminder.prenom || ''}`.trim(),
          baillorName: `${proprietaire.nom} ${proprietaire.prenom || ''}`.trim(),
          loyer: selectedLocataireForReminder.loyer_mensuel,
          charges: selectedLocataireForReminder.charges_mensuelles,
          adresseLogement: selectedLocataireForReminder.adresse_logement,
          customMessage: customMessage
        })
      });

      if (!response.ok) throw new Error('Erreur envoi relance');

      await supabase.from('relances').insert({
        proprietaire_id: proprietaire.id,
        locataire_id: selectedLocataireForReminder.id,
        date_envoi: new Date().toISOString(),
        email_content: { customMessage },
        statut: 'envoye'
      });

      alert('✅ Relance envoyée avec succès !');
      setShowReminderPreview(false);
      setSelectedLocataireForReminder(null);
    } catch (error) {
      console.error('Erreur relance:', error);
      alert('❌ Erreur lors de l\'envoi de la relance');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendQuittance = async () => {
    if (!previewQuittance || !proprietaire) return;

    try {
      setIsSending(true);

      console.log('Generating PDF with data:', previewQuittance);

      const { generateQuittancePDF } = await import('../utils/pdfGenerator');
      const pdfBlob = await generateQuittancePDF(previewQuittance);

      console.log('PDF generated successfully, size:', pdfBlob.size);

      const fileName = `quittance_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('quittances')
        .upload(`${proprietaire.id}/${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('quittances')
        .getPublicUrl(`${proprietaire.id}/${fileName}`);

      // Parse periode to get start/end dates
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const periodeDebut = new Date(year, month, 1).toISOString().split('T')[0];
      const periodeFin = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const loyerNum = parseFloat(previewQuittance.loyer);
      const chargesNum = parseFloat(previewQuittance.charges);

      if (isNaN(loyerNum) || isNaN(chargesNum)) {
        throw new Error(`Valeurs invalides: loyer=${previewQuittance.loyer}, charges=${previewQuittance.charges}`);
      }

      const insertData = {
        proprietaire_id: proprietaire.id,
        locataire_id: previewQuittance.locataireData.id,
        periode_debut: periodeDebut,
        periode_fin: periodeFin,
        loyer: loyerNum,
        charges: chargesNum,
        date_generation: new Date().toISOString(),
        pdf_url: publicUrl,
        statut: 'envoye',
        source: 'dashboard'
      };

      console.log('Insert data:', insertData);

      const { error: dbError } = await supabase
        .from('quittances')
        .upsert(insertData, {
          onConflict: 'proprietaire_id,locataire_id,periode_debut,periode_fin',
          ignoreDuplicates: false
        });

      if (dbError) throw dbError;

      // Envoyer par email si disponible
      if (previewQuittance.locataireData.email) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const total = parseFloat(previewQuittance.loyer) + parseFloat(previewQuittance.charges);

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-quittance-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            locataireEmail: previewQuittance.locataireData.email,
            locataireName: previewQuittance.locataireNom,
            baillorName: previewQuittance.proprietaireNom,
            periode: previewQuittance.periode,
            loyer: parseFloat(previewQuittance.loyer),
            charges: parseFloat(previewQuittance.charges),
            total: total,
            pdfUrl: publicUrl,
            locataireId: previewQuittance.locataireData.id
          })
        });

        if (!emailResponse.ok) {
          console.error('Erreur envoi email:', await emailResponse.text());
        }
      }

      console.log('📧 Mise à jour du statut après envoi de quittance...');
      await handleUpdateLocataire(previewQuittance.locataireData.id, { statut: 'paye' });
      console.log('✅ Statut mis à jour avec succès');

      alert('✅ Quittance envoyée avec succès et statut mis à jour !');
      setPreviewQuittance(null);

      console.log('🔄 Rechargement des données du tableau...');
      await loadDashboardData(proprietaire.email);
      console.log('✅ Tableau mis à jour');
    } catch (error) {
      console.error('❌ Erreur envoi:', error);
      alert('❌ Erreur lors de l\'envoi de la quittance');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateLocataire = async (id: string, updates: Partial<Locataire>) => {
    if (!proprietaire) return;

    try {
      console.log('📝 Mise à jour locataire:', { id, updates });

      const { data, error } = await supabase
        .from('locataires')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      console.log('✅ Mise à jour Supabase réussie:', data);

      setLocataires(locataires.map(l => l.id === id ? { ...l, ...updates } : l));

      if (updates.statut) {
        console.log(`✅ Statut mis à jour pour ${id}: ${updates.statut}`);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour locataire:', error);
      alert('❌ Erreur lors de la mise à jour du locataire');
      throw error;
    }
  };

  const handleAddLocataireChange = (field: string, value: string) => {
    setAddLocataireForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddLocataireSubmit = async () => {
    if (!proprietaire) return;

    if (!addLocataireForm.nom || !addLocataireForm.prenom || !addLocataireForm.email ||
        !addLocataireForm.adresse_logement || !addLocataireForm.loyer_mensuel ||
        !addLocataireForm.charges_mensuelles) {
      alert('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }

    const emailValidation = validateEmail(addLocataireForm.email);
    if (!emailValidation.isValid) {
      alert(emailValidation.error);
      return;
    }

    if (addLocataireForm.telephone && addLocataireForm.telephone.trim()) {
      const phoneValidation = validatePhone(addLocataireForm.telephone);
      if (!phoneValidation.isValid) {
        alert(phoneValidation.error);
        return;
      }
    }

    const loyerMensuel = parseFloat(addLocataireForm.loyer_mensuel);
    const chargesMensuelles = parseFloat(addLocataireForm.charges_mensuelles);

    if (isNaN(loyerMensuel) || loyerMensuel < 0) {
      alert('Le loyer mensuel doit être un nombre valide');
      return;
    }

    if (isNaN(chargesMensuelles) || chargesMensuelles < 0) {
      alert('Les charges mensuelles doivent être un nombre valide');
      return;
    }

    try {
      const { error } = await supabase.from('locataires').insert({
        proprietaire_id: proprietaire.id,
        nom: addLocataireForm.nom,
        prenom: addLocataireForm.prenom,
        email: addLocataireForm.email,
        telephone: addLocataireForm.telephone,
        adresse_logement: addLocataireForm.adresse_logement,
        detail_adresse: addLocataireForm.detail_adresse || null,
        loyer_mensuel: loyerMensuel,
        charges_mensuelles: chargesMensuelles,
        caution_initiale: null,
        date_rappel: parseInt(addLocataireForm.date_rappel),
        heure_rappel: parseInt(addLocataireForm.heure_rappel),
        minute_rappel: parseInt(addLocataireForm.minute_rappel),
        periodicite: 'mensuel',
        statut: 'en_attente',
        actif: true
      });

      if (error) throw error;

      alert('✅ Locataire ajouté avec succès !');
      setShowAddLocataire(false);
      setAddLocataireForm({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse_logement: '',
        detail_adresse: '',
        loyer_mensuel: '',
        charges_mensuelles: '',
        date_rappel: '5',
        heure_rappel: '9',
        minute_rappel: '0'
      });
      loadDashboardData(proprietaire.email);
    } catch (error) {
      console.error('Erreur ajout locataire:', error);
      alert('❌ Erreur lors de l\'ajout du locataire');
    }
  };

  const handleProceedToPayment = () => {
    if (!proprietaire || locataires.length === 0) return;
    setShowBillingCycleModal(true);
  };

  const handleBillingCycleConfirm = async (billingCycle: 'monthly' | 'yearly') => {
    if (!proprietaire || locataires.length === 0) return;

    setShowBillingCycleModal(false);
    setPendingBillingCycle(billingCycle);

    // Check for missing proprietaire information (non-blocking)
    const fields = [];
    if (!proprietaire.nom || proprietaire.nom.trim() === '') fields.push('nom');
    if (!proprietaire.prenom || proprietaire.prenom.trim() === '') fields.push('prénom');
    if (!proprietaire.adresse || proprietaire.adresse.trim() === '') fields.push('adresse');
    if (!proprietaire.telephone || proprietaire.telephone.trim() === '') fields.push('téléphone');

    // Only show warning modal if there are missing fields
    if (fields.length > 0) {
      setMissingFields(fields);
      setShowPaymentWarning(true);
    } else {
      // All fields are filled, proceed directly to payment
      await proceedToStripeCheckout(billingCycle);
    }
  };

  const handleConfirmPayment = async () => {
    setShowPaymentWarning(false);
    await proceedToStripeCheckout(pendingBillingCycle);
  };

  const proceedToStripeCheckout = async (billingCycle: 'monthly' | 'yearly') => {
    if (!proprietaire || locataires.length === 0) return;

    try {
      if (!proprietaire.user_id) {
        alert('Erreur : utilisateur non identifié');
        return;
      }

      await supabase
        .from('proprietaires')
        .update({ nombre_locataires: locataires.length })
        .eq('user_id', proprietaire.user_id);

      const selectedPlan = localStorage.getItem('selectedPlan') || 'auto';
      const numTenants = locataires.length;
      const lineItems: any[] = [];

      if (selectedPlan === 'plus') {
        lineItems.push({ price: import.meta.env.VITE_STRIPE_PRICE_PLUS_FIRST, quantity: 1 });
        if (numTenants > 1) {
          lineItems.push({
            price: import.meta.env.VITE_STRIPE_PRICE_PLUS_ADDITIONAL,
            quantity: numTenants - 1
          });
        }
      } else {
        let priceId;

        if (billingCycle === 'yearly') {
          if (numTenants >= 1 && numTenants <= 2) {
            priceId = import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1_YEARLY;
          } else if (numTenants >= 3 && numTenants <= 5) {
            priceId = import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2_YEARLY;
          } else {
            priceId = import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3_YEARLY;
          }
        } else {
          if (numTenants >= 1 && numTenants <= 2) {
            priceId = import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER1;
          } else if (numTenants >= 3 && numTenants <= 5) {
            priceId = import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER2;
          } else {
            priceId = import.meta.env.VITE_STRIPE_PRICE_AUTO_TIER3;
          }
        }

        lineItems.push({
          price: priceId,
          quantity: 1
        });
      }

      console.log('Sending to Stripe checkout:', { lineItems, numTenants, selectedPlan, billingCycle });

      const { data: session, error: checkoutError } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          line_items: lineItems,
          mode: 'subscription',
          success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/payment-cancelled`
        }
      });

      console.log('Stripe checkout response - data:', session);
      console.log('Stripe checkout response - error:', checkoutError);

      if (checkoutError) {
        console.error('Checkout error details:', checkoutError);
        // Try to extract detailed error message from the response
        const errorMessage = checkoutError.message || JSON.stringify(checkoutError);
        console.error('Full error object:', JSON.stringify(checkoutError, null, 2));
        alert('Erreur lors de la redirection vers le paiement: ' + errorMessage);
        return;
      }

      if (!session?.url) {
        console.error('No session URL returned:', session);
        alert('Erreur : URL de paiement non disponible');
        return;
      }

      console.log('Redirecting to Stripe:', session.url);
      window.location.href = session.url;
    } catch (error: any) {
      console.error('Payment error details:', error);
      alert('Une erreur est survenue: ' + (error.message || JSON.stringify(error)));
    }
  };

  const planType = (proprietaire?.plan_actuel === 'Quittance Connectée+' || proprietaire?.plan_actuel === 'premium')
    ? 'connectee_plus'
    : 'automatique';

  const getPlanName = () => {
    const selectedPlan = localStorage.getItem('selectedPlan') || 'auto';
    const count = locataires.length;

    if (selectedPlan === 'plus') {
      return 'Quittance Connectée+';
    }

    if (count <= 2) return 'Mode Tranquillité (1-2 locataires)';
    if (count <= 5) return 'Mode Tranquillité (3-5 locataires)';
    return 'Mode Tranquillité (5+ locataires)';
  };

  const getPlanPrice = () => {
    const selectedPlan = localStorage.getItem('selectedPlan') || 'auto';
    const count = locataires.length;

    if (selectedPlan === 'plus') {
      const basePrice = 2.99;
      const additionalPrice = (count - 1) * 0.99;
      return `${(basePrice + additionalPrice).toFixed(2)} €`;
    }

    if (pendingBillingCycle === 'yearly') {
      if (count <= 2) return '0,82 €/mois (9,90 €/an)';
      if (count <= 5) return '1,24 €/mois (14,90 €/an)';
      return '2,07 €/mois (24,90 €/an)';
    } else {
      if (count <= 2) return '0,99 €';
      if (count <= 5) return '1,49 €';
      return '2,49 €';
    }
  };

  const [resendingLink, setResendingLink] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

const handleResendAccessLink = async () => {
    try {
      // Récupérer l'email de l'utilisateur connecté automatiquement
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        alert('Email introuvable. Veuillez vous reconnecter.');
        return;
      }

      setResendingLink(true);
      setResendSuccess(false);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/resend-access-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du lien');
      }

      setResendSuccess(true);
      alert(`✅ Email envoyé avec succès à ${userEmail} ! Vérifiez votre boîte mail et vos spams.`);
    } catch (err: any) {
      console.error('Error resending link:', err);
      alert('❌ Erreur lors de l\'envoi du lien. Contactez le support si le problème persiste.');
    } finally {
      setResendingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CAA89] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!proprietaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <Lock className="w-16 h-16 text-[#7CAA89] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès au tableau de bord
            </h1>
            <p className="text-gray-600 mb-6">
              Accédez à votre compte via le lien sécurisé reçu par email après votre paiement.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleResendAccessLink}
                disabled={resendingLink}
                className="w-full px-6 py-3 bg-[#7CAA89] hover:bg-[#6a9d7f] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingLink ? 'Envoi en cours...' : 'Renvoyer le lien d\'accès'}
              </button>

              <Link
                to="/"
                className="block w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-center"
              >
                Retour à l'accueil
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Besoin d'aide ? Contactez-nous à{' '}
                <a href="mailto:contact@quittancesimple.fr" className="text-[#7CAA89] hover:underline">
                  contact@quittancesimple.fr
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-14 sm:pt-16">
      {/* Header avec nom du plan */}
      <div className="bg-white border-b border-gray-200 py-2 sm:py-3">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-7">
          <h1 className="text-lg sm:text-xl font-bold text-[#2b2b2b]">
            {planType === 'connectee_plus' ? 'Plan Quittance Connectée+' : 'Plan Automatique'}
          </h1>
        </div>
      </div>

      {/* Message de succès connexion bancaire */}
      {bankSuccessMessage && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-7 py-2 sm:py-3">
            <div className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] sm:text-xs text-green-800">{bankSuccessMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-7 py-3 sm:py-6">
        {/* Message de bienvenue si pas encore payé */}
        {proprietaire && !proprietaire.abonnement_actif && (
          <div className="bg-[#616161]/5 border border-[#7CAA89]/20 rounded-xl p-3 sm:p-5 mb-3 sm:mb-6">
            <h2 className="text-base sm:text-xl font-bold text-[#333232] mb-1.5">
              Bienvenue dans le Mode Tranquillité
            </h2>
            <p className="text-xs sm:text-sm text-gray-700">
              Tableau de bord, vous pouvez remplir ou modifier vos coordonées et celles de vos locataires et paramétrer vos rappels automatiques.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-3 sm:gap-6">
          {/* Sidebar - Mobile horizontal, Desktop vertical */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 lg:space-y-1 lg:sticky lg:top-20">
              <div className="flex lg:flex-col space-x-1.5 lg:space-x-0 lg:space-y-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-shrink-0 flex items-center justify-center lg:justify-start space-x-1.5 lg:space-x-2 px-2.5 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'bg-[#7CAA89]/10 text-[#7CAA89] font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Tableau de bord</span>
                </button>
                <button
                  onClick={() => navigate('/historique')}
                  className="flex-shrink-0 flex items-center justify-center lg:justify-start space-x-1.5 lg:space-x-2 px-2.5 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Historique</span>
                </button>
                <button
                  onClick={() => setActiveTab('bilan-annuel')}
                  className={`flex-shrink-0 flex items-center justify-center lg:justify-start space-x-1.5 lg:space-x-2 px-2.5 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm whitespace-nowrap ${
                    activeTab === 'bilan-annuel'
                      ? 'bg-[#7CAA89]/10 text-[#7CAA89] font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Bilan annuel</span>
                </button>
                <button
                  onClick={() => navigate('/revision-irl')}
                  className="flex-shrink-0 flex items-center justify-center lg:justify-start space-x-1.5 lg:space-x-2 px-2.5 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                >
                  <Euro className="w-4 h-4" />
                  <span className="hidden sm:inline">Révision IRL</span>
                </button>
                <button
                  onClick={() => navigate(`/billing?email=${proprietaire.email}`)}
                  className="flex-shrink-0 flex items-center justify-center lg:justify-start space-x-1.5 lg:space-x-2 px-2.5 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden sm:inline">Facturation</span>
                </button>
                <button
                  onClick={() => navigate(`/manage-subscription?email=${proprietaire.email}`)}
                  className="flex-shrink-0 flex items-center justify-center lg:justify-start space-x-1.5 lg:space-x-2 px-2.5 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Abonnement</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {activeTab === 'bilan-annuel' && (
              <BilanAnnuel
                proprietaireId={proprietaire.id}
                locataires={locataires}
              />
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-3 sm:space-y-5">
                {/* Section Mes informations */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-1.5">
                    <h2 className="text-base sm:text-lg font-bold text-[#2b2b2b] flex items-center space-x-1.5">
                      <span>📋</span>
                      <span>Informations propriétaire</span>
                    </h2>
                    {!isProprietaireInfoComplete(proprietaire) ? (
                      <div className="group relative sm:ml-2">
                        <button
                          onClick={() => setShowEditProprietaire(true)}
                          className="flex items-center space-x-1 px-2.5 sm:px-3 py-1 bg-[#ed7862] hover:bg-[#e56651] text-white rounded-full font-semibold transition-colors text-[10px] sm:text-xs shadow-sm"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Compléter</span>
                        </button>
                        <div className="absolute left-0 top-full mt-1.5 w-60 bg-gray-900 text-white text-[10px] sm:text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          {getMissingFieldsMessage(proprietaire)}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowEditProprietaire(true)}
                        className="sm:ml-2 flex items-center space-x-1 text-[#2D5C3F] hover:text-[#7CAA89] transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="text-[10px] sm:text-xs">Modifier</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                    <div>
                      <span className="text-gray-600">Nom:</span>
                      <p className="font-semibold text-gray-900">{proprietaire?.nom} {proprietaire?.prenom}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-semibold text-gray-900">{proprietaire?.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Adresse:</span>
                      <p className="font-semibold text-gray-900">{proprietaire?.adresse}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Téléphone:</span>
                      <p className="font-semibold text-gray-900">{proprietaire?.telephone || 'Non renseigné'}</p>
                    </div>
                  </div>

                  {/* Connexion bancaire - Uniquement pour le Plan Connectée+ */}
                  {planType === 'connectee_plus' && (
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                      {!bankConnection ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-5 h-5 text-[#7CAA89]" />
                              <h3 className="font-semibold text-gray-900">Synchronisation bancaire</h3>
                              <div className="group relative">
                                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                  <p className="leading-relaxed">
                                    Cliquez pour connecter votre compte bancaire en toute sécurité
                                  </p>
                                  <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={handleConnectBank}
                            disabled={connectingBank}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#7CAA89] hover:bg-[#6a9d7f] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Building2 className="w-5 h-5" />
                            <span>{connectingBank ? 'Connexion en cours...' : 'Connecter compte bancaire'}</span>
                          </button>

                          <div className="mt-3 flex items-start space-x-2 text-xs text-gray-600">
                            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#7CAA89]" />
                            <p className="leading-relaxed">
                              Connexion sécurisée via <strong>Powens</strong>, prestataire agréé Banque de France conformément à la directive européenne DSP2.
                              Nous n'avons jamais accès à vos identifiants bancaires, et aucune donnée bancaire n'est stockée.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <h3 className="font-semibold text-gray-900">Banque connectée (lecture seule)</h3>
                            </div>
                          </div>
{/* Bouton déconnecter */}
<div className="mt-4">
  <button
    onClick={async () => {
      if (!window.confirm("Voulez-vous vraiment déconnecter votre banque ?")) return;

      try {
        // 1. Supprimer les règles
        await supabase
          .from("rent_payment_rules")
          .delete()
          .eq("bank_connection_id", bankConnection.id);

        // 2. Supprimer la connexion bancaire
        await supabase
          .from("bank_connections")
          .delete()
          .eq("id", bankConnection.id);

        // 3. Reset local React state
        setBankConnection(null);

        alert("✅ Banque déconnectée avec succès !");
      } catch (err) {
        console.error("Erreur suppression:", err);
        alert("❌ Impossible de déconnecter la banque");
      }
    }}
    className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 
               text-red-700 rounded-lg border border-red-200 font-medium transition-colors"
  >
    <span>Déconnecter la banque</span>
  </button>
</div>

                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Building2 className="w-5 h-5 text-green-600" />
                              <p className="font-medium text-green-900">{bankConnection.institution_name}</p>
                            </div>
                            <p className="text-sm text-green-700">
                              Dernière synchro : {new Date(bankConnection.last_sync || bankConnection.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
{/* 🔥 Monitoring des dernières transactions */}
{recentTransactions.length > 0 && (
  <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
    <h4 className="font-semibold text-gray-800 mb-2">📊 Derniers paiements détectés</h4>

    <ul className="divide-y divide-gray-200">
      {recentTransactions.map((tx) => (
        <li key={tx.id} className="py-2 flex justify-between items-center">
          <div>
            <p className="text-gray-800 font-medium">{tx.description || tx.label}</p>
            <p className="text-sm text-gray-500">
              {new Date(tx.date).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {tx.amount} €
          </p>
        </li>
      ))}
    </ul>
  </div>
)}

                          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900 font-medium mb-1">✅ Banque connectée</p>
                            <p className="text-sm text-blue-700">
                              Cliquez sur <strong>"Détecter le loyer"</strong> dans chaque fiche locataire pour activer la détection automatique des loyers.
                            </p>
                          </div>
                          {bankConnection && latestTransactions.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-[#7CAA89]" />
              <h3 className="font-semibold text-gray-900">Derniers paiements détectés</h3>
            </div>

            <div className="space-y-3">
              {latestTransactions.map((tx) => (
                <div 
                  key={tx.transaction_id} 
                  className="flex items-center justify-between border-b border-gray-100 pb-2"
                >
                  <div>
                    <p className="font-medium text-gray-900">{tx.description || tx.label}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.amount} €
                    </p>
                    {tx.sender_name && (
                      <p className="text-xs text-gray-500">{tx.sender_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Section Mes locataires */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-xl font-bold text-[#2b2b2b]">Mes locataires</h2>
                      {locataires.length > 0 && (
                        <button
                          onClick={() => setShowAddLocataire(true)}
                          className="flex items-center justify-center space-x-2 px-2 py-0  bg-white hover:bg-gray-50 text-[#2D5C3F] border-2 border-[#2D5C3F] rounded-full font-medium transition-colors text-sm whitespace-nowrap"
                        >
                          <span className="text-lg font-bold">+</span>
                          <span>Ajouter locataire</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {planType === 'connectee_plus' ? 'Synchronisation bancaire active' : 'Gestion automatique des quittances'}
                    </p>
                  </div>

                  {locataires.length > 0 ? (
                    <LocatairesTable
                    locataires={locataires}
                    planType={planType as 'automatique' | 'connectee_plus'}
                    onEditLocataire={(locataire) => setEditingLocataire(locataire)}
                    onEditRappel={(locataire) => setEditingRappel(locataire)}
                    onSendQuittance={handleSendQuittanceClick}
                    onSendReminder={handleSendReminderClick}
                    onDeleteLocataire={handleDeleteLocataire}
                    onConfigureDetection={handleConfigureDetection}
                    rentRules={rentRules}
                    bankConnection={bankConnection}
                    isSubscriptionActive={proprietaire?.abonnement_actif || false}
                    onProceedToPayment={handleProceedToPayment}
                    billingCycle={billingCycle}
                    onBillingCycleChange={setBillingCycle}
                  />
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-gray-600 mb-4 text-base">Aucun locataire enregistré</p>
                      <p className="text-base text-gray-500 mb-4">
                        Ajoutez votre premier locataire pour commencer à gérer vos quittances automatiquement.
                      </p>
                      <button
                        onClick={() => setShowAddLocataire(true)}
                        className="inline-block bg-[#7CAA89] hover:bg-[#6b9378] text-white rounded-full px-6 py-3 font-semibold transition-colors text-base"
                      >
                        Ajouter un locataire
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditProprietaire && proprietaire && (
        <EditProprietaireModal
          proprietaire={proprietaire}
          onClose={() => setShowEditProprietaire(false)}
          onSave={(updatedProprietaire) => {
            setProprietaire(updatedProprietaire);
            alert('✅ Informations mises à jour');
          }}
        />
      )}

      {editingLocataire && (
        <EditLocataireModal
          locataire={editingLocataire}
          onClose={() => setEditingLocataire(null)}
          onSave={async (updated) => {
            setLocataires(locataires.map(l => l.id === updated.id ? updated : l));
            setEditingLocataire(null);
          }}
        />
      )}

      {editingRappel && (
        <EditRappelModal
          locataire={editingRappel}
          onClose={() => setEditingRappel(null)}
          onSave={async (updates) => {
            await handleUpdateLocataire(editingRappel.id, updates);
            setEditingRappel(null);
          }}
        />
      )}

      {showAddLocataire && (
        <AddLocataireForm
          planType="auto"
          formData={addLocataireForm}
          onChange={handleAddLocataireChange}
          onSubmit={handleAddLocataireSubmit}
          onCancel={() => setShowAddLocataire(false)}
          isLoading={false}
          isBeforePayment={!proprietaire?.abonnement_actif}
        />
      )}

      {showReminderPreview && selectedLocataireForReminder && proprietaire && (
        <ReminderPreviewModal
          isOpen={showReminderPreview}
          onClose={() => {
            setShowReminderPreview(false);
            setSelectedLocataireForReminder(null);
          }}
          onConfirm={handleConfirmReminder}
          locataireName={`${selectedLocataireForReminder.nom} ${selectedLocataireForReminder.prenom || ''}`.trim()}
          baillorName={`${proprietaire.nom} ${proprietaire.prenom || ''}`.trim()}
          loyer={selectedLocataireForReminder.loyer_mensuel}
          charges={selectedLocataireForReminder.charges_mensuelles}
          adresseLogement={selectedLocataireForReminder.adresse_logement}
          isSending={isSending}
        />
      )}

      {configuringDetection && bankConnection && (
        <RentDetectionModal
          locataire={configuringDetection}
          bankConnectionId={bankConnection.id}
          onClose={() => setConfiguringDetection(null)}
          onSave={handleSaveDetectionConfig}
        />
      )}

      <BillingCycleModal
        isOpen={showBillingCycleModal}
        onClose={() => setShowBillingCycleModal(false)}
        onConfirm={handleBillingCycleConfirm}
        numberOfTenants={locataires.length}
        ownerInfoComplete={isProprietaireInfoComplete(proprietaire)}
        missingFieldsMessage={getMissingFieldsMessage(proprietaire)}
        selectedBillingCycle={billingCycle}
      />

      <PaymentWarningModal
        isOpen={showPaymentWarning}
        onClose={() => setShowPaymentWarning(false)}
        onContinue={handleConfirmPayment}
        missingFields={missingFields}
        planName={getPlanName()}
        planPrice={getPlanPrice()}
        billingCycle={pendingBillingCycle}
      />

      {previewQuittance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-[#2b2b2b]">Prévisualisation de la quittance</h2>
              <button
                onClick={() => setPreviewQuittance(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <QuittancePreview data={previewQuittance} />
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-6 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSendQuittance}
                  disabled={isSending}
                  className="flex-1 bg-[#7CAA89] hover:bg-[#6b9378] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 text-base"
                >
                  {isSending ? 'Envoi en cours...' : 'Envoyer au locataire'}
                </button>

                <button
                  onClick={async () => {
                    try {
                      const { generateQuittancePDF } = await import('../utils/pdfGenerator');
                      const pdfBlob = await generateQuittancePDF(previewQuittance);
                      const url = URL.createObjectURL(pdfBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Quittance_${previewQuittance.periode.replace(/\s/g, '_')}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Erreur téléchargement:', error);
                    }
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-base"
                >
                  Télécharger PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
