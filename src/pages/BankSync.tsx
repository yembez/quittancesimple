import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, AlertCircle, CheckCircle, RefreshCw, Unlink, ArrowLeft, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AlertModal } from '../components/AlertModal';
import { bankAggregationService } from '../services/bankAggregation';

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
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (code && state) {
        setConnecting(true);
        console.log('========================================');
        console.log('🎯 Powens redirect callback détecté');
        console.log('📝 Code reçu:', code.substring(0, 20) + '...');
        console.log('👤 State (userId):', state);
        console.log('========================================');

        try {
          const { data: { session } } = await supabase.auth.getSession();
          console.log('👤 Session:', session ? `Présente (user: ${session.user.id})` : 'Absente');

          if (!session) {
            console.error('❌ Aucune session trouvée');
            setError('Vous devez être connecté pour finaliser la connexion bancaire');
            setShowErrorModal(true);
            setConnecting(false);
            return;
          }

          console.log('⏳ Échange du code Powens pour un token permanent...');
          setSuccess('Connexion en cours de traitement...');

          // Log dans la table pour persistence
          await supabase.from('powens_callback_logs').insert({
            event_type: 'callback_received',
            user_id: session.user.id,
            request_url: window.location.href,
            query_params: { code: code.substring(0, 20), state }
          });

          // Exchange the code for a permanent token and save connection
          const result = await bankAggregationService.exchangePublicToken(code, session.user.id);
          console.log('✅ Connexion créée:', result);

          // Log le résultat
          await supabase.from('powens_callback_logs').insert({
            event_type: 'exchange_success',
            user_id: session.user.id,
            response_body: result
          });

          const newConnection = {
            id: result.connection_id,
            institution_name: result.institution_name,
            account_id: result.account_id,
          };

          // Créer les règles de paiement si nécessaire
          const tenantConfigsStr = localStorage.getItem('tenantDetectionConfigs');
          if (tenantConfigsStr && newConnection.id) {
            try {
              const configs = JSON.parse(tenantConfigsStr);
              const rulesPromises = Object.values(configs).map(async (config: any) => {
                return supabase
                  .from('rent_payment_rules')
                  .insert({
                    user_id: session.user.id,
                    bank_connection_id: newConnection.id,
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
              console.log('✅ Règles de paiement créées automatiquement');
            } catch (configError) {
              console.error('Erreur lors de la création des règles:', configError);
            }
          }

          setSuccess(`Banque ${newConnection.institution_name} connectée avec succès !`);
          setShowSuccessModal(true);

          // TEMPORAIRE: Redirection désactivée pour debug
          // setTimeout(() => {
          //   window.location.href = '/dashboard';
          // }, 2000);

          console.log('✅ Connexion terminée, pas de redirection pour debug');
          window.history.replaceState({}, '', '/bank-sync');
        } catch (err: any) {
          console.error('Erreur dans le callback Powens:', err);

          // Log l'erreur
          try {
            await supabase.from('powens_callback_logs').insert({
              event_type: 'exchange_error',
              user_id: state || null,
              error_message: err.message,
              request_body: { stack: err.stack, code: code?.substring(0, 20) }
            });
          } catch (logErr) {
            console.error('Impossible de logger l\'erreur:', logErr);
          }

          setError(`Erreur lors de la connexion à la banque: ${err.message || 'Erreur inconnue'}`);
          setShowErrorModal(true);
          window.history.replaceState({}, '', '/bank-sync');
        } finally {
          setConnecting(false);
        }
      } else {
        // Pas de paramètres, charger les connexions
        await loadConnections();
      }
    };

    initializePage();
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

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/powens-connect/connections`;

      console.log('Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec du chargement des connexions');
      }

      const data = await response.json();
      console.log('API response:', data);

      setConnections(data.connections || []);
      setError('');
    } catch (err: any) {
      console.error('Error loading connections:', err);
      setError(err.message || 'Erreur lors du chargement des connexions');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleConnectBank = async () => {
    try {
      setConnecting(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Veuillez vous connecter pour continuer');
        setShowErrorModal(true);
        setConnecting(false);
        return;
      }

      const result = await bankAggregationService.createLinkToken(session.user.id);
      window.location.href = result.link_token;
    } catch (err: any) {
      console.error('Error connecting bank:', err);
      setError(err.message || 'Erreur lors de la connexion à la banque');
      setShowErrorModal(true);
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncConnection = async (connectionId: string) => {
    try {
      setSyncing(true);
      await bankAggregationService.syncTransactions(connectionId);
      setSuccess('Synchronisation réussie');
      setShowSuccessModal(true);
      await loadConnections(true);
    } catch (err: any) {
      console.error('Error syncing:', err);
      setError(err.message || 'Erreur lors de la synchronisation');
      setShowErrorModal(true);
    } finally {
      setSyncing(false);
    }
  };

  const handleRevokeConnection = async (connectionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette connexion ?')) {
      return;
    }

    try {
      await bankAggregationService.revokeConnection(connectionId);
      setSuccess('Connexion révoquée');
      setShowSuccessModal(true);
      await loadConnections();
    } catch (err: any) {
      console.error('Error revoking:', err);
      setError(err.message || 'Erreur lors de la révocation');
      setShowErrorModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Building2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Connexions bancaires</h1>
                <p className="text-gray-600">Gérez vos connexions bancaires</p>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Mes connexions</h2>
            <button
              onClick={handleConnectBank}
              disabled={connecting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              {connecting ? 'Connexion...' : 'Connecter une banque'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-gray-600">Chargement des connexions...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Aucune connexion bancaire configurée</p>
              <button
                onClick={handleConnectBank}
                disabled={connecting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Connecter ma première banque
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{connection.institution_name}</h3>
                        <p className="text-sm text-gray-600">
                          Connectée le {new Date(connection.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSyncConnection(connection.id)}
                        disabled={syncing}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                        title="Synchroniser"
                      >
                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRevokeConnection(connection.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Révoquer"
                      >
                        <Unlink className="h-4 w-4" />
                      </button>
                      <Link
                        to="/payment-rules"
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="Configurer les règles"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Erreur"
        message={error}
        type="error"
      />

      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Succès"
        message={success}
        type="success"
      />
    </div>
  );
};

export default BankSync;