import React, { useState } from 'react';
import { Edit2, Calendar, Trash2, CheckCircle, Settings, Check, Clock } from 'lucide-react';

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

interface Quittance {
  id: string;
  locataire_id: string;
  statut: string;
  date_envoi?: string;
  date_generation?: string;
}

interface Relance {
  id: string;
  locataire_id: string;
  date_envoi: string;
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
  quittances?: Quittance[];
  relances?: Relance[];
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
  quittances = [],
  relances = []
}: Props) => {
  const getStatusDetails = (locataire: Locataire) => {
    const quittance = quittances.find(q => q.locataire_id === locataire.id);
    const relance = relances.find(r => r.locataire_id === locataire.id);
    
    const isQuittanceSent = quittance ? (quittance.statut === 'envoyee' || !!quittance.date_envoi) : false;
    const hasReminder = !!relance && relance.date_envoi;
    
    // Vérifier si relance récente (moins de 7 jours)
    let isRecentReminder = false;
    if (hasReminder) {
      const reminderDate = new Date(relance.date_envoi);
      const daysSinceReminder = Math.floor((new Date().getTime() - reminderDate.getTime()) / (1000 * 60 * 60 * 24));
      isRecentReminder = daysSinceReminder <= 7;
    }
    
    return {
      isPaid: isQuittanceSent, // Une quittance envoyée = payé
      isQuittanceSent,
      hasReminder: isRecentReminder
    };
  };

  const getStatutBadge = (locataire: Locataire) => {
    const status = getStatusDetails(locataire);
    
    // Construire les labels séparés
    const paymentLabel = status.isPaid ? 'Payé' : 'Non payé';
    const quittanceLabel = status.isQuittanceSent ? 'Quittance envoyée' : 'Quittance à envoyer';
    
    // Déterminer les couleurs selon le statut principal
    let bgColor, textColor, iconColor, Icon;
    if (status.isQuittanceSent) {
      // Payé - Quittance envoyée
      bgColor = 'bg-emerald-50';
      textColor = 'text-emerald-700';
      iconColor = 'text-emerald-600';
      Icon = CheckCircle;
    } else if (status.hasReminder) {
      // Non payé - Relance envoyée
      bgColor = 'bg-orange-50';
      textColor = 'text-orange-700';
      iconColor = 'text-orange-600';
      Icon = Clock;
    } else {
      // Non payé - Quittance à envoyer
      bgColor = 'bg-amber-50';
      textColor = 'text-amber-700';
      iconColor = 'text-amber-600';
      Icon = Clock;
    }
    
    return (
      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] sm:text-[12px] font-medium ${bgColor} ${textColor}`}>
        <Icon className={`w-3 h-3 flex-shrink-0 ${iconColor}`} />
        <div className="flex flex-col leading-tight">
          <span>{paymentLabel}</span>
          <span>{quittanceLabel}</span>
          {status.hasReminder && (
            <span className="text-[10px] opacity-75">Relance envoyée</span>
          )}
        </div>
      </div>
    );
  };

  const formatRappelDate = (jour?: number, heure?: number, minute?: number) => {
    if (!jour) {
      return <span>Non configuré</span>;
    }
    const heureStr =
      heure !== undefined
        ? `${heure.toString().padStart(2, '0')}:${(minute || 0).toString().padStart(2, '0')}`
        : '';

    return (
      <span className="inline-flex flex-col leading-tight">
        <span>{`Le ${jour} du mois`}</span>
        {heureStr && <span>{`à ${heureStr}`}</span>}
      </span>
    );
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
      <div className="hidden lg:block min-w-0 overflow-hidden">
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
        <table className="w-full table-fixed text-[13px] sm:text-[14px]">
          <thead className="bg-[#f8fafc] border-b border-[#f1f5f9]">
            <tr>
              <th className="px-2 py-2.5 text-left font-medium text-[#64748b] w-[32%] min-w-0">Locataire</th>
              <th className="px-2 py-2.5 text-left font-medium text-[#64748b] w-[16%] min-w-0">Loyer + Charges</th>
              {planType !== 'connectee_plus' && (
                <th className="px-2 py-2.5 text-left font-medium text-[#64748b] w-[20%] min-w-0 whitespace-nowrap">Date de rappel / échéance</th>
              )}
              <th className="px-2 py-2.5 text-left font-medium text-[#64748b] w-[12%] min-w-0">Statut</th>
              {planType === 'connectee_plus' && (
                <th className="px-2 py-2.5 text-left font-medium text-[#64748b] w-[14%] min-w-0">Synchronisation</th>
              )}
              <th className="px-2 py-2.5 text-center font-medium text-[#64748b] w-[14%] min-w-0">Actions manuelles</th>
              <th className="px-1 py-2.5 text-center font-medium text-[#64748b] w-[6%] min-w-0"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {locataires.map((locataire, index) => (
              <tr key={locataire.id} className="hover:bg-[#f8fafc] transition-colors">
                <td className="px-2 py-2.5 align-top w-[32%] min-w-0 overflow-hidden">
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                      <p className="font-medium text-[#0f172a] text-[14px] whitespace-nowrap">
                        {locataire.nom} {locataire.prenom}
                      </p>
                      <button
                        onClick={() => onEditLocataire(locataire)}
                        className="flex items-center space-x-1 text-[#64748b] hover:text-[#0f172a] transition-colors flex-shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="text-xs whitespace-nowrap">Modifier</span>
                      </button>
                    </div>
                    <p className="text-[13px] text-[#64748b] break-words">
                      <span className="text-[#64748b]">E-mail : </span>
                      {locataire.email?.trim() ? (
                        <span className="text-[#64748b] break-all">{locataire.email}</span>
                      ) : (
                        <span className="inline-block text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 ml-1">
                          Non renseigné
                        </span>
                      )}
                    </p>
                    {locataire.telephone && (
                      <p className="text-[13px] text-[#64748b] break-words">{locataire.telephone}</p>
                    )}
                    <p className="text-[13px] text-[#64748b] break-words">{locataire.adresse_logement}</p>
                  </div>
                </td>
                <td className="px-2 py-2.5 align-top w-[16%] min-w-0">
                  <p className="font-medium text-[#0f172a] text-[14px] whitespace-nowrap">
                    Total: {((locataire.loyer_mensuel || 0) + (locataire.charges_mensuelles || 0)).toFixed(2)} €
                  </p>
                  <p className="text-[13px] text-[#64748b] whitespace-nowrap">
                    {(locataire.loyer_mensuel || 0).toFixed(2)} € + {(locataire.charges_mensuelles || 0).toFixed(2)} €
                  </p>
                </td>
                {planType !== 'connectee_plus' && (
                  <td className="px-2 py-2.5 align-top w-[20%] min-w-0">
                    {planType === 'free' ? (
                      <div className="group relative">
                        <p className="text-[#64748b] text-[13px] cursor-help whitespace-nowrap">Non disponible</p>
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          Automatisez l'envoi dès 3,90€/mois !<br />(5,90€ pour 3-5 locataires, 8,90€ pour 6+)
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="text-[13px] text-[#0f172a] whitespace-nowrap">
                          {formatRappelDate(locataire.date_rappel, locataire.heure_rappel, locataire.minute_rappel)}
                        </p>
                        {onEditRappel && (
                          isSubscriptionActive ? (
                            <button
                              onClick={() => onEditRappel(locataire)}
                              className="flex items-center space-x-1 text-[#64748b] hover:text-[#0f172a] transition-colors"
                            >
                              <Calendar className="w-3.5 h-3.5" />
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
                                Souscrivez à Pack Automatique pour programmer vos rappels automatiques !
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </td>
                )}
<td className="px-2 py-2.5 align-top w-[12%] min-w-0">
                  {planType === 'free' ? (
                      <div className="group relative">
                      <p className="text-[#64748b] text-[13px] cursor-help whitespace-nowrap">Non disponible</p>
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        Automatisez l'envoi dès 3,90€/mois !<br />(5,90€ pour 3-5 locataires, 8,90€ pour 6+)
                      </div>
                    </div>
                    ) : (
                      getStatutBadge(locataire)
                    )}
                </td>
                {planType === 'connectee_plus' && (
                  <td className="px-2 py-2.5 align-top w-[14%] min-w-0">
                  {!bankConnection ? (
                    <div className="text-[13px] text-[#64748b]">
                      Connectez votre banque d'abord
                    </div>
                  ) : rentRules[locataire.id] ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🟢</span>
                      <div>
                        <p className="text-[13px] font-medium text-[#0f172a] whitespace-nowrap">Synchronisé</p>
                        <p className="text-[12px] text-[#64748b] whitespace-nowrap">
                            {locataire.statut === 'paye'
                              ? `Loyer détecté le ${new Date().toLocaleDateString('fr-FR')}`
                              : 'En attente du paiement'}
                          </p>
                        </div>
                      </div>
                    ) : onConfigureDetection ? (
                      <button
                        onClick={() => onConfigureDetection(locataire)}
                        className="inline-flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Détecter le paiement</span>
                      </button>
                    ) : null}
                  </td>
                )}
                <td className="px-2 py-2.5 align-top w-[14%] min-w-0">
                  <div className="flex flex-col gap-1 items-center min-w-0">
                    {planType === 'free' && onDownloadQuittance && (
                      <button
                        onClick={() => onDownloadQuittance(locataire)}
                        className="w-full px-2 py-1 rounded-lg text-[12px] font-medium transition-colors border border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
                      >
                        Télécharger quittance
                      </button>
                    )}
                    {planType === 'free' ? (
                      <>
                        <button
                          disabled
                          className="w-full px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border border-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                        >
                          Envoi quittance
                        </button>
                        <button
                          disabled
                          className="w-full px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border border-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                        >
                          Relancer
                        </button>
                      </>
                    ) : (
                      <>
                        {isSubscriptionActive ? (
                          <button
                            onClick={() => onSendQuittance(locataire)}
                            className="w-full px-2 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap border border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#e5edf7]"
                          >
                            Envoi quittance
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border border-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                          >
                            Envoi quittance
                          </button>
                        )}
                        {isSubscriptionActive ? (
                          <button
                            onClick={() => onSendReminder(locataire)}
                            className="w-full px-2 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap border border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#e5edf7]"
                          >
                            Relancer
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border border-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                          >
                            Relancer
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-1 py-2.5 align-top text-center w-[6%] min-w-0">
                  <button
                    onClick={() => onDeleteLocataire(locataire)}
                    className="p-1 rounded-lg text-red-600 hover:bg-[#fef2f2] hover:text-red-700 transition-colors inline-flex"
                    title="Supprimer le locataire"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Hidden on Desktop - min-w-0 pour éviter débordement */}
      <div className="lg:hidden space-y-4 p-4 min-w-0 max-w-full overflow-hidden">
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
          <div key={locataire.id} className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden min-w-0 max-w-full">
            {/* Card Header — style Overview */}
            <div className="px-4 py-3 border-b border-[#f1f5f9] min-w-0">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-[#0f172a] text-[14px] break-words">
                      {locataire.nom} {locataire.prenom}
                    </h3>
                    <button
                      onClick={() => onEditLocataire(locataire)}
                      className="flex items-center gap-1 text-[#64748b] hover:text-[#0f172a] transition-colors flex-shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-xs">Modifier</span>
                    </button>
                  </div>
                  <p className="text-[13px] text-[#64748b] mt-0.5 break-all">
                    <span className="text-[#64748b]">E-mail : </span>
                    {locataire.email?.trim() ? (
                      <span className="text-[#64748b]">{locataire.email}</span>
                    ) : (
                      <span className="inline-block text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 ml-1">
                        Non renseigné
                      </span>
                    )}
                  </p>
                  {locataire.telephone && (
                    <p className="text-[13px] text-[#64748b] mt-0.5 break-words">{locataire.telephone}</p>
                  )}
                  <p className="text-[13px] text-[#64748b] mt-0.5 break-words">{locataire.adresse_logement}</p>
                </div>
                <button
                  onClick={() => onDeleteLocataire(locataire)}
                  className="p-1 rounded-lg text-red-600 hover:bg-[#fef2f2] transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3 min-w-0">
              {/* Loyer Section */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#f1f5f9] min-w-0">
                <div>
                  <p className="text-[12px] text-[#64748b] mb-0.5">Loyer + Charges</p>
                  <p className="font-medium text-[#0f172a] text-[14px]">
                    Total: {((locataire.loyer_mensuel || 0) + (locataire.charges_mensuelles || 0)).toFixed(2)} €
                  </p>
                  <p className="text-[13px] text-[#64748b] mt-0.5">
                    {(locataire.loyer_mensuel || 0).toFixed(2)} € + {(locataire.charges_mensuelles || 0).toFixed(2)} €
                  </p>
                </div>
                <div>
                  {planType === 'free' ? (
                    <span className="text-[#64748b] text-[13px]">Non disponible</span>
                    ) : (
                      getStatutBadge(locataire)
                    )}
                </div>
              </div>

              {/* Date rappel ou Sync bancaire */}
              {planType !== 'connectee_plus' ? (
                <div className="pb-3 border-b border-[#f1f5f9] min-w-0">
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-[12px] text-[#64748b] mb-0.5">Date de rappel / échéance</p>
                      {planType === 'free' ? (
                        <p className="text-[#64748b] text-[13px]">Non disponible</p>
                      ) : (
                        <p className="text-[13px] text-[#0f172a] font-medium">
                          {formatRappelDate(locataire.date_rappel, locataire.heure_rappel, locataire.minute_rappel)}
                        </p>
                      )}
                    </div>
                    {onEditRappel && planType !== 'free' && (
                      isSubscriptionActive ? (
                        <button
                          onClick={() => onEditRappel(locataire)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white rounded-lg text-[13px] font-medium transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Modifier la date de rappel</span>
                        </button>
                  ) : (
                    <div className="group relative">
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-1 px-4 py-2 border border-[#e2e8f0] text-[#94a3b8] cursor-not-allowed rounded-lg text-[13px]"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="whitespace-nowrap">Modifier</span>
                      </button>
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-50 w-64">
                            Souscrivez au Pack Automatique pour programmer vos rappels automatiques !
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="pb-3 border-b border-[#f1f5f9]">
                  <p className="text-[12px] text-[#64748b] mb-1">Synchronisation bancaire</p>
                  {!bankConnection ? (
                    <p className="text-[13px] text-[#64748b]">Connectez votre banque d'abord</p>
                  ) : rentRules[locataire.id] ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🟢</span>
                      <div>
                        <p className="text-[13px] font-medium text-[#0f172a]">Synchronisé</p>
                        <p className="text-[12px] text-[#64748b]">
                          {locataire.statut === 'paye'
                            ? `Loyer détecté le ${new Date().toLocaleDateString('fr-FR')}`
                            : 'En attente du paiement'}
                        </p>
                      </div>
                    </div>
                  ) : onConfigureDetection ? (
                    <button
                      onClick={() => onConfigureDetection(locataire)}
                      className="inline-flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Détecter le paiement</span>
                    </button>
                  ) : null}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 min-w-0">
                {planType === 'free' && onDownloadQuittance && (
                  <button
                    onClick={() => onDownloadQuittance(locataire)}
                    className="w-full px-4 py-2 rounded-lg text-[13px] font-medium bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white transition-colors"
                  >
                    Télécharger quittance
                  </button>
                )}

                {planType === 'free' ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      disabled
                      className="w-full px-2 py-1.5 rounded-lg text-[11px] font-medium border border-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                    >
                      Envoi quittance
                    </button>
                    <button
                      disabled
                      className="w-full px-2 py-1.5 rounded-lg text-[11px] font-medium border border-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                    >
                      Relancer
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {isSubscriptionActive ? (
                      <>
                        <button
                          onClick={() => onSendQuittance(locataire)}
                          className="w-full px-2 py-1.5 rounded-lg text-[11px] font-medium bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white transition-colors"
                        >
                          Envoi quittance
                        </button>
                        <button
                          onClick={() => onSendReminder(locataire)}
                          className="w-full px-2 py-1.5 rounded-lg text-[11px] font-medium bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white transition-colors"
                        >
                          Relancer
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          disabled
                          className="w-full px-2 py-1.5 rounded-lg text-[11px] font-medium border border-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                        >
                          Envoi quittance
                        </button>
                        <button
                          disabled
                          className="w-full px-2 py-1.5 rounded-lg text-[11px] font-medium border border-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                        >
                          Relancer
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </>
  );
};

export default LocatairesTable;
