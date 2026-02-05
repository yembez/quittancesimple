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
  Check,
  CheckCircle,
  Loader,
  Trash2,
  Building2,
  Sparkles
} from 'lucide-react';

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
  date_rappel: string;
}

const AutomationSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('standard');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const [proprietaire, setProprietaire] = useState<ProprietaireData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: ''
  });

  const [locataires, setLocataires] = useState<LocataireData[]>([{
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse_logement: '',
    loyer_mensuel: '',
    charges_mensuelles: '',
    date_rappel: '1'
  }]);

  useEffect(() => {
    checkExistingData();
  }, []);

  const checkExistingData = async () => {
    const savedData = localStorage.getItem('generatorFormData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setProprietaire({
        nom: data.baillorName || '',
        prenom: '',
        email: data.baillorEmail || '',
        telephone: '',
        adresse: data.baillorAddress || ''
      });

      if (data.locataireName && data.logementAddress) {
        setLocataires([{
          nom: data.locataireName,
          prenom: '',
          email: '',
          telephone: '',
          adresse_logement: data.logementAddress,
          loyer_mensuel: data.loyer || '',
          charges_mensuelles: data.charges || '',
          date_rappel: '1'
        }]);
      }

      setExistingData(data);
    } else {
      setProprietaire({
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@email.com',
        telephone: '06 12 34 56 78',
        adresse: '123 rue de la République, 75001 Paris'
      });

      setLocataires([{
        nom: 'Martin',
        prenom: 'Marie',
        email: 'marie.martin@email.com',
        telephone: '06 98 76 54 32',
        adresse_logement: '45 avenue des Champs, 75008 Paris',
        loyer_mensuel: '800',
        charges_mensuelles: '100',
        date_rappel: '5'
      }]);
    }
  };

  const handleProprietaireChange = (field: keyof ProprietaireData, value: string) => {
    // Validation spéciale pour le téléphone
    if (field === 'telephone') {
      const cleaned = value.replace(/[^0-9+]/g, '');
      setProprietaire(prev => ({ ...prev, [field]: cleaned }));
    } else {
      setProprietaire(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLocataireChange = (index: number, field: keyof LocataireData, value: string) => {
    setLocataires(prev => prev.map((loc, i) =>
      i === index ? { ...loc, [field]: value } : loc
    ));
  };

  const addLocataire = () => {
    setLocataires(prev => [...prev, {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse_logement: '',
      loyer_mensuel: '',
      charges_mensuelles: '',
      date_rappel: '1'
    }]);
  };

  const removeLocataire = (index: number) => {
    if (locataires.length > 1) {
      setLocataires(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const proprietaireValid = proprietaire.nom && proprietaire.email && proprietaire.adresse;
    const locatairesValid = locataires.every(loc =>
      loc.nom && loc.adresse_logement && loc.loyer_mensuel && loc.charges_mensuelles
    );
    return proprietaireValid && locatairesValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const setupData = {
      proprietaire,
      locataires,
      selectedPlan,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('automationSetupData', JSON.stringify(setupData));
    localStorage.setItem('billingCycle', billingCycle);

    if (selectedPlan === 'premium') {
      navigate('/bank-sync');
    } else {
      navigate('/payment-checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Automatisez vos quittances de loyer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Choisissez le niveau d'automatisation qui vous convient. Gagnez du temps et ne manquez plus jamais l'envoi d'une quittance.
          </p>

          {existingData && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Données récupérées du générateur gratuit
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section processus simplifié */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Mode Tranquillité */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mode Tranquillité</h2>
              <CheckCircle className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-gray-600 mb-6">
              Vous restez maître de l'envoi tout en étant guidé automatiquement
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Vous recevez un rappel</h3>
                  <p className="text-sm text-gray-600">
                    SMS et email automatiques à la date que vous avez choisie
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Vous validez le paiement</h3>
                  <p className="text-sm text-gray-600">
                    Confirmez en 1 clic que le loyer a été reçu
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Envoi automatique</h3>
                  <p className="text-sm text-gray-600">
                    La quittance est générée et envoyée instantanément par email
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quittance Connectée+ */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-gray-200 relative">
            <div className="absolute -top-3 right-4 bg-[#2D3436] text-white text-xs px-3 py-1 rounded-full font-semibold">
              100% automatique
            </div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Mode Tranquillité<span className="text-4xl text-gray-600">+</span>
              </h2>
              <Sparkles className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-600 mb-6">
              Zéro effort : tout se fait automatiquement de A à Z
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Connexion bancaire sécurisée</h3>
                  <p className="text-sm text-gray-600">
                    Synchronisez votre compte en toute sécurité (technologie bancaire)
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Détection automatique</h3>
                  <p className="text-sm text-gray-600">
                    Le système détecte les paiements de loyer sur votre compte
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Envoi 100% automatique</h3>
                  <p className="text-sm text-gray-600">
                    Quittance générée et envoyée automatiquement dès réception du loyer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Plan Selection */}
          <div className="mb-10">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2D3436] to-blue-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Choisissez votre plan</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedPlan('standard')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedPlan === 'standard'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Mode Tranquillité</h3>
                  {selectedPlan === 'standard' && <CheckCircle className="w-6 h-6 text-blue-600" />}
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  0,99€<span className="text-base font-normal text-gray-600">/mois</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  1-2 locataires : 0,99€ · 3-4 : 1,49€ · 5+ : 2,49€/mois
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Quittances créées automatiquement
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Rappels SMS + Email
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Validation paiement en 1 clic
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Historique des paiements
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Relances automatiques
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Sans engagement
                  </li>
                </ul>
              </button>

              <button
                onClick={() => setSelectedPlan('premium')}
                className={`p-6 rounded-xl border-2 transition-all text-left relative ${
                  selectedPlan === 'premium'
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="absolute -top-3 right-4 bg-[#2D3436] text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Nouveau
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-gray-600 mr-2" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Mode Tranquillité<span className="text-2xl text-gray-600">+</span>
                    </h3>
                  </div>
                  {selectedPlan === 'premium' && <CheckCircle className="w-6 h-6 text-gray-600" />}
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  1,50€<span className="text-base font-normal text-gray-600">/mois</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  par locataire
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">Synchronisation bancaire automatique</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Détection automatique des paiements
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Envoi 100% automatique des quittances
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Vérification quotidienne
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Rappels SMS + Email
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                    Sans engagement
                  </li>
                </ul>
              </button>
            </div>
          </div>

          {/* Section Propriétaire */}
          <div className="mb-10">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Informations du propriétaire</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={proprietaire.nom}
                  onChange={(e) => handleProprietaireChange('nom', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Dupont"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={proprietaire.prenom}
                  onChange={(e) => handleProprietaireChange('prenom', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Jean"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={proprietaire.email}
                    onChange={(e) => handleProprietaireChange('email', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="jean.dupont@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={proprietaire.telephone}
                    onChange={(e) => handleProprietaireChange('telephone', e.target.value)}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value && !value.match(/^\+33[67]\d{8}$/)) {
                        alert('⚠️ Format invalide. Utilisez +33612345678 (mobile français)');
                      }
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="+33612345678"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse complète <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={proprietaire.adresse}
                    onChange={(e) => handleProprietaireChange('adresse', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="123 rue de la République, 75001 Paris"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Locataires */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2D3436] to-blue-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Locataires</h2>
              </div>
              <button
                onClick={addLocataire}
                className="bg-[#2D3436] hover:bg-[#1a1f20] text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>

            <div className="space-y-8">
              {locataires.map((locataire, index) => (
                <div key={index} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Locataire {index + 1}
                    </h3>
                    {locataires.length > 1 && (
                      <button
                        onClick={() => removeLocataire(index)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={locataire.nom}
                        onChange={(e) => handleLocataireChange(index, 'nom', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="Martin"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={locataire.prenom}
                        onChange={(e) => handleLocataireChange(index, 'prenom', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="Marie"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={locataire.email}
                        onChange={(e) => handleLocataireChange(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="marie.martin@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={locataire.telephone}
                        onChange={(e) => handleLocataireChange(index, 'telephone', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="06 12 34 56 78"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse du logement <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={locataire.adresse_logement}
                        onChange={(e) => handleLocataireChange(index, 'adresse_logement', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="45 avenue des Champs, 75008 Paris"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loyer mensuel (€) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={locataire.loyer_mensuel}
                          onChange={(e) => handleLocataireChange(index, 'loyer_mensuel', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="800"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Charges mensuelles (€)
                      </label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={locataire.charges_mensuelles}
                          onChange={(e) => handleLocataireChange(index, 'charges_mensuelles', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="100"
                          required
                        />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Date de rappel (Configuration après paiement)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <select
                          value={locataire.date_rappel}
                          disabled
                          className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        >
                          <option value="1">Configuration disponible après le paiement</option>
                        </select>
                      </div>
                      <div className="absolute left-0 top-full mt-2 w-80 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <p className="leading-relaxed">
                          La configuration de la date et l'heure de rappel sera disponible après la finalisation du paiement. Vous pourrez alors personnaliser vos rappels automatiques dans votre tableau de bord.
                        </p>
                        <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Choix du cycle de facturation */}
          {selectedPlan === 'standard' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Choisissez votre formule</h3>
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div
                  onClick={() => setBillingCycle('monthly')}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    billingCycle === 'monthly'
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-lg text-gray-900">Mensuel</h4>
                    {billingCycle === 'monthly' && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {locataires.length <= 2 ? '0.99' : locataires.length <= 5 ? '1.49' : '2.49'} €
                      </span>
                      <span className="text-gray-600">/mois</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Engagement mensuel, annulation à tout moment</p>
                </div>

                <div
                  onClick={() => setBillingCycle('yearly')}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    billingCycle === 'yearly'
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      RECOMMANDÉ
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-lg text-gray-900">Annuel</h4>
                    {billingCycle === 'yearly' && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {locataires.length <= 2 ? '0,82' : locataires.length <= 5 ? '1,24' : '2,07'} €
                      </span>
                      <span className="text-gray-600">/mois</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      ({locataires.length <= 2 ? '9,90' : locataires.length <= 5 ? '14,90' : '24,90'} €/an)
                    </p>
                    <p className="text-sm text-green-600 font-semibold mt-1">
                      Économisez {locataires.length <= 2 ? '1,98' : locataires.length <= 5 ? '2,98' : '4,98'} € par an
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">Paiement unique annuel</p>
                </div>
              </div>
            </div>
          )}

          {/* Bouton Submit */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={loading || !validateForm()}
                className={`disabled:opacity-50 disabled:cursor-not-allowed text-white px-12 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl ${
                  selectedPlan === 'premium'
                    ? 'bg-gradient-to-r from-[#2D3436] to-blue-600 hover:from-[#1a1f20] hover:to-blue-700'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-6 h-6 animate-spin" />
                    <span>Chargement...</span>
                  </>
                ) : (
                  <>
                    {selectedPlan === 'premium' ? (
                      <>
                        <Building2 className="w-6 h-6" />
                        <span>Configurer la synchro bancaire</span>
                      </>
                    ) : (
                      <>
                        <span>Continuer vers le paiement</span>
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              {selectedPlan === 'premium'
                ? 'Vous allez configurer votre connexion bancaire pour une automatisation 100%'
                : 'Après le paiement, vos données seront enregistrées et l\'automatisation activée'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationSetup;
