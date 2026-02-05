import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle, User, CreditCard, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AlertModal } from '../components/AlertModal';

interface BankConnection {
  id: string;
  institution_name: string;
  status: string;
}

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

interface PaymentRule {
  id?: string;
  bank_connection_id: string;
  locataire_id: string;
  expected_amount: string;
  sender_iban: string;
  sender_name: string;
  description_contains: string;
  tolerance_amount: string;
  auto_generate_receipt: boolean;
  send_mode: 'auto' | 'manual_validation';
  verification_day_start?: string;
  verification_day_end?: string;
}

const PaymentRules = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connection_id');
  const urlLocataireId = searchParams.get('locataire_id');

  const [connection, setConnection] = useState<BankConnection | null>(null);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [rules, setRules] = useState<Record<string, PaymentRule>>({});
  const [selectedLocataireId, setSelectedLocataireId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState<PaymentRule>({
    bank_connection_id: connectionId || '',
    locataire_id: '',
    expected_amount: '',
    sender_iban: '',
    sender_name: '',
    description_contains: '',
    tolerance_amount: '5.00',
    auto_generate_receipt: true,
    send_mode: 'manual_validation',
    verification_day_start: '1',
    verification_day_end: '10',
  });

  useEffect(() => {
    loadData();
  }, [connectionId]);

  useEffect(() => {
    if (selectedLocataireId) {
      const locataire = locataires.find(l => l.id === selectedLocataireId);
      const existingRule = rules[selectedLocataireId];

      if (existingRule) {
        setFormData(existingRule);
      } else if (locataire) {
        const savedConfigsJson = localStorage.getItem('tenantDetectionConfigs');
        let savedConfig = null;

        if (savedConfigsJson) {
          try {
            const savedConfigs = JSON.parse(savedConfigsJson);
            savedConfig = savedConfigs[selectedLocataireId];
          } catch (e) {
            console.error('Error parsing saved configs:', e);
          }
        }

        const totalAmount = (locataire.loyer_mensuel + locataire.charges_mensuelles).toFixed(2);
        setFormData({
          bank_connection_id: connectionId || '',
          locataire_id: selectedLocataireId,
          expected_amount: savedConfig?.expected_amount || totalAmount,
          sender_iban: savedConfig?.sender_iban || locataire.iban || '',
          sender_name: savedConfig?.sender_name || `${locataire.nom.toUpperCase()} ${locataire.prenom}`,
          description_contains: savedConfig?.description_contains || '',
          tolerance_amount: savedConfig?.tolerance_amount || '5.00',
          auto_generate_receipt: true,
          send_mode: savedConfig?.send_mode || 'manual_validation',
          verification_day_start: savedConfig?.verification_day_start || '1',
          verification_day_end: savedConfig?.verification_day_end || '10',
        });
      }
    }
  }, [selectedLocataireId, locataires, rules]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (!connectionId) {
        setError('ID de connexion manquant');
        setShowErrorModal(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Veuillez vous connecter');
        setShowErrorModal(true);
        return;
      }

      const { data: connData, error: connError } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', session.user.id)
        .single();

      if (connError || !connData) {
        setError('Connexion bancaire introuvable');
        setShowErrorModal(true);
        return;
      }

      setConnection(connData);

      const { data: propData } = await supabase
        .from('proprietaires')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!propData) {
        setError('Profil propriétaire introuvable');
        return;
      }

      const { data: locatairesData, error: locatairesError } = await supabase
        .from('locataires')
        .select('*')
        .eq('proprietaire_id', propData.id)
        .order('nom');

      if (locatairesError) {
        throw locatairesError;
      }

      setLocataires(locatairesData || []);

      const { data: rulesData, error: rulesError } = await supabase
        .from('rent_payment_rules')
        .select('*')
        .eq('bank_connection_id', connectionId)
        .eq('user_id', session.user.id);

      if (rulesError) {
        console.error('Error loading rules:', rulesError);
      }

      const rulesMap: Record<string, PaymentRule> = {};
      if (rulesData) {
        rulesData.forEach((rule: any) => {
          if (rule.locataire_id) {
            rulesMap[rule.locataire_id] = {
              id: rule.id,
              bank_connection_id: rule.bank_connection_id,
              locataire_id: rule.locataire_id,
              expected_amount: rule.expected_amount.toString(),
              sender_iban: rule.sender_iban || '',
              sender_name: rule.sender_name || '',
              description_contains: rule.description_contains || '',
              tolerance_amount: rule.tolerance_amount?.toString() || '5.00',
              auto_generate_receipt: rule.auto_generate_receipt,
              send_mode: rule.send_mode || 'manual_validation',
            };
          }
        });
      }
      setRules(rulesMap);

      if (locatairesData && locatairesData.length > 0 && !selectedLocataireId) {
        if (urlLocataireId && locatairesData.find(l => l.id === urlLocataireId)) {
          setSelectedLocataireId(urlLocataireId);
        } else {
          setSelectedLocataireId(locatairesData[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading:', err);
      setError('Erreur lors du chargement');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Veuillez vous connecter');
        setShowErrorModal(true);
        return;
      }

      if (!formData.locataire_id) {
        setError('Veuillez sélectionner un locataire');
        setShowErrorModal(true);
        return;
      }

      if (!formData.expected_amount || parseFloat(formData.expected_amount) <= 0) {
        setError('Veuillez saisir un montant de loyer valide');
        setShowErrorModal(true);
        return;
      }

      // Enrichir automatiquement les mots-clés si nécessaire
      let enrichedDescription = formData.description_contains || '';

      // Si pas déjà enrichi, ajouter tous les mots-clés pertinents
      if (!enrichedDescription || enrichedDescription === 'Loyer' || enrichedDescription.split(',').length < 10) {
        const commonKeywords = [
          'loyer', 'location', 'appartement', 'appart', 'logement',
          'virement', 'paiement', 'rent', 'housing', 'lease'
        ];

        const months = [
          'janvier', 'jan', 'février', 'fev', 'fevrier', 'mars', 'mar',
          'avril', 'avr', 'mai', 'juin', 'juillet', 'juil', 'août', 'aout',
          'septembre', 'sept', 'octobre', 'oct', 'novembre', 'nov', 'décembre', 'dec'
        ];

        enrichedDescription = [...commonKeywords, ...months].join(',');
      }

      const ruleData = {
        user_id: session.user.id,
        bank_connection_id: formData.bank_connection_id,
        locataire_id: formData.locataire_id,
        expected_amount: parseFloat(formData.expected_amount),
        sender_iban: formData.sender_iban || null,
        sender_name: formData.sender_name || null,
        description_contains: enrichedDescription || null,
        tolerance_amount: parseFloat(formData.tolerance_amount),
        auto_generate_receipt: formData.auto_generate_receipt,
        send_mode: formData.send_mode,
        verification_day_start: formData.verification_day_start ? parseInt(formData.verification_day_start) : 1,
        verification_day_end: formData.verification_day_end ? parseInt(formData.verification_day_end) : 10,
        updated_at: new Date().toISOString(),
      };

      if (formData.id) {
        const { error: updateError } = await supabase
          .from('rent_payment_rules')
          .update(ruleData)
          .eq('id', formData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('rent_payment_rules')
          .insert(ruleData);

        if (insertError) throw insertError;
      }

      setSuccess('Règle de détection sauvegardée avec succès !');
      setShowSuccessModal(true);
      await loadData();

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error saving rule:', err);
      setError('Erreur lors de la sauvegarde');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link
          to="/bank-sync"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour aux connexions bancaires
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuration de la détection automatique
          </h1>
          {connection && (
            <p className="text-gray-600">
              Banque : <strong>{connection.institution_name}</strong>
            </p>
          )}
        </div>


        {locataires.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun locataire trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Vous devez d'abord ajouter des locataires avant de configurer les règles de détection.
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
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Sélectionnez un locataire
                </h3>
                <div className="space-y-2">
                  {locataires.map((locataire) => {
                    const hasRule = !!rules[locataire.id];
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
                          {hasRule ? (
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
                        <p className="text-xs text-gray-500 mt-1">
                          {hasRule ? (
                            <span className="text-gray-600">✓ Règle configurée</span>
                          ) : (
                            <span className="text-[#FFD76F]">⚠ Non configuré</span>
                          )}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="lg:col-span-2">
              {selectedLocataireId ? (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Configuration pour : {locataires.find(l => l.id === selectedLocataireId)?.nom} {locataires.find(l => l.id === selectedLocataireId)?.prenom}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Configurez les critères de détection des paiements pour ce locataire
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant du loyer attendu (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.expected_amount}
                      onChange={(e) => setFormData({ ...formData, expected_amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 850.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Le montant exact que vous attendez du locataire chaque mois (loyer + charges)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tolérance de montant (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tolerance_amount}
                      onChange={(e) => setFormData({ ...formData, tolerance_amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 5.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepter un écart de +/- ce montant (utile si le locataire paie les frais bancaires)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant de la caution initiale (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={locataires.find(l => l.id === selectedLocataireId)?.caution_initiale || ''}
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
                      value={formData.sender_name}
                      onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: DUPONT Jean"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Le nom tel qu'il apparaît sur les virements bancaires (optionnel, mais utile)
                    </p>
                  </div>

                  {/* Champ masqué - Les mots-clés sont ajoutés automatiquement */}
                  <div className="hidden">
                    <input
                      type="text"
                      value={formData.description_contains}
                      onChange={(e) => setFormData({ ...formData, description_contains: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <CreditCard className="w-4 h-4 mr-1" />
                      IBAN du locataire (facultatif)
                    </label>
                    <input
                      type="text"
                      value={formData.sender_iban}
                      onChange={(e) => setFormData({ ...formData, sender_iban: e.target.value.toUpperCase() })}
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
                      {locataires.find(l => l.id === selectedLocataireId)?.iban_verified ? (
                        <div className="flex items-start">
                          <input
                            type="radio"
                            id="auto_mode"
                            name="send_mode"
                            value="auto"
                            checked={formData.send_mode === 'auto'}
                            onChange={(e) => setFormData({ ...formData, send_mode: e.target.value as 'auto' | 'manual_validation' })}
                            className="w-4 h-4 text-blue-600 border-gray-300 mt-1 focus:ring-blue-500"
                          />
                          <label htmlFor="auto_mode" className="ml-3 flex-1">
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
                          id="manual_mode"
                          name="send_mode"
                          value="manual_validation"
                          checked={formData.send_mode === 'manual_validation'}
                          onChange={(e) => setFormData({ ...formData, send_mode: e.target.value as 'auto' | 'manual_validation' })}
                          className="w-4 h-4 text-blue-600 border-gray-300 mt-1 focus:ring-blue-500"
                        />
                        <label htmlFor="manual_mode" className="ml-3 flex-1">
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

                  <div className="border-t border-gray-200 pt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center"
                    >
                      {saving ? (
                        <>Enregistrement...</>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          {formData.id ? 'Mettre à jour' : 'Enregistrer'} la règle de détection
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">Sélectionnez un locataire pour configurer sa règle de détection</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Erreur"
        messages={[error]}
      />

      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Succès"
        messages={[success]}
      />
    </div>
  );
};

export default PaymentRules;
