import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, AlertCircle, CheckCircle, RefreshCw, Unlink, ArrowLeft, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AlertModal } from '../components/AlertModal';

interface BankConnection {
  id: string;
  institution_name: string;
  status: string;
  created_at: string;
  account_id: string | null;
}

const BankSync = () => {
  const [searchParams] = useSearchParams();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [success, setSuccess] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [waitingForCallback, setWaitingForCallback] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadConnections();

    const itemId = searchParams.get('item_id');
    const bankId = searchParams.get('bank_id');
    const bankName = searchParams.get('bank_name');

    if (itemId) {
      console.log('Bridge callback detected:', { itemId, bankId, bankName });
      handleBridgeCallback(itemId, bankId, bankName);
    }
  }, [searchParams]);

  const loadConnections = async (sync = false) => {
    try {
      if (sync) {
        setSyncing(true);
        console.log('Starting sync...');
      } else {
        setLoading(true);
        console.log('Loading connections...');
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        setError('Veuillez vous connecter pour accéder à cette page');
        setShowErrorModal(true);
        setLoading(false);
        setSyncing(false);
        return;
      }

      console.log('Session found, user:', session.user.id);

      const apiUrl = sync
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bridge-connect?action=sync`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bridge-connect`;

      console.log('Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error(`Échec de la récupération des connexions: ${errorText}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      setConnections(data.connections || []);

      if (sync) {
        if (data.connections && data.connections.length > 0) {
          setSuccess('Connexion bancaire synchronisée avec succès !');
          setShowSuccessModal(true);
        } else {
          setSuccess('Synchronisation effectuée. Aucune connexion bancaire trouvée. Connectez votre banque pour commencer.');
        }
        setTimeout(() => setSuccess(''), 8000);
      }
    } catch (err) {
      console.error('Error loading connections:', err);
      setError('Impossible de charger les connexions bancaires');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleBridgeCallback = async (itemId: string, bankId: string | null, bankName: string | null) => {
    try {
      console.log('handleBridgeCallback called with:', { itemId, bankId, bankName });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session in callback');
        return;
      }

      console.log('Sending PUT request to save connection...');
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bridge-connect`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: itemId,
          bank_id: bankId,
          bank_name: bankName,
        }),
      });

      console.log('PUT response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PUT error:', errorText);
        setError(`Erreur lors de la sauvegarde: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log('PUT response:', result);

      const tenantConfigsStr = localStorage.getItem('tenantDetectionConfigs');
      if (tenantConfigsStr && result.connection_id) {
        try {
          const configs = JSON.parse(tenantConfigsStr);
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
          console.log('Payment rules created automatically');
        } catch (configError) {
          console.error('Error creating payment rules:', configError);
        }
      }

      setSuccess('Banque connectée avec succès ! Les règles de détection ont été configurées automatiquement.');
      setShowSuccessModal(true);
      await loadConnections();
      window.history.replaceState({}, '', '/bank-sync');
    } catch (err) {
      console.error('Error handling callback:', err);
      setError('Erreur lors de la connexion à la banque');
      setShowErrorModal(true);
    }
  };

  const connectBank = async () => {
    try {
      setConnecting(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Veuillez vous connecter');
        setShowErrorModal(true);
        return;
      }

      const redirectUrl = `${window.location.origin}/bank-sync`;
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bridge-connect`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la connexion');
      }

      const data = await response.json();

      console.log('Bridge Connect URL:', data.connect_url);

      if (!data.connect_url) {
        throw new Error('URL de connexion non reçue de Bridge');
      }

      setWaitingForCallback(true);
      setSuccess('Fenêtre Bridge ouverte. Connectez votre banque puis revenez sur cette page.');
      setShowSuccessModal(true);
      window.open(data.connect_url, '_blank');
    } catch (err) {
      console.error('Error connecting bank:', err);
      setError('Impossible de se connecter à la banque. Veuillez réessayer.');
      setShowErrorModal(true);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectBank = async (connectionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter cette banque ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bank_connections')
        .update({ status: 'revoked' })
        .eq('id', connectionId);

      if (error) throw error;

      await loadConnections();
    } catch (err) {
      console.error('Error disconnecting bank:', err);
      setError('Impossible de déconnecter la banque');
      setShowErrorModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          to="/automation-setup"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour à la configuration
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Synchronisation bancaire
          </h1>
          <p className="text-gray-600">
            Connectez votre compte bancaire pour la vérification automatique des paiements
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}


        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Connexion 100% sécurisée
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Connexion via Bridge API - Agrégateur agréé PSD2</li>
            <li>• Vos identifiants bancaires ne transitent jamais par nos serveurs</li>
            <li>• Connexion chiffrée de bout en bout</li>
            <li>• Vous pouvez révoquer l'accès à tout moment</li>
            <li>• Plus de 400 banques européennes supportées</li>
          </ul>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : (
          <>
            {connections.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Mes connexions bancaires
                </h2>
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Building2 className="w-10 h-10 text-blue-600 mr-4" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {connection.institution_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {connection.status === 'active' ? (
                              <span className="text-green-600 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Connecté
                              </span>
                            ) : connection.status === 'pending' ? (
                              <span className="text-yellow-600 flex items-center">
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Synchronisation en cours...
                              </span>
                            ) : (
                              <span className="text-gray-500">Déconnecté</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {(connection.status === 'active' || connection.status === 'pending') && (
                          <>
                            <Link
                              to={`/payment-rules?connection_id=${connection.id}`}
                              className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Configurer
                            </Link>
                            <button
                              onClick={() => disconnectBank(connection.id)}
                              className="flex items-center text-sm text-red-600 hover:text-red-700"
                            >
                              <Unlink className="w-4 h-4 mr-1" />
                              Déconnecter
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Connecter une banque
              </h2>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-6">
                  En un clic, connectez votre banque de manière 100% sécurisée. Bridge vous permettra de choisir parmi plus de 400 banques européennes.
                </p>

                {/* Test sync button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Manual sync clicked');
                      await loadConnections(true);
                    }}
                    disabled={syncing}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Synchronisation en cours...' : 'Tester la synchronisation'}
                  </button>
                </div>

                {waitingForCallback && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-3">
                      <strong>En attente de votre connexion...</strong>
                      <br />
                      Terminez la connexion dans la fenêtre Bridge qui s'est ouverte, puis cliquez sur le bouton ci-dessous.
                    </p>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        setWaitingForCallback(false);
                        await loadConnections(true);
                      }}
                      disabled={syncing}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Synchronisation...' : 'J\'ai terminé - Rafraîchir'}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={connectBank}
                  disabled={connecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-5 h-5 mr-2" />
                      Connecter ma banque
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Plus de 400 banques disponibles !</strong> BNP Paribas, Crédit Agricole, Société Générale, Boursorama, N26, Revolut, et bien d'autres.
                </p>
              </div>
            </div>
          </>
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

export default BankSync;
