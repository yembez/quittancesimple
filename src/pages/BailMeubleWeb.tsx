import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, AlertCircle, CheckCircle, HelpCircle, X, FileText, Clock, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import { supabase } from '../lib/supabase';
import { uploadPrivateDocument } from '../utils/privateStorage';

interface SignatureRequest {
  id: string;
  bail_id: string;
  status: 'pending' | 'signed' | 'expired' | 'correction_requested';
  document_url: string;
  signers: Array<{ name: string; role: string; status: string; signed_at: string | null }>;
  owner_signature: { owner_name?: string };
  created_at: string;
  completed_at: string | null;
  audit?: Array<{
    type: string;
    comment?: string;
    created_at?: string;
    signer_name?: string;
  }>;
}

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  adresse?: string;
}

// Types pour les données du bail
interface BailData {
  // I. Désignation des parties
  bailleur_type: 'physique' | 'morale' | '';
  bailleur_nom: string;
  bailleur_denomination: string;
  societe_familiale: 'oui' | 'non' | '';
  bailleur_adresse: string;
  bailleur_email: string;
  mandataire_present: 'oui' | 'non' | '';
  mandataire_nom: string;
  mandataire_denomination: string;
  mandataire_adresse: string;
  mandataire_activite: string;
  mandataire_carte: string;
  garant_info: string;
  garant_email: string;
  garant_telephone: string;
  locataire_nom: string;
  locataire_nom_2: string;
  locataire_adresse: string;
  locataire_adresse_2: string;
  locataire_email: string;
  locataire_telephone: string;
  locataire_email_2: string;
  locataire_telephone_2: string;
  
  // II. Objet du contrat
  logement_adresse: string;
  identifiant_fiscal: string;
  immeuble_type: 'collectif' | 'individuel' | '';
  propriete_type: 'mono' | 'copropriete' | '';
  periode_construction: string;
  surface_habitable: string;
  nombre_pieces: string;
  autres_parties: string[];
  autres_parties_detail: string;
  equipements: string;
  chauffage_type: 'individuel' | 'collectif' | '';
  chauffage_modalites: string;
  eau_chaude_type: 'individuel' | 'collectif' | '';
  eau_chaude_modalites: string;
  destination: 'habitation' | 'mixte' | '';
  cave_numero: string;
  parking_numero: string;
  garage_numero: string;
  autres_privatifs: string;
  locaux_communs: string[];
  autres_communs: string;
  equipements_tic: string;
  dpe_classe: string;
  
  // III. Date et durée
  date_effet_jour: string;
  date_effet_mois: string;
  date_effet_annee: string;
  duree_contrat: '1an' | '3ans' | '6ans' | 'reduite' | '';
  duree_reduite_valeur: string;
  duree_reduite_raison: string;
  
  // III bis. Mobilier et équipements meublés (spécifique au bail meublé)
  mobilier_description: string;
  inventaire_present: 'oui' | 'non' | '';
  inventaire_date: string;
  etat_mobilier: string;
  
  // IV. Conditions financières
  loyer_mensuel: string;
  loyer_soumis_decret: 'oui' | 'non' | '';
  loyer_reference: 'oui' | 'non' | '';
  loyer_reference_montant: string;
  loyer_reference_majore: string;
  complement_loyer: string;
  loyer_dernier_locataire: string;
  revision_jour: string;
  revision_mois: string;
  revision_annee: string;
  irl_reference: string;
  charges_modalite: 'provisions' | 'periodique' | 'forfait' | '';
  montant_charges: string;
  revision_forfait_charges: string;
  contribution_economies: string;
  justification_travaux: string;
  assurance_colocataires: 'oui' | 'non' | '';
  assurance_montant_annuel: string;
  assurance_montant_mensuel: string;
  periodicite_paiement: string;
  paiement_type: 'echoir' | 'echu' | '';
  date_paiement: string;
  lieu_paiement: string;
  premiere_echeance_loyer: string;
  premiere_echeance_charges: string;
  premiere_echeance_contribution: string;
  premiere_echeance_assurance: string;
  
  // V. Travaux
  travaux_amelioration: string;
  majoration_travaux: string;
  diminution_travaux: string;
  
  // VI. Garanties
  depot_garantie: string;
  
  // IX. Honoraires
  plafond_honoraires_bail: string;
  plafond_honoraires_edl: string;
  honoraires_bailleur_bail: string;
  honoraires_bailleur_edl: string;
  honoraires_bailleur_autres: string;
  honoraires_locataire_bail: string;
  honoraires_locataire_edl: string;
  
  // X. Autres conditions
  conditions_particulieres: string;
  
  // Signatures
  signature_jour: string;
  signature_mois: string;
  signature_annee: string;
  signature_lieu: string;
}

const defaultBailData: BailData = {
  bailleur_type: '',
  bailleur_nom: '',
  bailleur_denomination: '',
  societe_familiale: '',
  bailleur_adresse: '',
  bailleur_email: '',
  mandataire_present: '',
  mandataire_nom: '',
  mandataire_denomination: '',
  mandataire_adresse: '',
  mandataire_activite: '',
  mandataire_carte: '',
  garant_info: '',
  garant_email: '',
  garant_telephone: '',
  locataire_nom: '',
  locataire_nom_2: '',
  locataire_adresse: '',
  locataire_adresse_2: '',
  locataire_email: '',
  locataire_telephone: '',
  locataire_email_2: '',
  locataire_telephone_2: '',
  logement_adresse: '',
  identifiant_fiscal: '',
  immeuble_type: '',
  propriete_type: '',
  periode_construction: '',
  surface_habitable: '',
  nombre_pieces: '',
  autres_parties: [],
  autres_parties_detail: '',
  equipements: '',
  chauffage_type: '',
  chauffage_modalites: '',
  eau_chaude_type: '',
  eau_chaude_modalites: '',
  destination: '',
  cave_numero: '',
  parking_numero: '',
  garage_numero: '',
  autres_privatifs: '',
  locaux_communs: [],
  autres_communs: '',
  equipements_tic: '',
  dpe_classe: '',
  date_effet_jour: '',
  date_effet_mois: '',
  date_effet_annee: '',
  duree_contrat: '',
  duree_reduite_valeur: '',
  duree_reduite_raison: '',
  mobilier_description: '',
  inventaire_present: '',
  inventaire_date: '',
  etat_mobilier: '',
  loyer_mensuel: '',
  loyer_soumis_decret: '',
  loyer_reference: '',
  loyer_reference_montant: '',
  loyer_reference_majore: '',
  complement_loyer: '',
  loyer_dernier_locataire: '',
  revision_jour: '',
  revision_mois: '',
  revision_annee: '',
  irl_reference: '',
  charges_modalite: '',
  montant_charges: '',
  revision_forfait_charges: '',
  contribution_economies: '',
  justification_travaux: '',
  assurance_colocataires: '',
  assurance_montant_annuel: '',
  assurance_montant_mensuel: '',
  periodicite_paiement: '',
  paiement_type: '',
  date_paiement: '',
  lieu_paiement: '',
  premiere_echeance_loyer: '',
  premiere_echeance_charges: '',
  premiere_echeance_contribution: '',
  premiere_echeance_assurance: '',
  travaux_amelioration: '',
  majoration_travaux: '',
  diminution_travaux: '',
  depot_garantie: '',
  plafond_honoraires_bail: '',
  plafond_honoraires_edl: '',
  honoraires_bailleur_bail: '',
  honoraires_bailleur_edl: '',
  honoraires_bailleur_autres: '',
  honoraires_locataire_bail: '',
  honoraires_locataire_edl: '',
  conditions_particulieres: '',
  signature_jour: '',
  signature_mois: '',
  signature_annee: '',
  signature_lieu: '',
};

const STORAGE_KEY = 'bail_meuble_web_draft';
const STORAGE_KEY_SAVED_LIST = 'bail_meuble_saved_list';
const STORAGE_KEY_SIGNATURE_BAIL_ID = 'bail_meuble_signature_bail_id';

interface SavedBailItem {
  id: string;
  label: string;
  data: BailData;
  createdAt: number;
}

type ValidationPayload = {
  id: string;
  sourcePath: '/bail' | '/bail-meuble';
  ownerName: string;
  documentUrl: string;
  summary: {
    title: string;
    noms: string;
    adresse: string;
    loyer: string;
    charges: string;
    dateEffet: string;
    typeBail: string;
  };
  signers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'locataire' | 'co-locataire' | 'garant';
  }>;
};

// Composant Tooltip - masqué lors de l'export PDF via la classe 'hide-on-export'
// Bulle à gauche de l'icône et typo lisible pour ne pas être cachée par les containers (overflow)
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  
  return (
    <span className="relative inline-flex items-center">
      {children}
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none hide-on-export"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {show && (
        <span role="tooltip" className="absolute right-full mr-2 top-1/2 -translate-y-1/2 left-auto z-[100] w-72 max-w-[90vw] block p-3 bg-gray-900 text-white text-sm leading-relaxed rounded-lg shadow-xl hide-on-export">
          {text}
          <span className="absolute -right-1 top-1/2 -translate-y-1/2 block w-2 h-2 bg-gray-900 rotate-45" aria-hidden />
        </span>
      )}
    </span>
  );
};

// Composant Checkbox inline - aligné sur la ligne de texte
const InlineCheckbox: React.FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <label 
    className="inline-flex items-center cursor-pointer mr-3"
    style={{ lineHeight: '1.4' }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-3.5 h-3.5 border border-gray-500 rounded-sm text-[#1e3a5f] focus:ring-[#1e3a5f] focus:ring-1"
    />
    <span className="ml-1.5 text-base text-gray-800">{label}</span>
  </label>
);

// Composant Input inline - style épuré avec soulignement
const InlineInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string;
  type?: string;
}> = ({ value, onChange, placeholder = '', width = 'w-48', type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`${width} inline border-b border-gray-500 focus:border-[#1e3a5f] bg-transparent outline-none transition-colors bail-input`}
    style={{ 
      fontSize: 'inherit',
      lineHeight: 'inherit',
      padding: '0 2px',
    }}
  />
);

// Composant Textarea inline - cadre simple
const InlineTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}> = ({ value, onChange, placeholder = '', rows = 2 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-2 py-1 border border-gray-500 rounded focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] bg-transparent outline-none resize-none transition-colors bail-input"
    style={{ 
      fontSize: 'inherit',
      lineHeight: '1.3',
    }}
  />
);

// Dimensions A4 en pixels (96 DPI) - format exact pour capture PDF
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const A4_PADDING_PX = 48; // ~12mm padding

// Composant Page A4 - hauteur fixe pour correspondre exactement au format A4
const A4Page: React.FC<{ children: React.ReactNode; pageNumber?: number; totalPages?: number }> = ({ children, pageNumber, totalPages = 11 }) => (
  <div 
    className="a4-page bg-white shadow-lg border border-gray-200 mb-8 relative print:shadow-none print:border-0 print:mb-0"
    data-page-number={pageNumber}
    style={{ 
      width: `${A4_WIDTH_PX}px`,
      height: `${A4_HEIGHT_PX}px`, // Hauteur FIXE pour éviter compression
      padding: `${A4_PADDING_PX}px`,
      lineHeight: '1.55',
      color: '#1a1a1a',
      boxSizing: 'border-box',
      overflow: 'visible',
      position: 'relative',
    }}
  >
    <div style={{ height: '100%', overflow: 'visible' }}>
      {children}
    </div>
    {pageNumber && (
      <div 
        className="absolute text-gray-400"
        style={{ bottom: '16px', right: '24px', fontSize: '9px' }}
      >
        Page {pageNumber} / {totalPages}
      </div>
    )}
  </div>
);

export default function BailMeubleWeb() {
  const navigate = useNavigate();
  const location = useLocation();
  const { proprietaire } = useEspaceBailleur();
  const [data, setData] = useState<BailData>(defaultBailData);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'creer' | 'sauvegardes' | 'signatures'>('creer');
  const [savedList, setSavedList] = useState<SavedBailItem[]>([]);
  const [savedFeedback, setSavedFeedback] = useState<false | 'Téléchargé'>(false);
  const [signatureBailId, setSignatureBailId] = useState<string | null>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const [currentBailSignatureStatus, setCurrentBailSignatureStatus] = useState<'draft' | 'pending' | 'signed' | 'correction_requested'>('draft');
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [cancellingBailId, setCancellingBailId] = useState<string | null>(null);
  const isEditingLocked = currentBailSignatureStatus === 'pending';

  /** Libellé bail : Nom de famille bailleur – noms de famille locataires */
  const getBailFamilyNamesLabel = (req: SignatureRequest) => {
    const family = (name: string) => {
      const s = String(name ?? '').trim();
      if (!s) return '';
      const parts = s.split(/\s+/);
      return parts[parts.length - 1] || s;
    };
    const owner = family(req.owner_signature?.owner_name ?? '');
    const locataires = (req.signers ?? []).map((s) => family(s.name)).filter(Boolean);
    const parts = [owner, ...locataires].filter(Boolean);
    return parts.join(' – ') || 'Bail';
  };

  const handleCancelSignatureFromTab = async (bailId: string) => {
    if (!window.confirm('Annuler cette demande de signature ? Les liens envoyés aux signataires ne seront plus valides.')) return;
    setCancellingBailId(bailId);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('signatures-cancel', {
        body: { bail_id: bailId },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      await loadSignatureRequests();
    } catch (_) {
      setError('Erreur lors de l’annulation de la signature');
    } finally {
      setCancellingBailId(null);
    }
  };

  // Venir sur le WebMirror pour une modification (depuis la page Signatures)
  useEffect(() => {
    const correctionBailId = (location.state as { correctionBailId?: string } | null)?.correctionBailId;
    if (correctionBailId) {
      setSignatureBailId(correctionBailId);
      setCurrentBailSignatureStatus('draft');
    }
  }, [location.state]);

  // Pré-remplir les champs bailleur avec les infos du propriétaire connecté
  useEffect(() => {
    if (!proprietaire) return;
    setData((prev) => ({
      ...prev,
      bailleur_nom: prev.bailleur_nom || [proprietaire.prenom, proprietaire.nom].filter(Boolean).join(' ') || proprietaire.nom || '',
      bailleur_email: prev.bailleur_email || proprietaire.email || '',
      bailleur_adresse: prev.bailleur_adresse || proprietaire.adresse || '',
    }));
  }, [proprietaire]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SAVED_LIST);
      if (raw) {
        const list = JSON.parse(raw) as SavedBailItem[];
        setSavedList(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error('Erreur parsing saved list:', e);
    }
  }, []);

  const loadSignatureStatus = useCallback(async () => {
    if (!signatureBailId) return;
    try {
      const { data: rows } = await supabase
        .from('signature_requests')
        .select('status')
        .eq('bail_id', signatureBailId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (rows && rows.length > 0) {
        setCurrentBailSignatureStatus(rows[0].status as 'pending' | 'signed' | 'correction_requested');
      }
    } catch (_) {}
  }, [signatureBailId]);

  const loadSignatureRequests = useCallback(async () => {
    setLoadingSignatures(true);
    try {
      const { data: rows } = await supabase
        .from('signature_requests')
        .select('*')
        .order('created_at', { ascending: false });
      setSignatureRequests((rows ?? []) as SignatureRequest[]);
    } catch (_) {}
    setLoadingSignatures(false);
  }, []);

  useEffect(() => {
    loadSignatureStatus();
  }, [loadSignatureStatus]);

  useEffect(() => {
    if (activeTab === 'signatures' || activeTab === 'sauvegardes') loadSignatureRequests();
  }, [activeTab, loadSignatureRequests]);

  const persistSavedList = (list: SavedBailItem[]) => {
    setSavedList(list);
    localStorage.setItem(STORAGE_KEY_SAVED_LIST, JSON.stringify(list));
  };

  /** Nom du bail : bailleur + locataires (noms de famille) + date. Même libellé partout (Baux sauvegardés + Mes documents). */
  const getBailDisplayName = (bailData: BailData) => {
    const family = (name: string) => {
      const s = String(name ?? '').trim();
      if (!s) return '';
      const parts = s.split(/\s+/);
      return parts[parts.length - 1] || s;
    };
    const names = [
      family(bailData.bailleur_nom),
      family(bailData.locataire_nom),
      family(bailData.locataire_nom_2),
    ].filter(Boolean);
    const namesStr = names.length ? names.join(', ') : 'Sans nom';
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `Bail meublé - ${namesStr} - ${day}-${month}-${year} ${hour}-${min}`;
  };

  const handleSauver = async () => {
    const label = getBailDisplayName(data);
    const item: SavedBailItem = { id: crypto.randomUUID(), label, data: { ...data }, createdAt: Date.now() };
    persistSavedList([item, ...savedList]);
    setSavedFeedback('Téléchargé');
    setTimeout(() => setSavedFeedback(false), 2000);
    try {
      await handleExportPDF({ download: false, uploadToDocuments: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur envoi vers Mes documents');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEffacer = () => {
    if (window.confirm('Effacer toutes les données du formulaire ? Le brouillon sera supprimé.')) {
      const bailleurFromProprio = proprietaire
        ? {
            bailleur_nom: [proprietaire.prenom, proprietaire.nom].filter(Boolean).join(' ') || proprietaire.nom || '',
            bailleur_email: proprietaire.email || '',
            bailleur_adresse: proprietaire.adresse || '',
          }
        : {};
      setData({ ...defaultBailData, ...bailleurFromProprio });
      localStorage.removeItem(STORAGE_KEY);
      setError(null);
      setSignatureBailId(null);
      setCurrentBailSignatureStatus('draft');
      setActiveTab('creer');
      setSignatureRequests([]);
    }
  };

  const loadSavedBail = (item: SavedBailItem) => {
    setData({ ...defaultBailData, ...item.data });
    setActiveTab('creer');
  };

  /** Charge le bail en réinitialisant uniquement locataire(s) et garant pour réutiliser comme modèle (changement de locataire, même logement). */
  const loadSavedBailAsModel = (item: SavedBailItem) => {
    const base = { ...defaultBailData, ...item.data };
    setData({
      ...base,
      locataire_nom: '',
      locataire_nom_2: '',
      locataire_adresse: '',
      locataire_adresse_2: '',
      locataire_email: '',
      locataire_telephone: '',
      locataire_email_2: '',
      locataire_telephone_2: '',
      garant_info: '',
      garant_email: '',
      garant_telephone: '',
    });
    setActiveTab('creer');
  };

  const deleteSavedBail = (id: string) => {
    persistSavedList(savedList.filter((i) => i.id !== id));
  };

  /** Charge un bail signé comme modèle (données stockées à l'envoi en signature). Réinitialise locataire(s) et garant. */
  const loadSignedBailAsModel = (bailId: string) => {
    try {
      const raw = localStorage.getItem(`bail_meuble_data_${bailId}`);
      if (!raw) return;
      const stored = JSON.parse(raw) as BailData;
      const base = { ...defaultBailData, ...stored };
      setData({
        ...base,
        locataire_nom: '',
        locataire_nom_2: '',
        locataire_adresse: '',
        locataire_adresse_2: '',
        locataire_email: '',
        locataire_telephone: '',
        locataire_email_2: '',
        locataire_telephone_2: '',
        garant_info: '',
        garant_email: '',
        garant_telephone: '',
      });
      setActiveTab('creer');
    } catch {
      // Données absentes ou invalides (ex. bail ancien)
    }
  };

  // Sauvegarder dans localStorage à chaque changement (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [data]);

  const updateField = <K extends keyof BailData>(field: K, value: BailData[K]) => {
    if (isEditingLocked) return;
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'autres_parties' | 'locaux_communs', item: string) => {
    if (isEditingLocked) return;
    setData(prev => {
      const arr = prev[field];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...arr, item] };
      }
    });
  };

  // Comptage des champs vides essentiels
  const countMissingFields = () => {
    const essential = [
      data.bailleur_nom || data.bailleur_denomination,
      data.locataire_nom,
      data.logement_adresse,
      data.surface_habitable,
      data.loyer_mensuel,
      data.date_effet_jour && data.date_effet_mois && data.date_effet_annee,
    ];
    return essential.filter(v => !v).length;
  };

  // Export PDF - Remplace les inputs par des spans pour un rendu correct
  const handleExportPDF = async (options: { download?: boolean; uploadForSignature?: boolean; uploadToDocuments?: boolean } = {}) => {
    const { download = true, uploadForSignature = false, uploadToDocuments = false } = options;
    if (!contractRef.current) return;
    
    setExporting(true);
    setError(null);
    
    // Stocker les éléments originaux pour restauration
    const replacements: { original: HTMLElement; replacement: HTMLElement; parent: HTMLElement }[] = [];
    
    try {
      // 1. Masquer les éléments à exclure (tooltips, icônes d'aide)
      const styleElement = document.createElement('style');
      styleElement.id = 'pdf-export-styles';
      styleElement.textContent = `
        .hide-on-export { display: none !important; visibility: hidden !important; }
      `;
      document.head.appendChild(styleElement);
      
      // 2. Remplacer TOUS les inputs texte par des spans simples
      const textInputs = contractRef.current.querySelectorAll('input[type="text"], input[type="number"], input[type="email"]');
      textInputs.forEach((el) => {
        const input = el as HTMLInputElement;
        const value = input.value.trim();
        const inputWidth = Math.max(input.offsetWidth, 50);
        
        const span = document.createElement('span');
        span.className = 'pdf-field-replacement';
        
        if (value) {
          // Champ rempli : afficher le texte sans soulignement
          span.textContent = value;
          span.style.cssText = `
            display: inline-block;
            min-width: ${inputWidth}px;
            padding: 0 2px;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            color: #1a1a1a;
          `;
        } else {
          // Champ vide : afficher juste une ligne avec des underscores
          span.textContent = '_'.repeat(Math.floor(inputWidth / 6));
          span.style.cssText = `
            display: inline-block;
            min-width: ${inputWidth}px;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            color: #888;
            letter-spacing: -1px;
          `;
        }
        
        if (input.parentNode) {
          replacements.push({ original: input, replacement: span, parent: input.parentNode as HTMLElement });
          input.parentNode.replaceChild(span, input);
        }
      });
      
      // 3. Remplacer TOUS les textareas par des divs
      const textareas = contractRef.current.querySelectorAll('textarea');
      textareas.forEach((el) => {
        const textarea = el as HTMLTextAreaElement;
        const div = document.createElement('div');
        const value = textarea.value.trim();
        div.textContent = value || '\u00A0'; // Espace insécable si vide
        div.className = 'pdf-field-replacement';
        div.style.cssText = `
          width: 100%;
          min-height: ${Math.max(textarea.offsetHeight, 24)}px;
          border: 1px solid #555;
          border-radius: 2px;
          padding: 3px 4px;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          color: #1a1a1a;
          white-space: pre-wrap;
          word-wrap: break-word;
        `;
        if (textarea.parentNode) {
          replacements.push({ original: textarea, replacement: div, parent: textarea.parentNode as HTMLElement });
          textarea.parentNode.replaceChild(div, textarea);
        }
      });
      
      // 4. Remplacer les checkboxes par des visuels simples
      const checkboxes = contractRef.current.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((el) => {
        const checkbox = el as HTMLInputElement;
        const span = document.createElement('span');
        span.textContent = checkbox.checked ? '☑' : '☐';
        span.className = 'pdf-checkbox-replacement';
        span.style.cssText = `
          display: inline-block;
          width: 14px;
          height: 14px;
          font-size: 14px;
          line-height: 14px;
          vertical-align: text-bottom;
          color: #1a1a1a;
          margin-right: 2px;
        `;
        if (checkbox.parentNode) {
          replacements.push({ original: checkbox, replacement: span, parent: checkbox.parentNode as HTMLElement });
          checkbox.parentNode.replaceChild(span, checkbox);
        }
      });
      
      // 5. Remplacer les selects par des wrappers avec texte + bordure
      const selects = contractRef.current.querySelectorAll('select');
      selects.forEach((el) => {
        const select = el as HTMLSelectElement;
        const selectedText = select.selectedIndex >= 0 ? select.options[select.selectedIndex]?.text || '' : '';
        const selectWidth = Math.max(select.offsetWidth, 50);
        
        // Créer un wrapper inline-block avec position relative
        const wrapper = document.createElement('span');
        wrapper.className = 'pdf-field-replacement';
        wrapper.style.cssText = `
          display: inline-block;
          position: relative;
          min-width: ${selectWidth}px;
          border: 1px solid #555;
          border-radius: 2px;
          vertical-align: baseline;
        `;
        
        // Texte
        const textSpan = document.createElement('span');
        textSpan.textContent = selectedText || '\u00A0';
        textSpan.style.cssText = `
          display: inline-block;
          padding: 1px 4px;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          color: #1a1a1a;
        `;
        
        wrapper.appendChild(textSpan);
        if (select.parentNode) {
          replacements.push({ original: select, replacement: wrapper, parent: select.parentNode as HTMLElement });
          select.parentNode.replaceChild(wrapper, select);
        }
      });
      
      // Attendre que le DOM se mette à jour
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 6. Récupérer toutes les pages A4
      const a4Pages = contractRef.current.querySelectorAll('.a4-page');
      
      if (a4Pages.length === 0) {
        throw new Error('Aucune page A4 trouvée');
      }
      
      // Configuration pour A4 en mm
      const a4WidthMm = 210;
      const a4HeightMm = 297;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // 7. Capturer chaque page A4 séparément
      for (let i = 0; i < a4Pages.length; i++) {
        const pageElement = a4Pages[i] as HTMLElement;
        
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, a4WidthMm, a4HeightMm);
      }
      
      // 8. Restaurer tous les éléments originaux
      replacements.reverse().forEach(({ original, replacement, parent }) => {
        if (parent.contains(replacement)) {
          parent.replaceChild(original, replacement);
        }
      });
      
      // 9. Supprimer les styles temporaires
      document.getElementById('pdf-export-styles')?.remove();
      
      // 10. Ajouter le footer légal sur la dernière page
      const totalPages = pdf.getNumberOfPages();
      pdf.setPage(totalPages);
      pdf.setFontSize(7);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        "Modèle basé sur le contrat-type (décret n°2015-587). L'utilisateur reste responsable des informations renseignées.",
        a4WidthMm / 2,
        a4HeightMm - 5,
        { align: 'center' }
      );
      
      const pdfBlob = pdf.output('blob') as Blob;
      let uploadedSignedUrl: string | null = null;
      const bailFileName = `${getBailDisplayName(data)}.pdf`;

      if (uploadForSignature) {
        const { signedUrl } = await uploadPrivateDocument(pdfBlob, bailFileName, {
          folder: 'baux-etat-des-lieux',
          contentType: 'application/pdf',
          upsert: true,
        });
        uploadedSignedUrl = signedUrl;
      }

      if (uploadToDocuments) {
        await uploadPrivateDocument(pdfBlob, bailFileName, {
          folder: 'baux-etat-des-lieux',
          contentType: 'application/pdf',
          upsert: true,
        });
      }

      if (download) {
        pdf.save('Bail_Location_Meublee_ALUR_QuittanceSimple.pdf');
      }

      return uploadedSignedUrl;
      
    } catch (err: any) {
      console.error('Erreur export PDF:', err);
      
      // Restaurer tous les éléments originaux en cas d'erreur
      replacements.reverse().forEach(({ original, replacement, parent }) => {
        if (parent.contains(replacement)) {
          parent.replaceChild(original, replacement);
        }
      });
      
      // Nettoyer les styles en cas d'erreur
      document.getElementById('pdf-export-styles')?.remove();
      setError(err.message || 'Erreur lors de l\'export PDF');
      return null;
    } finally {
      setExporting(false);
    }
  };

  const missingCount = countMissingFields();
  const ownerFullName = [proprietaire?.prenom, proprietaire?.nom].filter(Boolean).join(' ') || proprietaire?.nom || data.bailleur_nom;

  const handleFinalizeForSignature = async () => {
    const signedUrl = await handleExportPDF({ download: false, uploadForSignature: true });
    if (!signedUrl) return;
    const bailId = signatureBailId ?? crypto.randomUUID();
    if (!signatureBailId) setSignatureBailId(bailId);

    const signers: ValidationPayload['signers'] = [];
    if (data.locataire_nom) {
      signers.push({
        id: crypto.randomUUID(),
        name: data.locataire_nom,
        email: (data.locataire_email || '').trim(),
        phone: (data.locataire_telephone || '').trim(),
        role: 'locataire',
      });
    }
    if (data.locataire_nom_2) {
      signers.push({
        id: crypto.randomUUID(),
        name: data.locataire_nom_2,
        email: (data.locataire_email_2 || '').trim(),
        phone: (data.locataire_telephone_2 || '').trim(),
        role: 'co-locataire',
      });
    }
    if (data.garant_info && data.garant_info.trim()) {
      signers.push({
        id: crypto.randomUUID(),
        name: data.garant_info.trim(),
        email: (data.garant_email || '').trim(),
        phone: (data.garant_telephone || '').trim(),
        role: 'garant',
      });
    }
    if (signers.length === 0) {
      signers.push({
        id: crypto.randomUUID(),
        name: '',
        email: '',
        phone: '',
        role: 'locataire',
      });
    }

    const summary = {
      title: 'Contrat de location meublée',
      noms: [data.bailleur_nom, data.locataire_nom, data.locataire_nom_2].filter(Boolean).join(' - '),
      adresse: data.logement_adresse,
      loyer: data.loyer_mensuel ? `${data.loyer_mensuel} €` : '',
      charges: data.montant_charges ? `${data.montant_charges} €` : '',
      dateEffet: [data.date_effet_jour, data.date_effet_mois, data.date_effet_annee].filter(Boolean).join('/'),
      typeBail: 'Bail meublé',
    };

    localStorage.setItem(
      `bail_signature_validation_${bailId}`,
      JSON.stringify({
        id: bailId,
        sourcePath: '/bail-meuble',
        ownerName: ownerFullName,
        documentUrl: signedUrl,
        summary,
        signers,
      } satisfies ValidationPayload)
    );
    localStorage.setItem(`bail_meuble_data_${bailId}`, JSON.stringify(data));
    navigate(`/dashboard/baux/${bailId}/validation`);
  };

  return (
    <>
      {exporting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" aria-hidden="true">
          <div className="bg-white rounded-xl shadow-xl px-8 py-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#1e3a5f] border-t-transparent animate-spin" />
            <p className="text-gray-800 font-medium">Génération du PDF en cours...</p>
          </div>
        </div>
      )}
      <div className="flex flex-col min-h-0 overflow-hidden h-[calc(100vh-3.5rem)]">
      {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 sticky top-0 z-40 print:hidden">
          <div className="px-4 pt-4 pb-0">
            <div className="flex items-center justify-between">
              <div />
              <div />
            </div>
            {/* Onglets – collés à la bordure du contenu, un seul trait sous les onglets */}
            <nav className="mt-4 -mx-4 flex gap-0 px-4" aria-label="Onglets">
              <button
                type="button"
                onClick={() => setActiveTab('creer')}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-tl-md ${
                  activeTab === 'creer'
                    ? 'bg-charte-bleu text-white border border-b-0 border-charte-bleu border-b-white'
                    : 'border border-gray-300 border-b-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Créer un bail
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sauvegardes')}
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 rounded-none -ml-px ${
                  activeTab === 'sauvegardes'
                    ? 'bg-charte-bleu text-white border border-b-0 border-charte-bleu border-b-white'
                    : 'border border-gray-300 border-b-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Baux sauvegardés
                {savedList.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'sauvegardes' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {savedList.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signatures')}
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 rounded-tr-md -ml-px ${
                  activeTab === 'signatures'
                    ? 'bg-charte-bleu text-white border border-b-0 border-charte-bleu border-b-white'
                    : 'border border-gray-300 border-b-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Signatures
                {signatureRequests.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'signatures' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {signatureRequests.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Contract Content - WebMirror : scroll interne pour éviter débordement en bas */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-0 pb-28 overscroll-contain">
          {activeTab === 'signatures' ? (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Suivi des signatures</h2>
              {loadingSignatures ? (
                <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Chargement…</span>
                </div>
              ) : signatureRequests.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune demande de signature. Envoyez un bail pour signature depuis l'onglet « Créer un bail ».</p>
              ) : (
                <>
                  {/* À corriger */}
                  {signatureRequests.filter((r) => r.status === 'correction_requested').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-orange-700 flex items-center gap-1.5 mb-3">
                        <AlertCircle className="w-4 h-4" />
                        À corriger
                      </h3>
                      <div className="space-y-3">
                        {signatureRequests.filter((r) => r.status === 'correction_requested').map((req) => {
                          const lastModif = [...(req.audit ?? [])].reverse().find((a) => a.type === 'modification_requested');
                          return (
                            <div key={req.id} className="bg-white border border-orange-300 rounded-xl p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900">{getBailFamilyNamesLabel(req)}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Envoyé le {new Date(req.created_at).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                                  <AlertCircle className="w-3 h-3" /> À corriger
                                </span>
                              </div>
                              {lastModif && (
                                <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm">
                                  <p className="font-medium text-orange-800">{lastModif.signer_name || 'Locataire'} demande une correction :</p>
                                  <p className="text-gray-700 mt-1">{lastModif.comment}</p>
                                  <p className="text-xs text-gray-400 mt-1">{lastModif.created_at ? new Date(lastModif.created_at).toLocaleString('fr-FR') : ''}</p>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSignatureBailId(req.bail_id);
                                  setCurrentBailSignatureStatus('draft');
                                  setActiveTab('creer');
                                }}
                                className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
                              >
                                Corriger et renvoyer
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {signatureRequests.filter((r) => r.status === 'pending').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-1.5 mb-3">
                        <Clock className="w-4 h-4" />
                        En attente de signature
                      </h3>
                      <div className="space-y-3">
                        {signatureRequests.filter((r) => r.status === 'pending').map((req) => (
                          <div key={req.id} className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">{getBailFamilyNamesLabel(req)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Envoyé le {new Date(req.created_at).toLocaleDateString('fr-FR')} à {new Date(req.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                                <Clock className="w-3 h-3" /> En attente
                              </span>
                            </div>
                            <div className="mt-3 space-y-1">
                              {req.signers.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  {s.status === 'signed' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-amber-500" />}
                                  <span className={s.status === 'signed' ? 'text-green-700' : 'text-gray-700'}>
                                    {s.name} ({s.role}) — {s.status === 'signed' ? 'Signé' : 'À signer'}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {(req.audit ?? []).some((a) => a.type === 'modification_requested') && (
                              <button
                                type="button"
                                onClick={() => navigate(`/dashboard/baux/${req.bail_id}/signature`)}
                                className="mt-3 rounded-md border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                              >
                                Voir demande de modification
                              </button>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <a href={req.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#1e3a5f] hover:underline">
                                <ExternalLink className="w-3 h-3" /> Voir le document
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCancelSignatureFromTab(req.bail_id)}
                                disabled={cancellingBailId === req.bail_id}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                {cancellingBailId === req.bail_id ? 'Annulation...' : 'Annuler cette signature'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {signatureRequests.filter((r) => r.status === 'signed').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-green-700 flex items-center gap-1.5 mb-3">
                        <CheckCircle2 className="w-4 h-4" />
                        Baux finalisés
                      </h3>
                      <div className="space-y-3">
                        {signatureRequests.filter((r) => r.status === 'signed').map((req) => (
                          <div key={req.id} className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">{getBailFamilyNamesLabel(req)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Finalisé le {req.completed_at ? new Date(req.completed_at).toLocaleDateString('fr-FR') : '—'}</p>
                              </div>
                              <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3" /> Signé
                              </span>
                            </div>
                            <div className="mt-3 space-y-1">
                              {req.signers.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-green-700">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{s.name} ({s.role}) — Signé{s.signed_at ? ` le ${new Date(s.signed_at).toLocaleDateString('fr-FR')}` : ''}</span>
                                </div>
                              ))}
                            </div>
                            <a href={req.document_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[#1e3a5f] hover:underline">
                              <ExternalLink className="w-3 h-3" /> Télécharger le bail signé
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {signatureRequests.filter((r) => r.status === 'expired').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mb-3">
                        <X className="w-4 h-4" />
                        Expirés
                      </h3>
                      <div className="space-y-3">
                        {signatureRequests.filter((r) => r.status === 'expired').map((req) => (
                          <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm opacity-60">
<p className="font-medium text-gray-700">{getBailFamilyNamesLabel(req)}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Créé le {new Date(req.created_at).toLocaleDateString('fr-FR')} — Expiré</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : activeTab === 'sauvegardes' ? (
            <div className="max-w-2xl mx-auto space-y-8">
              <h2 className="bail-section-title border-b-0 pb-0 mb-4">Baux sauvegardés</h2>
              {signatureRequests.filter((r) => r.status === 'signed').length === 0 &&
               signatureRequests.filter((r) => r.status === 'pending').length === 0 &&
               savedList.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun bail. Créez un bail puis « Sauver » pour le mettre en projet, ou « Finaliser pour signature » pour l’envoyer. Les baux signés et les baux en projet sont réutilisables comme modèle en cas de changement de locataire.</p>
              ) : (
                <>
                  {signatureRequests.filter((r) => r.status === 'signed').length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3">Baux signés</h3>
                      <ul className="space-y-2">
                        {signatureRequests.filter((r) => r.status === 'signed').map((req) => (
                          <li key={req.id} className="flex items-center justify-between gap-4 bg-white border border-green-200 rounded-lg px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {getBailFamilyNamesLabel(req)}{req.completed_at ? ` – ${new Date(req.completed_at).toLocaleDateString('fr-FR')}` : ''}
                                </p>
                                <p className="text-xs text-gray-500">Visible aussi dans Mes documents · Utilisable comme modèle</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {typeof localStorage !== 'undefined' && localStorage.getItem(`bail_meuble_data_${req.bail_id}`) && (
                                <button
                                  type="button"
                                  onClick={() => loadSignedBailAsModel(req.bail_id)}
                                  className="px-3 py-1.5 text-sm font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition-colors"
                                >
                                  Utiliser comme modèle
                                </button>
                              )}
                              <a
                                href={req.document_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" /> Télécharger
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {signatureRequests.filter((r) => r.status === 'pending').length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3">En attente de signature</h3>
                      <ul className="space-y-2">
                        {signatureRequests.filter((r) => r.status === 'pending').map((req) => (
                          <li key={req.id} className="flex items-center justify-between gap-4 bg-white border border-amber-200 rounded-lg px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{getBailFamilyNamesLabel(req)}</p>
                                <p className="text-xs text-gray-500">Envoyé pour signature</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveTab('signatures')}
                              className="px-3 py-1.5 text-sm font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition-colors"
                            >
                              Voir le suivi
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {savedList.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3">En projet</h3>
                      <p className="text-xs text-gray-500 mb-2">Baux sauvegardés mais non envoyés pour signature.</p>
                      <ul className="space-y-2">
                        {savedList.map((item) => (
                          <li key={item.id} className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-5 h-5 text-[#1e3a5f] flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{item.label}</p>
                                <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('fr-FR')} · Utilisable comme modèle</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button type="button" onClick={() => loadSavedBailAsModel(item)} className="px-3 py-1.5 text-sm font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition-colors">
                                Utiliser comme modèle
                              </button>
                              <button type="button" onClick={() => loadSavedBail(item)} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                Ouvrir
                              </button>
                              <button type="button" onClick={() => deleteSavedBail(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors" aria-label="Supprimer">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}
            </div>
          ) : (
          <div ref={contractRef} className="flex flex-col items-center min-h-0 pb-8">
            
            {/* ========== PAGE 1 ========== */}
            <A4Page pageNumber={1}>
              {/* EN-TÊTE – condensé pour éviter débordement */}
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold mb-1">CONTRAT DE LOCATION</h1>
                <p className="bail-legal-note text-gray-600 text-[11px] leading-tight mb-1">
                  (Loi du 6 juillet 1989, mod. loi du 23 décembre 1986 – Bail type ALUR 2014, décret du 29 mai 2015)
                </p>
                <h2 className="bail-section-title border-b-0 pb-0 text-center text-base mt-2">LOCAUX MEUBLÉS À USAGE D'HABITATION</h2>
              </div>
              <p className="bail-legal-intro text-gray-600 text-xs mb-4">
                Dispositions d'ordre public ; elles s'imposent aux parties.
              </p>

          {/* ========== I. DÉSIGNATION DES PARTIES ========== */}
          <section className="mb-5">
            <h2 className="bail-section-title text-base">I. DÉSIGNATION DES PARTIES</h2>
            <p className="bail-intro-text mb-3 text-sm">Le présent contrat est conclu entre les soussignés :</p>
            
            <div className="mb-3">
              <h3 className="text-base font-semibold text-[#1e3a5f] mb-1.5">Le bailleur</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <InlineCheckbox
                  checked={data.bailleur_type === 'physique'}
                  onChange={() => updateField('bailleur_type', data.bailleur_type === 'physique' ? '' : 'physique')}
                  label="Personne physique"
                />
                <InlineCheckbox
                  checked={data.bailleur_type === 'morale'}
                  onChange={() => updateField('bailleur_type', data.bailleur_type === 'morale' ? '' : 'morale')}
                  label="Personne morale"
                />
              </div>
            </div>

            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Nom et prénom du bailleur : </span>
              <InlineInput
                value={data.bailleur_nom}
                onChange={(v) => updateField('bailleur_nom', v)}
                placeholder="Nom et prénom"
                width="w-80"
              />
            </div>

            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Dénomination (si personne morale) : </span>
              <InlineInput
                value={data.bailleur_denomination}
                onChange={(v) => updateField('bailleur_denomination', v)}
                placeholder="Dénomination sociale"
                width="w-80"
              />
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1.5 uppercase tracking-wide">Société civile famille 4ᵉ degré :</p>
              <div className="flex gap-4">
                <InlineCheckbox
                  checked={data.societe_familiale === 'oui'}
                  onChange={() => updateField('societe_familiale', data.societe_familiale === 'oui' ? '' : 'oui')}
                  label="Oui"
                />
                <InlineCheckbox
                  checked={data.societe_familiale === 'non'}
                  onChange={() => updateField('societe_familiale', data.societe_familiale === 'non' ? '' : 'non')}
                  label="Non"
                />
              </div>
            </div>

            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Adresse : </span>
              <InlineInput
                value={data.bailleur_adresse}
                onChange={(v) => updateField('bailleur_adresse', v)}
                placeholder="Adresse complète"
                width="w-full max-w-lg"
              />
            </div>

            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">Adresse email (facultatif) : </span>
              <InlineInput
                value={data.bailleur_email}
                onChange={(v) => updateField('bailleur_email', v)}
                placeholder="email@exemple.com"
                width="w-64"
                type="email"
              />
            </div>

            <p className="bail-body-text mb-3 italic text-sm">désigné(s) ci-après « le bailleur » ;</p>

            <div className="mb-3">
              <p className="bail-body-text mb-1.5 text-sm">Le cas échéant, représenté par un mandataire :</p>
              <div className="flex gap-4">
                <InlineCheckbox
                  checked={data.mandataire_present === 'oui'}
                  onChange={() => updateField('mandataire_present', data.mandataire_present === 'oui' ? '' : 'oui')}
                  label="Oui"
                />
                <InlineCheckbox
                  checked={data.mandataire_present === 'non'}
                  onChange={() => updateField('mandataire_present', data.mandataire_present === 'non' ? '' : 'non')}
                  label="Non"
                />
              </div>
            </div>

            {data.mandataire_present === 'oui' && (
              <div className="ml-4 mb-3 p-2.5 bg-gray-50 rounded border border-gray-200">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Nom et prénom du mandataire : </span>
                  <InlineInput
                    value={data.mandataire_nom}
                    onChange={(v) => updateField('mandataire_nom', v)}
                    width="w-64"
                  />
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Dénomination (si personne morale) : </span>
                  <InlineInput
                    value={data.mandataire_denomination}
                    onChange={(v) => updateField('mandataire_denomination', v)}
                    width="w-64"
                  />
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Adresse : </span>
                  <InlineInput
                    value={data.mandataire_adresse}
                    onChange={(v) => updateField('mandataire_adresse', v)}
                    width="w-full max-w-md"
                  />
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Activité exercée : </span>
                  <InlineInput
                    value={data.mandataire_activite}
                    onChange={(v) => updateField('mandataire_activite', v)}
                    width="w-64"
                  />
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">N° et lieu de délivrance de la carte professionnelle : </span>
                  <InlineInput
                    value={data.mandataire_carte}
                    onChange={(v) => updateField('mandataire_carte', v)}
                    width="w-full max-w-md"
                  />
                </div>
              </div>
            )}


            <h3 className="text-base font-semibold text-[#1e3a5f] mt-4 mb-1">Et le (ou les) locataire(s)</h3>
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Nom et prénom : </span>
              <InlineInput
                value={data.locataire_nom}
                onChange={(v) => updateField('locataire_nom', v)}
                placeholder="Locataire 1"
                width="w-full max-w-lg"
              />
            </div>
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Adresse : </span>
              <InlineInput
                value={data.locataire_adresse}
                onChange={(v) => updateField('locataire_adresse', v)}
                placeholder="Adresse du locataire 1"
                width="w-full max-w-lg"
              />
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-sm text-gray-600">E-mail (facultatif, pour signature) : </span>
              <InlineInput
                value={data.locataire_email}
                onChange={(v) => updateField('locataire_email', v)}
                placeholder="email@exemple.fr"
                width="w-full max-w-xs"
              />
              <span className="text-sm text-gray-600">Téléphone (facultatif) : </span>
              <InlineInput
                value={data.locataire_telephone}
                onChange={(v) => updateField('locataire_telephone', v)}
                placeholder="06 12 34 56 78"
                width="w-40"
              />
            </div>
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Nom et prénom : </span>
              <InlineInput
                value={data.locataire_nom_2}
                onChange={(v) => updateField('locataire_nom_2', v)}
                placeholder="Locataire 2 (si applicable)"
                width="w-full max-w-lg"
              />
            </div>
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Adresse : </span>
              <InlineInput
                value={data.locataire_adresse_2}
                onChange={(v) => updateField('locataire_adresse_2', v)}
                placeholder="Adresse du locataire 2"
                width="w-full max-w-lg"
              />
            </div>
            <div className="mb-3 flex flex-nowrap items-center gap-x-4 gap-y-1">
              <span className="text-sm text-gray-600 shrink-0">E-mail (facultatif) : </span>
              <InlineInput
                value={data.locataire_email_2}
                onChange={(v) => updateField('locataire_email_2', v)}
                placeholder="email@exemple.fr"
                width="w-full max-w-xs"
              />
              <span className="text-sm text-gray-600 shrink-0">Téléphone (facultatif) : </span>
              <InlineInput
                value={data.locataire_telephone_2}
                onChange={(v) => updateField('locataire_telephone_2', v)}
                placeholder="06 12 34 56 78"
                width="w-40"
              />
            </div>
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Le cas échéant, nom et adresse du garant : </span>
              <InlineInput
                value={data.garant_info}
                onChange={(v) => updateField('garant_info', v)}
                placeholder="Nom, prénom et adresse du garant"
                width="w-full max-w-lg"
              />
            </div>
            <div className="mb-3 ml-4 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-sm text-gray-600">E-mail du garant (facultatif, pour signature) : </span>
              <InlineInput
                value={data.garant_email}
                onChange={(v) => updateField('garant_email', v)}
                placeholder="email@exemple.fr"
                width="w-full max-w-xs"
              />
              <span className="text-sm text-gray-600">Téléphone du garant (facultatif) : </span>
              <InlineInput
                value={data.garant_telephone}
                onChange={(v) => updateField('garant_telephone', v)}
                placeholder="06 12 34 56 78"
                width="w-40"
              />
            </div>

            <p className="bail-body-text italic text-sm">désigné(s) ci-après « le locataire » ;</p>
          </section>
            </A4Page>

            {/* ========== PAGE 2 ========== */}
            <A4Page pageNumber={2}>
          {/* ========== II. OBJET DU CONTRAT ========== */}
          <section className="mb-8">
            <h2 className="bail-section-title">II. OBJET DU CONTRAT</h2>
            <p className="bail-intro-text mb-4">Le présent contrat a pour objet la location d'un logement ainsi déterminé :</p>
            
            <h3 className="bail-subsection-title">A. Consistance du logement</h3>
            
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">Adresse du logement : </span>
              <InlineInput
                value={data.logement_adresse}
                onChange={(v) => updateField('logement_adresse', v)}
                placeholder="Adresse / bâtiment / étage / porte"
                width="w-full max-w-lg"
              />
            </div>

            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">
                <Tooltip text="Retrouvez votre identifiant fiscal sur votre espace 'Gérer mes biens immobiliers' sur impots.gouv.fr.">
                  Identifiant fiscal du logement :
                </Tooltip>
              </span>
              <InlineInput
                value={data.identifiant_fiscal}
                onChange={(v) => updateField('identifiant_fiscal', v)}
                placeholder="Ex: 12345678901234"
                width="w-48"
              />
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Type d'habitat, Immeuble :</p>
              <div className="flex flex-wrap gap-4">
                <InlineCheckbox
                  checked={data.immeuble_type === 'collectif'}
                  onChange={() => updateField('immeuble_type', data.immeuble_type === 'collectif' ? '' : 'collectif')}
                  label="Collectif"
                />
                <InlineCheckbox
                  checked={data.immeuble_type === 'individuel'}
                  onChange={() => updateField('immeuble_type', data.immeuble_type === 'individuel' ? '' : 'individuel')}
                  label="Individuel"
                />
                <InlineCheckbox
                  checked={data.propriete_type === 'mono'}
                  onChange={() => updateField('propriete_type', data.propriete_type === 'mono' ? '' : 'mono')}
                  label="Mono propriété"
                />
                <InlineCheckbox
                  checked={data.propriete_type === 'copropriete'}
                  onChange={() => updateField('propriete_type', data.propriete_type === 'copropriete' ? '' : 'copropriete')}
                  label="Copropriété"
                />
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Période de construction :</p>
              <div className="flex flex-wrap gap-2">
                {['Avant 1949', '1949-1974', '1975-1989', '1989-2005', 'Depuis 2005'].map(p => (
                  <InlineCheckbox
                    key={p}
                    checked={data.periode_construction === p}
                    onChange={() => updateField('periode_construction', data.periode_construction === p ? '' : p)}
                    label={p}
                  />
                ))}
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-4">
              <span>
                <Tooltip text="La surface habitable doit être la surface 'Loi Boutin' réelle, mesurée selon les normes en vigueur. Elle détermine notamment le plafond des honoraires.">
                  <span className="text-sm font-medium text-gray-700">Surface habitable :</span>
                </Tooltip>
                <InlineInput
                  value={data.surface_habitable}
                  onChange={(v) => updateField('surface_habitable', v)}
                  placeholder="Ex: 45"
                  width="w-20"
                  type="number"
                />
                <span className="ml-1">m²</span>
              </span>
              <span>
                <span className="text-sm font-medium text-gray-700 ml-4">Nombre de pièces principales :</span>
                <InlineInput
                  value={data.nombre_pieces}
                  onChange={(v) => updateField('nombre_pieces', v)}
                  placeholder="Ex: 2"
                  width="w-16"
                  type="number"
                />
              </span>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Autres parties du logement :</p>
              <div className="flex flex-wrap gap-2">
                {['Grenier', 'Comble', 'Terrasse', 'Balcon', 'Loggia', 'Jardin'].map(item => (
                  <InlineCheckbox
                    key={item}
                    checked={data.autres_parties.includes(item)}
                    onChange={() => toggleArrayItem('autres_parties', item)}
                    label={item}
                  />
                ))}
              </div>
              <div className="mt-2">
                <span className="text-base text-gray-700">Autres : </span>
                <InlineInput
                  value={data.autres_parties_detail}
                  onChange={(v) => updateField('autres_parties_detail', v)}
                  width="w-64"
                />
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Éléments d'équipements du logement (cuisine équipée, installations sanitaires, etc.) :</p>
              <InlineTextarea
                value={data.equipements}
                onChange={(v) => updateField('equipements', v)}
                placeholder="Décrire les équipements..."
              />
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Modalité de production de chauffage :</p>
              <div className="flex gap-4 mb-2">
                <InlineCheckbox
                  checked={data.chauffage_type === 'individuel'}
                  onChange={() => updateField('chauffage_type', data.chauffage_type === 'individuel' ? '' : 'individuel')}
                  label="Individuel"
                />
                <InlineCheckbox
                  checked={data.chauffage_type === 'collectif'}
                  onChange={() => updateField('chauffage_type', data.chauffage_type === 'collectif' ? '' : 'collectif')}
                  label="Collectif"
                />
              </div>
              {data.chauffage_type === 'collectif' && (
                <div className="ml-4">
                  <span className="text-sm">(Si collectif, préciser les modalités de répartition) : </span>
                  <InlineInput
                    value={data.chauffage_modalites}
                    onChange={(v) => updateField('chauffage_modalites', v)}
                    width="w-full max-w-md"
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Modalité de production d'eau chaude sanitaire :</p>
              <div className="flex gap-4 mb-2">
                <InlineCheckbox
                  checked={data.eau_chaude_type === 'individuel'}
                  onChange={() => updateField('eau_chaude_type', data.eau_chaude_type === 'individuel' ? '' : 'individuel')}
                  label="Individuel"
                />
                <InlineCheckbox
                  checked={data.eau_chaude_type === 'collectif'}
                  onChange={() => updateField('eau_chaude_type', data.eau_chaude_type === 'collectif' ? '' : 'collectif')}
                  label="Collectif"
                />
              </div>
              {data.eau_chaude_type === 'collectif' && (
                <div className="ml-4">
                  <span className="text-sm">(Si collectif, préciser les modalités de répartition) : </span>
                  <InlineInput
                    value={data.eau_chaude_modalites}
                    onChange={(v) => updateField('eau_chaude_modalites', v)}
                    width="w-full max-w-md"
                  />
                </div>
              )}
            </div>
          </section>
            </A4Page>

            {/* ========== PAGE 2B ========== */}
            <A4Page pageNumber={3}>
          <section className="mb-8">
            <h2 className="bail-section-title">II. OBJET DU CONTRAT (suite)</h2>

            <h3 className="bail-subsection-title">B. Destination des locaux :</h3>
            <div className="mb-4 flex gap-4">
              <InlineCheckbox
                checked={data.destination === 'habitation'}
                onChange={() => updateField('destination', data.destination === 'habitation' ? '' : 'habitation')}
                label="Usage d'habitation"
              />
              <InlineCheckbox
                checked={data.destination === 'mixte'}
                onChange={() => updateField('destination', data.destination === 'mixte' ? '' : 'mixte')}
                label="Usage mixte professionnel et d'habitation"
              />
            </div>

            <h3 className="bail-subsection-title">C. Désignation des locaux et équipements accessoires de l'immeuble à usage privatif du locataire :</h3>
            <div className="mb-3 flex flex-wrap gap-4">
              <span>
                Cave n° : <InlineInput value={data.cave_numero} onChange={(v) => updateField('cave_numero', v)} width="w-16" />
              </span>
              <span>
                Parking n° : <InlineInput value={data.parking_numero} onChange={(v) => updateField('parking_numero', v)} width="w-16" />
              </span>
              <span>
                Garage n° : <InlineInput value={data.garage_numero} onChange={(v) => updateField('garage_numero', v)} width="w-16" />
              </span>
            </div>
            <div className="mb-4">
              <span>Autres : </span>
              <InlineInput
                value={data.autres_privatifs}
                onChange={(v) => updateField('autres_privatifs', v)}
                width="w-full max-w-lg"
              />
            </div>

            <h3 className="bail-subsection-title">D. Le cas échéant, Énumération des locaux, parties, équipements et accessoires de l'immeuble à usage commun :</h3>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {['Garage à vélo', 'Ascenseur', 'Espaces verts', 'Aires et équipements de jeux', 'Laverie', 'Local poubelle', 'Gardiennage'].map(item => (
                  <InlineCheckbox
                    key={item}
                    checked={data.locaux_communs.includes(item)}
                    onChange={() => toggleArrayItem('locaux_communs', item)}
                    label={item}
                  />
                ))}
              </div>
              <div>
                <span className="text-base text-gray-700">Autres : </span>
                <InlineInput
                  value={data.autres_communs}
                  onChange={(v) => updateField('autres_communs', v)}
                  width="w-64"
                />
              </div>
            </div>

            <h3 className="bail-subsection-title">E. Équipement d'accès aux technologies de l'information et de la communication</h3>
            <p className="text-sm text-gray-600 mb-2">(modalités de réception de la télévision, modalités de raccordement internet, etc.) :</p>
            <InlineTextarea
              value={data.equipements_tic}
              onChange={(v) => updateField('equipements_tic', v)}
              placeholder="Fibre optique, antenne collective, etc."
            />

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs">
              <p className="text-sm font-semibold text-[#1e3a5f] mb-1">Rappel : un logement décent doit respecter les critères minimaux de performance suivants :</p>
              <p className="text-sm font-medium text-gray-700">a) En France métropolitaine :</p>
              <ul className="list-disc ml-4 mb-2">
                <li>À compter du 1er janvier 2025, le niveau de performance minimal correspond à la classe F du DPE ;</li>
                <li>À compter du 1er janvier 2028, le niveau de performance minimal correspond à la classe E du DPE ;</li>
                <li>À compter du 1er janvier 2034, le niveau de performance minimal correspond à la classe D du DPE.</li>
              </ul>
              <p className="text-sm font-medium text-gray-700">b) En Guadeloupe, en Martinique, en Guyane, à La Réunion et à Mayotte :</p>
              <ul className="list-disc ml-4">
                <li>À compter du 1er janvier 2028, le niveau de performance minimal correspond à la classe F du DPE ;</li>
                <li>À compter du 1er janvier 2031, le niveau de performance minimal correspond à la classe E du DPE.</li>
              </ul>
            </div>

            <div className="mt-4 mb-4">
              <span className="text-sm font-medium text-gray-700">Niveau de performance du logement [classe du diagnostic de performance énergétique] : </span>
              <InlineInput
                value={data.dpe_classe}
                onChange={(v) => updateField('dpe_classe', v)}
                placeholder="Ex: D, E, F..."
                width="w-20"
              />
            </div>
          </section>
            </A4Page>

            {/* ========== PAGE 3 ========== */}
            <A4Page pageNumber={4}>
          {/* ========== III. DATE DE PRISE D'EFFET ET DURÉE ========== */}
          <section className="mb-8">
            <h2 className="bail-section-title">III. DATE DE PRISE D'EFFET ET DURÉE DU CONTRAT</h2>
            
            <p className="bail-intro-text mb-4">La durée du contrat et sa date de prise d'effet sont ainsi définies :</p>
            
            <h3 className="bail-subsection-title">A. Date de prise d'effet du contrat :</h3>
            <div className="mb-4 flex items-center gap-1">
              <span>Jour : </span>
              <InlineInput value={data.date_effet_jour} onChange={(v) => updateField('date_effet_jour', v)} width="w-12" type="number" />
              <span> / Mois : </span>
              <InlineInput value={data.date_effet_mois} onChange={(v) => updateField('date_effet_mois', v)} width="w-12" type="number" />
              <span> / Année : </span>
              <InlineInput value={data.date_effet_annee} onChange={(v) => updateField('date_effet_annee', v)} width="w-16" type="number" />
            </div>

            <h3 className="bail-subsection-title">B. Durée du contrat :</h3>
            <div className="mb-4 flex flex-wrap gap-4">
              <InlineCheckbox
                checked={data.duree_contrat === '1an'}
                onChange={() => updateField('duree_contrat', data.duree_contrat === '1an' ? '' : '1an')}
                label="1 an [durée minimale pour bail meublé]"
              />
              <InlineCheckbox
                checked={data.duree_contrat === '3ans'}
                onChange={() => updateField('duree_contrat', data.duree_contrat === '3ans' ? '' : '3ans')}
                label="3 ans"
              />
              <InlineCheckbox
                checked={data.duree_contrat === '6ans'}
                onChange={() => updateField('duree_contrat', data.duree_contrat === '6ans' ? '' : '6ans')}
                label="6 ans [minimum si le bailleur est une personne morale]"
              />
              <div className="flex items-center">
                <InlineCheckbox
                  checked={data.duree_contrat === 'reduite'}
                  onChange={() => updateField('duree_contrat', data.duree_contrat === 'reduite' ? '' : 'reduite')}
                  label="Durée réduite :"
                />
                {data.duree_contrat === 'reduite' && (
                  <InlineInput
                    value={data.duree_reduite_valeur}
                    onChange={(v) => updateField('duree_reduite_valeur', v)}
                    placeholder="ex: 1 an"
                    width="w-24"
                  />
                )}
              </div>
            </div>

            {data.duree_contrat === 'reduite' && (
              <div className="mb-4">
                <h3 className="bail-subsection-title mb-2">C. Le cas échéant, événement et raison justifiant la durée réduite du contrat de location :</h3>
                <InlineTextarea
                  value={data.duree_reduite_raison}
                  onChange={(v) => updateField('duree_reduite_raison', v)}
                  placeholder="Préciser l'événement justifiant la durée réduite (minimum 1 an)..."
                  rows={3}
                />
              </div>
            )}

            <p className="text-xs text-gray-600 italic">
              En l'absence de proposition de renouvellement du contrat, celui-ci est, à son terme, reconduit tacitement 
              pour 1 an, 3 ans ou 6 ans selon la durée initiale et dans les mêmes conditions. Le locataire peut mettre fin au bail à tout moment, après avoir 
              donné congé. Le bailleur, quant à lui, peut mettre fin au bail à son échéance et après avoir donné congé, soit 
              pour reprendre le logement en vue de l'occuper lui-même ou une personne de sa famille, soit pour le vendre, 
              soit pour un motif sérieux et légitime.
            </p>
          </section>

          {/* ========== III bis. MOBILIER ET ÉQUIPEMENTS MEUBLÉS ========== */}
          <section className="mb-8">
            <h2 className="bail-section-title">III bis. MOBILIER ET ÉQUIPEMENTS MEUBLÉS</h2>
            
            <p className="mb-4">Le logement objet du présent contrat est loué meublé. Le mobilier et les équipements fournis sont les suivants :</p>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Description du mobilier et des équipements meublés :</p>
              <InlineTextarea
                value={data.mobilier_description}
                onChange={(v) => updateField('mobilier_description', v)}
                placeholder="Décrire le mobilier présent : literie, meubles de rangement, électroménager, équipements de cuisine, etc."
                rows={4}
              />
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Un inventaire du mobilier a-t-il été établi ?</p>
              <div className="flex gap-4">
                <InlineCheckbox
                  checked={data.inventaire_present === 'oui'}
                  onChange={() => updateField('inventaire_present', data.inventaire_present === 'oui' ? '' : 'oui')}
                  label="Oui"
                />
                <InlineCheckbox
                  checked={data.inventaire_present === 'non'}
                  onChange={() => updateField('inventaire_present', data.inventaire_present === 'non' ? '' : 'non')}
                  label="Non"
                />
              </div>
            </div>

            {data.inventaire_present === 'oui' && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">Date de l'inventaire : </span>
                <InlineInput
                  value={data.inventaire_date}
                  onChange={(v) => updateField('inventaire_date', v)}
                  placeholder="JJ/MM/AAAA"
                  width="w-32"
                />
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">État général du mobilier et des équipements :</p>
              <InlineTextarea
                value={data.etat_mobilier}
                onChange={(v) => updateField('etat_mobilier', v)}
                placeholder="Décrire l'état général du mobilier et des équipements fournis"
                rows={3}
              />
            </div>

            <p className="text-xs text-gray-600 italic mb-4">
              Le locataire s'engage à maintenir le mobilier en bon état et à le restituer dans l'état où il l'a reçu, 
              compte tenu de l'usure normale résultant de l'usage auquel il est destiné.
            </p>
          </section>
            </A4Page>

            {/* ========== PAGE 5 - CONDITIONS FINANCIÈRES ========== */}
            <A4Page pageNumber={5}>
          {/* ========== IV. CONDITIONS FINANCIÈRES ========== */}
          <section className="mb-8">
            <h2 className="bail-section-title">IV. CONDITIONS FINANCIÈRES</h2>
            
            <p className="bail-intro-text mb-4">Les parties conviennent des conditions financières suivantes :</p>
            
            <h3 className="bail-subsection-title">A. Loyer</h3>
            
            <p className="text-sm font-semibold text-[#1e3a5f] mb-2">1° Fixation du loyer initial :</p>
            
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">a) Montant du loyer mensuel : </span>
              <InlineInput
                value={data.loyer_mensuel}
                onChange={(v) => updateField('loyer_mensuel', v)}
                placeholder="Ex: 800"
                width="w-24"
                type="number"
              />
              <span className="ml-1">€</span>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded overflow-visible">
              <p className="text-sm font-medium text-gray-700 mb-2">
                <Tooltip text="Testez votre adresse sur pap.fr/bailleur/encadrement-loyers pour savoir si vous êtes en zone tendue ou soumis à l'encadrement des loyers.">
                  b) Le cas échéant, modalités particulières de fixation initiale du loyer applicables dans les zones tendues :
                </Tooltip>
              </p>
              
              <div className="mb-3">
                <p className="text-sm mb-1">
                  <Tooltip text="Le décret annuel fixe le plafond d'évolution des loyers à la relocation (nouvelle location). Cocher Oui si votre logement entre dans ce cadre.">
                    Le loyer du logement objet du présent contrat est soumis au décret fixant annuellement le montant maximum d'évolution des loyers à la relocation :
                  </Tooltip>
                </p>
                <div className="flex gap-4">
                  <InlineCheckbox
                    checked={data.loyer_soumis_decret === 'oui'}
                    onChange={() => updateField('loyer_soumis_decret', data.loyer_soumis_decret === 'oui' ? '' : 'oui')}
                    label="Oui"
                  />
                  <InlineCheckbox
                    checked={data.loyer_soumis_decret === 'non'}
                    onChange={() => updateField('loyer_soumis_decret', data.loyer_soumis_decret === 'non' ? '' : 'non')}
                    label="Non"
                  />
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm mb-1">
                  <Tooltip text="Applicable à Paris, Lyon, Lille, Montpellier, Bordeaux, et certaines autres communes. Le loyer ne peut pas dépasser le loyer de référence majoré fixé par arrêté préfectoral.">
                    Le loyer du logement objet du présent contrat est soumis au loyer de référence majoré fixé par arrêté préfectoral :
                  </Tooltip>
                </p>
                <div className="flex gap-4">
                  <InlineCheckbox
                    checked={data.loyer_reference === 'oui'}
                    onChange={() => updateField('loyer_reference', data.loyer_reference === 'oui' ? '' : 'oui')}
                    label="Oui"
                  />
                  <InlineCheckbox
                    checked={data.loyer_reference === 'non'}
                    onChange={() => updateField('loyer_reference', data.loyer_reference === 'non' ? '' : 'non')}
                    label="Non"
                  />
                </div>
              </div>

              {data.loyer_reference === 'oui' && (
                <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                  <div className="mb-2">
                    <span>Montant du loyer de référence : </span>
                    <InlineInput value={data.loyer_reference_montant} onChange={(v) => updateField('loyer_reference_montant', v)} width="w-20" type="number" />
                    <span className="ml-1">€/m²</span>
                  </div>
                  <div>
                    <span>Montant du loyer de référence majoré : </span>
                    <InlineInput value={data.loyer_reference_majore} onChange={(v) => updateField('loyer_reference_majore', v)} width="w-20" type="number" />
                    <span className="ml-1">€/m²</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm mb-1">Le cas échéant, Complément de loyer [si un complément de loyer est prévu, indiquer le montant du loyer de base, nécessairement égal au loyer de référence majoré, le montant du complément de loyer et les caractéristiques du logement justifiant le complément de loyer] :</p>
              <InlineTextarea
                value={data.complement_loyer}
                onChange={(v) => updateField('complement_loyer', v)}
                placeholder="Caractéristiques exceptionnelles justifiant un complément de loyer..."
              />
            </div>

            <div className="mb-4">
              <p className="text-sm mb-1">c) Le cas échéant, informations relatives au loyer du dernier locataire [montant du dernier loyer acquitté par le précédent locataire, date de versement et date de la dernière révision du loyer] :</p>
              <InlineTextarea
                value={data.loyer_dernier_locataire}
                onChange={(v) => updateField('loyer_dernier_locataire', v)}
                placeholder="Ex: Dernier loyer 750€, versé le 05 du mois, révisé le 01/07/2024"
              />
            </div>

            <p className="text-sm font-semibold text-[#1e3a5f] mb-2">2° Le cas échéant, Modalités de révision :</p>
            <div className="mb-4">
              <span>Date de révision : </span>
              <InlineInput value={data.revision_jour} onChange={(v) => updateField('revision_jour', v)} width="w-12" />
              <span> / </span>
              <InlineInput value={data.revision_mois} onChange={(v) => updateField('revision_mois', v)} width="w-12" />
              <span> / </span>
              <InlineInput value={data.revision_annee} onChange={(v) => updateField('revision_annee', v)} width="w-16" />
            </div>
            <div className="mb-4">
              <span>Date ou trimestre de référence de l'IRL : </span>
              <InlineInput
                value={data.irl_reference}
                onChange={(v) => updateField('irl_reference', v)}
                placeholder="Ex: 4ème trimestre 2024"
                width="w-48"
              />
            </div>
          </section>
            </A4Page>

            {/* ========== PAGE 6 - CONDITIONS FINANCIÈRES (suite) ========== */}
            <A4Page pageNumber={6}>
          <section className="mb-8">
            <h2 className="bail-section-title">IV. CONDITIONS FINANCIÈRES (suite)</h2>

            <h3 className="bail-subsection-title">
              <Tooltip text="Provision = montant estimé avec régularisation annuelle. Forfait (colocation seulement) = montant fixe non régularisable.">
                B. Charges récupérables
              </Tooltip>
            </h3>
            
            <p className="text-sm font-medium text-gray-700 mb-2">1. Modalité de règlement des charges récupérables :</p>
            <div className="mb-4 space-y-1">
              <div>
                <InlineCheckbox
                  checked={data.charges_modalite === 'provisions'}
                  onChange={() => updateField('charges_modalite', data.charges_modalite === 'provisions' ? '' : 'provisions')}
                  label="Provisions sur charges avec régularisation annuelle"
                />
              </div>
              <div>
                <InlineCheckbox
                  checked={data.charges_modalite === 'periodique'}
                  onChange={() => updateField('charges_modalite', data.charges_modalite === 'periodique' ? '' : 'periodique')}
                  label="Paiement périodique des charges sans provision"
                />
              </div>
              <div>
                <InlineCheckbox
                  checked={data.charges_modalite === 'forfait'}
                  onChange={() => updateField('charges_modalite', data.charges_modalite === 'forfait' ? '' : 'forfait')}
                  label="[En cas de colocation seulement] Forfait de charges"
                />
              </div>
            </div>

            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">2. Le cas échéant, Montant des provisions sur charges ou, en cas de colocation, du forfait de charge : </span>
              <InlineInput value={data.montant_charges} onChange={(v) => updateField('montant_charges', v)} width="w-24" />
              <span className="ml-1">€</span>
            </div>

            {data.charges_modalite === 'forfait' && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">3. Le cas échéant, en cas de colocation et si les parties en conviennent, modalités de révision du forfait de charges :</p>
                <InlineTextarea
                  value={data.revision_forfait_charges}
                  onChange={(v) => updateField('revision_forfait_charges', v)}
                />
              </div>
            )}

            <h3 className="bail-subsection-title">C. Le cas échéant, contribution pour le partage des économies de charges :</h3>
            <div className="mb-3">
              <p className="text-sm mb-1">1. Montant et durée de la participation du locataire restant à courir au jour de la signature du contrat :</p>
              <InlineTextarea value={data.contribution_economies} onChange={(v) => updateField('contribution_economies', v)} />
            </div>
            <div className="mb-4">
              <p className="text-sm mb-1">2. Éléments propres à justifier les travaux réalisés donnant lieu à cette contribution :</p>
              <InlineTextarea value={data.justification_travaux} onChange={(v) => updateField('justification_travaux', v)} />
            </div>

            <h3 className="bail-subsection-title">D. Le cas échéant, En cas de colocation souscription par le bailleur d'une assurance pour le compte des colocataires :</h3>
            <div className="mb-4 flex gap-4">
              <InlineCheckbox
                checked={data.assurance_colocataires === 'oui'}
                onChange={() => updateField('assurance_colocataires', data.assurance_colocataires === 'oui' ? '' : 'oui')}
                label="Oui"
              />
              <InlineCheckbox
                checked={data.assurance_colocataires === 'non'}
                onChange={() => updateField('assurance_colocataires', data.assurance_colocataires === 'non' ? '' : 'non')}
                label="Non"
              />
            </div>

            {data.assurance_colocataires === 'oui' && (
              <div className="ml-4 mb-4 p-3 bg-gray-50 rounded border">
                <div className="mb-2">
                  <span>1. Montant total annuel récupérable au titre de l'assurance pour compte des colocataires : </span>
                  <InlineInput value={data.assurance_montant_annuel} onChange={(v) => updateField('assurance_montant_annuel', v)} width="w-24" />
                  <span className="ml-1">€</span>
                </div>
                <div>
                  <span>2. Montant récupérable par douzième : </span>
                  <InlineInput value={data.assurance_montant_mensuel} onChange={(v) => updateField('assurance_montant_mensuel', v)} width="w-24" />
                  <span className="ml-1">€</span>
                </div>
              </div>
            )}

            <h3 className="bail-subsection-title">E. Modalités de paiement</h3>
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">Périodicité du paiement : </span>
              <InlineInput value={data.periodicite_paiement} onChange={(v) => updateField('periodicite_paiement', v)} placeholder="Ex: Mensuelle" width="w-32" />
            </div>
            <div className="mb-3 flex gap-4">
              <span className="text-sm font-medium text-gray-700">Paiement : </span>
              <InlineCheckbox
                checked={data.paiement_type === 'echoir'}
                onChange={() => updateField('paiement_type', data.paiement_type === 'echoir' ? '' : 'echoir')}
                label="À échoir"
              />
              <InlineCheckbox
                checked={data.paiement_type === 'echu'}
                onChange={() => updateField('paiement_type', data.paiement_type === 'echu' ? '' : 'echu')}
                label="À terme échu"
              />
            </div>
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">Date ou période de paiement : </span>
              <InlineInput value={data.date_paiement} onChange={(v) => updateField('date_paiement', v)} placeholder="Ex: Le 5 de chaque mois" width="w-48" />
            </div>
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">Lieu de paiement : </span>
              <InlineInput value={data.lieu_paiement} onChange={(v) => updateField('lieu_paiement', v)} placeholder="Ex: Par virement bancaire" width="w-64" />
            </div>

            <p className="text-sm font-medium text-gray-700 mb-2">Montant total dû à la première échéance de paiement pour une période complète de location :</p>
            <div className="ml-4 space-y-2 mb-4">
              <div>
                <span>Loyer (hors charges) : </span>
                <InlineInput value={data.premiere_echeance_loyer} onChange={(v) => updateField('premiere_echeance_loyer', v)} width="w-24" />
                <span className="ml-1">€</span>
              </div>
              <div>
                <span>Charges récupérables : </span>
                <InlineInput value={data.premiere_echeance_charges} onChange={(v) => updateField('premiere_echeance_charges', v)} width="w-24" />
                <span className="ml-1">€</span>
              </div>
              <div>
                <Tooltip text="Montant de la participation du locataire au partage des économies de charges (ex. dispositif d'économies d'énergie). À renseigner uniquement si une telle contribution est prévue au bail.">
                  <span>Contribution pour le partage des économies de charges : </span>
                </Tooltip>
                <InlineInput value={data.premiere_echeance_contribution} onChange={(v) => updateField('premiere_echeance_contribution', v)} width="w-24" />
                <span className="ml-1">€</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-1">
                <Tooltip text="Si le bailleur a souscrit une assurance pour le compte des colocataires (GLI ou autre), indiquer ici le montant récupérable à la première échéance. Sinon, laisser vide ou 0.">
                  <span>En cas de colocation, à l'assurance récupérable pour le compte des colocataires : </span>
                </Tooltip>
                <span className="inline-flex items-baseline flex-nowrap shrink-0">
                  <InlineInput value={data.premiere_echeance_assurance} onChange={(v) => updateField('premiere_echeance_assurance', v)} width="w-24" />
                  <span className="ml-1">€</span>
                </span>
              </div>
            </div>
          </section>
            </A4Page>

            {/* ========== PAGE 4 ========== */}
            <A4Page pageNumber={7}>
          {/* ========== V. TRAVAUX ========== */}
          <section className="mb-8">
            <h2 className="bail-section-title">V. TRAVAUX</h2>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">A. Le cas échéant, Montant et nature des travaux d'amélioration ou de mise en conformité avec les caractéristiques de décence effectués depuis la fin du dernier contrat de location ou depuis le dernier renouvellement :</p>
              <InlineTextarea value={data.travaux_amelioration} onChange={(v) => updateField('travaux_amelioration', v)} rows={3} />
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">B. Majoration du loyer en cours de bail consécutive à des travaux d'amélioration entrepris par le bailleur [nature des travaux, modalités d'exécution, délai de réalisation ainsi que montant de la majoration du loyer] :</p>
              <InlineTextarea value={data.majoration_travaux} onChange={(v) => updateField('majoration_travaux', v)} rows={3} />
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">C. Le cas échéant, Diminution de loyer en cours de bail consécutive à des travaux entrepris par le locataire [durée de cette diminution et, en cas de départ anticipé du locataire, modalités de son dédommagement sur justification des dépenses effectuées] :</p>
              <InlineTextarea value={data.diminution_travaux} onChange={(v) => updateField('diminution_travaux', v)} rows={3} />
            </div>
          </section>

          {/* ========== VI. GARANTIES ========== */}
          <section className="mb-8">
            <h2 className="bail-section-title">VI. GARANTIES</h2>
            
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">
                <Tooltip text="Pour un bail vide, le dépôt de garantie ne peut excéder 1 mois de loyer hors charges. Il est restitué dans un délai maximal de 2 mois après la remise des clés.">
                  Le cas échéant, Montant du dépôt de garantie de l'exécution des obligations du locataire / Garantie autonome [inférieur ou égal à un mois de loyers hors charges] :
                </Tooltip>
              </span>
              <InlineInput value={data.depot_garantie} onChange={(v) => updateField('depot_garantie', v)} width="w-24" placeholder="Ex: 800" />
              <span className="ml-1">€</span>
            </div>
          </section>

          {/* ========== VII. CLAUSE DE SOLIDARITÉ ========== */}
          <section className="mb-8">
            <h2 className="bail-section-title">VII. CLAUSE DE SOLIDARITÉ</h2>
            
            <p className="text-xs text-gray-600 italic">
              Modalités particulières des obligations en cas de pluralité de locataires : en cas de colocation, c'est-à-dire de la 
              location d'un même logement par plusieurs locataires, constituant leur résidence principale et formalisée par la 
              conclusion d'un contrat unique ou de plusieurs contrats entre les locataires et le bailleur, les locataires sont tenus 
              conjointement, solidairement et indivisiblement à l'égard du bailleur au paiement des loyers, charges et accessoires 
              dus en application du présent bail. La solidarité d'un des colocataires et celle de la personne qui s'est portée 
              caution pour lui prennent fin à la date d'effet du congé régulièrement délivré et lorsqu'un nouveau colocataire figure 
              au bail. À défaut, la solidarité du colocataire sortant s'éteint au plus tard à l'expiration d'un délai de six mois 
              après la date d'effet du congé.
            </p>
          </section>
            </A4Page>

            {/* ========== VIII. CLAUSE RÉSOLUTOIRE (page dédiée pour éviter coupure PDF) ========== */}
            <A4Page pageNumber={8}>
          <section className="mb-8">
            <h2 className="bail-section-title">VIII. CLAUSE RÉSOLUTOIRE</h2>
            
            <p className="bail-legal-intro text-gray-600">
              Modalités de résiliation de plein droit du contrat : Le bail sera résilié de plein droit en cas d'inexécution des
              obligations du locataire, soit en cas de défaut de paiement des loyers et des charges locatives au terme convenu, de
              non-versement du dépôt de garantie, de défaut d'assurance du locataire contre les risques locatifs, de troubles de
              voisinage constatés par une décision de justice passée en force de chose jugée rendue au profit d'un tiers. Le
              bailleur devra assigner le locataire devant le tribunal pour faire constater l'acquisition de la clause résolutoire et
              la résiliation de plein droit du bail. Lorsque le bailleur souhaite mettre en œuvre la clause résolutoire pour défaut
              de paiement des loyers et des charges ou pour non-versement du dépôt de garantie, il doit préalablement faire
              signifier au locataire, par acte de commissaire de justice, un commandement de payer, qui doit mentionner certaines
              informations et notamment la faculté pour le locataire de saisir le fonds de solidarité pour le logement. De plus,
              pour les bailleurs personnes physiques ou les sociétés immobilières familiales, le commandement de payer doit être
              signalé par le commissaire de justice à la commission de coordination des actions de prévention des expulsions
              locatives dès lors que l'un des seuils relatifs au montant et à l'ancienneté de la dette, fixé par arrêté préfectoral,
              est atteint. Le locataire peut, à compter de la réception du commandement, régler sa dette, saisir le juge d'instance
              pour demander des délais de paiement, voire demander ponctuellement une aide financière à un fonds de solidarité
              pour le logement. Si le locataire ne s'est pas acquitté des sommes dues dans les six semaines suivant la
              signification, le bailleur peut alors assigner le locataire en justice pour faire constater la résiliation de plein droit
              du bail. En cas de défaut d'assurance, le bailleur ne peut assigner en justice le locataire pour faire constater
              l'acquisition de la clause résolutoire qu'après un délai d'un mois après un commandement demeuré infructueux.
            </p>
          </section>
            </A4Page>

            <A4Page pageNumber={9}>
          {/* ========== IX. HONORAIRES DE LOCATION ========== */}
          <section className="mb-8">
            <h2 className="bail-section-title">IX. LE CAS ÉCHÉANT, HONORAIRES DE LOCATION</h2>
            
            <h3 className="bail-subsection-title mb-2">A. Dispositions applicables</h3>
            <p className="text-xs text-gray-600 italic mb-4">
              Il est rappelé les dispositions du I de l'article 5 (I) de la loi du 6 juillet 1989, alinéas 1 à 3 : « La rémunération des 
              personnes mandatées pour se livrer ou prêter leur concours à l'entremise ou à la négociation d'une mise en location 
              d'un logement, tel que défini aux articles 2 et 25-3, est à la charge exclusive du bailleur, à l'exception des 
              honoraires liés aux prestations mentionnées aux deuxième et troisième alinéas du présent I.
              Les honoraires des personnes mandatées pour effectuer la visite du preneur, constituer son dossier et rédiger un 
              bail sont partagés entre le bailleur et le preneur. Le montant toutes taxes comprises imputé au preneur pour ces 
              prestations ne peut excéder celui imputé au bailleur et demeure inférieur ou égal à un plafond par mètre carré de 
              surface habitable de la chose louée fixé par voie réglementaire et révisable chaque année, dans des conditions 
              définies par décret. Ces honoraires sont dus à la signature du bail.
              Les honoraires des personnes mandatées pour réaliser un état des lieux sont partagés entre le bailleur et le 
              preneur. Le montant toutes taxes comprises imputé au locataire pour cette prestation ne peut excéder celui imputé 
              au bailleur et demeure inférieur ou égal à un plafond par mètre carré de surface habitable de la chose louée fixé 
              par voie réglementaire et révisable chaque année, dans des conditions définies par décret. Ces honoraires sont dus 
              à compter de la réalisation de la prestation. »
            </p>

            <p className="text-sm font-semibold text-[#1e3a5f] mb-2">Plafonds applicables :</p>
            <div className="mb-3">
              <span className="text-sm">Montant du plafond des honoraires imputables aux locataires en matière de prestation de visite du preneur, de constitution de son dossier et de rédaction de bail : </span>
              <InlineInput value={data.plafond_honoraires_bail} onChange={(v) => updateField('plafond_honoraires_bail', v)} width="w-20" />
              <span className="ml-1">€/m² de surface habitable</span>
            </div>
            <div className="mb-4">
              <span className="text-sm">Montant du plafond des honoraires imputables aux locataires en matière d'établissement de l'état des lieux d'entrée : </span>
              <InlineInput value={data.plafond_honoraires_edl} onChange={(v) => updateField('plafond_honoraires_edl', v)} width="w-20" />
              <span className="ml-1">€/m² de surface habitable</span>
            </div>

            <h3 className="bail-subsection-title mb-2">B. Détail et répartition des honoraires</h3>
            
            <p className="text-sm font-semibold text-[#1e3a5f] mb-2">1. Honoraires à la charge du bailleur :</p>
            <div className="mb-3">
              <p className="text-sm mb-1">Prestations de visite du preneur, de constitution de son dossier et de rédaction de bail [détail des prestations effectivement réalisées et montant des honoraires TTC dus à la signature du bail] :</p>
              <InlineTextarea value={data.honoraires_bailleur_bail} onChange={(v) => updateField('honoraires_bailleur_bail', v)} />
            </div>
            <div className="mb-3">
              <span className="text-sm">Prestation de réalisation de l'état des lieux d'entrée [montant des honoraires TTC] : </span>
              <InlineInput value={data.honoraires_bailleur_edl} onChange={(v) => updateField('honoraires_bailleur_edl', v)} width="w-full max-w-md" />
            </div>
            <div className="mb-4">
              <p className="text-sm mb-1">Autres prestations [détail des prestations et conditions de rémunération] :</p>
              <InlineTextarea value={data.honoraires_bailleur_autres} onChange={(v) => updateField('honoraires_bailleur_autres', v)} />
            </div>

            <p className="text-sm font-semibold text-[#1e3a5f] mb-2">2. Honoraires à la charge du locataire :</p>
            <div className="mb-3">
              <p className="text-sm mb-1">Prestations de visite du preneur, de constitution de son dossier et de rédaction de bail [détail des prestations effectivement réalisées et montant des honoraires TTC dus à la signature du bail] :</p>
              <InlineTextarea value={data.honoraires_locataire_bail} onChange={(v) => updateField('honoraires_locataire_bail', v)} />
            </div>
            <div className="mb-4">
              <span className="text-sm">Prestation de réalisation de l'état des lieux d'entrée [montant des honoraires TTC] : </span>
              <InlineInput value={data.honoraires_locataire_edl} onChange={(v) => updateField('honoraires_locataire_edl', v)} width="w-full max-w-md" />
            </div>
          </section>
            </A4Page>

            {/* ========== X. AUTRES CONDITIONS (page dédiée pour éviter coupure PDF) ========== */}
            <A4Page pageNumber={10}>
          <section className="mb-8">
            <h2 className="bail-section-title">X. AUTRES CONDITIONS PARTICULIÈRES</h2>
            
            <p className="text-sm text-gray-600 mb-2">[À définir par les parties]</p>
            <InlineTextarea
              value={data.conditions_particulieres}
              onChange={(v) => updateField('conditions_particulieres', v)}
              placeholder="Conditions particulières convenues entre les parties..."
              rows={4}
            />
          </section>
            </A4Page>

            <A4Page pageNumber={11}>
          {/* ========== XI. ANNEXES ========== */}
          <section className="mb-8">
            <h2 className="bail-section-title">XI. ANNEXES</h2>
            
            <p className="bail-body-text mb-3">Sont annexées et jointes au contrat de location les pièces suivantes :</p>
            
            <div className="text-sm space-y-2">
              <p><strong>A.</strong> Le cas échéant, un extrait du règlement concernant la destination de l'immeuble, la jouissance et l'usage des parties privatives et communes, et précisant la quote-part afférente au lot loué dans chacune des catégories de charges</p>
              
              <p><strong>B.</strong> Un dossier de diagnostic technique comprenant :</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>un diagnostic de performance énergétique ;</li>
                <li>un constat de risque d'exposition au plomb pour les immeubles construits avant le 1er janvier 1949 ;</li>
                <li>une copie d'un état mentionnant l'absence ou la présence de matériaux ou de produits de la construction contenant de l'amiante ;</li>
                <li>un état de l'installation intérieure d'électricité et de gaz, dont l'objet est d'évaluer les risques pouvant porter atteinte à la sécurité des personnes ;</li>
                <li>le cas échéant, un état des risques naturels et technologiques pour les zones couvertes par un plan de prévention des risques technologiques ou par un plan de prévention des risques naturels prévisibles, prescrit ou approuvé, ou dans des zones de sismicité.</li>
              </ul>
              
              <p><strong>C.</strong> Une notice d'information relative aux droits et obligations des locataires et des bailleurs</p>
              
              <p><strong>D.</strong> Un état des lieux</p>
              
              <p><strong>E.</strong> Le cas échéant, Une autorisation préalable de mise en location</p>
              
              <p><strong>F.</strong> Le cas échéant, références aux loyers habituellement constatés dans le voisinage pour des logements comparables</p>
            </div>
          </section>

          {/* ========== SIGNATURES ========== */}
          <section className="mt-12">
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Fait le </span>
              <InlineInput value={data.signature_jour} onChange={(v) => updateField('signature_jour', v)} width="w-12" />
              <span> / </span>
              <InlineInput value={data.signature_mois} onChange={(v) => updateField('signature_mois', v)} width="w-12" />
              <span> / </span>
              <InlineInput value={data.signature_annee} onChange={(v) => updateField('signature_annee', v)} width="w-16" />
              <span> , à </span>
              <InlineInput value={data.signature_lieu} onChange={(v) => updateField('signature_lieu', v)} placeholder="Ville" width="w-32" />
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-sm font-semibold text-[#1e3a5f] mb-2">Signature du (ou des) bailleur(s)</p>
                <p className="text-sm text-gray-600 mb-4">[ou de son mandataire, le cas échéant]</p>
                <div className="h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
                  Signature bailleur
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1e3a5f] mb-2">Signature du (ou des) locataire(s)</p>
                <p className="text-sm text-gray-600 mb-4">&nbsp;</p>
                <div className="h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
                  Signature locataire
                </div>
              </div>
            </div>
          </section>
            </A4Page>

          </div>
          )}
        </div>

        {activeTab === 'creer' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/70 border-t border-gray-200 backdrop-blur z-50 lg:left-64 print:hidden">
            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {missingCount > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    {missingCount} champ(s) essentiel(s) manquant(s)
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Tous les champs essentiels sont remplis
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleEffacer}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-400"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={handleSauver}
                  className="rounded-lg border border-transparent bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                >
                  {savedFeedback ? 'Téléchargé' : 'Sauver'}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-400"
                >
                  Imprimer
                </button>
                <button
                  onClick={() => handleExportPDF()}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#1e3a5f] px-4 py-2 text-sm font-medium text-[#1e3a5f] transition hover:bg-[#1e3a5f] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1e3a5f]"></div>
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      PDF
                    </>
                  )}
                </button>
                {(currentBailSignatureStatus === 'signed' || currentBailSignatureStatus === 'pending') ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('signatures')}
                    className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a2f4d]"
                  >
                    Voir le suivi des signatures
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalizeForSignature}
                    className="rounded-lg bg-[#E65F3F] hover:bg-[#d95530] px-4 py-2 text-sm font-medium text-white transition"
                  >
                    Finaliser pour signature
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
    </>
    );
  }
