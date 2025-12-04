import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, CreditCard, FileText, AlertCircle, CheckCircle, Settings, User, Bell, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    const email = searchParams.get('email') || localStorage.getItem('proprietaireEmail');

    if (!email) {
      navigate('/automation');
      return;
    }

    loadSubscriptionData(email);
  }, [searchParams, navigate]);

  const loadSubscriptionData = async (email: string) => {
    try {
      setLoading(true);

      // Récupérer les données du propriétaire
      const { data: propData, error: propError } = await supabase
        .from('proprietaires')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (propError || !propData) {
        console.error('Erreur récupération propriétaire:', propError);
        navigate('/automation');
        return;
      }

      setProprietaire(propData);

      // Récupérer le nombre de locataires
      const { data: locatairesData, error: locatairesError } = await supabase
        .from('locataires')
        .select('id')
        .eq('proprietaire_id', propData.id)
        .eq('actif', true);

      if (!locatairesError && locatairesData) {
        setNombreLocataires(locatairesData.length);
      }

      // Récupérer les factures
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

  const handleCancelSubscription = async () => {
    if (!proprietaire) return;

    setIsCancelling(true);

    try {
      // Mettre à jour le statut d'abonnement
      const { error } = await supabase
        .from('proprietaires')
        .update({
          abonnement_actif: false,
          plan_actuel: null
        })
        .eq('id', proprietaire.id);

      if (error) throw error;

      // Recharger les données
      await loadSubscriptionData(proprietaire.email);
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

  const calculatePlanPrice = (plan: string, tenants: number) => {
    if (plan === 'Quittance Automatique') {
      if (tenants === 0) return 0;
      if (tenants === 1) return 1;
      return 1 + (tenants - 1) * 0.7;
    } else if (plan === 'Quittance Connectée+' || plan === 'premium') {
      if (tenants === 0) return 0;
      if (tenants === 1) return 1.5;
      return 1.5 + (tenants - 1) * 1;
    }
    return 0;
  };

  const getPlanPriceBreakdown = (plan: string, tenants: number) => {
    if (tenants === 0) return [];

    if (plan === 'Quittance Automatique') {
      if (tenants === 1) return [{ label: '1er locataire', price: 1 }];
      const breakdown = [{ label: '1er locataire', price: 1 }];
      for (let i = 2; i <= tenants; i++) {
        breakdown.push({ label: `${i}e locataire`, price: 0.7 });
      }
      return breakdown;
    } else if (plan === 'Quittance Connectée+' || plan === 'premium') {
      if (tenants === 1) return [{ label: '1er locataire', price: 1.5 }];
      const breakdown = [{ label: '1er locataire', price: 1.5 }];
      for (let i = 2; i <= tenants; i++) {
        breakdown.push({ label: `${i}e locataire`, price: 1 });
      }
      return breakdown;
    }
    return [];
  };

  const getPlanDetails = (plan: string | undefined) => {
    if (!plan) return null;

    if (plan === 'Quittance Automatique') {
      return {
        name: 'Quittance Automatique',
        price: '1€/mois TTC',
        icon: Bell,
        color: '#ed7862',
        features: [
          'Rappels SMS + e-mail mensuels',
          'Génération automatique',
          'Envoi en 1 clic',
          'Historique des paiements'
        ]
      };
    } else if (plan === 'Quittance Connectée+' || plan === 'premium') {
      return {
        name: 'Quittance Connectée+',
        price: '1,50€/mois TTC',
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

    return null;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CAA89] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!proprietaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#545454]">Aucune donnée d'abonnement trouvée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header avec nom du plan */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#2b2b2b]">
            {planType === 'connectee_plus' ? 'Plan Quittance Connectée+' : 'Plan Automatique'}
          </h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-1 sticky top-24">
              <button
                onClick={() => navigate(`/dashboard?email=${proprietaire.email}`)}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-base text-gray-600 hover:bg-gray-50"
              >
                <Home className="w-5 h-5" />
                <span>Tableau de bord</span>
              </button>
              <button
                onClick={() => navigate(`/dashboard?email=${proprietaire.email}`)}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-base text-gray-600 hover:bg-gray-50"
              >
                <FileText className="w-5 h-5" />
                <span>Historique</span>
              </button>
              <button
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-base bg-[#7CAA89]/10 text-[#7CAA89] font-semibold"
              >
                <Settings className="w-5 h-5" />
                <span>Abonnement</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <div className="space-y-6">
              {/* Abonnement actuel */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${planDetails?.color}20` }}>
                    {planDetails && <PlanIcon className="w-6 h-6" style={{ color: planDetails.color }} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#2b2b2b]">Mon abonnement</h2>
                    <p className="text-sm text-gray-600">
                      {proprietaire.abonnement_actif ? 'Actif' : 'Inactif'}
                    </p>
                  </div>
                </div>

                {proprietaire.abonnement_actif && planDetails ? (
                  <div>
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-[#2b2b2b]">{planDetails.name}</h3>
                        <span className="text-2xl font-bold" style={{ color: planDetails.color }}>
                          {planDetails.price}
                        </span>
                      </div>

                      <ul className="space-y-3">
                        {planDetails.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tableau de calcul basé sur le nombre de locataires */}
                    {nombreLocataires > 0 && proprietaire.plan_actuel && (
                      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
                        <h4 className="font-bold text-[#2b2b2b] mb-4">Détail de votre abonnement</h4>
                        <div className="space-y-2 mb-4">
                          {getPlanPriceBreakdown(proprietaire.plan_actuel, nombreLocataires).map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-gray-600">
                              <span>{item.label}</span>
                              <span className="font-medium">{item.price.toFixed(2)}€ TTC</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t-2 border-gray-300 pt-4 flex items-center justify-between">
                          <span className="font-bold text-lg text-[#2b2b2b]">Total mensuel</span>
                          <span className="font-bold text-2xl" style={{ color: planDetails?.color }}>
                            {calculatePlanPrice(proprietaire.plan_actuel, nombreLocataires).toFixed(2)}€ TTC/mois
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-4 text-center">
                          Pour {nombreLocataires} locataire{nombreLocataires > 1 ? 's' : ''} actif{nombreLocataires > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    <div className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Annulation sans engagement</p>
                        <p>Vous pouvez annuler votre abonnement à tout moment. L'annulation prend effet immédiatement mais vous conservez l'accès jusqu'à la fin de votre période de facturation en cours.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-orange-900">
                          <p className="font-semibold mb-1">Pour changer d'abonnement</p>
                          <p>Annulez d'abord votre abonnement actuel, puis souscrivez à une nouvelle formule. Vos informations de paiement seront conservées si vous utilisez le même compte.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full py-3 rounded-xl border-2 border-red-500 text-red-600 font-semibold hover:bg-red-500 hover:text-white transition-all"
                      >
                        Annuler mon abonnement
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">Vous n'avez pas d'abonnement actif</p>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="px-8 py-3 rounded-xl bg-[#7CAA89] hover:bg-[#6a9579] text-white font-semibold transition-all"
                    >
                      Découvrir nos offres
                    </button>
                  </div>
                )}
              </div>

              {/* Factures */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-[#7CAA89]/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#7CAA89]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#2b2b2b]">Mes factures</h2>
                    <p className="text-sm text-gray-600">Historique de facturation</p>
                  </div>
                </div>

                {factures.length > 0 ? (
                  <div className="space-y-3">
                    {factures.map((facture) => (
                      <div
                        key={facture.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#7CAA89] transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#2b2b2b]">{facture.numero_facture}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(facture.date_emission).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#2b2b2b]">{facture.montant.toFixed(2)}€ TTC</p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              facture.statut === 'payee'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {facture.statut === 'payee' ? 'Payée' : 'En attente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune facture pour le moment</p>
                  </div>
                )}
              </div>

              {/* Informations du compte */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-[#7CAA89]/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-[#7CAA89]" />
                  </div>
                  <h3 className="font-bold text-[#2b2b2b]">Mon compte</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-[#2b2b2b]">{proprietaire.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nom</p>
                    <p className="font-semibold text-[#2b2b2b]">
                      {proprietaire.prenom} {proprietaire.nom}
                    </p>
                  </div>
                  {proprietaire.date_inscription && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Membre depuis</p>
                      <p className="font-semibold text-[#2b2b2b]">
                        {new Date(proprietaire.date_inscription).toLocaleDateString('fr-FR', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
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
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-8">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6 mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-[#2b2b2b] mb-4 text-center">
              Annuler mon abonnement ?
            </h2>

            <p className="text-gray-600 mb-6 text-center">
              Êtes-vous sûr de vouloir annuler votre abonnement ? Cette action est immédiate mais vous conserverez l'accès jusqu'à la fin de votre période de facturation.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? 'Annulation en cours...' : 'Oui, annuler mon abonnement'}
              </button>

              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 text-gray-600 font-semibold transition-all"
              >
                Non, conserver mon abonnement
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageSubscription;
