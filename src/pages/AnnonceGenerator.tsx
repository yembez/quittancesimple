import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Printer, Loader2, Sparkles, RotateCcw, Save, ImagePlus, Trash2, MapPin, Zap, Download } from 'lucide-react';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import { supabase } from '../lib/supabase';
import { uploadPrivateDocument, getPrivateDocumentUrl, deletePrivateDocument } from '../utils/privateStorage';
import { generateTemplateAnnonce, AnnonceData } from '../utils/annonceTemplateGenerator';
import { enhanceAnnonceWithGPT, StyleAnnonce } from '../utils/annonceGPTEnhancer';

const MAX_PHOTO_SIZE_MB = 5;
const MAX_PHOTOS_PER_ANNONCE = 10;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface AnnonceSauvegardee {
  id: string;
  titre: string;
  contenu: string;
  created_at: string;
  updated_at: string;
}

interface AnnoncePhoto {
  id: string;
  storage_path: string;
  file_name: string;
  size_bytes: number | null;
  signedUrl?: string;
}

const AnnonceGenerator = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'nouvelle' | 'sauvegardees' | 'photos'>('nouvelle');

  const [typeBien, setTypeBien] = useState('Appartement');
  const [meubleVide, setMeubleVide] = useState('Vide');
  const [ville, setVille] = useState('');
  const [quartier, setQuartier] = useState('');
  const [surface, setSurface] = useState('');
  const [nombrePieces, setNombrePieces] = useState('');
  const [etage, setEtage] = useState('');
  const [loyerHC, setLoyerHC] = useState('');
  const [charges, setCharges] = useState('');
  const [caution, setCaution] = useState<'1' | '2'>('1');
  const [dateDisponibilite, setDateDisponibilite] = useState(today);
  const [styleAnnonce, setStyleAnnonce] = useState('Standard');

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContraintes, setSelectedContraintes] = useState<string[]>([]);

  const [annonce, setAnnonce] = useState<string>('');
  const [titres, setTitres] = useState<string[]>([]);
  const [templateAnnonce, setTemplateAnnonce] = useState<string>('');
  const [enhancedAnnonce, setEnhancedAnnonce] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingTitres, setIsGeneratingTitres] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleAnnonce>('sobre');
  const [error, setError] = useState<string | null>(null);
  const { proprietaire } = useEspaceBailleur();

  const [savedAnnonces, setSavedAnnonces] = useState<AnnonceSauvegardee[]>([]);
  const [savedAnnonceEdits, setSavedAnnonceEdits] = useState<Record<string, string>>({});
  const [savingAnnonceId, setSavingAnnonceId] = useState<string | null>(null);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitre, setSaveTitre] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [selectedAnnonceForPhotos, setSelectedAnnonceForPhotos] = useState<string>('');
  const [annoncePhotos, setAnnoncePhotos] = useState<AnnoncePhoto[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [downloadingPhotos, setDownloadingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [locataires, setLocataires] = useState<Array<{ id: string; nom: string; prenom?: string; adresse_logement: string }>>([]);
  const [adresseSource, setAdresseSource] = useState<'saisie' | 'locataire'>('saisie');
  const [adresseBien, setAdresseBien] = useState('');
  const [selectedLocataireId, setSelectedLocataireId] = useState<string>('');
  const [adresseSuggestions, setAdresseSuggestions] = useState<Array<{ label: string; value: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [villeFromAdresse, setVilleFromAdresse] = useState('');

  const [nearByPois, setNearByPois] = useState<Array<{ type: string; distance_text: string; label_annonce: string; walk_min?: number }>>([]);
  const [isSearchingPois, setIsSearchingPois] = useState(false);
  const [poisError, setPoisError] = useState<string | null>(null);

  const availableTags = [
    'Calme', 'Lumineux', 'Balcon', 'Parking', 'Cuisine équipée', 'Rénové',
    'Ascenseur', 'Cave', 'Fibre', 'Terrasse', 'Jardin', 'Chauffage collectif', 'Proche transports', 'Résidence sécurisée'
  ];

  const contraintesOptions = [
    'Visale acceptée',
    'Garant demandé',
    'Animaux acceptés',
    'Non fumeur'
  ];

  React.useEffect(() => {
    const loadLocataires = async () => {
      if (!proprietaire?.id) return;
      const { data } = await supabase
        .from('locataires')
        .select('id, nom, prenom, adresse_logement')
        .eq('proprietaire_id', proprietaire.id)
        .not('adresse_logement', 'is', null);
      setLocataires(data || []);
    };
    loadLocataires();
  }, [proprietaire?.id]);

  const adressePourPois = adresseSource === 'locataire' && selectedLocataireId
    ? (locataires.find(l => l.id === selectedLocataireId)?.adresse_logement || '')
    : adresseBien.trim();

  // Recherche d'autocomplétion d'adresse (API Adresse.data.gouv.fr)
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAdresseSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&type=housenumber&autocomplete=1`);
      const data = await res.json();
      if (data.features) {
        const suggestions = data.features.map((f: any) => ({
          label: f.properties.label,
          value: f.properties.label,
        }));
        setAdresseSuggestions(suggestions);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Erreur recherche adresse:', err);
    }
  }, []);

  // Géocodage inverse pour extraire ville et quartier
  const geocodeAdresse = useCallback(async (adresse: string) => {
    if (!adresse.trim()) {
      setVilleFromAdresse('');
      setQuartier('');
      return;
    }
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse + ', France')}&limit=1&addressdetails=1`, {
        headers: { 'User-Agent': 'QuittanceSimple/1.0 (contact@quittancesimple.fr)' },
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const addr = data[0].address;
        const ville = addr.city || addr.town || addr.village || addr.municipality || '';
        const quartier = addr.suburb || addr.neighbourhood || addr.quarter || addr.district || '';
        setVilleFromAdresse(ville);
        if (quartier) {
          setQuartier(quartier);
        }
      }
    } catch (err) {
      console.error('Erreur géocodage:', err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Géocodage automatique de l'adresse saisie (avec debounce)
  React.useEffect(() => {
    if (adresseSource === 'saisie' && adresseBien.trim().length >= 5) {
      const timer = setTimeout(() => {
        geocodeAdresse(adresseBien.trim());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [adresseBien, adresseSource, geocodeAdresse]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleContrainte = (contrainte: string) => {
    setSelectedContraintes(prev =>
      prev.includes(contrainte) ? prev.filter(c => c !== contrainte) : [...prev, contrainte]
    );
  };

  const totalCC = React.useMemo(() => {
    const loyer = parseFloat(loyerHC) || 0;
    const chargesValue = parseFloat(charges) || 0;
    return loyer + chargesValue;
  }, [loyerHC, charges]);

  const loadSavedAnnonces = React.useCallback(async () => {
    if (!proprietaire?.id) return;
    const { data, error } = await supabase
      .from('annonces_sauvegardees')
      .select('id, titre, contenu, created_at, updated_at')
      .eq('proprietaire_id', proprietaire.id)
      .order('created_at', { ascending: false });
    if (!error) setSavedAnnonces(data || []);
  }, [proprietaire?.id]);

  React.useEffect(() => {
    if (proprietaire?.id && activeTab === 'sauvegardees') loadSavedAnnonces();
  }, [proprietaire?.id, activeTab, loadSavedAnnonces]);

  React.useEffect(() => {
    if (activeTab === 'photos' && proprietaire?.id) loadSavedAnnonces();
  }, [activeTab, proprietaire?.id, loadSavedAnnonces]);

  const loadPhotosForAnnonce = React.useCallback(async (annonceId: string) => {
    const { data: rows } = await supabase
      .from('annonce_photos')
      .select('id, storage_path, file_name, size_bytes')
      .eq('annonce_id', annonceId);
    if (!rows?.length) {
      setAnnoncePhotos([]);
      return;
    }
    const withUrls = await Promise.all(
      rows.map(async (p) => {
        const signedUrl = await getPrivateDocumentUrl(p.storage_path).catch(() => '');
        return { ...p, signedUrl };
      })
    );
    setAnnoncePhotos(withUrls);
  }, []);

  React.useEffect(() => {
    if (activeTab === 'photos' && selectedAnnonceForPhotos) loadPhotosForAnnonce(selectedAnnonceForPhotos);
    else if (!selectedAnnonceForPhotos) setAnnoncePhotos([]);
  }, [activeTab, selectedAnnonceForPhotos, loadPhotosForAnnonce]);

  React.useEffect(() => {
    setSelectedPhotoIds(new Set());
  }, [selectedAnnonceForPhotos]);

  const handleSaveAnnonce = async () => {
    // Utiliser l'annonce améliorée si disponible, sinon le template
    const annonceToSave = enhancedAnnonce || templateAnnonce || annonce;
    const titre = (saveTitre || annonceToSave.slice(0, 50)).trim() || 'Annonce sans titre';
    if (!proprietaire?.id) return;
    setIsSaving(true);
    setError(null);
    try {
      await supabase.from('annonces_sauvegardees').insert({
        proprietaire_id: proprietaire.id,
        titre,
        contenu: annonceToSave,
      });
      setShowSaveModal(false);
      setSaveTitre('');
      await loadSavedAnnonces();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedInEditor = (a: AnnonceSauvegardee) => {
    setAnnonce(a.contenu);
    setSelectedSavedId(a.id);
    setActiveTab('nouvelle');
  };

  const getSavedAnnonceContent = (a: AnnonceSauvegardee) => savedAnnonceEdits[a.id] ?? a.contenu;

  const handleCopySavedAnnonce = async (a: AnnonceSauvegardee) => {
    try {
      await navigator.clipboard.writeText(getSavedAnnonceContent(a));
      alert('Annonce copiée dans le presse-papier.');
    } catch {
      alert('Erreur lors de la copie');
    }
  };

  const handlePrintSavedAnnonce = (a: AnnonceSauvegardee) => {
    const content = getSavedAnnonceContent(a);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${a.titre}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
            h1 { color: #ef6e03; }
            p { line-height: 1.6; color: #111827; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${a.titre}</h1>
          <p>${content.replace(/\n/g, '<br>')}</p>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSaveSavedAnnonce = async (a: AnnonceSauvegardee) => {
    const content = savedAnnonceEdits[a.id];
    if (content === undefined) return;
    setSavingAnnonceId(a.id);
    try {
      await supabase.from('annonces_sauvegardees').update({ contenu: content }).eq('id', a.id);
      setSavedAnnonces((prev) => prev.map((x) => (x.id === a.id ? { ...x, contenu: content } : x)));
      setSavedAnnonceEdits((prev) => {
        const next = { ...prev };
        delete next[a.id];
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSavingAnnonceId(null);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !selectedAnnonceForPhotos || !proprietaire?.id) return;
    setPhotoError(null);
    const maxBytes = MAX_PHOTO_SIZE_MB * 1024 * 1024;
    if (annoncePhotos.length + files.length > MAX_PHOTOS_PER_ANNONCE) {
      setPhotoError(`Maximum ${MAX_PHOTOS_PER_ANNONCE} photos par annonce.`);
      return;
    }
    setUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
          setPhotoError('Formats acceptés : JPEG, PNG, WebP.');
          continue;
        }
        if (file.size > maxBytes) {
          setPhotoError(`Taille max par fichier : ${MAX_PHOTO_SIZE_MB} Mo.`);
          continue;
        }
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { path } = await uploadPrivateDocument(file, safeName, {
          folder: `annonces/${selectedAnnonceForPhotos}`,
          contentType: file.type,
        });
        await supabase.from('annonce_photos').insert({
          annonce_id: selectedAnnonceForPhotos,
          storage_path: path,
          file_name: file.name,
          size_bytes: file.size,
        });
      }
      await loadPhotosForAnnonce(selectedAnnonceForPhotos);
    } catch (err: any) {
      setPhotoError(err.message || 'Erreur upload');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (photo: AnnoncePhoto) => {
    try {
      await supabase.from('annonce_photos').delete().eq('id', photo.id);
      await deletePrivateDocument(photo.storage_path);
      await loadPhotosForAnnonce(selectedAnnonceForPhotos);
    } catch (err) {
      setPhotoError('Erreur suppression');
    }
  };

  const togglePhotoSelection = (id: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPhotos = () => setSelectedPhotoIds(new Set(annoncePhotos.map((p) => p.id)));
  const clearPhotoSelection = () => setSelectedPhotoIds(new Set());

  const handleDownloadPhotos = async () => {
    const toDownload = selectedPhotoIds.size > 0
      ? annoncePhotos.filter((p) => selectedPhotoIds.has(p.id))
      : annoncePhotos;
    if (toDownload.length === 0) return;
    setDownloadingPhotos(true);
    setPhotoError(null);
    try {
      for (let i = 0; i < toDownload.length; i++) {
        const p = toDownload[i];
        if (!p.signedUrl) continue;
        const res = await fetch(p.signedUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = p.file_name || `photo-${i + 1}`;
        a.click();
        URL.revokeObjectURL(url);
        if (i < toDownload.length - 1) await new Promise((r) => setTimeout(r, 300));
      }
    } catch (err: any) {
      setPhotoError(err?.message || 'Erreur lors du téléchargement');
    } finally {
      setDownloadingPhotos(false);
    }
  };

  const callApi = async (titlesOnly: boolean) => {
    const villeUtilisee = adressePourPois ? villeFromAdresse : ville;
    if (!villeUtilisee) {
      throw new Error('Ville requise (saisissez une adresse valide ou une ville)');
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-annonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
        body: JSON.stringify({
          typeBien,
          meubleVide,
          ville: villeUtilisee,
          quartier: quartier || null,
          surface: parseInt(surface),
          nombrePieces: parseInt(nombrePieces),
          etage: etage ? parseInt(etage) : null,
          loyerHC: parseFloat(loyerHC),
          charges: parseFloat(charges) || 0,
          totalCC,
          caution: parseInt(caution),
          dateDisponibilite: dateDisponibilite || today,
          styleAnnonce,
          tags: selectedTags,
          contraintes: selectedContraintes,
          residenceSecurisee: selectedTags.includes('Résidence sécurisée'),
          titlesOnly,
          pois: nearByPois.length > 0 ? nearByPois : undefined,
        }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la génération');
    }
    return res.json();
  };

  const handleGenerateTemplate = () => {
    const villeUtilisee = adressePourPois ? villeFromAdresse : ville;
    if (!adressePourPois && !ville) {
      setError('Veuillez saisir une adresse ou une ville');
      return;
    }
    if (adressePourPois && !villeFromAdresse) {
      setError('Adresse en cours de géocodage, veuillez patienter...');
      return;
    }
    if (!surface || !loyerHC || !nombrePieces) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setError(null);
    
    // Préparer les données pour le template
    const disponibiliteText = dateDisponibilite === today || new Date(dateDisponibilite) <= new Date()
      ? "Disponible dès aujourd'hui"
      : (() => {
          const dateDispo = new Date(dateDisponibilite);
          const jour = dateDispo.getDate();
          const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][dateDispo.getMonth()];
          const annee = dateDispo.getFullYear();
          return `Disponible à partir du ${jour} ${mois} ${annee}`;
        })();

    const annonceData: AnnonceData = {
      type: typeBien,
      surface: parseInt(surface),
      pieces: parseInt(nombrePieces),
      etage: etage ? parseInt(etage) : undefined,
      loyer: parseFloat(loyerHC),
      charges: parseFloat(charges) || 0,
      adresse: adressePourPois || undefined,
      quartier: quartier || undefined,
      ville: villeUtilisee,
      proximites: nearByPois.map(poi => poi.label_annonce),
      meuble: meubleVide === 'Meublé',
      pointsForts: selectedTags,
      contraintes: selectedContraintes,
      disponibilite: disponibiliteText,
      caution: parseInt(caution),
      residenceSecurisee: selectedContraintes.includes('Résidence sécurisée'),
    };

    const result = generateTemplateAnnonce(annonceData);
    setTemplateAnnonce(result.description);
    setTitres(result.titresAlternatifs);
    setAnnonce(result.description); // Afficher le template par défaut
    setEnhancedAnnonce(''); // Réinitialiser l'annonce améliorée
  };

  const handleEnhanceWithAI = async () => {
    if (!templateAnnonce) {
      setError('Générez d\'abord une annonce template');
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const enhanced = await enhanceAnnonceWithGPT(templateAnnonce, selectedStyle);
      setEnhancedAnnonce(enhanced);
      setAnnonce(enhanced); // Afficher la version améliorée
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'amélioration IA');
      // Fallback : utiliser le template tel quel
      setEnhancedAnnonce(templateAnnonce);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    // Garder l'ancienne méthode pour compatibilité, mais utiliser le template par défaut
    handleGenerateTemplate();
  };

  const handleRegenerateTitres = async () => {
    const villeUtilisee = adressePourPois ? villeFromAdresse : ville;
    if (!villeUtilisee || !surface || !loyerHC || !nombrePieces) return;
    setIsGeneratingTitres(true);
    setError(null);
    try {
      const data = await callApi(true);
      setTitres(data.titres || []);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsGeneratingTitres(false);
    }
  };

  const handleSearchPois = async () => {
    if (!adressePourPois) {
      setPoisError('Veuillez d\'abord saisir une adresse');
      return;
    }
    setIsSearchingPois(true);
    setPoisError(null);
    setNearByPois([]);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/get-nearby-pois`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          adresse: adressePourPois,
          ville: villeFromAdresse || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Recherche impossible');
      setNearByPois(data.pois || []);
    } catch (err: any) {
      setPoisError(err.message || 'Recherche des points d\'intérêt impossible');
    } finally {
      setIsSearchingPois(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleCopy = async () => {
    // Utiliser l'annonce améliorée si disponible, sinon le template
    const annonceToCopy = enhancedAnnonce || templateAnnonce || annonce;
    if (!annonceToCopy) return;
    try {
      await navigator.clipboard.writeText(annonceToCopy);
      alert('Annonce copiée dans le presse-papier !');
    } catch {
      alert('Erreur lors de la copie');
    }
  };

  const handlePrint = () => {
    // Utiliser l'annonce améliorée si disponible, sinon le template
    const annonceToPrint = enhancedAnnonce || templateAnnonce || annonce;
    if (!annonceToPrint) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Annonce immobilière</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
            h1 { color: #ef6e03; }
            p { line-height: 1.6; color: #111827; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Annonce immobilière</h1>
          <p>${annonceToPrint.replace(/\n/g, '<br>')}</p>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!proprietaire) return null;

  return (
    <div className="flex-1 min-w-0 annonce-generator-content-wrap page-annonce-generator">
        <div className="p-4 lg:pl-2 lg:pr-6 lg:py-6 w-full annonce-generator-content">
          {/* Onglets – style aligné baux / état des lieux */}
          <div className="mb-6">
            <div className="border-b border-gray-200 pt-4 pb-0">
              <nav className="flex gap-0 -mx-4 px-4 lg:-mx-6 lg:px-6" aria-label="Onglets">
                <button
                  type="button"
                  onClick={() => setActiveTab('nouvelle')}
                  className={`px-3 py-2 text-sm font-medium transition-colors rounded-tl-md ${
                    activeTab === 'nouvelle'
                      ? 'bg-charte-bleu text-white border border-b-0 border-charte-bleu border-b-white'
                      : 'border border-gray-300 border-b-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Nouvelle annonce
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sauvegardees')}
                  className={`px-3 py-2 text-sm font-medium transition-colors rounded-none -ml-px ${
                    activeTab === 'sauvegardees'
                      ? 'bg-charte-bleu text-white border border-b-0 border-charte-bleu border-b-white'
                      : 'border border-gray-300 border-b-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Annonces sauvegardées
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  className={`px-3 py-2 text-sm font-medium transition-colors rounded-tr-md -ml-px ${
                    activeTab === 'photos'
                      ? 'bg-charte-bleu text-white border border-b-0 border-charte-bleu border-b-white'
                      : 'border border-gray-300 border-b-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Photos de l'annonce
                </button>
              </nav>
            </div>

          {activeTab === 'sauvegardees' && (
            <div className="p-6 lg:p-8 pt-0">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">Vos annonces sauvegardées</h2>
              {savedAnnonces.length === 0 ? (
                <p className="text-[#6b7280]">Aucune annonce sauvegardée. Générez une annonce puis cliquez sur « Sauver l'annonce ».</p>
              ) : (
                <ul className="space-y-6">
                  {savedAnnonces.map((a) => {
                    const content = getSavedAnnonceContent(a);
                    const hasEdit = savedAnnonceEdits[a.id] !== undefined && savedAnnonceEdits[a.id] !== a.contenu;
                    const isSaving = savingAnnonceId === a.id;
                    return (
                      <li
                        key={a.id}
                        className="p-4 border border-[#e5e7eb] rounded-lg bg-white"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div>
                            <p className="font-medium text-[#111827]">{a.titre}</p>
                            <p className="text-sm text-[#6b7280]">
                              {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopySavedAnnonce(a)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#2f4e69] hover:bg-[#f4f6f8] rounded-lg border border-[#d1d5db]"
                            >
                              <Copy className="w-4 h-4" />
                              Copier
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintSavedAnnonce(a)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#111827] hover:bg-[#f4f6f8] rounded-lg border border-[#d1d5db]"
                            >
                              <Printer className="w-4 h-4" />
                              Imprimer
                            </button>
                            {hasEdit && (
                              <button
                                type="button"
                                onClick={() => handleSaveSavedAnnonce(a)}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#2f4e69] hover:bg-[#1e3a52] disabled:opacity-60 rounded-lg"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Enregistrer
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleLoadSavedInEditor(a)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#2f4e69] hover:bg-[#1e3a52] rounded-lg"
                            >
                              Charger dans l'éditeur
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={content}
                          onChange={(e) => setSavedAnnonceEdits((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          className="w-full text-sm px-3 py-2 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none resize-y min-h-[min(500px,70vh)] font-mono"
                          placeholder="Texte de l'annonce..."
                          spellCheck={false}
                          rows={24}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="p-6 lg:p-8 pt-0">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">Photos de l'annonce</h2>
              <p className="text-sm text-[#6b7280] mb-4">
                Max {MAX_PHOTOS_PER_ANNONCE} photos, {MAX_PHOTO_SIZE_MB} Mo par fichier. Formats : JPEG, PNG, WebP.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#111827] mb-2">Annonce concernée</label>
                <select
                  value={selectedAnnonceForPhotos}
                  onChange={(e) => setSelectedAnnonceForPhotos(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#ef6e03] outline-none bg-white"
                >
                  <option value="">Sélectionner une annonce sauvegardée</option>
                  {savedAnnonces.map((a) => (
                    <option key={a.id} value={a.id}>{a.titre}</option>
                  ))}
                </select>
              </div>
              {selectedAnnonceForPhotos && (
                <>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#f3644b] hover:bg-[#e0553d] text-white font-medium rounded-lg cursor-pointer">
                      <ImagePlus className="w-5 h-5" />
                      Ajouter des photos
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleUploadPhoto}
                        disabled={uploadingPhoto || annoncePhotos.length >= MAX_PHOTOS_PER_ANNONCE}
                      />
                    </label>
                    {annoncePhotos.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={selectAllPhotos}
                          className="text-sm text-[#2f4e69] hover:underline font-medium"
                        >
                          Tout sélectionner
                        </button>
                        <button
                          type="button"
                          onClick={clearPhotoSelection}
                          className="text-sm text-[#2f4e69] hover:underline font-medium"
                        >
                          Tout désélectionner
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPhotos}
                          disabled={downloadingPhotos}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2f4e69] hover:bg-[#1e3a52] disabled:opacity-60 text-white font-medium rounded-lg"
                        >
                          {downloadingPhotos ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          Télécharger {selectedPhotoIds.size > 0 ? `(${selectedPhotoIds.size})` : 'toutes'}
                        </button>
                      </>
                    )}
                  </div>
                  {photoError && <p className="text-sm text-red-600 mb-2">{photoError}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {annoncePhotos.map((p) => (
                      <div
                        key={p.id}
                        className={`relative group rounded-lg border-2 cursor-pointer transition-colors ${selectedPhotoIds.has(p.id) ? 'border-[#2f4e69] ring-2 ring-[#2f4e69]/30' : 'border-[#e5e7eb] hover:border-[#d1d5db]'}`}
                        onClick={() => togglePhotoSelection(p.id)}
                      >
                        <img
                          src={p.signedUrl}
                          alt={p.file_name}
                          className="w-full aspect-square object-cover rounded-md"
                        />
                        <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded bg-white/90 border border-[#e5e7eb]">
                          <input
                            type="checkbox"
                            checked={selectedPhotoIds.has(p.id)}
                            onChange={() => togglePhotoSelection(p.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 text-[#2f4e69] rounded cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-[#6b7280] truncate mt-1 px-0.5">{p.file_name}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p); }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'nouvelle' && (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start w-full pt-0">
            {/* Colonne gauche : formulaire */}
            <div className="lg:sticky lg:top-6 w-full">
          <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-[#e5e7eb] w-full">
            <form onSubmit={(e) => { e.preventDefault(); handleGenerateTemplate(); }}>
              {/* Adresse du bien (pour POI) */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-[#111827] mb-1">
                  Adresse du bien <span className="text-[#ef6e03]">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="adresseSource"
                        checked={adresseSource === 'saisie'}
                        onChange={() => {
                          setAdresseSource('saisie');
                          setSelectedLocataireId('');
                          setNearByPois([]);
                          setVilleFromAdresse('');
                          setQuartier('');
                        }}
                      />
                      <span className="text-xs text-[#374151]">Saisir l'adresse</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="adresseSource"
                        checked={adresseSource === 'locataire'}
                        onChange={() => {
                          setAdresseSource('locataire');
                          setAdresseBien('');
                          setNearByPois([]);
                          setVilleFromAdresse('');
                          setQuartier('');
                        }}
                      />
                      <span className="text-xs text-[#374151]">Choisir un locataire</span>
                    </label>
                  </div>
                  {adresseSource === 'saisie' && (
                    <div className="relative">
                      <input
                        type="text"
                        value={adresseBien}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAdresseBien(val);
                          searchAddress(val);
                          if (!val.trim()) {
                            setVilleFromAdresse('');
                            setQuartier('');
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        onFocus={() => {
                          if (adresseBien.length >= 3) setShowSuggestions(true);
                        }}
                        placeholder="Ex: 12 rue de la Paix, 75002 Paris"
                        className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] focus:border-transparent outline-none"
                      />
                      {showSuggestions && adresseSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#d1d5db] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {adresseSuggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setAdresseBien(s.value);
                                setShowSuggestions(false);
                                geocodeAdresse(s.value);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-[#f9fafb] text-xs text-[#111827]"
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {isGeocoding && (
                        <p className="mt-1 text-xs text-[#6b7280]">Recherche de la localisation...</p>
                      )}
                    </div>
                  )}
                  {adresseSource === 'locataire' && (
                    <select
                      value={selectedLocataireId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedLocataireId(id);
                        const loc = locataires.find(l => l.id === id);
                        setNearByPois([]);
                        if (loc?.adresse_logement) {
                          geocodeAdresse(loc.adresse_logement);
                        } else {
                          setVilleFromAdresse('');
                          setQuartier('');
                        }
                      }}
                      className="w-full max-w-md text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none bg-white"
                    >
                      <option value="">Sélectionner un locataire</option>
                      {locataires.map((l) => (
                        <option key={l.id} value={l.id}>
                          {[l.prenom, l.nom].filter(Boolean).join(' ')} – {l.adresse_logement}
                        </option>
                      ))}
                    </select>
                  )}
                  {adresseSource === 'locataire' && selectedLocataireId && (
                    <p className="text-xs text-[#6b7280]">
                      Adresse utilisée : {locataires.find(l => l.id === selectedLocataireId)?.adresse_logement}
                    </p>
                  )}
                </div>
              </div>

              {/* Quartier / secteur / rue (remonté près de l'adresse) */}
              {adressePourPois && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    Quartier / secteur / rue
                  </label>
                  <input
                    type="text"
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none"
                    placeholder="Ex: Le Marais, rue de Rivoli (pré-rempli automatiquement si détecté)"
                  />
                  {villeFromAdresse && (
                    <p className="mt-1 text-xs text-[#6b7280]">
                      Ville détectée : {villeFromAdresse}
                    </p>
                  )}
                </div>
              )}

              {/* Points d'intérêt à proximité */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-[#111827] mb-1">
                  Points d'intérêt à proximité
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSearchPois}
                    disabled={!adressePourPois || isSearchingPois}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#2f4e69] hover:bg-[#1e3a52] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
                  >
                    {isSearchingPois ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                    {isSearchingPois ? 'Recherche...' : 'Rechercher'}
                  </button>
                  {nearByPois.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNearByPois([]);
                        setPoisError(null);
                      }}
                      className="px-2.5 py-1.5 text-xs text-[#6b7280] hover:text-[#111827] border border-[#d1d5db] hover:border-[#9ca3af] rounded transition-colors"
                    >
                      Supprimer POI
                    </button>
                  )}
                </div>
                {poisError && <p className="mt-2 text-sm text-red-600">{poisError}</p>}
                {nearByPois.length > 0 && (
                  <div className="mt-3 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
                    <p className="text-xs font-medium text-[#111827] mb-2">À proximité (mentionnés dans l'annonce si avantageux) :</p>
                    <ul className="space-y-1 text-sm text-[#374151]">
                      {nearByPois.map((poi, i) => (
                        <li key={i}>{poi.label_annonce}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Type de bien et Meublé/Vide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    Type de bien <span className="text-[#ef6e03]">*</span>
                  </label>
                  <select
                    value={typeBien}
                    onChange={(e) => setTypeBien(e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none bg-white"
                  >
                    <option value="Appartement">Appartement</option>
                    <option value="Maison">Maison</option>
                    <option value="Studio">Studio</option>
                    <option value="Chambre en colocation">Chambre en colocation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    Meublé / Vide <span className="text-[#ef6e03]">*</span>
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" value="Meublé" checked={meubleVide === 'Meublé'} onChange={(e) => setMeubleVide(e.target.value)} />
                      <span className="text-xs text-[#374151]">Meublé</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" value="Vide" checked={meubleVide === 'Vide'} onChange={(e) => setMeubleVide(e.target.value)} />
                      <span className="text-xs text-[#374151]">Vide</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Ville et Quartier / secteur / rue (affichés seulement si pas d'adresse) */}
              {!adressePourPois && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-[#111827] mb-1">Ville <span className="text-[#ef6e03]">*</span></label>
                    <input type="text" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ex: Paris" required className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#111827] mb-1">Quartier / secteur / rue</label>
                    <input type="text" value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Ex: Le Marais" className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none" />
                  </div>
                </div>
              )}

              {/* Surface, Nombre de pièces et Étage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">Surface (m²) <span className="text-[#ef6e03]">*</span></label>
                  <input type="number" value={surface} onChange={(e) => setSurface(e.target.value)} placeholder="45" min={1} required className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">Pièces <span className="text-[#ef6e03]">*</span></label>
                  <input type="number" value={nombrePieces} onChange={(e) => setNombrePieces(e.target.value)} placeholder="2" min={1} required className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">Étage</label>
                  <input type="number" value={etage} onChange={(e) => setEtage(e.target.value)} placeholder="3" min={0} className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none" />
                </div>
              </div>

              {/* Loyer HC et Charges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">Loyer HC (€) <span className="text-[#ef6e03]">*</span></label>
                  <input
                    type="number"
                    value={loyerHC}
                    onChange={(e) => setLoyerHC(e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none"
                    placeholder="800"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">Charges (€)</label>
                  <input
                    type="number"
                    value={charges}
                    onChange={(e) => setCharges(e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none"
                    placeholder="50"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {(parseFloat(loyerHC) > 0 || parseFloat(charges) > 0) && (
                <p className="text-[#111827] text-xs mb-3">
                  Total charges comprises : <strong>{totalCC.toFixed(2)} €</strong>
                </p>
              )}

              {/* Date de disponibilité et Caution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">
                    Date de disponibilité <span className="text-[#ef6e03]">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateDisponibilite}
                    onChange={(e) => setDateDisponibilite(e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-[#d1d5db] rounded-md focus:ring-2 focus:ring-[#ef6e03] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111827] mb-1">Caution</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="caution" checked={caution === '1'} onChange={() => setCaution('1')} className="w-3.5 h-3.5 text-[#2f4e69] border-[#d1d5db] focus:ring-[#2f4e69] cursor-pointer" />
                      <span className="text-xs text-[#111827]">1 mois</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="caution" checked={caution === '2'} onChange={() => setCaution('2')} className="w-3.5 h-3.5 text-[#2f4e69] border-[#d1d5db] focus:ring-[#2f4e69] cursor-pointer" />
                      <span className="text-xs text-[#111827]">2 mois</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Points forts */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-[#111827] mb-1">Points forts</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                  {availableTags.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 py-0.5 rounded hover:bg-[#f4f6f8] cursor-pointer transition-colors">
                      <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => toggleTag(tag)} className="w-3.5 h-3.5 shrink-0 text-[#2f4e69] border-[#d1d5db] rounded focus:ring-[#2f4e69] cursor-pointer" />
                      <span className="text-xs text-[#111827]">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditions : 4 conditions sur une ligne */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-[#111827] mb-1">Conditions</label>
                <div className="grid grid-cols-4 gap-x-2 gap-y-1 items-center">
                  {contraintesOptions.map((contrainte) => (
                    <label key={contrainte} className="flex items-center gap-2 py-0.5 rounded hover:bg-[#f4f6f8] cursor-pointer transition-colors">
                      <input type="checkbox" checked={selectedContraintes.includes(contrainte)} onChange={() => toggleContrainte(contrainte)} className="w-3.5 h-3.5 shrink-0 text-[#2f4e69] border-[#d1d5db] rounded focus:ring-[#2f4e69] cursor-pointer" />
                      <span className="text-xs text-[#111827]">{contrainte}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Zone CTA */}
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-md p-3 mb-0">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">
                  <button
                    type="button"
                    onClick={handleGenerateTemplate}
                    className="px-4 py-2 text-sm font-semibold bg-[#f3644b] hover:bg-[#e0553d] text-white rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-4 h-4" />
                    Générer l'annonce
                  </button>
                </div>
              </div>
            </form>
          </div>
            </div>

            {/* Colonne droite : titres et annonces */}
            <div className="space-y-6 min-w-0">
          {!templateAnnonce && !enhancedAnnonce && (
            <div className="bg-[#f9fafb] border border-dashed border-[#d1d5db] rounded-xl p-8 text-center">
              <p className="text-[#6b7280] text-sm">Remplissez le formulaire et cliquez sur « Générer l'annonce » pour voir le résultat ici.</p>
            </div>
          )}
          {/* Section Titres */}
          {titres.length > 0 && (
            <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e5e7eb]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-[#111827]">Titre de l'annonce</h2>
                <button
                  onClick={handleRegenerateTitres}
                  disabled={isGeneratingTitres}
                  className="px-2 py-1 text-xs text-[#2f4e69] hover:bg-[#f4f6f8] rounded flex items-center gap-1 disabled:opacity-50"
                >
                  {isGeneratingTitres ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {isGeneratingTitres ? 'Génération...' : 'Renouveler'}
                </button>
              </div>
              <div className="space-y-1.5">
                {titres.map((titre, index) => (
                  <div
                    key={index}
                    className="py-1.5 px-2 border border-[#e5e7eb] rounded bg-[#f9fafb] hover:bg-[#f4f6f8] transition-colors flex items-center justify-between gap-2"
                  >
                    <p className="text-[#111827] text-sm font-medium flex-1 min-w-0">{titre}</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(titre);
                          alert('Titre copié.');
                        } catch {
                          alert('Erreur copie');
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-[#2f4e69] hover:text-[#1e3a52] hover:underline shrink-0"
                      title="Copier"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Annonce basique (template) */}
          {templateAnnonce && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-base font-semibold text-[#111827]">Annonce basique</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setSaveTitre(titres[0] ?? ''); setShowSaveModal(true); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#2f4e69] hover:bg-[#f4f6f8] font-medium rounded text-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Sauver l'annonce
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(templateAnnonce);
                        alert('Annonce copiée.');
                      } catch {
                        alert('Erreur copie');
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#2f4e69] hover:bg-[#f4f6f8] font-medium rounded text-sm transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copier
                  </button>
                </div>
              </div>
              <textarea
                value={templateAnnonce}
                onChange={(e) => {
                  setTemplateAnnonce(e.target.value);
                  setAnnonce(e.target.value);
                }}
                className="w-full min-h-[320px] px-3 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#ef6e03] outline-none text-[#111827] text-sm leading-relaxed whitespace-pre-wrap"
                placeholder="Modifiez le texte si besoin..."
              />
              {/* Bouton Améliorer avec IA sous le bloc annonce */}
              <div className="mt-3 pt-3 border-t border-[#e5e7eb]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-[#f3644b]">Style IA :</span>
                  <div className="flex gap-1">
                    {(['sobre', 'chaleureux', 'dynamique'] as StyleAnnonce[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedStyle(s)}
                        className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                          selectedStyle === s ? 'bg-[#f3644b] text-white' : 'text-[#6b7280] hover:bg-[#fff0ee] border border-[#f3644b]/30'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleEnhanceWithAI}
                    disabled={isEnhancing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#f3644b] hover:bg-[#e0553d] disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors"
                  >
                    {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isEnhancing ? 'Amélioration...' : 'Améliorer avec IA'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section Annonce améliorée par IA */}
          {enhancedAnnonce && (
            <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-[#2f4e69]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-base font-semibold text-[#111827]">✨ Annonce améliorée par IA ({selectedStyle})</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setSaveTitre(titres[0] ?? ''); setShowSaveModal(true); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#2f4e69] hover:bg-[#f4f6f8] font-medium rounded text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Sauver
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(enhancedAnnonce);
                        alert('Annonce copiée.');
                      } catch {
                        alert('Erreur copie');
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#2f4e69] hover:bg-[#f4f6f8] font-medium rounded text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copier
                  </button>
                </div>
              </div>
              <textarea
                value={enhancedAnnonce}
                onChange={(e) => {
                  setEnhancedAnnonce(e.target.value);
                  setAnnonce(e.target.value);
                }}
                className="w-full min-h-[400px] px-4 py-3 border-2 border-[#2f4e69] rounded-lg focus:ring-2 focus:ring-[#ef6e03] focus:border-[#ef6e03] outline-none text-[#111827] leading-relaxed text-sm whitespace-pre-wrap"
                placeholder="L'annonce améliorée apparaîtra ici..."
              />
              {/* Régénérer avec style IA sous l'annonce améliorée */}
              <div className="mt-3 pt-3 border-t border-[#e5e7eb]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-[#f3644b]">Style IA :</span>
                  <div className="flex gap-1">
                    {(['sobre', 'chaleureux', 'dynamique'] as StyleAnnonce[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedStyle(s)}
                        className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                          selectedStyle === s ? 'bg-[#f3644b] text-white' : 'text-[#6b7280] hover:bg-[#fff0ee] border border-[#f3644b]/30'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleEnhanceWithAI}
                    disabled={isEnhancing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#f3644b] hover:bg-[#e0553d] disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors"
                  >
                    {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    {isEnhancing ? 'Amélioration...' : 'Régénérer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section Annonce générée (ancienne méthode - gardée pour compatibilité) */}
          {annonce && !templateAnnonce && (
            <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-[#e5e7eb]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#111827] mb-1">Annonce basique</h2>
                  <p className="text-sm text-[#6b7280]">Vous pouvez modifier le texte ci-dessous</p>
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-white border-2 border-[#2f4e69] text-[#2f4e69] hover:bg-[#f4f6f8] font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  Régénérer
                </button>
              </div>
              <textarea
                value={annonce}
                onChange={(e) => setAnnonce(e.target.value)}
                className="w-full min-h-[400px] px-4 py-3 border-2 border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#ef6e03] focus:border-[#ef6e03] outline-none text-[#111827] leading-relaxed text-sm whitespace-pre-wrap"
                placeholder="L'annonce basique apparaîtra ici..."
              />
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setSaveTitre(titres[0] ?? ''); setShowSaveModal(true); }}
                  className="px-6 py-3 bg-[#2f4e69] hover:bg-[#1e3a52] text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Sauver l'annonce
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-6 py-3 bg-[#f3644b] hover:bg-[#e0553d] text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Copy className="w-5 h-5" />
                  Copier l'annonce
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-6 py-3 bg-white border-2 border-[#d1d5db] text-[#111827] hover:bg-[#f4f6f8] font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Imprimer l'annonce
                </button>
              </div>
            </div>
          )}

            </div>
          </div>

          </>
          )}
          </div>

          {/* Modal Sauver l'annonce */}
          {showSaveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                <h3 className="text-lg font-semibold text-[#111827] mb-2">Sauver l'annonce</h3>
                <p className="text-sm text-[#6b7280] mb-4">Donnez un titre à cette annonce pour la retrouver dans « Annonces sauvegardées ».</p>
                <input
                  type="text"
                  value={saveTitre}
                  onChange={(e) => setSaveTitre(e.target.value)}
                  placeholder="Ex. T2 Lyon 3, Appartement rénové..."
                  className="w-full px-4 py-2 border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#ef6e03] outline-none mb-4"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowSaveModal(false); setSaveTitre(''); }}
                    className="px-4 py-2 border border-[#d1d5db] rounded-lg text-[#111827] hover:bg-[#f4f6f8]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAnnonce}
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#f3644b] hover:bg-[#e0553d] text-white font-medium rounded-lg disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-[#f3644b] text-center mt-8">
            Besoin d'aide ? <a href="mailto:contact@quittancesimple.fr" className="underline font-medium">Contactez-nous</a>
          </p>
          </div>
        </div>
    );
  };

export default AnnonceGenerator;
