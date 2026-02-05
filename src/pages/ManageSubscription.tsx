import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, CreditCard, FileText, AlertCircle, CheckCircle, Settings, User, Bell, RefreshCw, X, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  abonnement_actif: boolean;
  plan_actuel?: string;
  date_inscription?: string;
  stripe_customer_id?: string;
}

interface Facture {
  id: string;
  proprietaire_id: string;
  montant: number;
  statut: string;
  date_emission: string;
  date_echeance: string;
  numero_facture: string;
  pdf_url?: string;
}

const ManageSubscription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [nombreLocataires, setNombreLocataires] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const pollingStarted = useRef(false);

  useEffect(() => {
    const email = searchParams.get('email') || localStorage.getItem('proprietaireEmail');
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (!email) {
      navigate('/automation');
      return;
    }

    const loadData = async (emailParam: string) => {
      try {
        setLoading(true);

        const { data: propData, error: propError } = await supabase
          .from('proprietaires')
          .select('*')
          .eq('email', emailParam)
          .maybeSingle();

        if (propError || !propData) {
          console.error('Erreur récupération propriétaire:', propError);
          navigate('/automation');
          return;
        }

        setProprietaire(propData);

        const { data: locatairesData, error: locatairesError } = await supabase
          .from('locataires')
          .select('id')
          .eq('proprietaire_id', propData.id)
          .eq('actif', true);

        if (!locatairesError && locatairesData) {
          setNombreLocataires(locatairesData.length);
        }

        const { data: facturesData, error: facturesError } = await supabase
          .from('factures')
          .select('*')
          .eq('proprietaire_id', propData.id)
          .order('date_emission', { ascending: false });

        if (!facturesError && facturesData) {
          setFactures(facturesData);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    if (success === 'true' && sessionId && !pollingStarted.current) {
      pollingStarted.current = true;
      setShowSuccessMessage(true);
      setIsRefreshing(true);

      loadData(email);

      let attempts = 0;
      const maxAttempts = 15;

      const pollForUpdates = setInterval(async () => {
        attempts++;
        console.log(`Polling for updates, attempt ${attempts}/${maxAttempts}`);
        await loadData(email);

        if (attempts >= maxAttempts) {
          clearInterval(pollForUpdates);
          setIsRefreshing(false);
          setShowSuccessMessage(false);
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollForUpdates);
        setIsRefreshing(false);
        setShowSuccessMessage(false);
      }, 30000);

      return () => clearInterval(pollForUpdates);
    } else {
      loadData(email);
    }
  }, [searchParams, navigate]);

  const handleCancelSubscription = async () => {
    if (!proprietaire) return;

    setIsCancelling(true);

    try {
      const { error } = await supabase
        .from('proprietaires')
        .update({
          abonnement_actif: false,
          plan_actuel: null
        })
        .eq('id', proprietaire.id);

      if (error) throw error;

      setProprietaire({ ...proprietaire, abonnement_actif: false, plan_actuel: undefined });
      setShowCancelModal(false);

      // Afficher une notification de succès
      alert('Votre abonnement a été annulé avec succès. Vous pouvez continuer à utiliser le service jusqu\'à la fin de votre période de facturation.');
    } catch (error) {
      console.error('Erreur annulation:', error);
      alert('Une erreur est survenue lors de l\'annulation. Veuillez réessayer ou nous contacter.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadInvoice = async (facture: Facture) => {
    try {
      if (facture.pdf_url) {
        window.open(facture.pdf_url, '_blank');
      } else {
        alert('Le PDF de cette facture n\'est pas encore disponible.');
      }
    } catch (error) {
      console.error('Erreur téléchargement facture:', error);
      alert('Erreur lors du téléchargement de la facture. Veuillez réessayer.');
    }
  };

  const calculatePlanPrice = (plan: string, tenants: number) => {
    if (tenants === 0) return 0;
    if (tenants >= 1 && tenants <= 2) {
      return 0.99;
    } else if (tenants >= 3 && tenants <= 4) {
      return 1.49;
    } else if (tenants >= 5 && tenants <= 8) {
      return 2.49;
    } else {
      return 2.49;
    }
  };

  const getPlanPriceBreakdown = (plan: string, tenants: number) => {
    if (tenants === 0) return [];

    if (tenants >= 1 && tenants <= 2) {
      return [{ label: `${tenants} logement${tenants > 1 ? 's' : ''}`, price: 0.99 }];
    } else if (tenants >= 3 && tenants <= 4) {
      return [{ label: `${tenants} logements`, price: 1.49 }];
    } else if (tenants >= 5 && tenants <= 8) {
      return [{ label: `${tenants} logements`, price: 2.49 }];
    } else {
      return [{ label: `${tenants} logements`, price: 2.49 }];
    }
  };

  const getPlanDetails = (plan: string | undefined) => {
    if (!plan) {
      return {
        name: 'Mode Tranquillité',
        price: '0,99€ à 2,49€/mois TTC',
        icon: Bell,
        color: '#ed7862',
        features: [
          'Rappels SMS + e-mail mensuels',
          'Génération automatique',
          'Envoi en 1 clic',
          'Historique des paiements'
        ]
      };
    }

    const planLower = plan.toLowerCase();

    if (planLower.includes('connectée') || planLower.includes('connecte') || planLower.includes('premium') || planLower.includes('bank') || planLower.includes('plus')) {
      return {
        name: 'Quittance Connectée+',
        price: '0,99€ à 2,49€/mois TTC',
        icon: RefreshCw,
        color: '#2D3436',
        features: [
          'Synchronisation bancaire (PSD2)',
          'Détection automatique du paiement',
          'Envoi automatique',
          'Suivi temps réel'
        ]
      };
    }

    return {
      name: 'Mode Tranquillité',
      price: '0,99€ à 2,49€/mois TTC',
      icon: Bell,
      color: '#ed7862',
      features: [
        'Rappels SMS + e-mail mensuels',
        'Génération automatique',
        'Envoi en 1 clic',
        'Historique des paiements'
      ]
    };
  };

  const planDetails = getPlanDetails(proprietaire?.plan_actuel);
  const PlanIcon = planDetails?.icon || Bell;
  const planType = (proprietaire?.plan_actuel === 'Quittance Connectée+' || proprietaire?.plan_actuel === 'premium')
    ? 'connectee_plus'
    : 'automatique';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CAA89] mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!proprietaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-base text-black">Aucune donnée d'abonnement trouvée.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Header avec nom du plan */}
        <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6">
          <h1 className="text-lg font-bold text-black">
            {planType === 'connectee_plus' ? 'Plan Quittance Connectée+' : 'Plan Automatique'}
          </h1>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
            <div className="flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-green-900 mb-0.5">
                Paiement réussi !
              </h3>
              <p className="text-xs text-green-700">
                Votre abonnement a été activé avec succès. Nous mettons à jour vos informations...
              </p>
              {isRefreshing && (
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <RefreshCw className="w-3 h-3 text-green-600 animate-spin" />
                  <span className="text-[10px] text-green-600">Actualisation en cours</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-5">
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 space-y-0.5 sticky top-24">
              <button
                onClick={() => navigate(`/dashboard?email=${proprietaire.email}`)}
                className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg transition-colors text-sm text-black hover:bg-gray-50"
              >
                <Home className="w-4 h-4" />
                <span>Tableau de bord</span>
              </button>
              <button
                onClick={() => navigate(`/historique?email=${proprietaire.email}`)}
                className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg transition-colors text-sm text-black hover:bg-gray-50"
              >
                <FileText className="w-4 h-4" />
                <span>Historique</span>
              </button>
              <button
                onClick={() => navigate(`/billing?email=${proprietaire.email}`)}
                className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg transition-colors text-sm text-black hover:bg-gray-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>Facturation</span>
              </button>
              <button
                className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg transition-colors text-sm bg-[#7CAA89]/10 text-[#7CAA89] font-semibold"
              >
                <Settings className="w-4 h-4" />
                <span>Abonnement</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <div className="space-y-4">
              {/* Informations du compte */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-[#7CAA89]/10 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-[#7CAA89]" />
                  </div>
                  <h3 className="text-base font-bold text-black">Mon compte</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-black mb-0.5">Email</p>
                    <p className="font-semibold text-sm text-black">{proprietaire.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black mb-0.5">Nom</p>
                    <p className="font-semibold text-sm text-black">
                      {proprietaire.prenom} {proprietaire.nom}
                    </p>
                  </div>
                  {proprietaire.date_inscription && (
                    <div>
                      <p className="text-xs text-black mb-0.5">Membre depuis</p>
                      <p className="font-semibold text-sm text-black">
                        {new Date(proprietaire.date_inscription).toLocaleDateString('fr-FR', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Abonnement actuel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${planDetails?.color}20` }}>
                    <PlanIcon className="w-5 h-5" style={{ color: planDetails.color }} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-black">Mon abonnement</h2>
                    <p className={`text-xs font-semibold ${proprietaire.abonnement_actif ? 'text-green-600' : 'text-gray-500'}`}>
                      {proprietaire.abonnement_actif ? 'Actif' : 'Inactif'}
                    </p>
                  </div>
                </div>

                {proprietaire.abonnement_actif ? (
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-black">{planDetails.name}</h3>
                      </div>

                      <ul className="space-y-2">
                        {planDetails.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-black">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tableau de calcul basé sur le nombre de locataires */}
                    {nombreLocataires > 0 && proprietaire.plan_actuel && (
                      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4">
                        <h4 className="font-bold text-sm text-black mb-3">Détail de votre abonnement</h4>
                        <div className="space-y-1.5 mb-3">
                          {getPlanPriceBreakdown(proprietaire.plan_actuel, nombreLocataires).map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-xs text-black">
                              <span>{item.label}</span>
                              <span className="font-medium">{item.price.toFixed(2)}€ TTC</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t-2 border-gray-300 pt-3 flex items-center justify-between">
                          <span className="font-bold text-sm text-black">Total mensuel</span>
                          <span className="font-bold text-lg text-black">
                            {calculatePlanPrice(proprietaire.plan_actuel, nombreLocataires).toFixed(2)}€ TTC/mois
                          </span>
                        </div>
                        <p className="text-xs text-black mt-3 text-center">
                          Pour {nombreLocataires} logement{nombreLocataires > 1 ? 's' : ''} actif{nombreLocataires > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    <div className="flex items-start space-x-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-black">
                        <p className="font-semibold mb-0.5">Annulation sans engagement</p>
                        <p>Vous pouvez annuler votre abonnement à tout moment. L'annulation prend effet immédiatement mais vous conservez l'accès jusqu'à la fin de votre période de facturation en cours.</p>
                      </div>
                    </div>

                    {/* Factures */}
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-[#7CAA89]/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-[#7CAA89]" />
                        </div>
                        <h3 className="text-base font-bold text-black">Mes factures</h3>
                      </div>

                      {factures.length > 0 ? (
                        <div className="space-y-2">
                          {factures.map((facture) => (
                            <div
                              key={facture.id}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#7CAA89] transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-black">{facture.numero_facture}</p>
                                  <p className="text-xs text-black">
                                    {new Date(facture.date_emission).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <p className="font-bold text-sm text-black">{facture.montant.toFixed(2)}€ TTC</p>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                      facture.statut === 'payee'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {facture.statut === 'payee' ? 'Payée' : 'En attente'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDownloadInvoice(facture)}
                                  className="p-1.5 rounded-lg bg-[#7CAA89] hover:bg-[#6a9579] text-white transition-colors"
                                  title="Télécharger la facture"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-black">
                          <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">Aucune facture pour le moment</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-5 py-1.5 rounded-full border-2 border-red-500 text-sm text-red-600 font-semibold hover:bg-red-500 hover:text-white transition-all"
                    >
                      Annuler mon abonnement
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-black">Aucun abonnement actif</h3>
                      </div>
                      <p className="text-xs text-black mb-3">
                        Vous n'avez pas encore souscrit à un abonnement. Retournez sur le tableau de bord et découvrez nos formules pour automatiser vos quittances de loyer et gagner du temps.
                      </p>
                    </div>

                   
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modal d'annulation */}
      {showCancelModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 p-5">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>

            <h2 className="text-lg font-bold text-black mb-3 text-center">
              Annuler mon abonnement ?
            </h2>

            <p className="text-sm text-black mb-4 text-center">
              Êtes-vous sûr de vouloir annuler votre abonnement ? Cette action est immédiate mais vous conserverez l'accès jusqu'à la fin de votre période de facturation.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? 'Annulation en cours...' : 'Oui, annuler mon abonnement'}
              </button>

              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 text-black text-sm font-semibold transition-all"
              >
                Non, conserver mon abonnement
              </button>
            </div>
          </div>
        </>
      )}
      </div>
      <Footer />
    </>
  );
};

export default ManageSubscription;
