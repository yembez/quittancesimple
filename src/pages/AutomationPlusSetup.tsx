import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  Euro,
  Calendar,
  ArrowRight,
  CheckCircle,
  Loader,
  Trash2,
  Building2,
  Sparkles,
  CreditCard,
  Zap,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProprietaireData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
}

interface LocataireData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse_logement: string;
  loyer_mensuel: string;
  charges_mensuelles: string;
}

const AutomationPlusSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'intro' | 'proprietaire' | 'locataires' | 'summary'>('intro');
  const [nombreLocatairesExistants, setNombreLocatairesExistants] = useState(0);
  const [isAddMode, setIsAddMode] = useState(false); // Mode ajout vs configuration initiale

  const [proprietaire, setProprietaire] = useState<ProprietaireData>({
    nom: '',
    prenom: '',
    email: localStorage.getItem('proprietaireEmail') || '',
    telephone: '',
    adresse: ''
  });

  const [locataires, setLocataires] = useState<LocataireData[]>([
    {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse_logement: '',
      loyer_mensuel: '',
      charges_mensuelles: ''
    }
  ]);

  // Nouveau système forfaitaire : 1,50€ pour 1 locataire, 2,50€ pour 2+ locataires
  const basePrice = 1.50;
  const multiTenantPrice = 2.50;
  const totalPrice = locataires.length === 1 ? basePrice : multiTenantPrice;

  useEffect(() => {
    const userEmail = localStorage.getItem('proprietaireEmail');
    if (!userEmail) {
      navigate('/pricing');
      return;
    }

    // Vérifier si le propriétaire existe déjà
    const loadProprietaireData = async () => {
      try {
        const { data: propData, error } = await supabase
          .from('proprietaires')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();

        if (error) {
          console.error('Erreur chargement propriétaire:', error);
          return;
        }

        if (propData && propData.plan_actuel === 'Quittance Connectée+') {
          // Propriétaire existant avec plan Connectée+ → Mode "ajout de locataire"
          setProprietaire({
            nom: propData.nom || '',
            prenom: propData.prenom || '',
            email: propData.email || '',
            telephone: propData.telephone || '',
            adresse: propData.adresse || ''
          });

          // Charger les locataires existants pour calculer le nouveau prix
          const { data: locatairesData } = await supabase
            .from('locataires')
            .select('*')
            .eq('proprietaire_id', propData.id)
            .eq('actif', true);

          const nombreLocatairesActuels = locatairesData?.length || 0;
          setNombreLocatairesExistants(nombreLocatairesActuels);
          setIsAddMode(true);

          // Aller directement à la page d'ajout de locataire
          setStep('locataires');

          // Afficher un message informatif
          console.log(`Vous avez actuellement ${nombreLocatairesActuels} locataire(s). Tarif forfaitaire : 1,50€ pour 1 locataire, 2,50€ pour 2+`);
        }
        // Sinon, on reste sur l'intro pour la configuration initiale
      } catch (err) {
        console.error('Erreur:', err);
      }
    };

    loadProprietaireData();
  }, [navigate]);

  const addLocataire = () => {
    setLocataires([
      ...locataires,
      {
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse_logement: '',
        loyer_mensuel: '',
        charges_mensuelles: ''
      }
    ]);
  };

  const removeLocataire = (index: number) => {
    if (locataires.length > 1) {
      setLocataires(locataires.filter((_, i) => i !== index));
    }
  };

  const updateLocataire = (index: number, field: keyof LocataireData, value: string) => {
    const updated = [...locataires];
    updated[index][field] = value;
    setLocataires(updated);
  };

  const handleProprietaireSubmit = () => {
    if (!proprietaire.nom || !proprietaire.prenom || !proprietaire.email || !proprietaire.telephone || !proprietaire.adresse) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    setStep('locataires');
  };

  const handleLocatairesSubmit = async () => {
    const incomplete = locataires.some(
      loc => !loc.nom || !loc.adresse_logement || !loc.loyer_mensuel || !loc.charges_mensuelles
    );

    if (incomplete) {
      alert('Veuillez remplir au minimum le nom, l\'adresse, le loyer et les charges pour chaque locataire');
      return;
    }

    // En mode ajout, sauvegarder directement et retourner au dashboard
    if (isAddMode) {
      await saveNewLocataires();
    } else {
      setStep('summary');
    }
  };

  const saveNewLocataires = async () => {
    setLoading(true);

    try {
      // Récupérer l'ID du propriétaire
      const { data: propData, error: propError } = await supabase
        .from('proprietaires')
        .select('id')
        .eq('email', proprietaire.email)
        .maybeSingle();

      if (propError || !propData) {
        throw new Error('Propriétaire non trouvé');
      }

      // Insérer les nouveaux locataires
      const locatairesData = locataires.map(loc => ({
        proprietaire_id: propData.id,
        nom: loc.nom,
        prenom: loc.prenom || '',
        email: loc.email || '',
        telephone: loc.telephone || '',
        adresse_logement: loc.adresse_logement,
        loyer_mensuel: parseFloat(loc.loyer_mensuel),
        charges_mensuelles: parseFloat(loc.charges_mensuelles),
        date_rappel: 1,
        periodicite: 'mensuel',
        statut: 'en_attente',
        actif: true
      }));

      const { error: insertError } = await supabase
        .from('locataires')
        .insert(locatairesData);

      if (insertError) {
        console.error('Erreur insertion locataires:', insertError);
        throw insertError;
      }

      // Mettre à jour le nombre de locataires du propriétaire
      const { data: allLocataires } = await supabase
        .from('locataires')
        .select('id')
        .eq('proprietaire_id', propData.id)
        .eq('actif', true);

      const totalLocataires = allLocataires?.length || 0;

      await supabase
        .from('proprietaires')
        .update({ nombre_locataires: totalLocataires })
        .eq('id', propData.id);

      // Message de succès et retour au dashboard
      alert(
        `${locataires.length} nouveau${locataires.length > 1 ? 'x' : ''} locataire${locataires.length > 1 ? 's' : ''} ajouté${locataires.length > 1 ? 's' : ''} avec succès !\n\n` +
        `Vous pouvez maintenant configurer la détection automatique des paiements depuis le Dashboard (onglet Synchro bancaire).`
      );

      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur:', err);
      alert('Une erreur est survenue lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expirée. Veuillez vous reconnecter.');
        navigate('/pricing');
        return;
      }

      const { data: proprietaireData, error: propError } = await supabase
        .from('proprietaires')
        .select('id')
        .eq('email', proprietaire.email)
        .maybeSingle();

      if (propError) {
        console.error('Erreur récupération propriétaire:', propError);
        alert('Erreur lors de la récupération de vos informations');
        setLoading(false);
        return;
      }

      if (!proprietaireData) {
        alert('Propriétaire introuvable');
        setLoading(false);
        return;
      }

      const proprietaireId = proprietaireData.id;

      const { error: updateError } = await supabase
        .from('proprietaires')
        .update({
          nom: proprietaire.nom,
          prenom: proprietaire.prenom,
          telephone: proprietaire.telephone,
          adresse: proprietaire.adresse,
          nombre_locataires: locataires.length,
          plan_actuel: 'Quittance Connectée+',
          abonnement_actif: true
        })
        .eq('id', proprietaireId);

      if (updateError) {
        console.error('Erreur mise à jour propriétaire:', updateError);
        alert('Erreur lors de la mise à jour de vos informations');
        setLoading(false);
        return;
      }

      const locatairesData = locataires.map(loc => ({
        proprietaire_id: proprietaireId,
        nom: loc.nom,
        prenom: loc.prenom || '',
        email: loc.email || '',
        telephone: loc.telephone || '',
        adresse_logement: loc.adresse_logement,
        loyer_mensuel: parseFloat(loc.loyer_mensuel) || 0,
        charges_mensuelles: parseFloat(loc.charges_mensuelles) || 0,
        date_rappel: 1,
        periodicite: 'mensuel',
        actif: true
      }));

      const { error: locError } = await supabase
        .from('locataires')
        .insert(locatairesData);

      if (locError) {
        console.error('Erreur insertion locataires:', locError);
        alert('Erreur lors de l\'ajout des locataires');
        setLoading(false);
        return;
      }

      localStorage.setItem('numberOfTenants', locataires.length.toString());
      localStorage.setItem('proprietaireEmail', proprietaire.email);

      navigate('/tenant-detection-setup');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefdf9] via-white to-[#2D3436]/5 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-[#2D3436] to-[#6a9d7f] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#1a1f20] mb-4">
            {isAddMode ? 'Ajouter un nouveau locataire' : 'Configuration Quittance Connectée+'}
          </h1>
          <p className="text-lg text-[#415052]/80">
            {isAddMode
              ? 'Ajoutez les informations de votre nouveau locataire'
              : 'Configurez vos informations et vos locataires avant d\'activer la synchronisation bancaire'}
          </p>
        </div>

        {/* Progress indicator - masqué en mode ajout */}
        {!isAddMode && (
          <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step === 'intro' ? 'text-[#2D3436]' : step !== 'intro' ? 'text-[#2D3436]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'intro' ? 'bg-[#2D3436] text-white' : step !== 'intro' ? 'bg-[#2D3436] text-white' : 'bg-gray-200'}`}>
                {step !== 'intro' ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Introduction</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'proprietaire' ? 'text-[#2D3436]' : step === 'locataires' || step === 'summary' ? 'text-[#2D3436]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'proprietaire' ? 'bg-[#2D3436] text-white' : (step === 'locataires' || step === 'summary') ? 'bg-[#2D3436] text-white' : 'bg-gray-200'}`}>
                {(step === 'locataires' || step === 'summary') ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Propriétaire</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'locataires' ? 'text-[#2D3436]' : step === 'summary' ? 'text-[#2D3436]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'locataires' ? 'bg-[#2D3436] text-white' : step === 'summary' ? 'bg-[#2D3436] text-white' : 'bg-gray-200'}`}>
                {step === 'summary' ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Locataires</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step === 'summary' ? 'text-[#2D3436]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'summary' ? 'bg-[#2D3436] text-white' : 'bg-gray-200'}`}>
                4
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Résumé</span>
            </div>
          </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Step 1: Introduction */}
          {step === 'intro' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#2D3436]/10 to-[#6a9d7f]/10 rounded-2xl p-6 border border-[#2D3436]/20">
                <h3 className="text-xl font-bold text-[#1a1f20] mb-4 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-[#2D3436]" />
                  Comment fonctionne Quittance Connectée+ ?
                </h3>
                <p className="text-[#415052] leading-relaxed">
                  Votre banque détecte automatiquement les virements de vos locataires, et les quittances sont générées et envoyées sans intervention de votre part.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-[#1a1f20] text-lg">Les étapes :</h4>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-[#2D3436]/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-[#2D3436]">1</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-[#415052]">Renseignez vos informations</h5>
                    <p className="text-[#415052]/70 text-sm">Complétez vos coordonnées de propriétaire</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-[#2D3436]/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-[#2D3436]">2</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-[#415052]">Ajoutez vos locataires</h5>
                    <p className="text-[#415052]/70 text-sm">Nom, adresse, loyer et charges pour chaque locataire</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-[#2D3436]/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-[#2D3436]">3</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-[#415052]">Connectez votre banque</h5>
                    <p className="text-[#415052]/70 text-sm">Synchronisation sécurisée avec Bridge (agrégateur certifié)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-[#2D3436]/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-[#2D3436]">4</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-[#415052]">C'est automatique !</h5>
                    <p className="text-[#415052]/70 text-sm">Les quittances s'envoient automatiquement quand un virement est détecté</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-800 flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Vos données bancaires sont totalement sécurisées. Nous n'avons jamais accès à vos identifiants bancaires.</span>
                </p>
              </div>

              <button
                onClick={() => setStep('proprietaire')}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#2D3436] to-[#6a9d7f] hover:from-[#6a9d7f] hover:to-[#769272] text-white font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Commencer la configuration
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}

          {/* Step 2: Propriétaire */}
          {step === 'proprietaire' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1a1f20] mb-6 flex items-center">
                <User className="w-7 h-7 mr-3 text-[#2D3436]" />
                Vos informations
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-2">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={proprietaire.nom}
                      onChange={(e) => setProprietaire({ ...proprietaire, nom: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-2">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={proprietaire.prenom}
                      onChange={(e) => setProprietaire({ ...proprietaire, prenom: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                      placeholder="Jean"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#415052] mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={proprietaire.email}
                    onChange={(e) => setProprietaire({ ...proprietaire, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all bg-gray-50"
                    placeholder="jean.dupont@email.com"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#415052] mb-2">
                  Téléphone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={proprietaire.telephone}
                    onChange={(e) => {
                      const value = e.target.value;
                      const cleaned = value.replace(/[^0-9+]/g, '');
                      setProprietaire({ ...proprietaire, telephone: cleaned });
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value && !value.match(/^\+33[67]\d{8}$/)) {
                        alert('⚠️ Format invalide. Utilisez +33612345678 (mobile français)');
                      }
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="+33612345678"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#415052] mb-2">
                  Adresse complète *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={proprietaire.adresse}
                    onChange={(e) => setProprietaire({ ...proprietaire, adresse: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all min-h-[80px]"
                    placeholder="12 Rue de la République, 75001 Paris"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('intro')}
                  className="px-6 py-3 rounded-full border-2 border-gray-300 text-[#415052] font-semibold hover:bg-gray-50 transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={handleProprietaireSubmit}
                  className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#2D3436] to-[#6a9d7f] text-white font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Suivant : Ajouter mes locataires
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Locataires */}
          {step === 'locataires' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#2b2b2b]">
                  {isAddMode ? 'Nouveau locataire' : 'Vos locataires'}
                </h2>
                <div className="bg-[#7CAA89] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  {isAddMode
                    ? `+${locataires.length}€/mois`
                    : `${totalPrice.toFixed(2)}€/mois`
                  }
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
                <div className="flex items-start">
                  <CreditCard className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    {isAddMode ? (
                      <>
                        <p className="font-semibold mb-1">Vous avez actuellement {nombreLocatairesExistants} locataire{nombreLocatairesExistants > 1 ? 's' : ''}</p>
                        <p>Tarification forfaitaire : 1,50€ pour 1 locataire, 2,50€ pour 2+ locataires</p>
                        <p className="font-semibold mt-2">Nouveau total après ajout : {((nombreLocatairesExistants + locataires.length) === 1 ? basePrice : multiTenantPrice).toFixed(2)}€/mois</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold mb-1">Tarification : 1,50€ pour 1 locataire, 2,50€ pour 2+ locataires</p>
                        <p>{locataires.length} locataire{locataires.length > 1 ? 's' : ''} = {totalPrice.toFixed(2)}€/mois</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {locataires.map((locataire, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-2xl p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-[#1a1f20]">Locataire {index + 1}</h3>
                      {locataires.length > 1 && (
                        <button
                          onClick={() => removeLocataire(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#415052] mb-2">
                          Nom *
                        </label>
                        <input
                          type="text"
                          value={locataire.nom}
                          onChange={(e) => updateLocataire(index, 'nom', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                          placeholder="Martin"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#415052] mb-2">
                          Prénom
                        </label>
                        <input
                          type="text"
                          value={locataire.prenom}
                          onChange={(e) => updateLocataire(index, 'prenom', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                          placeholder="Sophie"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#415052] mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={locataire.email}
                          onChange={(e) => updateLocataire(index, 'email', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                          placeholder="sophie.martin@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#415052] mb-2">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          value={locataire.telephone}
                          onChange={(e) => updateLocataire(index, 'telephone', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                          placeholder="06 12 34 56 78"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-[#415052] mb-2">
                          Adresse du logement *
                        </label>
                        <input
                          type="text"
                          value={locataire.adresse_logement}
                          onChange={(e) => updateLocataire(index, 'adresse_logement', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                          placeholder="5 Avenue des Champs, 75008 Paris"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#415052] mb-2">
                          Loyer mensuel (€) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={locataire.loyer_mensuel}
                          onChange={(e) => updateLocataire(index, 'loyer_mensuel', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                          placeholder="800"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#415052] mb-2">
                          Charges mensuelles (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={locataire.charges_mensuelles}
                          onChange={(e) => updateLocataire(index, 'charges_mensuelles', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                          placeholder="100"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!isAddMode && (
                <button
                  onClick={addLocataire}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-[#7CAA89] text-[#7CAA89] font-semibold hover:bg-[#7CAA89]/5 transition-all flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter un locataire
                </button>
              )}

              <div className="flex gap-3">
                {!isAddMode && (
                  <button
                    onClick={() => setStep('proprietaire')}
                    className="px-6 py-3 rounded-full border-2 border-gray-300 text-[#415052] font-semibold hover:bg-gray-50 transition-all"
                  >
                    Retour
                  </button>
                )}
                {isAddMode && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 rounded-full border-2 border-gray-300 text-[#415052] font-semibold hover:bg-gray-50 transition-all"
                  >
                    Annuler
                  </button>
                )}
                <button
                  onClick={handleLocatairesSubmit}
                  className="flex-1 py-3 rounded-full bg-[#7CAA89] hover:bg-[#6b9378] text-white font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {isAddMode ? 'Enregistrer le locataire' : 'Suivant : Résumé'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 'summary' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1a1f20] mb-6 flex items-center">
                <CheckCircle className="w-7 h-7 mr-3 text-[#2D3436]" />
                Récapitulatif
              </h2>

              <div className="bg-gradient-to-r from-[#2D3436]/10 to-[#6a9d7f]/10 rounded-2xl p-6 border border-[#2D3436]/20">
                <h3 className="font-bold text-[#1a1f20] mb-3">Propriétaire</h3>
                <div className="space-y-1 text-[#415052]">
                  <p>{proprietaire.prenom} {proprietaire.nom}</p>
                  <p className="text-sm">{proprietaire.email}</p>
                  <p className="text-sm">{proprietaire.telephone}</p>
                  <p className="text-sm">{proprietaire.adresse}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
                <h3 className="font-bold text-[#1a1f20] mb-4">
                  Locataires ({locataires.length})
                </h3>
                <div className="space-y-4">
                  {locataires.map((loc, index) => (
                    <div key={index} className="flex justify-between items-start pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-[#415052]">{loc.prenom} {loc.nom}</p>
                        <p className="text-sm text-[#415052]/70">{loc.adresse_logement}</p>
                        {loc.email && <p className="text-sm text-[#415052]/70">{loc.email}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#1a1f20]">{parseFloat(loc.loyer_mensuel) + parseFloat(loc.charges_mensuelles)}€</p>
                        <p className="text-xs text-[#415052]/70">
                          Loyer: {loc.loyer_mensuel}€<br />
                          Charges: {loc.charges_mensuelles}€
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#2D3436] to-[#6a9d7f] rounded-2xl p-6 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Total de votre abonnement</span>
                  <span className="text-3xl font-bold">{totalPrice.toFixed(2)}€</span>
                </div>
                <p className="text-sm opacity-90">par mois</p>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-start">
                  <Building2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Prochaine étape : Connecter votre banque pour activer la synchronisation automatique des paiements</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('locataires')}
                  className="px-6 py-3 rounded-full border-2 border-gray-300 text-[#415052] font-semibold hover:bg-gray-50 transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex-1 py-4 rounded-full bg-gradient-to-r from-[#2D3436] to-[#6a9d7f] hover:from-[#6a9d7f] hover:to-[#769272] text-white font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      Connecter ma banque
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomationPlusSetup;
