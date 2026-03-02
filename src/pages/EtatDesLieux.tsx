import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, AlertCircle, Save, FileText, FolderOpen, ChevronLeft, ChevronRight, Printer, Trash2 } from 'lucide-react';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import { supabase } from '../lib/supabase';
import {
  generateEtatDesLieuxPDF,
  EtatDesLieuxData,
  MODELE_PIECES,
  ELEMENTS_STANDARD,
  ELEMENTS_WC,
  ELEMENTS_CUISINE,
  ELEMENTS_SALLE_BAIN,
  PARTIES_PRIVATIVES_LABELS,
  EQUIPEMENTS_LABELS,
  EtatPiece,
  EDL_MAX_LENGTH_ADRESSE,
  EDL_MAX_LENGTH_ADRESSE_LOGEMENT,
} from '../utils/etatDesLieuxPdfGenerator';
import { uploadPrivateDocument } from '../utils/privateStorage';

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  adresse?: string;
  telephone?: string;
}

const formatDate = (d: Date) =>
  d.getDate().toString().padStart(2, '0') +
  '/' +
  (d.getMonth() + 1).toString().padStart(2, '0') +
  '/' +
  d.getFullYear();

/** Pour input type="date" : DD/MM/YYYY -> YYYY-MM-DD */
function dateToInputValue(ddmmyyyy: string): string {
  if (!ddmmyyyy || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ddmmyyyy.trim())) return '';
  const [d, m, y] = ddmmyyyy.trim().split('/').map(Number);
  if (d < 1 || d > 31 || m < 1 || m > 12) return '';
  return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
}
/** Pour input type="date" : YYYY-MM-DD -> DD/MM/YYYY */
function inputValueToDate(yyyymmdd: string): string {
  if (!yyyymmdd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyymmdd)) return '';
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y}`;
}

const EDL_MOBILE_BREAKPOINT = 768; /* Parcours par étapes sous 768px */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < EDL_MOBILE_BREAKPOINT);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${EDL_MOBILE_BREAKPOINT - 1}px)`);
    const fn = () => setIsMobile(mql.matches);
    mql.addEventListener('change', fn);
    fn();
    return () => mql.removeEventListener('change', fn);
  }, []);
  return isMobile;
}

// Champ inline style document (souligné)
const InlineInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: string;
  className?: string;
}> = ({ value, onChange, placeholder, width = 'flex-1 min-w-0', className = '' }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`${width} edl-input inline ${className ?? ''}`.trim()}
  />
);

export default function EtatDesLieux() {
  const { proprietaire } = useEspaceBailleur();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<'entree' | 'sortie'>('entree');
  const [dateEtablissement, setDateEtablissement] = useState(formatDate(new Date()));
  const [typeLocaux, setTypeLocaux] = useState<'appartement' | 'maison' | 'autre'>('appartement');
  const [typeLocauxAutre, setTypeLocauxAutre] = useState('');
  const [surfaceLogement, setSurfaceLogement] = useState('');
  const [nombrePieces, setNombrePieces] = useState('');
  const [adresseLogement, setAdresseLogement] = useState('');
  const [bailleurNomComplet, setBailleurNomComplet] = useState('');
  const [locataireNomComplet, setLocataireNomComplet] = useState('');
  const [bailleur, setBailleur] = useState({ nom: '', prenom: '', adresse: '', telephone: '', email: '' });
  const [locataire, setLocataire] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    telephone: '',
    email: '',
    nouvelleAdresse: '',
  });
  const NOMBRE_LIGNES_CLES = 5;
  const [cles, setCles] = useState<Array<{ type: string; nombre: string; commentaires: string }>>(() =>
    Array.from({ length: NOMBRE_LIGNES_CLES }, () => ({ type: '', nombre: '', commentaires: '' }))
  );
  const [compteurs, setCompteurs] = useState({
    eau: '',
    eauChaude: '',
    electricite: '',
    electriciteHP: '',
    electriciteHC: '',
    gaz: '',
    gazNumero: '',
  });
  const [nomAncienOccupant, setNomAncienOccupant] = useState('');
  const [chauffageType, setChauffageType] = useState('');
  const [eauChaudeType, setEauChaudeType] = useState('');
  const [chauffageElectrique, setChauffageElectrique] = useState(false);
  const [chauffageGaz, setChauffageGaz] = useState(false);
  const [chauffageAutre, setChauffageAutre] = useState(false);
  const [chauffageCollectif, setChauffageCollectif] = useState(false);
  const [eauChaudeElectrique, setEauChaudeElectrique] = useState(false);
  const [eauChaudeGaz, setEauChaudeGaz] = useState(false);
  const [eauChaudeAutre, setEauChaudeAutre] = useState(false);
  const [eauChaudeCollectif, setEauChaudeCollectif] = useState(false);
  const [chauffageEtat, setChauffageEtat] = useState('');
  const [chauffageDernierEntretien, setChauffageDernierEntretien] = useState('');
  const [radiateursEau, setRadiateursEau] = useState('');
  const [radiateursElectriques, setRadiateursElectriques] = useState('');
  const [ballonEtat, setBallonEtat] = useState('');
  const [chaudiereEtat, setChaudiereEtat] = useState('');
  const [chaudierePresent, setChaudierePresent] = useState(false);
  const [radiateursEauPresent, setRadiateursEauPresent] = useState(false);
  const [radiateursElectriquesPresent, setRadiateursElectriquesPresent] = useState(false);
  const [ballonPresent, setBallonPresent] = useState(false);
  const [autresEquipementsCommentaires, setAutresEquipementsCommentaires] = useState('');
  const [partiesPrivatives, setPartiesPrivatives] = useState<Array<{ numero?: string; entree?: EtatPiece; sortie?: EtatPiece; commentaires?: string; nom?: string }>>(() =>
    [...PARTIES_PRIVATIVES_LABELS.map(() => ({})), {}]
  );
  const [equipements, setEquipements] = useState<Array<{ entree?: EtatPiece; sortie?: EtatPiece; commentaires?: string; nom?: string }>>(() =>
    [...EQUIPEMENTS_LABELS.map(() => ({})), {}]
  );
  const [dateEtatDesLieuxEntree, setDateEtatDesLieuxEntree] = useState('');
  const [evolutionsSortie, setEvolutionsSortie] = useState('');
  const [dateSortie, setDateSortie] = useState('');
  const [dateSignatureEntreeBailleur, setDateSignatureEntreeBailleur] = useState('');
  const [dateSignatureSortieBailleur, setDateSignatureSortieBailleur] = useState('');
  const [dateSignatureEntreeLocataire, setDateSignatureEntreeLocataire] = useState('');
  const [dateSignatureSortieLocataire, setDateSignatureSortieLocataire] = useState('');
  const [dateSignatureAnnexe, setDateSignatureAnnexe] = useState('');
  const [annexTravauxRows, setAnnexTravauxRows] = useState<Array<{ element: string; commentaire: string }>>(() =>
    Array.from({ length: 8 }, () => ({ element: '', commentaire: '' }))
  );
  const [annexCommentaires, setAnnexCommentaires] = useState('');

  const getElementsForPiece = (pieceNom: string): readonly string[] => {
    if (pieceNom.startsWith('WC')) return ELEMENTS_WC;
    if (pieceNom === 'Cuisine') return ELEMENTS_CUISINE;
    if (pieceNom === 'Salle de bain') return ELEMENTS_SALLE_BAIN;
    return ELEMENTS_STANDARD;
  };

  type LignePiece = { entree?: EtatPiece; sortie?: EtatPiece; commentaires?: string };
  type PieceState = {
    nom: string;
    nomAutre?: string;
    observations: string;
    etatEntree?: EtatPiece;
    etatSortie?: EtatPiece;
    lignes: LignePiece[];
  };
  const [pieces, setPieces] = useState<PieceState[]>(() =>
    MODELE_PIECES.map((p) => ({
      nom: p.nom,
      observations: '',
      ...(p.autreLabel ? { nomAutre: '' } : {}),
      lignes: getElementsForPiece(p.nom).map(() => ({})),
    }))
  );

  const STORAGE_KEY_ENTREES = 'edl_entrees';
  const [savedEntrees, setSavedEntrees] = useState<Array<{ id: string; label: string; data: EtatDesLieuxData; savedAt: string; documentName?: string }>>([]);
  const [loadedEntreeId, setLoadedEntreeId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingToDocs, setSavingToDocs] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'sauvegardes'>('form');

  const isMobile = useIsMobile();
  const [mobileStep, setMobileStep] = useState(0);
  const [mobilePieceIndex, setMobilePieceIndex] = useState(0);
  const totalScreens = 6 + pieces.length + 2;
  const isLastMobileStep = mobileStep === 8 || (mobileStep === 6 && mobilePieceIndex >= pieces.length - 1);
  const currentScreenIndex = useMemo(() => {
    if (mobileStep < 6) return mobileStep;
    if (mobileStep === 6) return 6 + mobilePieceIndex;
    return 6 + pieces.length + (mobileStep - 7);
  }, [mobileStep, mobilePieceIndex, pieces.length]);
  const canPrev = mobileStep > 0 || (mobileStep === 6 && mobilePieceIndex > 0);
  const goPrev = () => {
    if (mobileStep === 6 && mobilePieceIndex > 0) setMobilePieceIndex((i) => i - 1);
    else if (mobileStep > 0) setMobileStep((s) => s - 1);
  };
  const goNext = () => {
    if (mobileStep === 6 && mobilePieceIndex < pieces.length - 1) setMobilePieceIndex((i) => i + 1);
    else if (mobileStep < 8) setMobileStep((s) => s + 1);
  };
  const ETAT_LABELS: Record<EtatPiece, string> = { tres_bon: 'Très bon', bon: 'Bon', moyen: 'Moyen', mauvais: 'Mauvais' };
  const updateLignePiece = (pieceIdx: number, lineIdx: number, key: 'entree' | 'sortie' | 'commentaires', value: EtatPiece | string) => {
    setPieces((prev) =>
      prev.map((p, i) =>
        i !== pieceIdx
          ? p
          : { ...p, lignes: p.lignes.map((l, j) => (j !== lineIdx ? l : { ...l, [key]: value })) }
      )
    );
  };
  const navigate = useNavigate();

  useEffect(() => {
    if (!proprietaire) return;
    const nomComplet = [proprietaire.prenom, proprietaire.nom].filter(Boolean).join(' ');
    setBailleurNomComplet((prev) => prev || nomComplet);
    setBailleur((prev) => ({
      ...prev,
      nom: proprietaire.nom || prev.nom,
      prenom: proprietaire.prenom || prev.prenom,
      adresse: proprietaire.adresse || prev.adresse,
      telephone: proprietaire.telephone || prev.telephone,
      email: proprietaire.email || prev.email,
    }));
    // Ne pas préremplir l'adresse des locaux avec l'adresse du bailleur : elle vient du locataire (adresse_logement)
  }, [proprietaire]);

  // Préremplir adresse du logement et locataire depuis le premier locataire (espace bailleur)
  useEffect(() => {
    if (!proprietaire?.id) return;
    let cancelled = false;
    (async () => {
      const { data: locs } = await supabase
        .from('locataires')
        .select('nom, prenom, email, telephone, adresse_logement')
        .eq('proprietaire_id', proprietaire.id)
        .order('created_at', { ascending: true })
        .limit(1);
      if (cancelled || !locs?.length) return;
      const first = locs[0];
      setAdresseLogement((prev) => prev || first.adresse_logement || '');
      setLocataireNomComplet((prev) => prev || [first.prenom, first.nom].filter(Boolean).join(' '));
      setLocataire((prev) => ({
        ...prev,
        nom: prev.nom || first.nom || '',
        prenom: prev.prenom || first.prenom || '',
        adresse: prev.adresse || first.adresse_logement || '',
        telephone: prev.telephone || first.telephone || '',
        email: prev.email || first.email || '',
      }));
    })();
    return () => { cancelled = true; };
  }, [proprietaire?.id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ENTREES);
      if (raw) {
        const list = JSON.parse(raw) as Array<{ id: string; label: string; data: EtatDesLieuxData; savedAt: string }>;
        setSavedEntrees(Array.isArray(list) ? list : []);
      }
    } catch {
      setSavedEntrees([]);
    }
  }, []);

  const buildFilledData = (): EtatDesLieuxData => ({
    type,
    dateEtablissement,
    typeLocaux,
    surfaceLogement: surfaceLogement.trim() || undefined,
    nombrePieces: nombrePieces.trim() || undefined,
    adresseLogement: adresseLogement.trim(),
    bailleur: (() => {
      const parts = bailleurNomComplet.trim().split(/\s+/).filter(Boolean);
      return {
        prenom: parts[0] ?? '',
        nom: parts.slice(1).join(' ') ?? '',
        adresse: bailleur.adresse.trim(),
        telephone: bailleur.telephone.trim() || undefined,
        email: bailleur.email.trim() || undefined,
      };
    })(),
    locataire: (() => {
      const parts = locataireNomComplet.trim().split(/\s+/).filter(Boolean);
      return {
        prenom: parts[0] ?? '',
        nom: parts.slice(1).join(' ') ?? '',
        adresse: locataire.adresse.trim(),
        telephone: locataire.telephone.trim() || undefined,
        email: locataire.email.trim() || undefined,
        nouvelleAdresse: locataire.nouvelleAdresse?.trim() || undefined,
      };
    })(),
    cles: cles.map((c) => ({ type: c.type.trim() || undefined, nombre: c.nombre.trim() || undefined, commentaires: c.commentaires.trim() || undefined })),
    compteurs:
      compteurs.eau ||
      compteurs.eauChaude ||
      compteurs.electricite ||
      compteurs.electriciteHP ||
      compteurs.electriciteHC ||
      compteurs.gaz ||
      compteurs.gazNumero
        ? {
            eau: compteurs.eau.trim() || undefined,
            eauChaude: compteurs.eauChaude.trim() || undefined,
            electricite: compteurs.electricite.trim() || undefined,
            electriciteHP: compteurs.electriciteHP.trim() || undefined,
            electriciteHC: compteurs.electriciteHC.trim() || undefined,
            gaz: compteurs.gaz.trim() || undefined,
            gazNumero: compteurs.gazNumero.trim() || undefined,
          }
        : undefined,
    nomAncienOccupant: nomAncienOccupant.trim() || undefined,
    chauffageType: chauffageType.trim() || undefined,
    eauChaudeType: eauChaudeType.trim() || undefined,
    chauffageElectrique: chauffageElectrique || undefined,
    chauffageGaz: chauffageGaz || undefined,
    chauffageAutre: chauffageAutre || undefined,
    chauffageCollectif: chauffageCollectif || undefined,
    eauChaudeElectrique: eauChaudeElectrique || undefined,
    eauChaudeGaz: eauChaudeGaz || undefined,
    eauChaudeAutre: eauChaudeAutre || undefined,
    eauChaudeCollectif: eauChaudeCollectif || undefined,
    chauffageEtat: chauffageEtat.trim() || undefined,
    chauffageDernierEntretien: chauffageDernierEntretien.trim() || undefined,
    radiateursEau: radiateursEau.trim() || undefined,
    radiateursElectriques: radiateursElectriques.trim() || undefined,
    ballonEtat: ballonEtat.trim() || undefined,
    chaudiereEtat: chaudiereEtat.trim() || undefined,
    chaudierePresent: chaudierePresent || undefined,
    radiateursEauPresent: radiateursEauPresent || undefined,
    radiateursElectriquesPresent: radiateursElectriquesPresent || undefined,
    ballonPresent: ballonPresent || undefined,
    autresEquipementsCommentaires: autresEquipementsCommentaires.trim() || undefined,
    partiesPrivatives: partiesPrivatives.some((p) => p.numero || p.entree || p.sortie || (p.commentaires && p.commentaires.trim()) || (p.nom && p.nom.trim()))
      ? partiesPrivatives.map((p) => ({
          numero: p.numero?.trim() || undefined,
          entree: p.entree,
          sortie: p.sortie,
          commentaires: p.commentaires?.trim() || undefined,
          nom: p.nom?.trim() || undefined,
        }))
      : undefined,
    equipements: equipements.some((e) => e.entree || e.sortie || (e.commentaires && e.commentaires.trim()) || (e.nom && e.nom.trim()))
      ? equipements.map((e) => ({
          entree: e.entree,
          sortie: e.sortie,
          commentaires: e.commentaires?.trim() || undefined,
          nom: e.nom?.trim() || undefined,
        }))
      : undefined,
    dateEtatDesLieuxEntree: dateEtatDesLieuxEntree.trim() || undefined,
    evolutionsSortie: evolutionsSortie.trim() || undefined,
    dateSortie: dateSortie.trim() || dateEtablissement || undefined,
    dateSignatureEntreeBailleur: dateSignatureEntreeBailleur.trim() || undefined,
    dateSignatureSortieBailleur: dateSignatureSortieBailleur.trim() || undefined,
    dateSignatureEntreeLocataire: dateSignatureEntreeLocataire.trim() || undefined,
    dateSignatureSortieLocataire: dateSignatureSortieLocataire.trim() || undefined,
    dateSignatureAnnexe: dateSignatureAnnexe.trim() || undefined,
    annexTravauxRows,
    annexCommentaires: annexCommentaires.trim() || undefined,
    pieces: pieces.map((p) => {
      const firstLigne = p.lignes?.[0];
      return {
        nom: p.nom,
        nomAutre: p.nomAutre?.trim() || undefined,
        observations: (p.lignes?.map((l) => l.commentaires).filter(Boolean).join(' ; ') || p.observations || '').trim() || undefined,
        etatEntree: firstLigne?.entree ?? p.etatEntree,
        etatSortie: firstLigne?.sortie ?? p.etatSortie,
        lignes: p.lignes?.map((l) => ({
          entree: l.entree,
          sortie: l.sortie,
          commentaires: l.commentaires?.trim() || undefined,
        })),
      };
    }),
  });

  const downloadPdf = (data: EtatDesLieuxData, filename: string) => {
    generateEtatDesLieuxPDF(data)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Erreur lors de la génération du PDF.';
        setError(msg);
        console.error('Génération PDF état des lieux:', err);
      })
      .finally(() => setGenerating(false));
  };

  const handleDownload = () => {
    setError(null);
    setGenerating(true);
    const dateStr = dateEtablissement.replace(/\//g, '-') || formatDate(new Date()).replace(/\//g, '-');
    downloadPdf(buildFilledData(), `Etat_des_lieux_${type}_${dateStr}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEffacer = () => {
    if (!window.confirm('Effacer toutes les données du formulaire ?')) return;
    setType('entree');
    setDateEtablissement(formatDate(new Date()));
    setTypeLocaux('appartement');
    setTypeLocauxAutre('');
    setSurfaceLogement('');
    setNombrePieces('');
    setAdresseLogement('');
    setBailleurNomComplet(proprietaire ? [proprietaire.prenom, proprietaire.nom].filter(Boolean).join(' ') : '');
    setLocataireNomComplet('');
    setBailleur(proprietaire
      ? { nom: proprietaire.nom || '', prenom: proprietaire.prenom || '', adresse: proprietaire.adresse || '', telephone: proprietaire.telephone || '', email: proprietaire.email || '' }
      : { nom: '', prenom: '', adresse: '', telephone: '', email: '' });
    setLocataire({ nom: '', prenom: '', adresse: '', telephone: '', email: '', nouvelleAdresse: '' });
    setCles(Array.from({ length: NOMBRE_LIGNES_CLES }, () => ({ type: '', nombre: '', commentaires: '' })));
    setCompteurs({ eau: '', eauChaude: '', electricite: '', electriciteHP: '', electriciteHC: '', gaz: '', gazNumero: '' });
    setNomAncienOccupant('');
    setChauffageType('');
    setEauChaudeType('');
    setChauffageElectrique(false);
    setChauffageGaz(false);
    setChauffageAutre(false);
    setChauffageCollectif(false);
    setEauChaudeElectrique(false);
    setEauChaudeGaz(false);
    setEauChaudeAutre(false);
    setEauChaudeCollectif(false);
    setChauffageEtat('');
    setChauffageDernierEntretien('');
    setRadiateursEau('');
    setRadiateursElectriques('');
    setBallonEtat('');
    setChaudiereEtat('');
    setChaudierePresent(false);
    setRadiateursEauPresent(false);
    setRadiateursElectriquesPresent(false);
    setBallonPresent(false);
    setAutresEquipementsCommentaires('');
    setPartiesPrivatives([...PARTIES_PRIVATIVES_LABELS.map(() => ({})), {}]);
    setEquipements([...EQUIPEMENTS_LABELS.map(() => ({})), {}]);
    setDateEtatDesLieuxEntree('');
    setEvolutionsSortie('');
    setDateSortie('');
    setDateSignatureEntreeBailleur('');
    setDateSignatureSortieBailleur('');
    setDateSignatureEntreeLocataire('');
    setDateSignatureSortieLocataire('');
    setDateSignatureAnnexe('');
    setAnnexTravauxRows(Array.from({ length: 8 }, () => ({ element: '', commentaire: '' })));
    setAnnexCommentaires('');
    setPieces(MODELE_PIECES.map((p) => ({
      nom: p.nom,
      observations: '',
      ...(p.autreLabel ? { nomAutre: '' } : {}),
      lignes: getElementsForPiece(p.nom).map(() => ({})),
    })));
    setMobileStep(0);
    setMobilePieceIndex(0);
    setError(null);
    setSaveSuccess(false);
    setLoadedEntreeId(null);
  };

  const safeFileName = (s: string) =>
    s.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '').slice(0, 60) || 'logement';

  const handleSaveEntree = async () => {
    setError(null);
    if (!adresseLogement.trim()) {
      setError('L\'adresse du logement est obligatoire pour sauvegarder.');
      return;
    }
    const data: EtatDesLieuxData = { ...buildFilledData(), type: 'entree' };
    const id = `edl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const label = `${adresseLogement.trim()} – ${dateEtablissement}`;
    const savedAt = new Date().toISOString();
    let documentName: string | undefined;
    setSavingToDocs(true);
    try {
      const blob = await generateEtatDesLieuxPDF(data);
      const dateStr = dateEtablissement.replace(/\//g, '-');
      const baseName = `Etat_des_lieux_entree_${dateStr}_${safeFileName(adresseLogement.trim())}`;
      documentName = `${baseName}.pdf`;
      await uploadPrivateDocument(blob, documentName, {
        folder: 'baux-etat-des-lieux',
        contentType: 'application/pdf',
      });
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de l\'enregistrement dans Mes documents.');
      setSavingToDocs(false);
      return;
    }
    setSavingToDocs(false);
    const next = [...savedEntrees, { id, label, data, savedAt, documentName }];
    setSavedEntrees(next);
    try {
      localStorage.setItem(STORAGE_KEY_ENTREES, JSON.stringify(next));
    } catch (e) {
      setError('Impossible de sauvegarder (stockage local plein).');
      return;
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setActiveTab('sauvegardes');
  };

  const handleLoadEntree = (entreeId: string) => {
    const entree = savedEntrees.find((e) => e.id === entreeId);
    if (!entree) return;
    const d = entree.data;
    setLoadedEntreeId(entreeId);
    setTypeLocaux(d.typeLocaux || 'appartement');
    setSurfaceLogement(d.surfaceLogement || '');
    setNombrePieces(d.nombrePieces || '');
    setAdresseLogement(d.adresseLogement);
    setBailleurNomComplet([d.bailleur.prenom, d.bailleur.nom].filter(Boolean).join(' '));
    setLocataireNomComplet([d.locataire.prenom, d.locataire.nom].filter(Boolean).join(' '));
    setBailleur({
      nom: d.bailleur.nom,
      prenom: d.bailleur.prenom,
      adresse: d.bailleur.adresse,
      telephone: d.bailleur.telephone || '',
      email: d.bailleur.email || '',
    });
    setLocataire({
      nom: d.locataire.nom,
      prenom: d.locataire.prenom,
      adresse: d.locataire.adresse,
      telephone: d.locataire.telephone || '',
      email: d.locataire.email || '',
      nouvelleAdresse: '',
    });
    setDateEtablissement(d.dateEtablissement || '');
    setDateEtatDesLieuxEntree(d.dateEtatDesLieuxEntree || d.dateEtablissement || '');
    setDateSortie(d.dateSortie || '');
    setEvolutionsSortie(d.evolutionsSortie || '');
    if (d.cles && d.cles.length > 0) {
      setCles(
        Array.from({ length: NOMBRE_LIGNES_CLES }, (_, i) => ({
          type: d.cles![i]?.type ?? '',
          nombre: d.cles![i]?.nombre ?? '',
          commentaires: d.cles![i]?.commentaires ?? '',
        }))
      );
    } else {
      setCles(
        Array.from({ length: NOMBRE_LIGNES_CLES }, (_, i) =>
          i === 0
            ? { type: d.cleType ?? '', nombre: d.cleNombre ?? '', commentaires: d.clesEtAcces ?? '' }
            : { type: '', nombre: '', commentaires: '' }
        )
      );
    }
    setCompteurs({
      eau: d.compteurs?.eau || '',
      eauChaude: d.compteurs?.eauChaude || '',
      electricite: d.compteurs?.electricite || '',
      electriciteHP: d.compteurs?.electriciteHP || '',
      electriciteHC: d.compteurs?.electriciteHC || '',
      gaz: d.compteurs?.gaz || '',
      gazNumero: d.compteurs?.gazNumero || '',
    });
    setNomAncienOccupant(d.nomAncienOccupant || '');
    setChauffageType(d.chauffageType || '');
    setEauChaudeType(d.eauChaudeType || '');
    setChauffageElectrique(!!d.chauffageElectrique);
    setChauffageGaz(!!d.chauffageGaz);
    setChauffageAutre(!!d.chauffageAutre);
    setChauffageCollectif(!!d.chauffageCollectif);
    setEauChaudeElectrique(!!d.eauChaudeElectrique);
    setEauChaudeGaz(!!d.eauChaudeGaz);
    setEauChaudeAutre(!!d.eauChaudeAutre);
    setEauChaudeCollectif(!!d.eauChaudeCollectif);
    setChauffageEtat(d.chauffageEtat || '');
    setChauffageDernierEntretien(d.chauffageDernierEntretien || '');
    setRadiateursEau(d.radiateursEau || '');
    setRadiateursElectriques(d.radiateursElectriques || '');
    setBallonEtat(d.ballonEtat || '');
    setChaudiereEtat(d.chaudiereEtat || '');
    setChaudierePresent(!!d.chaudierePresent);
    setRadiateursEauPresent(!!d.radiateursEauPresent);
    setRadiateursElectriquesPresent(!!d.radiateursElectriquesPresent);
    setBallonPresent(!!d.ballonPresent);
    setAutresEquipementsCommentaires(d.autresEquipementsCommentaires || '');
    if (d.partiesPrivatives && d.partiesPrivatives.length > 0) {
      setPartiesPrivatives(
        Array.from({ length: PARTIES_PRIVATIVES_LABELS.length + 1 }, (_, i) => d.partiesPrivatives![i] || {})
      );
    }
    if (d.equipements && d.equipements.length > 0) {
      setEquipements(
        Array.from({ length: EQUIPEMENTS_LABELS.length + 1 }, (_, i) => d.equipements![i] || {})
      );
    }
    if (d.pieces && d.pieces.length > 0) {
      setPieces(
        MODELE_PIECES.map((modele, i) => {
          const p = d.pieces![i];
          const elements = getElementsForPiece(modele.nom);
          const lignes: LignePiece[] = elements.map((_, elemIdx) => {
            if (elemIdx === 0 && p) return { entree: p.etatEntree, sortie: p.etatSortie, commentaires: p.observations || '' };
            return {};
          });
          if (!p) return { nom: modele.nom, observations: '', lignes, ...(modele.autreLabel ? { nomAutre: '' } : {}) };
          return {
            nom: p.nom || modele.nom,
            nomAutre: (p as { nomAutre?: string }).nomAutre ?? (modele.autreLabel ? '' : undefined),
            observations: p.observations || '',
            etatEntree: p.etatEntree,
            etatSortie: p.etatSortie,
            lignes,
          };
        })
      );
    }
    if (d.dateSignatureAnnexe) setDateSignatureAnnexe(d.dateSignatureAnnexe);
    if (d.annexTravauxRows && d.annexTravauxRows.length > 0) {
      const rows = d.annexTravauxRows.slice(0, 8);
      setAnnexTravauxRows(rows.length >= 8 ? rows : [...rows, ...Array.from({ length: 8 - rows.length }, () => ({ element: '', commentaire: '' }))]);
    }
    if (d.annexCommentaires) setAnnexCommentaires(d.annexCommentaires);
  };

  if (!proprietaire) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 print:hidden">
          <div className="px-4 pt-4 pb-0">
            <div className="flex items-center justify-between">
              <div />
            </div>
            {/* Onglets – collés à la bordure du contenu, un seul trait sous les onglets */}
            <nav className="mt-4 -mx-4 flex gap-0 px-4" aria-label="Onglets">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-tl-md ${
                  activeTab === 'form'
                    ? 'bg-charte-bleu text-white border border-b-0 border-charte-bleu border-b-white'
                    : 'border border-gray-300 border-b-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Rédiger
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sauvegardes')}
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 rounded-tr-md -ml-px ${
                  activeTab === 'sauvegardes'
                    ? 'bg-charte-bleu text-white border border-b-0 border-charte-bleu border-b-white'
                    : 'border border-gray-300 border-b-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Sauvegardes
                {savedEntrees.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'sauvegardes' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {savedEntrees.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </header>

        {error && (
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <main className={`flex-1 min-w-0 ${activeTab === 'form' && isMobile ? 'overflow-x-hidden overflow-y-auto' : 'overflow-y-auto'} px-3 sm:px-4 pt-0 pb-24`}>
          {activeTab === 'form' && (
          <div className={isMobile ? 'w-full max-w-full min-w-0 mx-auto h-full' : 'max-w-[210mm] mx-auto w-full h-full'}>
          {isMobile ? (
          <>
          <div className="flex flex-col w-full max-w-full min-w-0 overflow-x-hidden h-[calc(100dvh-10rem)] max-h-[calc(100dvh-10rem)]">
            <div className="edl-mobile-flow flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
              {mobileStep === 0 && (
                <div className="edl-page space-y-4 w-full max-w-full min-w-0 px-1">
                  <h2 className="edl-block-title">Général</h2>
                  <div className="space-y-3">
                    <div><p className="text-sm text-gray-600 mb-1">Entrée le</p><InlineInput value={dateEtatDesLieuxEntree || ''} onChange={(v) => setDateEtatDesLieuxEntree(v)} width="w-full" placeholder="JJ/MM/AAAA" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Sortie le</p><InlineInput value={dateSortie || ''} onChange={(v) => setDateSortie(v)} width="w-full" placeholder="JJ/MM/AAAA" /></div>
                  </div>
                  <div className="edl-block">
                    <h3 className="edl-block-title">Les locaux</h3>
                    <p className="mb-3 text-sm">Type</p>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" name="typeLocaux" checked={typeLocaux === 'appartement'} onChange={() => setTypeLocaux('appartement')} className="text-[#1e3a5f]" /> Appartement</label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" name="typeLocaux" checked={typeLocaux === 'maison'} onChange={() => setTypeLocaux('maison')} className="text-[#1e3a5f]" /> Maison</label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" name="typeLocaux" checked={typeLocaux === 'autre'} onChange={() => setTypeLocaux('autre')} className="text-[#1e3a5f]" /> Autre</label>
                    </div>
                    {typeLocaux === 'autre' && <div className="mb-3"><p className="text-sm text-gray-600 mb-1">Précisez</p><InlineInput value={typeLocauxAutre} onChange={setTypeLocauxAutre} width="w-full" placeholder="—" /></div>}
                    <div className="mb-3"><p className="text-sm text-gray-600 mb-1">Surface (m²)</p><InlineInput value={surfaceLogement} onChange={setSurfaceLogement} width="w-full" placeholder="—" /></div>
                    <div className="mb-3"><p className="text-sm text-gray-600 mb-1">Nombre de pièces</p><InlineInput value={nombrePieces} onChange={setNombrePieces} width="w-full" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Adresse</p><textarea value={adresseLogement} onChange={(e) => setAdresseLogement(e.target.value.slice(0, EDL_MAX_LENGTH_ADRESSE_LOGEMENT))} rows={2} maxLength={EDL_MAX_LENGTH_ADRESSE_LOGEMENT} className="w-full max-w-full edl-input-area resize-y text-inherit min-w-0" placeholder="Adresse du logement" /></div>
                  </div>
                  <div className="edl-block">
                    <h3 className="edl-block-title">Bailleur</h3>
                    <div className="mb-2"><p className="text-sm text-gray-600 mb-1">Nom / dénomination</p><InlineInput value={bailleurNomComplet} onChange={setBailleurNomComplet} placeholder="—" width="w-full" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Adresse</p><textarea value={bailleur.adresse} onChange={(e) => setBailleur((b) => ({ ...b, adresse: e.target.value.slice(0, EDL_MAX_LENGTH_ADRESSE) }))} rows={2} maxLength={EDL_MAX_LENGTH_ADRESSE} className="w-full max-w-full edl-input-area resize-y text-inherit min-w-0" placeholder="—" /></div>
                  </div>
                  <div className="edl-block">
                    <h3 className="edl-block-title">Locataire(s)</h3>
                    <div className="mb-2"><p className="text-sm text-gray-600 mb-1">Nom et prénom</p><InlineInput value={locataireNomComplet} onChange={setLocataireNomComplet} placeholder="—" width="w-full" /></div>
                    <div className="mb-2"><p className="text-sm text-gray-600 mb-1">Adresse</p><textarea value={locataire.adresse} onChange={(e) => setLocataire((l) => ({ ...l, adresse: e.target.value.slice(0, EDL_MAX_LENGTH_ADRESSE) }))} rows={2} maxLength={EDL_MAX_LENGTH_ADRESSE} className="w-full max-w-full edl-input-area resize-y text-inherit min-w-0" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Nouvelle adresse (sortie)</p><InlineInput value={locataire.nouvelleAdresse} onChange={(v) => setLocataire((l) => ({ ...l, nouvelleAdresse: v }))} placeholder="—" width="w-full" /></div>
                  </div>
                </div>
              )}
              {mobileStep === 1 && (
                <div className="edl-page space-y-4 w-full max-w-full min-w-0 px-1">
                  <h2 className="edl-block-title">Relevé des compteurs</h2>
                  <div className="edl-block space-y-2">
                    <h3 className="text-sm font-semibold text-[#1e3a5f]">Électricité</h3>
                    <div><p className="text-sm text-gray-600 mb-1">N° compteur</p><InlineInput value={compteurs.electricite} onChange={(v) => setCompteurs((c) => ({ ...c, electricite: v }))} width="w-full" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">HP</p><InlineInput value={compteurs.electriciteHP} onChange={(v) => setCompteurs((c) => ({ ...c, electriciteHP: v }))} width="w-full" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">HC</p><InlineInput value={compteurs.electriciteHC} onChange={(v) => setCompteurs((c) => ({ ...c, electriciteHC: v }))} width="w-full" placeholder="—" /></div>
                  </div>
                  <div className="edl-block space-y-2">
                    <h3 className="text-sm font-semibold text-[#1e3a5f]">Gaz</h3>
                    <div><p className="text-sm text-gray-600 mb-1">N° compteur</p><InlineInput value={compteurs.gazNumero} onChange={(v) => setCompteurs((c) => ({ ...c, gazNumero: v }))} width="w-full" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Relevé</p><InlineInput value={compteurs.gaz} onChange={(v) => setCompteurs((c) => ({ ...c, gaz: v }))} width="w-full" placeholder="—" /></div>
                  </div>
                  <div className="edl-block space-y-2">
                    <h3 className="text-sm font-semibold text-[#1e3a5f]">Eau</h3>
                    <div><p className="text-sm text-gray-600 mb-1">Eau chaude (m³)</p><InlineInput value={compteurs.eauChaude} onChange={(v) => setCompteurs((c) => ({ ...c, eauChaude: v }))} width="w-full" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Eau froide (m³)</p><InlineInput value={compteurs.eau} onChange={(v) => setCompteurs((c) => ({ ...c, eau: v }))} width="w-full" placeholder="—" /></div>
                  </div>
                  <div className="edl-block">
                    <p className="text-sm text-gray-600 mb-1">Ancien occupant</p><InlineInput value={nomAncienOccupant} onChange={setNomAncienOccupant} width="w-full" placeholder="—" />
                  </div>
                </div>
              )}
              {mobileStep === 2 && (
                <div className="edl-page space-y-4 w-full max-w-full min-w-0 px-1">
                  <h2 className="edl-block-title">Énergie & chauffage</h2>
                  <div className="edl-block">
                    <h3 className="text-sm font-semibold text-[#1e3a5f] mb-2">Chauffage</h3>
                    <div className="flex flex-wrap gap-3 mb-2">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={chauffageElectrique} onChange={(e) => setChauffageElectrique(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" /> électrique</label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={chauffageGaz} onChange={(e) => setChauffageGaz(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" /> gaz</label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={chauffageAutre} onChange={(e) => setChauffageAutre(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" /> autre</label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={chauffageCollectif} onChange={(e) => setChauffageCollectif(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" /> collectif</label>
                    </div>
                    <div className="mb-2"><p className="text-sm text-gray-600 mb-1">Type (précisez)</p><InlineInput value={chauffageType} onChange={setChauffageType} width="w-full" placeholder="—" /></div>
                  </div>
                  <div className="edl-block">
                    <h3 className="text-sm font-semibold text-[#1e3a5f] mb-2">Eau chaude</h3>
                    <div className="flex flex-wrap gap-3 mb-2">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={eauChaudeElectrique} onChange={(e) => setEauChaudeElectrique(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" /> électrique</label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={eauChaudeGaz} onChange={(e) => setEauChaudeGaz(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" /> gaz</label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={eauChaudeAutre} onChange={(e) => setEauChaudeAutre(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" /> autre</label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={eauChaudeCollectif} onChange={(e) => setEauChaudeCollectif(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" /> collectif</label>
                    </div>
                    <div className="mb-2"><p className="text-sm text-gray-600 mb-1">Type (précisez)</p><InlineInput value={eauChaudeType} onChange={setEauChaudeType} width="w-full" placeholder="—" /></div>
                  </div>
                  <div className="edl-block space-y-2">
                    <h3 className="text-sm font-semibold text-[#1e3a5f]">Équipements</h3>
                    <div><p className="text-sm text-gray-600 mb-1">Chaudière / état</p><InlineInput value={chaudiereEtat} onChange={setChaudiereEtat} width="w-full" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Dernier entretien</p><InlineInput value={chauffageDernierEntretien} onChange={setChauffageDernierEntretien} width="w-full" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Radiateurs à eau (nombre)</p><InlineInput value={radiateursEau} onChange={setRadiateursEau} width="w-full" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Radiateurs électriques (nombre)</p><InlineInput value={radiateursElectriques} onChange={setRadiateursElectriques} width="w-full" placeholder="—" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Ballon / état</p><InlineInput value={ballonEtat} onChange={setBallonEtat} width="w-full" placeholder="—" /></div>
                  </div>
                </div>
              )}
              {mobileStep === 3 && (
                <div className="edl-page space-y-3 w-full max-w-full min-w-0 px-1">
                  <h2 className="edl-block-title">Clés et moyens d'accès</h2>
                  {cles.map((c, idx) => (
                    <div key={idx} className="edl-block border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Clé {idx + 1}</p>
                      <div className="mb-2"><p className="text-xs text-gray-500 mb-1">Type</p><input type="text" value={c.type} onChange={(e) => setCles((prev) => prev.map((x, i) => (i === idx ? { ...x, type: e.target.value } : x)))} className="edl-input w-full max-w-full min-w-0" placeholder="Ex. Clés portes" /></div>
                      <div className="mb-2"><p className="text-xs text-gray-500 mb-1">Nombre</p><input type="text" value={c.nombre} onChange={(e) => setCles((prev) => prev.map((x, i) => (i === idx ? { ...x, nombre: e.target.value } : x)))} className="edl-input w-full max-w-full min-w-0" placeholder="Ex. 2" /></div>
                      <div><p className="text-xs text-gray-500 mb-1">Commentaires</p><input type="text" value={c.commentaires} onChange={(e) => setCles((prev) => prev.map((x, i) => (i === idx ? { ...x, commentaires: e.target.value } : x)))} className="edl-input w-full max-w-full min-w-0" placeholder="Ex. code 1234" /></div>
                    </div>
                  ))}
                </div>
              )}
              {mobileStep === 4 && (
                <div className="edl-page space-y-4 w-full max-w-full min-w-0 px-1">
                  <h2 className="edl-block-title">Évolutions & parties privatives</h2>
                  <div className="edl-block">
                    <div className="mb-2"><p className="text-sm text-gray-600 mb-1">Date état des lieux d'entrée</p><InlineInput value={dateEtatDesLieuxEntree} onChange={setDateEtatDesLieuxEntree} width="w-full" placeholder="JJ/MM/AAAA" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Évolutions constatées (sortie)</p><textarea value={evolutionsSortie} onChange={(e) => setEvolutionsSortie(e.target.value)} rows={2} className="w-full max-w-full min-w-0 edl-input-area text-inherit resize-y" placeholder="Dégradations, travaux..." /></div>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1e3a5f]">Parties privatives</h3>
                  {[...PARTIES_PRIVATIVES_LABELS, ''].map((label, idx) => (
                    <div key={idx} className="edl-block border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{idx < PARTIES_PRIVATIVES_LABELS.length ? label : 'Autre (à préciser)'}</p>
                      {idx >= PARTIES_PRIVATIVES_LABELS.length && (
                        <div className="mb-2"><p className="text-xs text-gray-500 mb-1">Nom</p><input type="text" value={partiesPrivatives[idx]?.nom ?? ''} onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, nom: e.target.value } : p)))} className="edl-input w-full max-w-full min-w-0" placeholder="—" /></div>
                      )}
                      <div className="mb-2"><p className="text-xs text-gray-500 mb-1">N°</p><input type="text" value={partiesPrivatives[idx]?.numero ?? ''} onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, numero: e.target.value } : p)))} className="edl-input w-full max-w-full min-w-0" placeholder="—" /></div>
                      <div className="mb-2"><p className="text-xs text-gray-500 mb-1">Entrée</p><select value={partiesPrivatives[idx]?.entree ?? ''} onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, entree: (e.target.value || undefined) as EtatPiece | undefined } : p)))} className="edl-select w-full max-w-full"><option value="">—</option>{(['tres_bon', 'bon', 'moyen', 'mauvais'] as const).map((et) => <option key={et} value={et}>{ETAT_LABELS[et]}</option>)}</select></div>
                      <div className="mb-2"><p className="text-xs text-gray-500 mb-1">Sortie</p><select value={partiesPrivatives[idx]?.sortie ?? ''} onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, sortie: (e.target.value || undefined) as EtatPiece | undefined } : p)))} className="edl-select w-full max-w-full"><option value="">—</option>{(['tres_bon', 'bon', 'moyen', 'mauvais'] as const).map((et) => <option key={et} value={et}>{ETAT_LABELS[et]}</option>)}</select></div>
                      <div><p className="text-xs text-gray-500 mb-1">Commentaire</p><input type="text" value={partiesPrivatives[idx]?.commentaires ?? ''} onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, commentaires: e.target.value } : p)))} className="edl-input w-full max-w-full min-w-0" placeholder="—" /></div>
                    </div>
                  ))}
                </div>
              )}
              {mobileStep === 5 && (
                <div className="edl-page space-y-3 w-full max-w-full min-w-0 px-1">
                  <h2 className="edl-block-title">Autres équipements</h2>
                  {EQUIPEMENTS_LABELS.map((label, idx) => (
                    <div key={idx} className="edl-block border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
                      <div className="mb-2"><p className="text-xs text-gray-500 mb-1">Entrée</p><select value={equipements[idx]?.entree ?? ''} onChange={(e) => setEquipements((prev) => prev.map((p, i) => (i === idx ? { ...p, entree: (e.target.value || undefined) as EtatPiece | undefined } : p)))} className="edl-select w-full max-w-full"><option value="">—</option>{(['tres_bon', 'bon', 'moyen', 'mauvais'] as const).map((et) => <option key={et} value={et}>{ETAT_LABELS[et]}</option>)}</select></div>
                      <div className="mb-2"><p className="text-xs text-gray-500 mb-1">Sortie</p><select value={equipements[idx]?.sortie ?? ''} onChange={(e) => setEquipements((prev) => prev.map((p, i) => (i === idx ? { ...p, sortie: (e.target.value || undefined) as EtatPiece | undefined } : p)))} className="edl-select w-full max-w-full"><option value="">—</option>{(['tres_bon', 'bon', 'moyen', 'mauvais'] as const).map((et) => <option key={et} value={et}>{ETAT_LABELS[et]}</option>)}</select></div>
                      <div><p className="text-xs text-gray-500 mb-1">Commentaire</p><input type="text" value={equipements[idx]?.commentaires ?? ''} onChange={(e) => setEquipements((prev) => prev.map((p, i) => (i === idx ? { ...p, commentaires: e.target.value } : p)))} className="edl-input w-full max-w-full min-w-0" placeholder="—" /></div>
                    </div>
                  ))}
                </div>
              )}
              {mobileStep === 6 && (() => {
                const piece = pieces[mobilePieceIndex];
                const modele = MODELE_PIECES[mobilePieceIndex];
                const elements = getElementsForPiece(piece?.nom ?? modele?.nom ?? '');
                return (
                  <div className="edl-page space-y-3 w-full max-w-full min-w-0 px-1">
                    <h2 className="edl-block-title">Pièce : {piece?.nom ?? modele?.nom ?? ''}</h2>
                    {modele?.autreLabel && (
                      <div className="edl-block">
                        <p className="text-sm text-gray-600 mb-1">Nom autre pièce</p>
                        <input type="text" value={piece?.nomAutre ?? ''} onChange={(e) => setPieces((prev) => prev.map((p, i) => (i === mobilePieceIndex ? { ...p, nomAutre: e.target.value } : p)))} className="edl-input w-full max-w-full min-w-0" placeholder="—" />
                      </div>
                    )}
                    <div className="edl-block">
                      <p className="text-sm text-gray-600 mb-1">Observations</p>
                      <textarea value={piece?.observations ?? ''} onChange={(e) => setPieces((prev) => prev.map((p, i) => (i === mobilePieceIndex ? { ...p, observations: e.target.value } : p)))} rows={2} className="w-full max-w-full min-w-0 edl-input-area text-inherit resize-y" placeholder="—" />
                    </div>
                    <p className="text-sm font-semibold text-[#1e3a5f]">Éléments (entrée / sortie)</p>
                    {(piece?.lignes ?? []).map((ligne, lineIdx) => (
                      <div key={lineIdx} className="edl-block border border-gray-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">{elements[lineIdx]}</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div><p className="text-xs text-gray-500 mb-1">Entrée</p><select value={ligne.entree ?? ''} onChange={(e) => updateLignePiece(mobilePieceIndex, lineIdx, 'entree', e.target.value as EtatPiece)} className="edl-select w-full max-w-full"><option value="">—</option>{(['tres_bon', 'bon', 'moyen', 'mauvais'] as const).map((et) => <option key={et} value={et}>{ETAT_LABELS[et]}</option>)}</select></div>
                          <div><p className="text-xs text-gray-500 mb-1">Sortie</p><select value={ligne.sortie ?? ''} onChange={(e) => updateLignePiece(mobilePieceIndex, lineIdx, 'sortie', e.target.value as EtatPiece)} className="edl-select w-full max-w-full"><option value="">—</option>{(['tres_bon', 'bon', 'moyen', 'mauvais'] as const).map((et) => <option key={et} value={et}>{ETAT_LABELS[et]}</option>)}</select></div>
                        </div>
                        <div><p className="text-xs text-gray-500 mb-1">Commentaire</p><input type="text" value={ligne.commentaires ?? ''} onChange={(e) => updateLignePiece(mobilePieceIndex, lineIdx, 'commentaires', e.target.value)} className="edl-input w-full max-w-full min-w-0" placeholder="—" /></div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {mobileStep === 7 && (
                <div className="edl-page space-y-4 w-full max-w-full min-w-0 px-1">
                  <h2 className="edl-block-title">Signatures</h2>
                  <div className="edl-block space-y-2">
                    <div><p className="text-sm text-gray-600 mb-1">Bailleur entrée</p><InlineInput value={dateSignatureEntreeBailleur} onChange={setDateSignatureEntreeBailleur} width="w-full" placeholder="JJ/MM/AAAA" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Bailleur sortie</p><InlineInput value={dateSignatureSortieBailleur} onChange={setDateSignatureSortieBailleur} width="w-full" placeholder="JJ/MM/AAAA" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Locataire entrée</p><InlineInput value={dateSignatureEntreeLocataire} onChange={setDateSignatureEntreeLocataire} width="w-full" placeholder="JJ/MM/AAAA" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Locataire sortie</p><InlineInput value={dateSignatureSortieLocataire} onChange={setDateSignatureSortieLocataire} width="w-full" placeholder="JJ/MM/AAAA" /></div>
                    <div><p className="text-sm text-gray-600 mb-1">Annexe</p><InlineInput value={dateSignatureAnnexe} onChange={setDateSignatureAnnexe} width="w-full" placeholder="JJ/MM/AAAA" /></div>
                  </div>
                </div>
              )}
              {mobileStep === 8 && (
                <div className="edl-page space-y-4 w-full max-w-full min-w-0 px-1">
                  <h2 className="edl-block-title">Annexe</h2>
                  <div className="edl-block">
                    <p className="text-sm text-gray-600 mb-2">Travaux à prévoir</p>
                    {annexTravauxRows.slice(0, 4).map((row, idx) => (
                      <div key={idx} className="flex flex-col gap-1 mb-3">
                        <input type="text" value={row.element} onChange={(e) => setAnnexTravauxRows((prev) => prev.map((r, i) => (i === idx ? { ...r, element: e.target.value } : r)))} className="edl-input w-full max-w-full min-w-0" placeholder="Élément" />
                        <input type="text" value={row.commentaire} onChange={(e) => setAnnexTravauxRows((prev) => prev.map((r, i) => (i === idx ? { ...r, commentaire: e.target.value } : r)))} className="edl-input w-full max-w-full min-w-0" placeholder="Commentaire" />
                      </div>
                    ))}
                    <p className="text-sm text-gray-600 mb-1 mt-3">Commentaires annexe</p>
                    <textarea value={annexCommentaires} onChange={(e) => setAnnexCommentaires(e.target.value)} rows={3} className="w-full max-w-full min-w-0 edl-input-area text-inherit resize-y" placeholder="—" />
                  </div>
                </div>
              )}
            </div>
            </div>
            {!isLastMobileStep && (
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2 px-4 py-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
              <button type="button" onClick={goPrev} disabled={!canPrev} className="inline-flex items-center gap-1 py-2 text-sm font-medium text-[#1e3a5f] disabled:opacity-40 disabled:pointer-events-none">
                <ChevronLeft className="w-5 h-5" /> Précédent
              </button>
              <span className="text-xs text-gray-500 tabular-nums">{currentScreenIndex + 1} / {totalScreens}</span>
              <button type="button" onClick={goNext} className="inline-flex items-center gap-1 py-2 text-sm font-semibold text-[#1e3a5f]">
                Suivant <ChevronRight className="w-5 h-5" />
              </button>
            </nav>
            )}
          </>
          ) : (
          <div className="edl-document-wrapper pb-8">
            {/* ========== Page 1 – Blocs inspirés de la maquette ========== */}
            <div className="edl-page">
            <h1 className="text-center text-lg font-bold mb-4">État des lieux</h1>
            <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-2 flex-wrap"><span>Entrée, réalisé le</span> <InlineInput value={dateEtatDesLieuxEntree || ''} onChange={(v) => setDateEtatDesLieuxEntree(v)} width="w-28" placeholder="JJ/MM/AAAA" /></span>
              <span className="flex items-center gap-2 flex-wrap"><span>Sortie, réalisé le</span> <InlineInput value={dateSortie || ''} onChange={(v) => setDateSortie(v)} width="w-28" placeholder="JJ/MM/AAAA" /></span>
            </p>
            <p className="mb-6 text-justify">
              L'état des lieux doit être établi de façon contradictoire entre les deux parties lors de la remise des clés au locataire et lors de leur restitution en fin de bail. L'état des lieux prévu à l'article 3-2 de la loi du 6 juillet 1989 doit porter sur l'ensemble des locaux et équipements d'usage privatif mentionnés au contrat de bail et dont le locataire a la jouissance exclusive.
            </p>

            {/* Bloc Les locaux */}
            <div className="edl-block">
              <h2 className="edl-block-title">Les locaux</h2>
              <p className="mb-3">
                Type :{' '}
                <label className="inline-flex items-center gap-1.5 cursor-pointer mr-4"><input type="radio" name="typeLocaux" checked={typeLocaux === 'appartement'} onChange={() => setTypeLocaux('appartement')} className="text-[#1e3a5f]" /> Appartement</label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer mr-4"><input type="radio" name="typeLocaux" checked={typeLocaux === 'maison'} onChange={() => setTypeLocaux('maison')} className="text-[#1e3a5f]" /> Maison</label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer mr-4"><input type="radio" name="typeLocaux" checked={typeLocaux === 'autre'} onChange={() => setTypeLocaux('autre')} className="text-[#1e3a5f]" /> Autre</label>
                {typeLocaux === 'autre' && <InlineInput value={typeLocauxAutre} onChange={setTypeLocauxAutre} width="w-32" placeholder="précisez" className="ml-1" />}
              </p>
              <p className="mb-3">
                Surface : <InlineInput value={surfaceLogement} onChange={setSurfaceLogement} width="w-16" placeholder="—" /> m²   Nombre de pièces principales : <InlineInput value={nombrePieces} onChange={setNombrePieces} width="w-12" placeholder="—" />
              </p>
              <p className="mb-1">Adresse précise :</p>
              <textarea value={adresseLogement} onChange={(e) => setAdresseLogement(e.target.value.slice(0, EDL_MAX_LENGTH_ADRESSE_LOGEMENT))} rows={3} maxLength={EDL_MAX_LENGTH_ADRESSE_LOGEMENT} className="w-full edl-input-area resize-y text-inherit" placeholder="Adresse du logement" />
            </div>

            {/* Blocs Bailleur / Locataire côte à côte */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="edl-block">
                <h2 className="edl-block-title">Le bailleur (ou son mandataire)</h2>
                <p className="mb-1">Nom et prénom / dénomination :</p>
                <p className="mb-3"><InlineInput value={bailleurNomComplet} onChange={setBailleurNomComplet} placeholder="—" className="w-full" /></p>
                <p className="mb-1">Adresse (ou siège social) :</p>
                <textarea value={bailleur.adresse} onChange={(e) => setBailleur((b) => ({ ...b, adresse: e.target.value.slice(0, EDL_MAX_LENGTH_ADRESSE) }))} rows={3} maxLength={EDL_MAX_LENGTH_ADRESSE} className="w-full edl-input-area resize-y text-inherit" placeholder="—" />
              </div>
              <div className="edl-block">
                <h2 className="edl-block-title">Le(s) locataire(s)</h2>
                <p className="mb-1">Nom et prénom :</p>
                <p className="mb-3"><InlineInput value={locataireNomComplet} onChange={setLocataireNomComplet} placeholder="—" className="w-full" /></p>
                <p className="mb-1">Adresse :</p>
                <textarea value={locataire.adresse} onChange={(e) => setLocataire((l) => ({ ...l, adresse: e.target.value.slice(0, EDL_MAX_LENGTH_ADRESSE) }))} rows={3} maxLength={EDL_MAX_LENGTH_ADRESSE} className="w-full edl-input-area resize-y text-inherit" placeholder="—" />
              </div>
            </div>
            <div className="edl-block mb-4">
              <p className="mb-1">Nouvelle adresse du locataire (à remplir en sortie) :</p>
              <InlineInput value={locataire.nouvelleAdresse} onChange={(v) => setLocataire((l) => ({ ...l, nouvelleAdresse: v }))} placeholder="—" className="w-full" />
            </div>

            {/* Bloc Relevé des compteurs */}
            <div className="edl-block">
              <h2 className="edl-block-title">Relevé des compteurs</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#1e3a5f] mb-2">Électricité</h3>
                  <p className="mb-1.5 text-sm"><span className="text-gray-700">N° compteur :</span> <InlineInput value={compteurs.electricite} onChange={(v) => setCompteurs((c) => ({ ...c, electricite: v }))} width="w-36" placeholder="—" /></p>
                  <p className="mb-1.5 text-sm"><span className="text-gray-700">HP (heures pleines) :</span> <InlineInput value={compteurs.electriciteHP} onChange={(v) => setCompteurs((c) => ({ ...c, electriciteHP: v }))} width="w-24" placeholder="—" /></p>
                  <p className="text-sm"><span className="text-gray-700">HC (heures creuses) :</span> <InlineInput value={compteurs.electriciteHC} onChange={(v) => setCompteurs((c) => ({ ...c, electriciteHC: v }))} width="w-24" placeholder="—" /></p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1e3a5f] mb-2">Gaz naturel</h3>
                  <p className="mb-1.5 text-sm"><span className="text-gray-700">N° compteur :</span> <InlineInput value={compteurs.gazNumero} onChange={(v) => setCompteurs((c) => ({ ...c, gazNumero: v }))} width="w-32" placeholder="—" /></p>
                  <p className="text-sm"><span className="text-gray-700">Relevé :</span> <InlineInput value={compteurs.gaz} onChange={(v) => setCompteurs((c) => ({ ...c, gaz: v }))} width="w-36" placeholder="—" /></p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1e3a5f] mb-2">Eau</h3>
                  <p className="mb-1.5 text-sm"><span className="text-gray-700">Eau chaude :</span> <InlineInput value={compteurs.eauChaude} onChange={(v) => setCompteurs((c) => ({ ...c, eauChaude: v }))} width="w-24" placeholder="—" /> <span className="text-gray-600">m³</span></p>
                  <p className="text-sm"><span className="text-gray-700">Eau froide :</span> <InlineInput value={compteurs.eau} onChange={(v) => setCompteurs((c) => ({ ...c, eau: v }))} width="w-24" placeholder="—" /> <span className="text-gray-600">m³</span></p>
                </div>
                <p className="text-sm pt-1 border-t border-gray-200"><span className="text-gray-700">Nom ancien occupant :</span> <InlineInput value={nomAncienOccupant} onChange={setNomAncienOccupant} className="w-80 max-w-full" placeholder="—" /></p>
              </div>
            </div>

            {/* Bloc Équipements énergétiques */}
            <div className="edl-block">
              <h2 className="edl-block-title">Équipements énergétiques</h2>
              <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Chauffage :</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={chauffageElectrique} onChange={(e) => setChauffageElectrique(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                  <span>électrique</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={chauffageGaz} onChange={(e) => setChauffageGaz(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                  <span>gaz</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={chauffageAutre} onChange={(e) => setChauffageAutre(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                  <span>autre</span>
                </label>
                <InlineInput value={chauffageType} onChange={setChauffageType} width="w-32" placeholder="—" className="inline-block" />
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={chauffageCollectif} onChange={(e) => setChauffageCollectif(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                  <span>collectif</span>
                </label>
              </p>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Eau chaude :</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={eauChaudeElectrique} onChange={(e) => setEauChaudeElectrique(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                  <span>électrique</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={eauChaudeGaz} onChange={(e) => setEauChaudeGaz(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                  <span>gaz</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={eauChaudeAutre} onChange={(e) => setEauChaudeAutre(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                  <span>autre</span>
                </label>
                <InlineInput value={eauChaudeType} onChange={setEauChaudeType} width="w-32" placeholder="—" className="inline-block" />
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={eauChaudeCollectif} onChange={(e) => setEauChaudeCollectif(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                  <span>collectif</span>
                </label>
              </p>
            </div>

            {/* Bloc Équipements de chauffage */}
            <div className="edl-block">
              <h2 className="edl-block-title">Équipements de chauffage</h2>
              <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={chaudierePresent} onChange={(e) => setChaudierePresent(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                </label>
                <span>Chaudière / état :</span>
                <InlineInput value={chaudiereEtat} onChange={setChaudiereEtat} width="w-40" placeholder="—" />
                <span className="ml-2">dernier entretien :</span>
                <InlineInput value={chauffageDernierEntretien} onChange={setChauffageDernierEntretien} width="w-44" placeholder="—" />
              </p>
              <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={radiateursEauPresent} onChange={(e) => setRadiateursEauPresent(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                </label>
                <span>Nombre de radiateurs à eau :</span>
                <InlineInput value={radiateursEau} onChange={setRadiateursEau} width="w-12" placeholder="—" />
                <label className="inline-flex items-center gap-1.5 cursor-pointer ml-4">
                  <input type="checkbox" checked={radiateursElectriquesPresent} onChange={(e) => setRadiateursElectriquesPresent(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                </label>
                <span>Nombre de radiateurs électriques :</span>
                <InlineInput value={radiateursElectriques} onChange={setRadiateursElectriques} width="w-12" placeholder="—" />
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={ballonPresent} onChange={(e) => setBallonPresent(e.target.checked)} className="rounded border-gray-400 text-[#1e3a5f]" />
                </label>
                <span>Ballon d'eau chaude / état :</span>
                <InlineInput value={ballonEtat} onChange={setBallonEtat} className="w-full max-w-md" placeholder="—" />
              </p>
            </div>

            {/* Clés – 5 lignes */}
            <div className="edl-block">
              <h2 className="edl-block-title">Clés et moyens d'accès</h2>
              <div className="edl-table-scroll">
              <div className="border border-gray-300 rounded-lg overflow-hidden min-w-[320px]">
                <div className="grid grid-cols-12 gap-0 border-b border-gray-300">
                  <div className="col-span-4 p-2 border-r border-gray-300 font-semibold text-sm">Type de clé</div>
                  <div className="col-span-2 p-2 border-r border-gray-300 font-semibold text-sm">Nombre</div>
                  <div className="col-span-6 p-2 font-semibold text-sm">Commentaires</div>
                </div>
                {cles.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-0 border-b border-gray-300 last:border-b-0">
                    <div className="col-span-4 p-2 border-r border-gray-300">
                      <input type="text" value={c.type} onChange={(e) => setCles((prev) => prev.map((x, i) => (i === idx ? { ...x, type: e.target.value } : x)))} className="w-full edl-input-cell border-0" placeholder="Ex. Clés portes" />
                    </div>
                    <div className="col-span-2 p-2 border-r border-gray-300">
                      <input type="text" value={c.nombre} onChange={(e) => setCles((prev) => prev.map((x, i) => (i === idx ? { ...x, nombre: e.target.value } : x)))} className="w-full edl-input-cell border-0" placeholder="Ex. 2" />
                    </div>
                    <div className="col-span-6 p-2">
                      <input type="text" value={c.commentaires} onChange={(e) => setCles((prev) => prev.map((x, i) => (i === idx ? { ...x, commentaires: e.target.value } : x)))} className="w-full edl-input-cell" placeholder="Ex. 2 jeux, code 1234" />
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            {/* Paraphes en bas de la page 1 */}
            <div className="edl-page-footer">
              <span className="text-xs text-gray-600">Paraphes : <span className="inline-block border border-gray-400 rounded w-24 h-8 align-middle ml-1" /></span>
            </div>

            <div className="edl-block mt-4">
              <p className="mb-2">Date de l'état des lieux d'entrée : <InlineInput value={dateEtatDesLieuxEntree} onChange={setDateEtatDesLieuxEntree} width="w-28" placeholder="JJ/MM/AAAA" /></p>
              <p className="mb-2">Évolutions constatées depuis l'entrée (à remplir en sortie) :</p>
              <textarea value={evolutionsSortie} onChange={(e) => setEvolutionsSortie(e.target.value)} rows={3} className="w-full edl-input-area text-inherit resize-y" placeholder="Dégradations, travaux, usure anormale..." />
            </div>
            </div>

            {/* ========== Page 2 : Parties privatives, Autres équipements, Equipements (modèle T4/T5) ========== */}
            <div className="edl-page">
            <h2 className="font-bold mb-2">Parties privatives attachées au logement</h2>
            <div className="edl-table-scroll">
              <p className="edl-table-hint text-xs text-slate-500 mb-1.5 sm:hidden">Défiler horizontalement si besoin</p>
              <table className="w-full min-w-[580px] border-collapse border border-gray-400 mb-4 text-left">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="border-r border-gray-400 p-2 font-semibold">Parties privatives</th>
                  <th className="border-r border-gray-400 p-2 font-semibold w-16">N°</th>
                  <th className="border-r border-gray-400 p-2 font-semibold w-20">Entrée</th>
                  <th className="border-r border-gray-400 p-2 font-semibold w-20">Sortie</th>
                  <th className="p-2 font-semibold">Commentaires</th>
                </tr>
              </thead>
              <tbody>
                {[...PARTIES_PRIVATIVES_LABELS, ''].map((label, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="border-r border-gray-400 p-2">
                      {idx < PARTIES_PRIVATIVES_LABELS.length ? (
                        label
                      ) : (
                        <input
                          type="text"
                          value={partiesPrivatives[idx]?.nom ?? ''}
                          onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, nom: e.target.value } : p)))}
                          className="w-full text-xs edl-input-cell"
                          placeholder="Autre (à préciser)"
                        />
                      )}
                    </td>
                    <td className="border-r border-gray-400 p-1">
                      <input
                        type="text"
                        value={partiesPrivatives[idx]?.numero ?? ''}
                        onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, numero: e.target.value } : p)))}
                        className="w-full text-xs edl-input-cell"
                        placeholder="N°"
                      />
                    </td>
                    <td className="border-r border-gray-400 p-1">
                      <select
                        value={partiesPrivatives[idx]?.entree || ''}
                        onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, entree: (e.target.value || undefined) as EtatPiece | undefined } : p)))}
                        className="w-full text-xs edl-select"
                      >
                        <option value="">—</option>
                        <option value="tres_bon">Très bon</option>
                        <option value="bon">Bon</option>
                        <option value="moyen">Moyen</option>
                        <option value="mauvais">Mauvais</option>
                      </select>
                    </td>
                    <td className="border-r border-gray-400 p-1">
                      <select
                        value={partiesPrivatives[idx]?.sortie || ''}
                        onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, sortie: (e.target.value || undefined) as EtatPiece | undefined } : p)))}
                        className="w-full text-xs edl-select"
                      >
                        <option value="">—</option>
                        <option value="tres_bon">Très bon</option>
                        <option value="bon">Bon</option>
                        <option value="moyen">Moyen</option>
                        <option value="mauvais">Mauvais</option>
                      </select>
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={partiesPrivatives[idx]?.commentaires ?? ''}
                        onChange={(e) => setPartiesPrivatives((prev) => prev.map((p, i) => (i === idx ? { ...p, commentaires: e.target.value } : p)))}
                        className="w-full text-xs edl-input-cell"
                        placeholder="Commentaires"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            <h2 className="font-bold mb-2">Autres équipements et aménagements</h2>
            <div className="edl-table-scroll">
              <table className="w-full min-w-[520px] border-collapse border border-gray-400 mb-6 text-left">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="border-r border-gray-400 p-2 font-semibold">Equipements</th>
                  <th className="border-r border-gray-400 p-2 font-semibold w-20">Entrée</th>
                  <th className="border-r border-gray-400 p-2 font-semibold w-20">Sortie</th>
                  <th className="p-2 font-semibold">Commentaires</th>
                </tr>
              </thead>
              <tbody>
                {[...EQUIPEMENTS_LABELS, ''].map((label, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="border-r border-gray-400 p-2">
                      {idx < EQUIPEMENTS_LABELS.length ? (
                        label
                      ) : (
                        <input
                          type="text"
                          value={equipements[idx]?.nom ?? ''}
                          onChange={(e) => setEquipements((prev) => prev.map((p, i) => (i === idx ? { ...p, nom: e.target.value } : p)))}
                          className="w-full text-xs edl-input-cell"
                          placeholder="Autre (à préciser)"
                        />
                      )}
                    </td>
                    <td className="border-r border-gray-400 p-1">
                      <select
                        value={equipements[idx]?.entree || ''}
                        onChange={(e) => setEquipements((prev) => prev.map((p, i) => (i === idx ? { ...p, entree: (e.target.value || undefined) as EtatPiece | undefined } : p)))}
                        className="w-full text-xs edl-select"
                      >
                        <option value="">—</option>
                        <option value="tres_bon">Très bon</option>
                        <option value="bon">Bon</option>
                        <option value="moyen">Moyen</option>
                        <option value="mauvais">Mauvais</option>
                      </select>
                    </td>
                    <td className="border-r border-gray-400 p-1">
                      <select
                        value={equipements[idx]?.sortie || ''}
                        onChange={(e) => setEquipements((prev) => prev.map((p, i) => (i === idx ? { ...p, sortie: (e.target.value || undefined) as EtatPiece | undefined } : p)))}
                        className="w-full text-xs edl-select"
                      >
                        <option value="">—</option>
                        <option value="tres_bon">Très bon</option>
                        <option value="bon">Bon</option>
                        <option value="moyen">Moyen</option>
                        <option value="mauvais">Mauvais</option>
                      </select>
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        value={equipements[idx]?.commentaires ?? ''}
                        onChange={(e) => setEquipements((prev) => prev.map((p, i) => (i === idx ? { ...p, commentaires: e.target.value } : p)))}
                        className="w-full text-xs edl-input-cell"
                        placeholder="Commentaires"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            <div className="edl-page-footer">
              <span className="text-xs text-gray-600">Paraphes : <span className="inline-block border border-gray-400 rounded w-24 h-8 align-middle ml-1" /></span>
            </div>
            </div>

            {/* ========== Pages pièces : ordre et libellés du modèle T4/T5, 2 tableaux par page ========== */}
            {(() => {
              const PIECES_PER_PAGE = 2;
              const chunks: PieceState[][] = [];
              for (let i = 0; i < pieces.length; i += PIECES_PER_PAGE) chunks.push(pieces.slice(i, i + PIECES_PER_PAGE));
              return chunks.map((chunk, chunkIdx) => (
                <div key={chunkIdx} className="edl-page edl-page-fill">
                  {chunk.map((piece, localIdx) => {
                    const idx = chunkIdx * PIECES_PER_PAGE + localIdx;
                    const modele = MODELE_PIECES[idx];
                    const elements = getElementsForPiece(piece.nom);
                    const titre = modele?.autreLabel && piece.nomAutre ? `${piece.nom} ${piece.nomAutre}` : piece.nom;
                    return (
                      <div key={piece.nom + idx} className={localIdx > 0 ? 'mt-6' : ''}>
                        <h2 className="font-bold mb-1">{titre}</h2>
                        {modele?.autreLabel && (
                          <p className="mb-2">
                            <input
                              type="text"
                              value={piece.nomAutre ?? ''}
                              onChange={(e) => setPieces((prev) => prev.map((p, i) => (i === idx ? { ...p, nomAutre: e.target.value } : p)))}
                              className="edl-input-cell w-64"
                              placeholder="Précisez l'autre pièce (ex. Bureau)"
                            />
                          </p>
                        )}
                        <div className="edl-table-scroll">
                        <table className="w-full min-w-[480px] border-collapse border border-gray-400 text-left">
                          <thead>
                            <tr className="border-b border-gray-400">
                              <th className="border-r border-gray-400 p-2 font-semibold">Éléments</th>
                              <th className="border-r border-gray-400 p-2 font-semibold w-24">Entrée</th>
                              <th className="border-r border-gray-400 p-2 font-semibold w-24">Sortie</th>
                              <th className="p-2 font-semibold">Commentaires</th>
                            </tr>
                          </thead>
                          <tbody>
                            {elements.map((elem, elemIdx) => {
                              const lignes = piece.lignes || [];
                              const ligne = lignes[elemIdx] || {};
                              const ensureLignes = (updater: (l: LignePiece) => LignePiece) => {
                                setPieces((prev) => {
                                  const p = prev[idx];
                                  const newLignes = [...(p.lignes || [])];
                                  while (newLignes.length <= elemIdx) newLignes.push({});
                                  newLignes[elemIdx] = updater(newLignes[elemIdx] || {});
                                  return prev.map((pi, i) => (i === idx ? { ...pi, lignes: newLignes } : pi));
                                });
                              };
                              return (
                                <tr key={elem} className="border-b border-gray-300">
                                  <td className="border-r border-gray-400 p-2">{elem}</td>
                                  <td className="border-r border-gray-400 p-1">
                                    <select
                                      value={ligne.entree || ''}
                                      onChange={(e) => ensureLignes((l) => ({ ...l, entree: (e.target.value || undefined) as EtatPiece | undefined }))}
                                      className="w-full text-xs edl-select"
                                    >
                                      <option value="">—</option>
                                      <option value="tres_bon">Très bon</option>
                                      <option value="bon">Bon</option>
                                      <option value="moyen">Moyen</option>
                                      <option value="mauvais">Mauvais</option>
                                    </select>
                                  </td>
                                  <td className="border-r border-gray-400 p-1">
                                    <select
                                      value={ligne.sortie || ''}
                                      onChange={(e) => ensureLignes((l) => ({ ...l, sortie: (e.target.value || undefined) as EtatPiece | undefined }))}
                                      className="w-full text-xs edl-select"
                                    >
                                      <option value="">—</option>
                                      <option value="tres_bon">Très bon</option>
                                      <option value="bon">Bon</option>
                                      <option value="moyen">Moyen</option>
                                      <option value="mauvais">Mauvais</option>
                                    </select>
                                  </td>
                                  <td className="p-1">
                                    <input
                                      type="text"
                                      value={ligne.commentaires ?? ''}
                                      onChange={(e) => ensureLignes((l) => ({ ...l, commentaires: e.target.value }))}
                                      className="w-full text-xs edl-input-cell"
                                      placeholder="Commentaires"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                      </div>
                    );
                  })}
                  <div className="edl-page-footer">
                    <span className="text-xs text-gray-600">Paraphes : <span className="inline-block border border-gray-400 rounded w-24 h-8 align-middle ml-1" /></span>
                  </div>
                </div>
              ));
            })()}

            {/* ========== Page Signatures (identique au PDF) ========== */}
            <div className="edl-page">
            <h2 className="font-bold text-base mb-4">Signatures</h2>
            <p className="text-xs mb-3">Le locataire peut demander au bailleur ou à son représentant de compléter l'état des lieux d'entrée : dans les 10 jours suivant sa date de réalisation pour tout élément concernant le logement, le premier mois de la période de chauffe concernant l'état des éléments de chauffage.</p>
            <p className="text-xs mb-6">Entretien courant et menues réparations – Le locataire doit veiller à maintenir en l'état le logement. À défaut, le bailleur peut retenir sur le dépôt de garantie les sommes correspondant aux réparations locatives non effectuées, justificatifs à l'appui.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div>
                <p className="font-semibold mb-1">Le bailleur (ou son mandataire)</p>
                <p className="text-xs mb-2">Signature précédée de « certifié exact »</p>
                <div className="border-b border-gray-600 h-12 mb-3"></div>
                <p className="text-xs mb-1 flex items-center gap-2 whitespace-nowrap">Entrée, le <input type="date" value={dateToInputValue(dateSignatureEntreeBailleur)} onChange={(e) => setDateSignatureEntreeBailleur(inputValueToDate(e.target.value))} className="edl-input text-sm inline-block" /></p>
                <p className="text-xs mb-2 flex items-center gap-2 whitespace-nowrap">Sortie, le <input type="date" value={dateToInputValue(dateSignatureSortieBailleur)} onChange={(e) => setDateSignatureSortieBailleur(inputValueToDate(e.target.value))} className="edl-input text-sm inline-block" /></p>
              </div>
              <div>
                <p className="font-semibold mb-1">Le(s) locataire(s)</p>
                <p className="text-xs mb-2">Signature précédée de « certifié exact »</p>
                <div className="border-b border-gray-600 h-12 mb-3"></div>
                <p className="text-xs mb-1 flex items-center gap-2 whitespace-nowrap">Entrée, le <input type="date" value={dateToInputValue(dateSignatureEntreeLocataire)} onChange={(e) => setDateSignatureEntreeLocataire(inputValueToDate(e.target.value))} className="edl-input text-sm inline-block" /></p>
                <p className="text-xs mb-2 flex items-center gap-2 whitespace-nowrap">Sortie, le <input type="date" value={dateToInputValue(dateSignatureSortieLocataire)} onChange={(e) => setDateSignatureSortieLocataire(inputValueToDate(e.target.value))} className="edl-input text-sm inline-block" /></p>
              </div>
            </div>
            <div className="edl-page-footer">
              <span className="text-xs text-gray-600">Paraphes : <span className="inline-block border border-gray-400 rounded w-24 h-8 align-middle ml-1" /></span>
            </div>
            </div>

            <div className="edl-page">
            <h2 className="font-bold text-base mb-4">État des lieux de sortie (annexe)</h2>
            <p className="text-xs text-gray-600 mb-3">À remplir au moment de la sortie du locataire, si besoin.</p>
            <p className="text-xs mb-3">L'état des lieux de sortie est réalisé sur la base des éléments recueillis lors de l'état des lieux d'entrée réalisé le <InlineInput value={dateEtatDesLieuxEntree} onChange={setDateEtatDesLieuxEntree} width="w-28" placeholder="JJ/MM/AAAA" /> (annexé au présent document). Seuls les éléments pour lequel l'état de sortie est non conforme à l'état d'entrée sont reportés dans le présent document.</p>
            <p className="text-xs mb-2">Date de sortie du locataire : <InlineInput value={dateSortie} onChange={setDateSortie} width="w-28" placeholder="JJ/MM/AAAA" /></p>

            <div className="edl-table-scroll">
              <table className="w-full min-w-[400px] border-collapse border border-gray-400 mb-4 text-left">
              <thead>
                <tr className="border-b border-gray-400 bg-gray-50">
                  <th className="border-r border-gray-400 p-2 font-semibold">Éléments et pièces concernées</th>
                  <th className="p-2 font-semibold">Commentaires / montant estimé / devis de remise en état</th>
                </tr>
              </thead>
              <tbody>
                {annexTravauxRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="border-r border-gray-400 p-1">
                      <input type="text" value={row.element} onChange={(e) => setAnnexTravauxRows((prev) => prev.map((r, i) => (i === idx ? { ...r, element: e.target.value } : r)))} className="w-full edl-input-cell text-inherit" placeholder="—" />
                    </td>
                    <td className="p-1">
                      <input type="text" value={row.commentaire} onChange={(e) => setAnnexTravauxRows((prev) => prev.map((r, i) => (i === idx ? { ...r, commentaire: e.target.value } : r)))} className="w-full edl-input-cell text-inherit" placeholder="—" />
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            <h3 className="font-bold text-sm mb-2">Relevé des compteurs (au jour de l'état des lieux de sortie)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="edl-block">
                <p className="text-xs font-medium mb-1">Électricité</p>
                <p className="text-xs">N° compteur : <InlineInput value={compteurs.electricite} onChange={(v) => setCompteurs((c) => ({ ...c, electricite: v }))} width="w-24" /> HP : <InlineInput value={compteurs.electriciteHP} onChange={(v) => setCompteurs((c) => ({ ...c, electriciteHP: v }))} width="w-16" /> HC : <InlineInput value={compteurs.electriciteHC} onChange={(v) => setCompteurs((c) => ({ ...c, electriciteHC: v }))} width="w-16" /></p>
              </div>
              <div className="edl-block">
                <p className="text-xs font-medium mb-1">Gaz naturel</p>
                <p className="text-xs">N° compteur : <InlineInput value={compteurs.gazNumero} onChange={(v) => setCompteurs((c) => ({ ...c, gazNumero: v }))} width="w-24" /> Relevé : <InlineInput value={compteurs.gaz} onChange={(v) => setCompteurs((c) => ({ ...c, gaz: v }))} width="w-24" /></p>
              </div>
              <div className="edl-block">
                <p className="text-xs font-medium mb-1">Eau</p>
                <p className="text-xs">Eau chaude : <InlineInput value={compteurs.eauChaude} onChange={(v) => setCompteurs((c) => ({ ...c, eauChaude: v }))} width="w-16" /> m³ Eau froide : <InlineInput value={compteurs.eau} onChange={(v) => setCompteurs((c) => ({ ...c, eau: v }))} width="w-16" /> m³</p>
              </div>
            </div>

            <p className="text-xs font-semibold mb-1">Commentaires :</p>
            <textarea value={annexCommentaires} onChange={(e) => setAnnexCommentaires(e.target.value)} rows={3} className="w-full edl-input-area text-inherit resize-y mb-4" placeholder="—" />

            <p className="text-xs font-semibold mb-1">Nouvelle adresse du (des) locataire(s) (Obligatoire)</p>
            <p className="mb-4"><InlineInput value={locataire.nouvelleAdresse} onChange={(v) => setLocataire((l) => ({ ...l, nouvelleAdresse: v }))} className="w-full" placeholder="—" /></p>

            <p className="text-xs mb-2">Le <input type="date" value={dateToInputValue(dateSignatureAnnexe)} onChange={(e) => setDateSignatureAnnexe(inputValueToDate(e.target.value))} className="edl-input text-sm align-middle" /></p>
            <p className="font-semibold text-sm mb-1">Le bailleur (ou son mandataire)</p>
            <p className="text-xs mb-2">Signature précédée de « certifié exact »</p>
            <div className="border-b border-gray-600 h-8 mb-4"></div>
            <p className="font-semibold text-sm mb-1">Le(s) locataire(s)</p>
            <p className="text-xs mb-2">Signature précédée de « certifié exact »</p>
            <div className="border-b border-gray-600 h-8"></div>
            {/* Pas de paraphe sur la dernière page de signature (annexe) */}
            </div>
            </div>
          )}
          </div>
          )}

          {activeTab === 'form' && (!isMobile || isLastMobileStep) && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/70 border-t border-gray-200 backdrop-blur z-50 lg:left-64 print:hidden">
              <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-2 font-sans">
                <button type="button" onClick={handleEffacer} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-400">
                  <Trash2 className="w-4 h-4" />
                  Effacer les données
                </button>
                <button type="button" onClick={() => handleSaveEntree()} disabled={savingToDocs} className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-60">
                  {savingToDocs ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" /> Enregistrement...</> : <><Save className="w-4 h-4" /> Sauver</>}
                </button>
                {saveSuccess && <span className="text-sm text-green-600 font-medium">Sauvegardé dans Mes documents.</span>}
                <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-400">
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <button type="button" onClick={handleDownload} disabled={generating} className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a2f4d] disabled:opacity-50 disabled:cursor-not-allowed">
                  <Download className="w-4 h-4" />
                  {generating ? 'Génération...' : 'Télécharger le PDF'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'sauvegardes' && (
            <div className="max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">États des lieux d'entrée sauvegardés</h2>
              <p className="text-sm text-gray-500 mb-4">
                Chaque sauvegarde est enregistrée ici et dans <strong>Mes documents</strong> (dossier Baux / Etat des lieux). Vous pouvez charger un état d'entrée pour préparer l'état des lieux de sortie.
              </p>
              <button
                type="button"
                onClick={() => navigate('/documents')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg mb-4"
              >
                <FolderOpen className="w-4 h-4" />
                Ouvrir Mes documents
              </button>
              {savedEntrees.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune sauvegarde pour le moment.</p>
                  <p className="text-sm mt-1">Passez par l'onglet Rédiger, remplissez un état des lieux d'entrée et cliquez sur « Sauvegarder l'état d'entrée ».</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {savedEntrees.map((entree) => (
                    <li key={entree.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{entree.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Sauvegardé le {new Date(entree.savedAt).toLocaleDateString('fr-FR')}
                          {entree.documentName && (
                            <> · PDF : {entree.documentName}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setType('sortie');
                            handleLoadEntree(entree.id);
                            setActiveTab('form');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#f4663b] hover:bg-[#e0553d] text-white rounded-lg"
                        >
                          Charger pour sortie
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      </div>
  );
}
