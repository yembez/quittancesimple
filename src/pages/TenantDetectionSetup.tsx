import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  User,
  CreditCard,
  Euro,
  Shield,
  ArrowRight,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Locataire {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  adresse_logement: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  caution_initiale?: number;
  iban?: string;
  iban_verified?: boolean;
}

interface DetectionConfig {
  locataire_id: string;
  expected_amount: string;
  sender_iban: string;
  sender_name: string;
  description_contains: string;
  tolerance_amount: string;
  send_mode: 'auto' | 'manual_validation';
  verification_day_start: string;
  verification_day_end: string;
}

const TenantDetectionSetup = () => {
  const navigate = useNavigate();
  const [proprietaire, setProprietaire] = useState<any>(null);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [configs, setConfigs] = useState<Record<string, DetectionConfig>>({});
  const [selectedLocataireId, setSelectedLocataireId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const savedEmail = localStorage.getItem('proprietaireEmail');
      if (!savedEmail) {
        navigate('/automation-plus-setup');
        return;
      }

      const { data: propData } = await supabase
        .from('proprietaires')
        .select('*')
        .eq('email', savedEmail)
        .maybeSingle();

      if (!propData) {
        navigate('/automation-plus-setup');
        return;
      }

      setProprietaire(propData);

      const { data: locatairesData, error: locatairesError } = await supabase
        .from('locataires')
        .select('*')
        .eq('proprietaire_id', propData.id)
        .eq('actif', true)
        .order('nom');

      if (locatairesError) throw locatairesError;

      setLocataires(locatairesData || []);

      if (locatairesData && locatairesData.length > 0) {
        const savedLocataireId = localStorage.getItem('selectedLocataireId');
        setSelectedLocataireId(savedLocataireId || locatairesData[0].id);

        const initialConfigs: Record<string, DetectionConfig> = {};
        locatairesData.forEach(locataire => {
          const totalAmount = (locataire.loyer_mensuel + locataire.charges_mensuelles).toFixed(2);
          initialConfigs[locataire.id] = {
            locataire_id: locataire.id,
            expected_amount: totalAmount,
            sender_iban: locataire.iban || '',
            sender_name: `${locataire.nom.toUpperCase()} ${locataire.prenom || ''}`,
            description_contains: '', // Sera enrichi automatiquement
            tolerance_amount: '5.00',
            send_mode: 'manual_validation',
            verification_day_start: '1',
            verification_day_end: '10',
          };
        });
        setConfigs(initialConfigs);
      }
    } catch (err) {
      console.error('Error loading:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (locataireId: string, field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [locataireId]: {
        ...prev[locataireId],
        [field]: value
      }
    }));
  };

  const isConfigComplete = (config: DetectionConfig) => {
    return config.expected_amount && parseFloat(config.expected_amount) > 0;
  };

  const allConfigsComplete = () => {
    return locataires.every(loc => isConfigComplete(configs[loc.id]));
  };

  const handleContinue = () => {
    if (!allConfigsComplete()) {
      setError('Veuillez configurer tous les locataires avant de continuer');
      return;
    }

    // Enrichir automatiquement avec tous les mots-clés pertinents
    const enrichedConfigs = { ...configs };
    Object.keys(enrichedConfigs).forEach(locataireId => {
      const config = enrichedConfigs[locataireId];

      // Mots-clés courants pour les virements de loyer
      const commonKeywords = [
        'loyer', 'location', 'appartement', 'appart', 'logement',
        'virement', 'paiement', 'rent', 'housing', 'lease'
      ];

      // Mois et leurs abréviations
      const months = [
        'janvier', 'jan', 'février', 'fev', 'fevrier', 'mars', 'mar',
        'avril', 'avr', 'mai', 'juin', 'juillet', 'juil', 'août', 'aout',
        'septembre', 'sept', 'octobre', 'oct', 'novembre', 'nov', 'décembre', 'dec'
      ];

      // Combiner tous les mots-clés
      const allKeywords = [...commonKeywords, ...months].join(',');

      enrichedConfigs[locataireId] = {
        ...config,
        description_contains: allKeywords
      };
    });

    localStorage.setItem('tenantDetectionConfigs', JSON.stringify(enrichedConfigs));
    navigate('/bank-sync');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  const selectedConfig = selectedLocataireId ? configs[selectedLocataireId] : null;
  const selectedLocataire = locataires.find(l => l.id === selectedLocataireId);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour au dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuration de la détection automatique
          </h1>
          <p className="text-gray-600">
            Configurez les critères de détection pour chaque locataire avant de connecter votre banque
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-blue-900 font-medium">
                Configurez les paramètres de détection pour chaque locataire. Vos données sont sécurisées et restent confidentielles.
              </p>
            </div>
          </div>
        </div>

        {locataires.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun locataire trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Vous devez d'abord ajouter des locataires avant de configurer la détection.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Aller au Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center justify-between">
                  <span>Vos locataires</span>
                  <span className="text-xs text-gray-500">
                    {locataires.filter(l => isConfigComplete(configs[l.id])).length}/{locataires.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {locataires.map((locataire) => {
                    const config = configs[locataire.id];
                    const isComplete = config && isConfigComplete(config);
                    const isSelected = selectedLocataireId === locataire.id;
                    const totalAmount = locataire.loyer_mensuel + locataire.charges_mensuelles;

                    return (
                      <button
                        key={locataire.id}
                        onClick={() => setSelectedLocataireId(locataire.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center">
                            <User className={`w-4 h-4 mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {locataire.nom} {locataire.prenom}
                            </span>
                          </div>
                          {isComplete ? (
                            <CheckCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-[#FFD76F] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {locataire.adresse_logement}
                        </p>
                        <p className="text-xs font-medium text-gray-700">
                          {totalAmount.toFixed(2)}€/mois
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Configuration presque terminée
                    </h4>
                    <p className="text-xs text-gray-800">
                      Une fois tous les locataires configurés, vous pourrez connecter votre banque en toute sécurité.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedLocataire && selectedConfig ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Configuration : {selectedLocataire.nom} {selectedLocataire.prenom}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Détection automatique des paiements
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loyer attendu + charges
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={selectedConfig.expected_amount}
                      onChange={(e) => updateConfig(selectedLocataireId!, 'expected_amount', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 850.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tolérance de montant (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedConfig.tolerance_amount}
                      onChange={(e) => updateConfig(selectedLocataireId!, 'tolerance_amount', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 5.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepter un écart de +/- ce montant
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant de la caution initiale (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedLocataire?.caution_initiale || ''}
                      onChange={async (e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : 0;

                        // Mise à jour dans la base de données
                        const { error } = await supabase
                          .from('locataires')
                          .update({ caution_initiale: value })
                          .eq('id', selectedLocataireId);

                        if (!error) {
                          // Mise à jour locale
                          setLocataires(prev => prev.map(l =>
                            l.id === selectedLocataireId
                              ? { ...l, caution_initiale: value }
                              : l
                          ));
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 950.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom exact du titulaire du compte émetteur des loyers
                    </label>
                    <input
                      type="text"
                      value={selectedConfig.sender_name}
                      onChange={(e) => updateConfig(selectedLocataireId!, 'sender_name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: DUPONT Jean"
                    />
                  </div>

                  {/* Champ masqué - Les mots-clés sont ajoutés automatiquement lors de la sauvegarde */}
                  <div className="hidden">
                    <input
                      type="text"
                      value={selectedConfig.description_contains}
                      onChange={(e) => updateConfig(selectedLocataireId!, 'description_contains', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Période de vérification du paiement
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jour de début
                        </label>
                        <select
                          value={selectedConfig.verification_day_start}
                          onChange={(e) => updateConfig(selectedLocataireId!, 'verification_day_start', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day.toString()}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jour de fin
                        </label>
                        <select
                          value={selectedConfig.verification_day_end}
                          onChange={(e) => updateConfig(selectedLocataireId!, 'verification_day_end', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day.toString()}>{day}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <strong>Alerte SMS+Email Automatique :</strong> En cas de non détection de paiement à cette période, nous vous prévenons, vous pourrez alors vérifier et envoyer si besoin une relance ou la quittance générée automatiquement en 1 clic.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <CreditCard className="w-4 h-4 mr-1" />
                      IBAN du locataire (facultatif)
                    </label>
                    <input
                      type="text"
                      value={selectedConfig.sender_iban}
                      onChange={(e) => updateConfig(selectedLocataireId!, 'sender_iban', e.target.value.toUpperCase())}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex. FR76 3000 6000 0112 3456 7890 189 ou ****90189"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si vous l'avez, vous pouvez saisir l'IBAN complet ou seulement les 4 à 6 derniers chiffres, sinon laissez vide.
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-600">
                      <Shield className="w-3 h-3 mr-1" />
                      <span>L'IBAN n'est jamais affiché ni partagé. Il sert uniquement à identifier les paiements reçus.</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Mode d'envoi de la quittance
                    </h3>

                    <div className="space-y-4">
                      {/* Envoi automatique disponible uniquement si IBAN vérifié */}
                      {selectedLocataire?.iban_verified ? (
                        <div className="flex items-start">
                          <input
                            type="radio"
                            id={`auto_${selectedLocataireId}`}
                            name={`send_mode_${selectedLocataireId}`}
                            value="auto"
                            checked={selectedConfig.send_mode === 'auto'}
                            onChange={(e) => updateConfig(selectedLocataireId!, 'send_mode', e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 mt-1 focus:ring-blue-500"
                          />
                          <label htmlFor={`auto_${selectedLocataireId}`} className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              Envoi automatique complet
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              La quittance est générée et envoyée automatiquement au locataire dès qu'un paiement correspondant est détecté. Vous recevez un email de confirmation.
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                          <div className="flex items-start">
                            <input
                              type="radio"
                              disabled
                              className="w-4 h-4 text-gray-400 border-gray-300 mt-1 cursor-not-allowed"
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-500">
                                Envoi automatique complet <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Bientôt disponible</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                Pour une identification bancaire 100% sécurisée l'envoi automatique complet sera disponible après votre validation du premier paiement du locataire.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start">
                        <input
                          type="radio"
                          id={`manual_${selectedLocataireId}`}
                          name={`send_mode_${selectedLocataireId}`}
                          value="manual_validation"
                          checked={selectedConfig.send_mode === 'manual_validation'}
                          onChange={(e) => updateConfig(selectedLocataireId!, 'send_mode', e.target.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 mt-1 focus:ring-blue-500"
                        />
                        <label htmlFor={`manual_${selectedLocataireId}`} className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Validation manuelle (recommandé)
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Vous recevez une notification par email + SMS quand un paiement est détecté. La quittance est générée mais vous devez valider l'envoi en un clic depuis votre mobile.
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">Sélectionnez un locataire pour le configurer</p>
                </div>
              )}
            </div>
          </div>
        )}

        {locataires.length > 0 && allConfigsComplete() && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
            >
              <span>Connecter ma banque</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDetectionSetup;
