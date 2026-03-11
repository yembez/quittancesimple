import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Home, FileText, Download, Settings, Edit2, CreditCard, UserPlus, Building2, Lock, CheckCircle, Info, TrendingUp, Euro, Sparkles, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import QuittancePreview from '../components/QuittancePreview';
import EditProprietaireModal from '../components/EditProprietaireModal';
import EditLocataireModal from '../components/EditLocataireModal';
import EditRappelModal from '../components/EditRappelModal';
import ReminderPreviewModal from '../components/ReminderPreviewModal';
import AutomationConfigModal from '../components/AutomationConfigModal';
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
  date_fin_essai?: string;
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
  mode_envoi_quittance?: 'rappel_classique' | 'systematic_preavis_5j' | null;
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
  const { proprietaire: contextProprietaire, setActiveDashboardTab, refetchProprietaire } = useEspaceBailleur();
  const proprietaire = contextProprietaire as Proprietaire | null;
  const [activeTab, setActiveTab] = useState('dashboard');

  // Ouvrir l'onglet bilan annuel si on arrive via le lien sidebar (?tab=bilan-annuel)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'bilan-annuel') {
      setActiveTab('bilan-annuel');
    }
  }, [searchParams]);

  // Synchroniser l'onglet actif avec la sidebar (layout)
  useEffect(() => {
    setActiveDashboardTab(activeTab);
  }, [activeTab, setActiveDashboardTab]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [relances, setRelances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const hasCheckedSnapshotRef = useRef(false);
  const [previewQuittance, setPreviewQuittance] = useState<any>(null);
  const [showEditProprietaire, setShowEditProprietaire] = useState(false);
  const [editingLocataire, setEditingLocataire] = useState<Locataire | null>(null);
  const [editingRappel, setEditingRappel] = useState<Locataire | null>(null);
  const [showReminderPreview, setShowReminderPreview] = useState(false);
  const [selectedLocataireForReminder, setSelectedLocataireForReminder] = useState<Locataire | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showAddLocataire, setShowAddLocataire] = useState(false);
  const [automationDetailOpen, setAutomationDetailOpen] = useState<1 | 2 | null>(null);
  const [showAutomationConfigModal, setShowAutomationConfigModal] = useState(false);
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

  // Ouvrir le modal de relance si on arrive via le lien préavis (?openRelance=locataire_id)
  // On garde l'id en sessionStorage pour survivre à un redirect login (retour sans query)
  const openRelanceIdFromUrl = searchParams.get('openRelance');
  useEffect(() => {
    if (openRelanceIdFromUrl) {
      try {
        sessionStorage.setItem('openRelanceLocataireId', openRelanceIdFromUrl);
      } catch (_) {}
    }
  }, [openRelanceIdFromUrl]);

  useEffect(() => {
    const openRelanceId = openRelanceIdFromUrl || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('openRelanceLocataireId') : null);
    if (!openRelanceId || locataires.length === 0) return;
    const locataire = locataires.find((l) => l.id === openRelanceId);
    if (locataire) {
      try {
        sessionStorage.removeItem('openRelanceLocataireId');
      } catch (_) {}
      setSelectedLocataireForReminder(locataire);
      setShowReminderPreview(true);
      setActiveTab('dashboard');
      if (openRelanceIdFromUrl) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [openRelanceIdFromUrl, locataires, navigate]);

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
    if (!proprietaire?.id) return;
    if (proprietaire.plan_type === 'free') {
      navigate(`/free-dashboard?email=${encodeURIComponent(proprietaire.email || '')}`);
      return;
    }
    loadDashboardData(proprietaire.id);
  }, [proprietaire?.id, proprietaire?.plan_type, proprietaire?.email, navigate]);

  // Pré-remplissage "Wow" : si le lead a déjà généré une quittance gratuite (ex. CTA campagne), créer le 1er locataire depuis le snapshot
  useEffect(() => {
    if (!proprietaire?.id || loading || locataires.length > 0 || hasCheckedSnapshotRef.current) return;
    hasCheckedSnapshotRef.current = true;

    const applyFreeQuittanceSnapshot = async () => {
      const email = (proprietaire.email || '').trim().toLowerCase();
      if (!email) return;

      const { data: snapshot, error: snapErr } = await supabase
        .from('free_quittance_snapshots')
        .select('*')
        .eq('email', email)
        .is('applied_at', null)
        .maybeSingle();

      if (snapErr || !snapshot) return;

      // Pré-remplir le propriétaire (adresse, nom, prénom) si vides (effet "wow" campagne)
      const updates: { adresse?: string; nom?: string; prenom?: string } = {};
      if (snapshot.baillor_address && !(proprietaire.adresse || '').trim()) updates.adresse = String(snapshot.baillor_address).trim();
      if (snapshot.baillor_nom && !(proprietaire.nom || '').trim()) updates.nom = String(snapshot.baillor_nom).trim();
      if (snapshot.baillor_prenom && !(proprietaire.prenom || '').trim()) updates.prenom = String(snapshot.baillor_prenom).trim();
      if (Object.keys(updates).length > 0) {
        await supabase.from('proprietaires').update(updates).eq('id', proprietaire.id);
        refetchProprietaire?.();
      }

      const nom = (snapshot.locataire_nom || '').trim() || 'Locataire';
      const adresse = (snapshot.locataire_address || '').trim();
      if (!adresse) return;

      const { error: insertErr } = await supabase.from('locataires').insert({
        proprietaire_id: proprietaire.id,
        nom,
        prenom: (snapshot.locataire_prenom || '').trim() || null,
        email: null,
        telephone: null,
        adresse_logement: adresse,
        detail_adresse: null,
        loyer_mensuel: Number(snapshot.loyer) || 0,
        charges_mensuelles: Number(snapshot.charges) || 0,
        caution_initiale: null,
        date_rappel: 5,
        heure_rappel: 9,
        minute_rappel: 0,
        periodicite: 'mensuel',
        statut: 'en_attente',
        actif: true,
      });

      if (insertErr) {
        hasCheckedSnapshotRef.current = false;
        return;
      }

      await supabase
        .from('free_quittance_snapshots')
        .update({ applied_at: new Date().toISOString() })
        .eq('id', snapshot.id);

      await loadDashboardData(proprietaire.id);
    };

    applyFreeQuittanceSnapshot();
  }, [proprietaire?.id, proprietaire?.email, loading, locataires.length]);

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
        if (proprietaire?.id) {
          await loadDashboardData(proprietaire.id);
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

  const loadDashboardData = async (proprietaireId: string) => {
    try {
      setLoading(true);

      const { data: locatairesData } = await supabase
        .from('locataires')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .eq('actif', true);

      if (locatairesData) {
        setLocataires(locatairesData);
      }

      const { data: quittancesData } = await supabase
        .from('quittances')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .order('date_generation', { ascending: false })
        .limit(10);

      if (quittancesData) {
        setQuittances(quittancesData);
      }

      // Charger les relances récentes (dernière par locataire)
      const { data: relancesData } = await supabase
        .from('relances')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .order('date_envoi', { ascending: false });

      if (relancesData) {
        // Grouper par locataire et prendre la dernière relance
        const latestByLocataire = new Map<string, any>();
        relancesData.forEach(r => {
          const existing = latestByLocataire.get(r.locataire_id);
          if (!existing || new Date(r.date_envoi) > new Date(existing.date_envoi)) {
            latestByLocataire.set(r.locataire_id, r);
          }
        });
        setRelances(Array.from(latestByLocataire.values()));
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
          .eq('user_id', proprietaireId);

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

    // Calculer les dates de début et fin de période
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const periodeDebut = new Date(year, month, 1).toISOString().split('T')[0];
    const periodeFin = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Préparer les données au format attendu par generateQuittancePDF
    const quittanceData = {
      // Propriétaire (bailleur)
      baillorName: `${proprietaire.prenom || ''} ${proprietaire.nom}`.trim() || proprietaire.nom,
      baillorAddress: proprietaire.adresse || '',
      baillorEmail: proprietaire.email || '',
      // Locataire
      locataireName: `${locataire.prenom || ''} ${locataire.nom}`.trim() || locataire.nom,
      logementAddress: locataire.adresse_logement || '',
      locataireDomicileAddress: locataire.detail_adresse || '', // Adresse de domicile si différente
      // Montants
      loyer: locataire.loyer_mensuel.toString(),
      charges: locataire.charges_mensuelles.toString(),
      // Période
      periode: periode,
      dateDebut: periodeDebut,
      dateFin: periodeFin,
      // Options
      isProrata: false,
      typeCalcul: '',
      isElectronicSignature: true, // Signature électronique par défaut pour l'envoi manuel
      // Données supplémentaires pour l'envoi email et la base de données
      proprietaireNom: `${proprietaire.nom} ${proprietaire.prenom || ''}`.trim(),
      proprietaireAdresse: proprietaire.adresse,
      locataireNom: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
      locataireAdresse: locataire.adresse_logement,
      locataireDetailAdresse: locataire.detail_adresse || '',
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
        loadDashboardData(proprietaire.id);
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
        loadDashboardData(proprietaire.id);
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
          locataireName: [selectedLocataireForReminder.prenom, selectedLocataireForReminder.nom].filter(Boolean).join(' ') || selectedLocataireForReminder.nom,
          baillorName: [proprietaire.prenom, proprietaire.nom].filter(Boolean).join(' ') || proprietaire.nom,
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

      // Si quittance systématique en attente pour ce locataire + période courante : marquer reminder_sent et envoyer email confirmation
      try {
        const confirmRes = await fetch(`${supabaseUrl}/functions/v1/send-systematic-relance-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
          body: JSON.stringify({ locataireId: selectedLocataireForReminder.id }),
        });
        const confirmData = await confirmRes.json();
        if (confirmData.updated) {
          // Email de confirmation envoyé par la fonction
        }
      } catch (_) {
        // Ne pas bloquer l'UX si la confirmation systématique échoue
      }

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

      // Appeler la fonction edge pour générer le PDF avec le même template que l'envoi automatique
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/generate-quittance-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          baillorName: previewQuittance.baillorName,
          baillorAddress: previewQuittance.baillorAddress,
          baillorEmail: previewQuittance.baillorEmail,
          locataireName: previewQuittance.locataireName,
          logementAddress: previewQuittance.logementAddress,
          locataireDomicileAddress: previewQuittance.locataireDomicileAddress || '',
          loyer: previewQuittance.loyer,
          charges: previewQuittance.charges,
          periode: previewQuittance.periode,
          dateDebut: previewQuittance.dateDebut,
          dateFin: previewQuittance.dateFin,
          isProrata: previewQuittance.isProrata || false,
          isElectronicSignature: previewQuittance.isElectronicSignature !== undefined ? previewQuittance.isElectronicSignature : true
        })
      });

      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        throw new Error(`Erreur génération PDF: ${errorText}`);
      }

      const pdfResult = await pdfResponse.json();
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || 'Erreur génération PDF');
      }

      // Convertir le base64 en Blob
      const pdfBase64 = pdfResult.pdfBase64;
      const binaryString = atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pdfBlob = new Blob([bytes], { type: 'application/pdf' });

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

      const now = new Date().toISOString();
      const insertData = {
        proprietaire_id: proprietaire.id,
        locataire_id: previewQuittance.locataireData.id,
        periode_debut: periodeDebut,
        periode_fin: periodeFin,
        loyer: loyerNum,
        charges: chargesNum,
        date_generation: now,
        date_envoi: now,
        pdf_url: publicUrl,
        statut: 'envoyee',
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
      await loadDashboardData(proprietaire.id);
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

  const handleDisableAutomation = async () => {
    if (!proprietaire) return;

    if (!window.confirm("Voulez-vous vraiment désactiver l'automatisation des quittances pour tous vos locataires ?")) {
      return;
    }

    try {
      const updates = {
        date_rappel: null as unknown as number,
        heure_rappel: null as unknown as number,
        minute_rappel: null as unknown as number,
        mode_envoi_quittance: null as 'rappel_classique' | 'systematic_preavis_5j' | null,
      };

      const { error } = await supabase
        .from('locataires')
        .update(updates)
        .eq('proprietaire_id', proprietaire.id);

      if (error) throw error;

      setLocataires((prev) =>
        prev.map((l) => ({
          ...l,
          date_rappel: 0,
          heure_rappel: undefined,
          minute_rappel: undefined,
          mode_envoi_quittance: null,
        }))
      );

      alert('✅ Automatisation désactivée pour vos locataires.');
    } catch (error) {
      console.error('❌ Erreur désactivation automatisation:', error);
      alert("❌ Impossible de désactiver l'automatisation pour le moment.");
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
      loadDashboardData(proprietaire.id);
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

    if (count <= 2) return 'Pack Automatique (1-2 locataires)';
    if (count <= 5) return 'Pack Automatique (3-5 locataires)';
    return 'Pack Automatique (5+ locataires)';
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
      if (count <= 2) return '3,25 €/mois (39 €/an)';
      if (count <= 5) return '4,92 €/mois (59 €/an)';
      return '7,42 €/mois (89 €/an)';
    } else {
      if (count <= 2) return '3,90 €';
      if (count <= 5) return '5,90 €';
      return '8,90 €';
    }
  };

  const [resendingLink, setResendingLink] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

const handleResendAccessLink = async () => {
    try {
      let userEmail: string | null = null;

      // 1. Essayer depuis la session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        userEmail = session.user.email;
      }

      // 2. Essayer depuis le proprietaire
      if (!userEmail && proprietaire) {
        userEmail = proprietaire.email;
      }

      // 3. Essayer depuis l'URL (searchParams)
      if (!userEmail) {
        const emailFromUrl = searchParams.get('email');
        if (emailFromUrl) {
          userEmail = emailFromUrl;
        }
      }

      // 4. Essayer depuis localStorage
      if (!userEmail) {
        const emailFromStorage = localStorage.getItem('proprietaireEmail');
        if (emailFromStorage) {
          userEmail = emailFromStorage;
        }
      }

      // 5. En dernier recours, demander
      if (!userEmail) {
        const emailInput = prompt('Entrez votre email pour recevoir le lien d\'accès :');
        if (!emailInput) return;
        userEmail = emailInput;
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
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
          <p className="mt-4 text-[13px] text-[#5e6478]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!proprietaire) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#e8e7ef] p-6 sm:p-8">
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
                className="w-full px-6 py-3 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="mt-4 pt-4 border-t border-[#e8e7ef]">
              <p className="text-[12px] text-[#5e6478] text-center">
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

  // État global d'automatisation (pour la carte de synthèse)
  const hasAutomationConfig =
    locataires.length > 0 &&
    locataires.some(
      (l) =>
        typeof l.date_rappel === 'number' &&
        l.date_rappel > 0 &&
        typeof l.heure_rappel === 'number' &&
        typeof l.minute_rappel === 'number' &&
        !!l.mode_envoi_quittance
    );

  const firstConfiguredLocataire = hasAutomationConfig
    ? locataires.find(
        (l) =>
          typeof l.date_rappel === 'number' &&
          l.date_rappel > 0 &&
          typeof l.heure_rappel === 'number' &&
          typeof l.minute_rappel === 'number' &&
          !!l.mode_envoi_quittance
      ) || null
    : null;

  const prochaineQuittanceLabel = firstConfiguredLocataire
    ? `le ${firstConfiguredLocataire.date_rappel} de chaque mois à ${String(
        firstConfiguredLocataire.heure_rappel ?? 0
      ).padStart(2, '0')}:${String(firstConfiguredLocataire.minute_rappel ?? 0).padStart(2, '0')}`
    : null;

  return (
    <>
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Message de succès connexion bancaire */}
        {bankSuccessMessage && (
          <div className="bg-green-50 border-b border-green-200 px-4 sm:px-6 py-2">
            <div className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-800">{bankSuccessMessage}</p>
            </div>
          </div>
        )}

        {/* Contenu scrollable - style Overview (fafafa, spacing condensé) */}
        <main className="flex-1 min-w-0 bg-[#fafafa] px-4 sm:px-5 py-5 sm:py-6 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[67rem] mx-auto w-full min-w-0 flex flex-col gap-4">
          {/* Message conditionnel - onglet dashboard (titre déplacé dans le header) */}
          {proprietaire && activeTab === 'dashboard' && (
            <div className="min-w-0">
              {/* Message d'accueil si infos incomplètes — carte sobre type Overview */}
              {proprietaire.abonnement_actif && !isProprietaireInfoComplete(proprietaire) && (
                <div className="mt-4 p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-9 h-9 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#1e3a5f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#0f172a] mb-1">
                        Bienvenue et merci de nous rejoindre !
                      </p>
                      <p className="text-[13px] text-[#64748b] leading-relaxed">
                        Complétez vos informations ci-dessous et l'envoi de vos quittances sera automatisé… tout simplement.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {proprietaire.abonnement_actif && isProprietaireInfoComplete(proprietaire) && locataires.length === 0 && (
                <div className="mt-4 p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
                  <p className="text-[14px] font-semibold text-[#0f172a] mb-1">
                    Votre profil est complet
                  </p>
                  <p className="text-[13px] text-[#64748b] leading-relaxed">
                    Il ne vous reste plus qu'à ajouter votre premier locataire pour activer l'automatisation des quittances.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Main Content */}
          <div className="min-w-0 overflow-visible">
            {activeTab === 'bilan-annuel' && (
              <BilanAnnuel
                proprietaireId={proprietaire.id}
                locataires={locataires}
              />
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-4 min-w-0">
                {/* Carte Automatisation des quittances (inspirée du modèle) */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-visible min-w-0 p-5 sm:p-6">
                  {hasAutomationConfig ? (
                    <>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#212a3e]">
                            Automatisation des quittances{' '}
                            <span className="text-green-700">activée</span>
                          </h2>
                        </div>
                      </div>

                      {prochaineQuittanceLabel && firstConfiguredLocataire && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-[#166534]">
                            <span className="font-semibold">Prochaine quittance :</span>{' '}
                            {prochaineQuittanceLabel}
                          </p>
                          <p className="text-xs text-[#166534] mt-1">
                            Mode :{' '}
                            {firstConfiguredLocataire.mode_envoi_quittance === 'systematic_preavis_5j'
                              ? 'Automatique avec préavis 5 jours'
                              : 'Rappel puis validation en un clic'}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAutomationConfigModal(true)}
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-[#cbd5e1] text-[14px] font-medium text-[#1e293b] bg-white hover:bg-[#f8fafc] transition-colors"
                        >
                          Modifier les paramètres
                        </button>
                        <button
                          type="button"
                          onClick={handleDisableAutomation}
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-red-200 text-[14px] font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Désactiver l'automatisation
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-[#E65F3F]" aria-hidden />
                        <h2 className="text-lg font-bold text-[#212a3e]">
                          Activer l'automatisation des quittances
                        </h2>
                      </div>
                      <p className="text-[14px] text-[#5e6478] mb-2">
                        Au choix :
                      </p>
                      <ul className="list-none space-y-2 mb-4 text-[14px] text-[#5e6478]">
                        <li className="flex flex-wrap items-baseline gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E65F3F] flex-shrink-0 mt-1.5 self-start" aria-hidden />
                          <span>
                            <strong>100% Automatique</strong> (on vous envoie un rappel 5 jours avant l'envoi)
                            <span
                              className="relative inline-block ml-1 align-baseline"
                              onMouseEnter={() => setAutomationDetailOpen(1)}
                              onMouseLeave={() => setAutomationDetailOpen(null)}
                            >
                              <span
                                role="button"
                                tabIndex={0}
                                className="text-[#E65F3F] hover:text-[#d95530] underline font-medium cursor-help"
                                onFocus={() => setAutomationDetailOpen(1)}
                                onBlur={() => setAutomationDetailOpen(null)}
                              >
                                Détail
                              </span>
                              {automationDetailOpen === 1 && (
                                <div className="absolute left-0 top-full mt-1 z-20 min-w-[260px] max-w-[360px] p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] leading-relaxed shadow-lg">
                                  Vous recevez un email 5 jours avant l'envoi réel.<br />Sans action de votre part sous 5 jours, la quittance part automatiquement.<br />Pour garder le contrôle, il y a 3 boutons dans le mail : « Annuler », « Relancer le locataire », ou « Envoyer la quittance manuellement ».
                                </div>
                              )}
                            </span>
                          </span>
                        </li>
                        <li>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E65F3F] flex-shrink-0" aria-hidden />
                          Ou bien :
                        </li>
                        <li className="flex flex-wrap items-baseline gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E65F3F] flex-shrink-0 mt-1.5 self-start" aria-hidden />
                          <span>
                            <strong>En un clic</strong> dans le SMS ou l'e-mail de rappel
                            <span
                              className="relative inline-block ml-1 align-baseline"
                              onMouseEnter={() => setAutomationDetailOpen(2)}
                              onMouseLeave={() => setAutomationDetailOpen(null)}
                            >
                              <span
                                role="button"
                                tabIndex={0}
                                className="text-[#E65F3F] hover:text-[#d95530] underline font-medium cursor-help"
                                onFocus={() => setAutomationDetailOpen(2)}
                                onBlur={() => setAutomationDetailOpen(null)}
                              >
                                Détail
                              </span>
                              {automationDetailOpen === 2 && (
                                <div className="absolute left-0 top-full mt-1 z-20 min-w-[260px] max-w-[360px] p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] leading-relaxed shadow-lg">
                                  Pour plus de contrôle : Vous recevez un rappel (SMS/email) à la date programmée, puis vous envoyez la quittance en un clic dans le SMS ou le mail.
                                </div>
                              )}
                            </span>
                          </span>
                        </li>
                      </ul>
                      <div className="mb-1">
                        {proprietaire?.abonnement_actif ? (
                          <button
                            type="button"
                            onClick={() => setShowAutomationConfigModal(true)}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#E65F3F] hover:bg-[#d95530] text-white font-semibold text-[15px] transition-colors shadow-sm"
                          >
                            Paramétrer l'automatisation
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/automation')}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#E65F3F] hover:bg-[#d95530] text-white font-semibold text-[15px] transition-colors shadow-sm"
                          >
                            Activer l'automatisation
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Section Informations Bailleur */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden min-w-0">
                  <div className="px-4 sm:px-5 py-3 border-b border-[#e8e7ef] flex items-center gap-2">
                    <h2 className="text-[15px] font-bold text-[#212a3e]">
                      Informations Bailleur
                    </h2>
                    {!isProprietaireInfoComplete(proprietaire) ? (
                      <button
                        onClick={() => setShowEditProprietaire(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E65F3F] hover:bg-[#d95530] text-white text-xs font-medium transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Compléter</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowEditProprietaire(true)}
                        className="flex items-center gap-1.5 text-[13px] text-[#64748b] hover:text-[#0f172a] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[14px] min-w-0">
                    <div className="min-w-0 overflow-hidden">
                      <span className="text-[#64748b]">Nom</span>
                      <p className="font-medium text-[#0f172a] break-words">{proprietaire?.nom} {proprietaire?.prenom}</p>
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <span className="text-[#64748b]">Email</span>
                      <p className="font-medium text-[#0f172a] break-all">{proprietaire?.email}</p>
                    </div>
                    <div className="min-w-0 overflow-hidden sm:col-span-2">
                      <span className="text-[#64748b]">Adresse</span>
                      <p className="font-medium text-[#0f172a] break-words whitespace-normal">
                        {proprietaire?.adresse}
                      </p>
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <span className="text-[#64748b]">Téléphone</span>
                      {proprietaire?.telephone?.trim() ? (
                        <p className="font-medium text-[#0f172a] break-words">
                          {proprietaire.telephone}
                        </p>
                      ) : (
                        <p className="font-medium break-words">
                          <span className="inline-block bg-amber-50 border border-amber-200 rounded px-2 py-0.5 text-amber-700">
                            Non renseigné
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Connexion bancaire - Uniquement pour le Plan Connectée+ */}
                  {planType === 'connectee_plus' && (
                    <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                      {!bankConnection ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-5 h-5 text-[#7CAA89]" />
                              <h3 className="text-[14px] font-semibold text-[#151b2c]">Synchronisation bancaire</h3>
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
                            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <Building2 className="w-5 h-5" />
                            <span>{connectingBank ? 'Connexion en cours...' : 'Connecter compte bancaire'}</span>
                          </button>

                          <div className="mt-2 flex items-start space-x-2 text-[12px] text-[#5e6478]">
                            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#7CAA89]" />
                            <p className="leading-relaxed">
                              Connexion sécurisée via <strong>Powens</strong>, prestataire agréé Banque de France conformément à la directive européenne DSP2.
                              Nous n'avons jamais accès à vos identifiants bancaires, et aucune donnée bancaire n'est stockée.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <h3 className="text-[14px] font-semibold text-[#151b2c]">Banque connectée (lecture seule)</h3>
                            </div>
                          </div>
{/* Bouton déconnecter */}
<div className="mt-2">
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
    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 font-medium text-[13px] transition-colors"
  >
    <span>Déconnecter la banque</span>
  </button>
</div>

                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Building2 className="w-5 h-5 text-green-600" />
                              <p className="font-medium text-green-900 text-[13px]">{bankConnection.institution_name}</p>
                            </div>
                            <p className="text-[12px] text-green-700">
                              Dernière synchro : {new Date(bankConnection.last_sync || bankConnection.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
{/* 🔥 Monitoring des dernières transactions */}
{recentTransactions.length > 0 && (
  <div className="mt-3 border border-[#e2e8f0] rounded-lg p-3 bg-[#f8fafc]">
    <h4 className="text-[14px] font-semibold text-[#151b2c] mb-2">📊 Derniers paiements détectés</h4>

    <ul className="divide-y divide-[#e2e8f0]">
      {recentTransactions.map((tx) => (
        <li key={tx.id} className="py-1.5 flex justify-between items-center">
          <div>
            <p className="text-[#151b2c] font-medium text-[13px]">{tx.description || tx.label}</p>
            <p className="text-[12px] text-[#5e6478]">
              {new Date(tx.date).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <p className={`text-[13px] font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {tx.amount} €
          </p>
        </li>
      ))}
    </ul>
  </div>
)}

                          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-[13px] text-blue-900 font-medium mb-1">✅ Banque connectée</p>
                            <p className="text-[12px] text-blue-700">
                              Cliquez sur <strong>"Détecter le loyer"</strong> dans chaque fiche locataire pour activer la détection automatique des loyers.
                            </p>
                          </div>
                          {bankConnection && latestTransactions.length > 0 && (
          <div className="mt-3 bg-white border border-[#e2e8f0] rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-[#7CAA89]" />
              <h3 className="text-[14px] font-semibold text-[#151b2c]">Derniers paiements détectés</h3>
            </div>

            <div className="space-y-2">
              {latestTransactions.map((tx) => (
                <div 
                  key={tx.transaction_id} 
                  className="flex items-center justify-between border-b border-[#e8e7ef] pb-1.5"
                >
                  <div>
                    <p className="font-medium text-[#151b2c] text-[13px]">{tx.description || tx.label}</p>
                    <p className="text-[11px] text-[#5e6478]">
                      {new Date(tx.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`text-[13px] font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount} €
                    </p>
                    {tx.sender_name && (
                      <p className="text-[11px] text-[#5e6478]">{tx.sender_name}</p>
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
                </div>

                {/* Section Mes locataires — tableau actuel conservé tel quel */}
                <div id="mes-locataires" className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden min-w-0">
                  <div className="px-4 sm:px-5 py-3 border-b border-[#1e3a5f]/50 bg-[#1e3a5f]/10 flex items-center gap-2">
                    <h2 className="text-[13px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Mes locataires</h2>
                    {locataires.length > 0 && (
                      <button
                        onClick={() => setShowAddLocataire(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white text-xs font-medium transition-colors"
                      >
                        <span className="text-sm font-bold">+</span>
                        <span>Ajouter locataire</span>
                      </button>
                    )}
                  </div>
                  <div className="min-w-0">

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
                    quittances={quittances}
                    relances={relances}
                  />
                  ) : (
                    <div className="px-4 sm:px-5 py-8 text-center">
                      <p className="text-[14px] text-[#64748b]">Aucun locataire enregistré</p>
                      <p className="text-[13px] text-[#64748b] mt-1 mb-3">
                        Ajoutez votre premier locataire pour commencer à gérer vos quittances automatiquement.
                      </p>
                      <button
                        onClick={() => setShowAddLocataire(true)}
                        className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white text-[13px] font-medium transition-colors"
                      >
                        Ajouter un locataire
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}

          </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showEditProprietaire && proprietaire && (
        <EditProprietaireModal
          proprietaire={proprietaire}
          onClose={() => setShowEditProprietaire(false)}
          onSave={async () => {
            await refetchProprietaire();
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
          bailleurTelephone={proprietaire?.telephone}
          onClose={() => setEditingRappel(null)}
          onSave={async (updates) => {
            await handleUpdateLocataire(editingRappel.id, updates);
            setEditingRappel(null);
          }}
        />
      )}

      {proprietaire && (
        <AutomationConfigModal
          isOpen={showAutomationConfigModal}
          onClose={() => setShowAutomationConfigModal(false)}
          proprietaireId={proprietaire.id}
          locataires={locataires}
          onSuccess={(updates) => {
            setLocataires((prev) =>
              prev.map((l) => ({
                ...l,
                date_rappel: updates.date_rappel,
                heure_rappel: updates.heure_rappel,
                minute_rappel: updates.minute_rappel,
                mode_envoi_quittance: updates.mode_envoi_quittance,
              }))
            );
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
          locataireName={[selectedLocataireForReminder.prenom, selectedLocataireForReminder.nom].filter(Boolean).join(' ') || selectedLocataireForReminder.nom}
          baillorName={[proprietaire.prenom, proprietaire.nom].filter(Boolean).join(' ') || proprietaire.nom}
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
          <div className="bg-white rounded-lg max-w-[67rem] w-full my-8 shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-lg">
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

            <div className="border-t border-gray-200 bg-gray-50 p-6 rounded-b-lg">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSendQuittance}
                  disabled={isSending}
                  className="flex-1 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white px-6 py-3 rounded-md font-semibold transition-colors disabled:opacity-50 text-base"
                >
                  {isSending ? 'Envoi en cours...' : 'Envoyer au locataire'}
                </button>

                <button
                  onClick={async () => {
                    try {
                      // Utiliser le même générateur que l'envoi automatique
                      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                      const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/generate-quittance-pdf`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${supabaseKey}`
                        },
                        body: JSON.stringify({
                          baillorName: previewQuittance.baillorName,
                          baillorAddress: previewQuittance.baillorAddress,
                          baillorEmail: previewQuittance.baillorEmail,
                          locataireName: previewQuittance.locataireName,
                          logementAddress: previewQuittance.logementAddress,
                          locataireDomicileAddress: previewQuittance.locataireDomicileAddress || '',
                          loyer: previewQuittance.loyer,
                          charges: previewQuittance.charges,
                          periode: previewQuittance.periode,
                          dateDebut: previewQuittance.dateDebut,
                          dateFin: previewQuittance.dateFin,
                          isProrata: previewQuittance.isProrata || false,
                          isElectronicSignature: previewQuittance.isElectronicSignature !== undefined ? previewQuittance.isElectronicSignature : true
                        })
                      });

                      if (!pdfResponse.ok) {
                        throw new Error('Erreur génération PDF');
                      }

                      const pdfResult = await pdfResponse.json();
                      if (!pdfResult.success) {
                        throw new Error(pdfResult.error || 'Erreur génération PDF');
                      }

                      // Convertir le base64 en Blob
                      const pdfBase64 = pdfResult.pdfBase64;
                      const binaryString = atob(pdfBase64);
                      const bytes = new Uint8Array(binaryString.length);
                      for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                      }
                      const pdfBlob = new Blob([bytes], { type: 'application/pdf' });

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
                      alert('Erreur lors du téléchargement du PDF');
                    }
                  }}
                  className="flex-1 bg-[#212a3e] hover:bg-[#1a1f2e] text-white px-6 py-3 rounded-md font-semibold transition-colors text-base"
                >
                  Télécharger PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
