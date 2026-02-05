import React, { useState } from 'react';
import { Edit2, Calendar, Trash2, CheckCircle, Settings, Check } from 'lucide-react';

interface Locataire {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse_logement: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  date_rappel?: number;
  heure_rappel?: number;
  minute_rappel?: number;
  statut?: 'en_attente' | 'paye';
  actif: boolean;
}

interface Props {
  locataires: Locataire[];
  planType: 'free' | 'automatique' | 'connectee_plus';
  onEditLocataire: (locataire: Locataire) => void;
  onEditRappel?: (locataire: Locataire) => void;
  onSendQuittance: (locataire: Locataire) => void;
  onSendReminder: (locataire: Locataire) => void;
  onDeleteLocataire: (locataire: Locataire) => void;
  onDownloadQuittance?: (locataire: Locataire) => void;
  onSyncPayment?: (locataire: Locataire) => void;
  onConfigureDetection?: (locataire: Locataire) => void;
  rentRules?: Record<string, any>;
  isSyncing?: boolean;
  bankConnection?: any;
  isSubscriptionActive?: boolean;
  onProceedToPayment?: () => void;
  billingCycle?: 'monthly' | 'yearly';
  onBillingCycleChange?: (cycle: 'monthly' | 'yearly') => void;
}

const LocatairesTable = ({
  locataires,
  planType,
  onEditLocataire,
  onEditRappel,
  onSendQuittance,
  onSendReminder,
  onDeleteLocataire,
  onDownloadQuittance,
  onSyncPayment,
  onConfigureDetection,
  rentRules = {},
  isSyncing = false,
  bankConnection,
  isSubscriptionActive = true,
  onProceedToPayment,
  billingCycle = 'yearly',
  onBillingCycleChange
}: Props) => {
  const getStatutBadge = (statut?: string) => {
    if (!statut) return null;

    const colors = {
      'paye': 'bg-green-100 text-green-800',
      'en_attente': 'bg-grey-100 text-grey-800'
    };

    const labels = {
      'paye': 'Payé',
      'en_attente': 'En attente'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[statut as keyof typeof labels] || statut}
      </span>
    );
  };

  const formatRappelDate = (jour?: number, heure?: number, minute?: number) => {
    if (!jour) return 'Non configuré';
    const heureStr = heure !== undefined ? `${heure.toString().padStart(2, '0')}:${(minute || 0).toString().padStart(2, '0')}` : '';
    return `Le ${jour} ${heureStr}`;
  };

  const calculatePrice = (index: number) => {
    const totalLocataires = locataires.length;
    if (totalLocataires <= 2) {
      return index === 0 ? 0.99 : 0;
    } else if (totalLocataires <= 4) {
      return index === 0 ? 1.49 : 0;
    } else {
      return index === 0 ? 2.49 : 0;
    }
  };

  const calculateTotal = () => {
    const count = locataires.length;

    if (billingCycle === 'yearly') {
      if (count <= 2) {
        return 9.90;
      } else if (count <= 5) {
        return 14.90;
      } else {
        return 24.90;
      }
    } else {
      if (count <= 2) {
        return 0.99;
      } else if (count <= 5) {
        return 1.49;
      } else {
        return 2.49;
      }
    }
  };

  const getSavings = () => {
    const count = locataires.length;
    if (count <= 2) {
      return 1.98;
    } else if (count <= 5) {
      return 2.98;
    } else {
      return 4.98;
    }
  };

  const getPlanName = () => {
    const count = locataires.length;
    if (count <= 2) {
      return 'forfait 1-2 locataires';
    } else if (count <= 4) {
      return 'forfait 3-4 locataires';
    } else if (count <= 8) {
      return 'forfait 5-8 locataires';
    } else {
      return 'forfait 9+ locataires';
    }
  };

  // Vérifier si toutes les dates de rappel sont configurées
  const allRemindersConfigured = locataires.every(loc =>
    loc.date_rappel !== undefined &&
    loc.date_rappel !== null &&
    loc.heure_rappel !== undefined &&
    loc.heure_rappel !== null
  );

  // Afficher le message seulement si l'abonnement est actif et les rappels ne sont pas tous configurés
  const showReminderSetupMessage = isSubscriptionActive && !allRemindersConfigured && planType !== 'connectee_plus';

  return (
    <>
      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden lg:block overflow-x-auto pt-2">
        {/* Message pour configurer les rappels */}
        {showReminderSetupMessage && (
          <div className="mb-2 px-4">
            <p className="text-green-600 font-semibold text-sm">
              Paramètrez date et heure de rappel dans le tableau
            </p>
            <p className="text-green-600 text-xs">
              pour recevoir vos rappels SMS + Email quand vous le souhaitez
            </p>
          </div>
        )}
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[32%]">Locataire</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[24%]">Loyer + Charges</th>
              {planType !== 'connectee_plus' && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[18%]">Date de rappel</th>
              )}
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[10%]">Statut</th>
              {planType === 'connectee_plus' && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[15%]">Synchronisation</th>
              )}
              <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700 w-[24%]">Action manuelle</th>
              <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700 w-[6%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locataires.map((locataire, index) => (
              <tr key={locataire.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 align-top w-[32%]">
                  <div className="flex items-center space-x-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-gray-900 text-base whitespace-nowrap">
                          {locataire.nom} {locataire.prenom}
                        </p>
                        <button
                          onClick={() => onEditLocataire(locataire)}
                          className="flex items-center space-x-1 text-[#2D5C3F] hover:text-[#ed7862] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="text-xs whitespace-nowrap">Modifier</span>
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{locataire.email || 'Pas d\'email'}</p>
                      {locataire.telephone && (
                        <p className="text-sm text-gray-600">{locataire.telephone}</p>
                      )}
                      <p className="text-sm text-gray-500">{locataire.adresse_logement}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top w-[24%]">
                  <p className="font-semibold text-gray-900 text-base whitespace-nowrap">
                    Total: {((locataire.loyer_mensuel || 0) + (locataire.charges_mensuelles || 0)).toFixed(2)} €
                  </p>
                  <p className="text-sm text-gray-500 whitespace-nowrap">
                    {(locataire.loyer_mensuel || 0).toFixed(2)} € + {(locataire.charges_mensuelles || 0).toFixed(2)} €
                  </p>
                </td>
                {planType !== 'connectee_plus' && (
                  <td className="px-4 py-3 align-top w-[18%]">
                    {planType === 'free' ? (
                      <div className="group relative">
                        <p className="text-gray-400 text-sm cursor-help whitespace-nowrap">Non disponible</p>
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          Automatisez l'envoi dès 0,99€/mois !<br />(1,49€ pour 3-4 locataires, 2,49€ pour 5+)
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-900 whitespace-nowrap">
                          {formatRappelDate(locataire.date_rappel, locataire.heure_rappel, locataire.minute_rappel)}
                        </p>
                        {onEditRappel && (
                          isSubscriptionActive ? (
                            <button
                              onClick={() => onEditRappel(locataire)}
                              className="flex items-center space-x-1 text-[#2D5C3F] hover:text-[#ed7862] transition-colors"
                            >
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs whitespace-nowrap">Modifier</span>
                            </button>
                          ) : (
                            <div className="group relative">
                              <button
                                disabled
                                className="flex items-center space-x-1 text-gray-400 cursor-not-allowed"
                              >
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs whitespace-nowrap">Modifier</span>
                              </button>
                              <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-50 w-64">
                                Souscrivez à Mode Tranquillité pour programmer vos rappels automatiques !
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 align-top w-[10%]">
                  {planType === 'free' ? (
                    <div className="group relative">
                      <p className="text-gray-400 text-sm cursor-help whitespace-nowrap">Non disponible</p>
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        Automatisez l'envoi dès 0,99€/mois !<br />(1,49€ pour 3-4 locataires, 2,49€ pour 5+)
                      </div>
                    </div>
                  ) : (
                    getStatutBadge(locataire.statut)
                  )}
                </td>
                {planType === 'connectee_plus' && (
                  <td className="px-4 py-3 align-top w-[15%]">
                    {!bankConnection ? (
                      <div className="text-sm text-gray-400">
                        Connectez votre banque d'abord
                      </div>
                    ) : rentRules[locataire.id] ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🟢</span>
                        <div>
                          <p className="text-sm font-semibold text-green-900 whitespace-nowrap">Synchronisé</p>
                          <p className="text-xs text-green-700 whitespace-nowrap">
                            {locataire.statut === 'paye'
                              ? `Loyer détecté le ${new Date().toLocaleDateString('fr-FR')}`
                              : 'En attente du paiement'}
                          </p>
                        </div>
                      </div>
                    ) : onConfigureDetection ? (
                      <button
                        onClick={() => onConfigureDetection(locataire)}
                        className="flex items-center space-x-2 bg-[#7CAA89] hover:bg-[#6b9378] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap"
                      >
                        <Settings className="w-4 h-4" />
                        <span>⚙️ Détecter le paiement</span>
                      </button>
                    ) : null}
                  </td>
                )}
                <td className="px-2 py-3 align-top w-[24%]">
                  <div className="flex flex-col gap-2 items-end pr-2">
                    {planType === 'free' && onDownloadQuittance && (
                      <button
                        onClick={() => onDownloadQuittance(locataire)}
                        className="bg-[#7CAA89] hover:bg-[#6b9378] text-white px-3 py-1 rounded-full text-sm font-semibold transition-colors whitespace-nowrap w-[170px] flex items-center justify-center"
                      >
                        Télécharger quittance
                      </button>
                    )}
                    {planType === 'free' ? (
                      <>
                        <div className="group relative w-[170px]">
                          <button
                            disabled
                            className="bg-gray-200 text-gray-400 px-3 py-1 rounded-full text-sm font-semibold cursor-not-allowed whitespace-nowrap w-full"
                          >
                            Envoi quittance
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            Automatisez l'envoi dès 0,99€/mois !<br />(1,49€ pour 3-4 locataires, 2,49€ pour 5+)
                          </div>
                        </div>
                        <div className="group relative w-[170px]">
                          <button
                            disabled
                            className="bg-gray-200 text-gray-400 px-3 py-1 rounded-full text-sm font-semibold cursor-not-allowed whitespace-nowrap w-[170px]"
                          >
                            Relancer
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            Automatisez l'envoi dès 0,99€/mois !<br />(1,49€ pour 3-4 locataires, 2,49€ pour 5+)
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {isSubscriptionActive ? (
                          <button
                            onClick={() => onSendQuittance(locataire)}
                            className="px-4 py-1 rounded-full text-sm font-semibold transition-colors whitespace-nowrap w-[140px] bg-[#7CAA89] hover:bg-[#6b9378] text-white"
                          >
                            Envoi quittance
                          </button>
                        ) : (
                          <div className="group relative w-[140px]">
                            <button
                              disabled
                              className="px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap w-full bg-gray-200 text-gray-400 cursor-not-allowed"
                            >
                              Envoi quittance
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-50 w-64">
                              Souscrivez au Mode Tranquillité pour envoyer automatiquement vos quittances !
                            </div>
                          </div>
                        )}
                        {isSubscriptionActive ? (
                          <button
                            onClick={() => onSendReminder(locataire)}
                            className="px-4 py-1 rounded-full text-sm font-semibold transition-colors whitespace-nowrap w-[140px] bg-[#ed7862] hover:bg-[#e56651] text-white"
                          >
                            Relancer
                          </button>
                        ) : (
                          <div className="group relative w-[140px]">
                            <button
                              disabled
                              className="px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap w-full bg-gray-200 text-gray-400 cursor-not-allowed"
                            >
                              Relancer
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-50 w-64">
                              Souscrivez au Mode Tranquillité pour envoyer automatiquement vos relances !
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-2 py-3 align-top text-right w-[40px]">
                  <button
                    onClick={() => onDeleteLocataire(locataire)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Supprimer le locataire"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Hidden on Desktop */}
      <div className="lg:hidden space-y-4 p-4">
        {/* Message pour configurer les rappels - Mobile */}
        {showReminderSetupMessage && (
          <div className="mb-2 px-2">
            <p className="text-green-600 font-semibold text-sm">
              Paramètrez date et heure de rappel dans le tableau
            </p>
            <p className="text-green-600 text-xs">
              pour recevoir vos rappels SMS + Email quand vous le souhaitez
            </p>
          </div>
        )}
        {locataires.map((locataire, index) => (
          <div key={locataire.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {locataire.nom} {locataire.prenom}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{locataire.email || 'Pas d\'email'}</p>
                  {locataire.telephone && (
                    <p className="text-sm text-gray-600 mt-1">{locataire.telephone}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{locataire.adresse_logement}</p>
                </div>
                <button
                  onClick={() => onDeleteLocataire(locataire)}
                  className="text-red-600 hover:text-red-800 transition-colors p-2"
                  title="Supprimer"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-4">
              {/* Loyer Section */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Loyer + Charges</p>
                  <p className="font-bold text-gray-900 text-base">
                    Total: {((locataire.loyer_mensuel || 0) + (locataire.charges_mensuelles || 0)).toFixed(2)} €
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(locataire.loyer_mensuel || 0).toFixed(2)} € + {(locataire.charges_mensuelles || 0).toFixed(2)} €
                  </p>
                </div>
                <div>
                  {planType === 'free' ? (
                    <span className="text-gray-400 text-sm">Non disponible</span>
                  ) : (
                    getStatutBadge(locataire.statut)
                  )}
                </div>
              </div>

              {/* Date rappel ou Sync bancaire */}
              {planType !== 'connectee_plus' ? (
                <div className="pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date de rappel</p>
                      {planType === 'free' ? (
                        <p className="text-gray-400 text-sm">Non disponible</p>
                      ) : (
                        <p className="text-sm text-gray-900 font-medium">
                          {formatRappelDate(locataire.date_rappel, locataire.heure_rappel, locataire.minute_rappel)}
                        </p>
                      )}
                    </div>
                    {onEditRappel && planType !== 'free' && (
                      isSubscriptionActive ? (
                        <button
                          onClick={() => onEditRappel(locataire)}
                          className="flex items-center space-x-1 text-[#2D5C3F] hover:text-[#ed7862] transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">Modifier</span>
                        </button>
                      ) : (
                        <div className="group relative">
                          <button
                            disabled
                            className="flex items-center space-x-1 text-gray-400 cursor-not-allowed"
                          >
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs">Modifier</span>
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-50 w-64">
                            Souscrivez au Mode Tranquillité pour programmer vos rappels automatiques !
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="pb-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Synchronisation bancaire</p>
                  {!bankConnection ? (
                    <p className="text-sm text-gray-400">Connectez votre banque d'abord</p>
                  ) : rentRules[locataire.id] ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🟢</span>
                      <div>
                        <p className="text-sm font-semibold text-green-900">Synchronisé</p>
                        <p className="text-xs text-green-700">
                          {locataire.statut === 'paye'
                            ? `Loyer détecté le ${new Date().toLocaleDateString('fr-FR')}`
                            : 'En attente du paiement'}
                        </p>
                      </div>
                    </div>
                  ) : onConfigureDetection ? (
                    <button
                      onClick={() => onConfigureDetection(locataire)}
                      className="flex items-center justify-center space-x-2 bg-[#7CAA89] hover:bg-[#6b9378] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors w-full"
                    >
                      <Settings className="w-4 h-4" />
                      <span>⚙️ Détecter le paiement</span>
                    </button>
                  ) : null}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => onEditLocataire(locataire)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Modifier les informations</span>
                </button>

                {planType === 'free' && onDownloadQuittance && (
                  <button
                    onClick={() => onDownloadQuittance(locataire)}
                    className="w-full bg-[#7CAA89] hover:bg-[#6b9378] text-white px-4 py-2.5 rounded-lg font-semibold transition-colors"
                  >
                    Télécharger quittance
                  </button>
                )}

                {planType === 'free' ? (
                  <>
                    <button
                      disabled
                      className="w-full bg-gray-200 text-gray-400 px-4 py-2.5 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Envoi quittance (Plan payant)
                    </button>
                    <button
                      disabled
                      className="w-full bg-gray-200 text-gray-400 px-4 py-2.5 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Relancer (Plan payant)
                    </button>
                  </>
                ) : (
                  <>
                    {isSubscriptionActive ? (
                      <button
                        onClick={() => onSendQuittance(locataire)}
                        className="w-full px-4 py-2.5 rounded-lg font-semibold transition-colors bg-[#7CAA89] hover:bg-[#6b9378] text-white"
                      >
                        Envoyer la quittance
                      </button>
                    ) : (
                      <div className="group relative w-full">
                        <button
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg font-semibold bg-gray-200 text-gray-400 cursor-not-allowed"
                        >
                          Envoyer la quittance
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-50 w-64">
                          Souscrivez au Mode Tranquillité pour envoyer automatiquement vos quittances !
                        </div>
                      </div>
                    )}
                    {isSubscriptionActive ? (
                      <button
                        onClick={() => onSendReminder(locataire)}
                        className="w-full px-4 py-2.5 rounded-lg font-semibold transition-colors bg-[#ed7862] hover:bg-[#e56651] text-white"
                      >
                        Envoyer une relance
                      </button>
                    ) : (
                      <div className="group relative w-full">
                        <button
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg font-semibold bg-gray-200 text-gray-400 cursor-not-allowed"
                        >
                          Envoyer une relance
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-50 w-64">
                          Souscrivez au Mode Tranquillité pour envoyer automatiquement vos relances !
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total et bouton paiement */}
      {!isSubscriptionActive && locataires.length > 0 && onProceedToPayment && (
        <div className="mt-6 bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Automatisez votre adminstratif locatif avec l'offre de lancement pour <span className="font-bold text-[#7CAA89]">{locataires.length} {locataires.length === 1 ? 'locataire' : 'locataires'}</span>
            </p>

            <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {/* Option Mensuel */}
              <div
                onClick={() => onBillingCycleChange?.('monthly')}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  billingCycle === 'monthly'
                    ? 'border-[#7CAA89] bg-[#7CAA89]/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {billingCycle === 'monthly' && (
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                <div className="mb-2">
                  <h4 className="font-bold text-base text-gray-900">Mensuel</h4>
                </div>
                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {locataires.length <= 2 ? '0.99' : locataires.length <= 5 ? '1.49' : '2.49'} €
                    </span>
                    <span className="text-gray-600 text-sm">/mois</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Sans engagement</p>
              </div>

              {/* Option Annuel */}
              <div
                onClick={() => onBillingCycleChange?.('yearly')}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  billingCycle === 'yearly'
                    ? 'border-[#7CAA89] bg-[#7CAA89]/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="bg-[#ed7862] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    RECOMMANDÉ
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 bg-[#7CAA89] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                <div className="mb-2">
                  <h4 className="font-bold text-base text-gray-900">Annuel</h4>
                </div>
                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {locataires.length <= 2 ? '0,82' : locataires.length <= 5 ? '1,24' : '2,07'} €
                    </span>
                    <span className="text-gray-600 text-sm">/mois</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ({locataires.length <= 2 ? '9,90' : locataires.length <= 5 ? '14,90' : '24,90'} €/an)
                  </p>
                  <p className="text-xs text-[#7CAA89] font-semibold mt-1">
                    Deux mois gratuits
                  </p>
                </div>
                <p className="text-xs text-gray-600">Sans engagement</p>
              </div>
            </div>
          </div>

          {/* Résumé et bouton */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-600">
                {locataires.length} {locataires.length === 1 ? 'locataire' : 'locataires'} • {billingCycle === 'yearly' ? 'Paiement annuel' : 'Paiement mensuel'}
              </p>
              {billingCycle === 'yearly' ? (
                <div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {locataires.length <= 2 ? '0,82' : locataires.length <= 5 ? '1,24' : '2,07'} €<span className="text-base font-normal text-gray-600">/mois</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    ({calculateTotal().toFixed(2).replace('.', ',')} €/an)
                  </p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {calculateTotal().toFixed(2).replace('.', ',')} €<span className="text-base font-normal text-gray-600">/mois</span>
                </p>
              )}
            </div>
            <button
              onClick={onProceedToPayment}
              className="w-full sm:w-auto bg-[#7CAA89] hover:bg-[#6b9378] text-white px-8 py-3 rounded-full text-base font-semibold transition-colors shadow-lg"
            >
              Valider et payer
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LocatairesTable;
