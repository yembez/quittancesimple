import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, User, Bell, RefreshCw, X, Clock, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import QuickPaymentModal from '../components/QuickPaymentModal';

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  abonnement_actif: boolean;
  plan_actuel?: string;
  date_inscription?: string;
  date_fin_essai?: string;
  stripe_customer_id?: string;
}


const ManageSubscription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { proprietaire: contextProprietaire, refetchProprietaire } = useEspaceBailleur();
  const proprietaire = contextProprietaire as Proprietaire | null;
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [nombreLocataires, setNombreLocataires] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastPaymentDebug, setLastPaymentDebug] = useState<Record<string, unknown> | null>(null);
  const pollingStarted = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastQuickPaymentDebug');
      if (raw) {
        const data = JSON.parse(raw);
        setLastPaymentDebug(data);
        console.log('[ManageSubscription] Dernier envoi quick-checkout:', data);
        console.log('[ManageSubscription] stripePriceId envoyé:', data.stripePriceId);
      } else {
        setLastPaymentDebug(null);
      }
    } catch (_) {
      setLastPaymentDebug(null);
    }
  }, [showPaymentModal]);

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (!proprietaire?.id) return;

    const loadData = async (proprietaireId: string) => {
      try {
        setLoading(true);

        const { data: locatairesData, error: locatairesError } = await supabase
          .from('locataires')
          .select('id')
          .eq('proprietaire_id', proprietaireId)
          .eq('actif', true);

        if (!locatairesError && locatairesData) {
          setNombreLocataires(locatairesData.length);
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

      loadData(proprietaire.id);

      let attempts = 0;
      const maxAttempts = 15;

      const pollForUpdates = setInterval(async () => {
        attempts++;
        console.log(`Polling for updates, attempt ${attempts}/${maxAttempts}`);
        await loadData(proprietaire.id);

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
      loadData(proprietaire.id);
    }
  }, [searchParams, proprietaire?.id]);

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

      await refetchProprietaire();
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
    if (tenants === 0) return 0;
    if (tenants >= 1 && tenants <= 2) {
      return 3.90;
    } else if (tenants >= 3 && tenants <= 5) {
      return 5.90;
    } else {
      return 8.90;
    }
  };

  const getPlanPriceBreakdown = (plan: string, tenants: number) => {
    if (tenants === 0) return [];

    if (tenants >= 1 && tenants <= 2) {
      return [{ label: `${tenants} logement${tenants > 1 ? 's' : ''}`, price: 3.90 }];
    } else if (tenants >= 3 && tenants <= 5) {
      return [{ label: `${tenants} logements`, price: 5.90 }];
    } else {
      return [{ label: `${tenants} logements`, price: 8.90 }];
    }
  };

  const getPlanDetails = (plan: string | undefined) => {
    const packAutomatiqueFeatures = [
      'Envoi automatique des quittances ou rappels — Générées et envoyées chaque mois automatiquement. Vous validez en un clic.',
      'Historique toujours disponible — Plus jamais à chercher un PDF.',
      'Votre espace stockage privé — Déposez tous vos documents au même endroit.',
      'Calcul des révisions IRL automatique — Calcul conforme INSEE, rappel à la bonne date, lettre automatique prête à envoyer.',
      'Bail Facile — Modèle de bail facile à remplir ou à télécharger vierge avec aide au remplissage.',
      'Bilan annuel simplifié / report fiscal — Votre déclaration prête en quelques clics.'
    ];

    if (!plan) {
      return {
        name: 'Pack Automatique',
        price: '3,90€ à 8,90€/mois TTC',
        icon: Bell,
        color: '#ed7862',
        features: packAutomatiqueFeatures
      };
    }

    const planLower = plan.toLowerCase();

    if (planLower.includes('connectée') || planLower.includes('connecte') || planLower.includes('premium') || planLower.includes('bank') || planLower.includes('plus')) {
      return {
        name: 'Quittance Connectée+',
        price: '3,90€ à 8,90€/mois TTC',
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
      name: 'Pack Automatique',
      price: '3,90€ à 8,90€/mois TTC',
      icon: Bell,
      color: '#ed7862',
      features: packAutomatiqueFeatures
    };
  };

  // Calculer les jours restants de la période d'essai
  const getTrialDaysRemaining = () => {
    if (!proprietaire?.date_fin_essai) return null;
    const endDate = new Date(proprietaire.date_fin_essai);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const isInTrialPeriod = proprietaire?.abonnement_actif && trialDaysRemaining !== null && trialDaysRemaining > 0;
  const trialExpired = proprietaire?.date_fin_essai && trialDaysRemaining !== null && trialDaysRemaining <= 0;

  const planDetails = getPlanDetails(proprietaire?.plan_actuel);
  const PlanIcon = planDetails?.icon || Bell;
  const planType = (proprietaire?.plan_actuel === 'Quittance Connectée+' || proprietaire?.plan_actuel === 'premium')
    ? 'connectee_plus'
    : 'automatique';

  if (!proprietaire) return null;

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto" />
          <p className="mt-3 text-sm text-[#5e6478]">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#151b2c] mb-1">
                      Paiement réussi !
                    </h3>
                    <p className="text-xs text-[#5e6478]">
                      Votre abonnement a été activé avec succès. Nous mettons à jour vos informations...
                    </p>
                    {isRefreshing && (
                      <div className="flex items-center gap-2 mt-2">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                        <span className="text-xs text-emerald-600">Actualisation en cours</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Debug : dernier envoi quick-checkout (après retour Stripe) */}
            {lastPaymentDebug && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
                <p className="text-xs font-semibold text-amber-800 mb-1">Debug paiement (dernier envoi vers Stripe)</p>
                <p className="text-xs text-amber-800 font-mono break-all">
                  stripePriceId : <strong>{String(lastPaymentDebug.stripePriceId ?? '—')}</strong>
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  palier : {String(lastPaymentDebug.tenantTier)} · cycle : {String(lastPaymentDebug.billingCycle)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('lastQuickPaymentDebug');
                    setLastPaymentDebug(null);
                  }}
                  className="mt-2 text-xs text-amber-700 underline hover:no-underline"
                >
                  Effacer ce message
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* Informations du compte */}
              <div className="bg-white rounded-xl border border-[#e8e7ef] overflow-hidden">
            <div className="bg-charte-bleu px-4 py-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-white" />
                <h2 className="text-[15px] font-semibold text-white">Mon compte</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#5e6478] mb-1">Email</p>
                  <p className="font-medium text-sm text-[#151b2c]">{proprietaire.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#5e6478] mb-1">Nom</p>
                  <p className="font-medium text-sm text-[#151b2c]">
                    {proprietaire.prenom} {proprietaire.nom}
                  </p>
                </div>
                {proprietaire.date_inscription && (
                  <div>
                    <p className="text-xs text-[#5e6478] mb-1">Membre depuis</p>
                    <p className="font-medium text-sm text-[#151b2c]">
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

            {/* Abonnement actuel */}
            <div className="bg-white rounded-xl border border-[#e8e7ef] overflow-hidden">
            <div className="bg-charte-bleu px-4 py-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <PlanIcon className="w-5 h-5 text-white" />
                <div className="flex-1">
                  <h2 className="text-[15px] font-semibold text-white">Mon abonnement</h2>
                  <p className={`text-xs font-medium ${proprietaire.abonnement_actif ? 'text-emerald-300' : 'text-gray-300'}`}>
                    {proprietaire.abonnement_actif ? 'Actif' : 'Inactif'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {proprietaire.abonnement_actif ? (
                <>
                  {/* Bandeau période d'essai avec CTA dans le bandeau */}
                  {isInTrialPeriod && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-[#f4663b]/10 to-orange-50 border-2 border-[#f4663b]/30 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-5 h-5 text-[#f4663b]" />
                            <h3 className="text-sm font-bold text-[#151b2c]">Période d'essai gratuite</h3>
                            <span className="bg-[#f4663b] text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
                              {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} restant{trialDaysRemaining > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-[#5e6478] mb-3 sm:mb-0">
                            Profitez de toutes les fonctionnalités du Pack Automatique jusqu'au {new Date(proprietaire.date_fin_essai!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}. Abonnez-vous pour continuer ensuite.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="flex-shrink-0 bg-[#f4663b] hover:bg-[#e25830] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          S'abonner
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bandeau essai terminé : réactiver */}
                  {trialExpired && (
                    <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-sm text-[#151b2c] mb-3">
                        Votre période d'essai est terminée, mais vous pouvez réactiver votre espace et le Pack Automatique à tout moment.
                      </p>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-[#f4663b] hover:bg-[#e25830] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Réactiver le Pack Automatique
                      </button>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[#151b2c]">{planDetails.name}</h3>
                    </div>

                    <p className="text-xs text-[#5e6478] mb-3">
                      Toutes les fonctionnalités incluses dans votre abonnement :
                    </p>

                    <ul className="space-y-2">
                      {planDetails.features.map((feature, index) => {
                        const [title, ...descriptionParts] = feature.split(' — ');
                        const description = descriptionParts.join(' — ');
                        return (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-[#151b2c] leading-snug">
                              {title && <strong>{title}</strong>}
                              {description && ` — ${description}`}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Tableau de calcul basé sur le nombre de locataires */}
                  {nombreLocataires > 0 && proprietaire.plan_actuel && (
                    <div className="bg-white border-2 border-[#e8e7ef] rounded-xl p-4 mb-4">
                      <h4 className="font-semibold text-sm text-[#151b2c] mb-3">Détail de votre abonnement</h4>
                      <div className="space-y-2 mb-3">
                        {getPlanPriceBreakdown(proprietaire.plan_actuel, nombreLocataires).map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-xs text-[#151b2c]">
                            <span className="text-[#5e6478]">{item.label}</span>
                            <span className="font-medium text-[#151b2c]">{item.price.toFixed(2)}€ TTC</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t-2 border-[#e8e7ef] pt-3 flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#151b2c]">Total mensuel</span>
                        <span className="font-bold text-lg text-[#1e3a5f]">
                          {calculatePlanPrice(proprietaire.plan_actuel, nombreLocataires).toFixed(2)}€ TTC/mois
                        </span>
                      </div>
                      <p className="text-xs text-[#5e6478] mt-3 text-center">
                        Pour {nombreLocataires} logement{nombreLocataires > 1 ? 's' : ''} actif{nombreLocataires > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-[#151b2c]">
                      <p className="font-semibold mb-1 text-[#151b2c]">Annulation sans engagement</p>
                      <p className="text-[#5e6478]">Vous pouvez annuler votre abonnement à tout moment. L'annulation prend effet immédiatement mais vous conservez l'accès jusqu'à la fin de votre période de facturation en cours.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-red-500 text-sm text-red-600 font-semibold hover:bg-red-500 hover:text-white transition-all"
                  >
                    Annuler mon abonnement
                  </button>
                </>
              ) : (
                <>
                  {/* Bandeau essai terminé : réactiver (quand plus d'abonnement actif) */}
                  {trialExpired && (
                    <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-sm text-[#151b2c] mb-3">
                        Votre période d'essai est terminée, mais vous pouvez réactiver votre espace et le Pack Automatique à tout moment.
                      </p>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-[#f4663b] hover:bg-[#e25830] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Réactiver le Pack Automatique
                      </button>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#151b2c]">Aucun abonnement actif</h3>
                  </div>
                  <p className="text-xs text-[#5e6478] mb-3">
                    {trialExpired
                      ? 'Réactivez votre compte pour retrouver l\'accès au Pack Automatique et à vos données.'
                      : 'Vous n\'avez pas encore souscrit à un abonnement. Découvrez nos formules pour automatiser vos quittances de loyer et gagner du temps.'}
                  </p>
                </div>

                {/* Plans tarifaires disponibles */}
                <div className="bg-white border border-[#e8e7ef] rounded-xl overflow-hidden mb-4">
                  <div className="bg-charte-bleu px-4 py-3 border-b border-white/20">
                    <h3 className="text-[15px] font-semibold text-white">Plans tarifaires disponibles</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {/* Pack Automatique 1-2 locataires */}
                      <div className="border border-[#e8e7ef] rounded-xl p-3 hover:border-[#f4663b] transition-colors bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-[#151b2c]">Pack Automatique (1-2 locataires)</h4>
                          <span className="text-sm font-bold text-[#f4663b]">3,90€/mois</span>
                        </div>
                        <p className="text-xs text-[#5e6478] mb-2">Idéal pour les petits propriétaires</p>
                        <ul className="text-xs text-[#151b2c] space-y-1 mb-2">
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-emerald-600 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>Rappels automatiques SMS + e-mail</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-emerald-600 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>Génération et envoi automatiques</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-emerald-600 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>Historique illimité</span>
                          </li>
                        </ul>
                      </div>

                      {/* Pack Automatique 3-5 locataires */}
                      <div className="border border-[#e8e7ef] rounded-xl p-3 hover:border-[#f4663b] transition-colors bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-[#151b2c]">Pack Automatique (3-5 locataires)</h4>
                          <span className="text-sm font-bold text-[#f4663b]">5,90€/mois</span>
                        </div>
                        <p className="text-xs text-[#5e6478] mb-2">Parfait pour les propriétaires multi-biens</p>
                        <ul className="text-xs text-[#151b2c] space-y-1 mb-2">
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-emerald-600 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>Toutes les fonctionnalités du pack 1-2</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-emerald-600 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>Gestion jusqu'à 5 locataires</span>
                          </li>
                        </ul>
                      </div>

                      {/* Pack Automatique 5+ locataires */}
                      <div className="border-2 border-[#f4663b] rounded-xl p-3 bg-orange-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-[#151b2c]">Pack Automatique (5+ locataires)</h4>
                          <span className="text-sm font-bold text-[#f4663b]">8,90€/mois</span>
                        </div>
                        <p className="text-xs text-[#5e6478] mb-2">Pour les professionnels de l'immobilier</p>
                        <ul className="text-xs text-[#151b2c] space-y-1 mb-2">
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-emerald-600 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>Gestion illimitée de locataires</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-emerald-600 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>Support prioritaire</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* CTA s'abonner / réactiver (hors période d'essai : essai terminé ou jamais eu d'essai) */}
                    {(trialExpired || (!isInTrialPeriod && !proprietaire?.abonnement_actif)) && (
                      <div className="mt-4 pt-4 border-t border-[#e8e7ef]">
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="w-full bg-[#f4663b] hover:bg-[#e25830] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          {trialExpired ? 'Réactiver le Pack Automatique' : 'S\'abonner'}
                        </button>
                        <p className="text-xs text-[#5e6478] text-center mt-2">
                          {trialExpired
                            ? 'Réactivez votre espace pour retrouver l\'accès à vos données et au Pack Automatique.'
                            : 'Choisissez une formule pour automatiser vos quittances.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
          </div>
          </div>

          {/* Modal de paiement Stripe */}
          <QuickPaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            selectedPlan="auto"
            billingCycle="yearly"
            prefilledEmail={proprietaire?.email}
          />

          {/* Modal d'annulation */}
          {showCancelModal && (
            <>
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => setShowCancelModal(false)}
              />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl border border-[#e8e7ef] shadow-2xl z-50 p-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-[#5e6478]" />
                </button>

                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-4 mx-auto">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>

                <h2 className="text-lg font-semibold text-[#151b2c] mb-3 text-center">
                  Annuler mon abonnement ?
                </h2>

                <p className="text-sm text-[#5e6478] mb-4 text-center">
                  Êtes-vous sûr de vouloir annuler votre abonnement ? Cette action est immédiate mais vous conserverez l'accès jusqu'à la fin de votre période de facturation.
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? 'Annulation en cours...' : 'Oui, annuler mon abonnement'}
                  </button>

                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="w-full py-2.5 rounded-xl border-2 border-[#e8e7ef] hover:border-[#5e6478] text-[#151b2c] text-sm font-semibold transition-all"
                  >
                    Non, conserver mon abonnement
                  </button>
                </div>
              </div>
            </>
          )}
    </main>
  );
};

export default ManageSubscription;

