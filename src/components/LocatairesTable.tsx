import React from 'react';
import { Edit2, Calendar, Trash2, CheckCircle, Settings } from 'lucide-react';

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
  onProceedToPayment
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
    return index === 0 ? 1 : 0.70;
  };

  const calculateTotal = () => {
    return locataires.reduce((sum, _, index) => sum + calculatePrice(index), 0);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[25%]">Locataire</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[20%]">Loyer + Charges</th>
            {planType !== 'connectee_plus' && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[20%]">Date de rappel</th>
            )}
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[20%]">Loyer</th>
            {planType === 'connectee_plus' && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[15%]">Synchronisation</th>
            )}
            {!isSubscriptionActive && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[12%]">Prix</th>
            )}
            <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700 w-[25%]">Action manuelle</th>
            <th className="px-2 py-3 text-center text-sm font-semibold text-gray-700 w-[6%]"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {locataires.map((locataire) => (
            <tr key={locataire.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 align-top">
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900 text-base whitespace-nowrap">
                        {locataire.nom} {locataire.prenom}
                      </p>
                      <button
                        onClick={() => onEditLocataire(locataire)}
                        className="flex items-center space-x-1 text-gray-400 hover:text-[#7CAA89] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-xs whitespace-nowrap">Modifier</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">{locataire.email || 'Pas d\'email'}</p>
                    <p className="text-sm text-gray-500">{locataire.adresse_logement}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 align-top">
                <p className="font-semibold text-gray-900 text-base whitespace-nowrap">
                  {(locataire.loyer_mensuel || 0).toFixed(2)} € + {(locataire.charges_mensuelles || 0).toFixed(2)} €
                </p>
                <p className="text-sm text-gray-500 whitespace-nowrap">
                  Total: {((locataire.loyer_mensuel || 0) + (locataire.charges_mensuelles || 0)).toFixed(2)} €
                </p>
              </td>
              {planType !== 'connectee_plus' && (
                <td className="px-4 py-3 align-top">
                  {planType === 'free' ? (
                    <div className="group relative">
                      <p className="text-gray-400 text-sm cursor-help whitespace-nowrap">Non disponible</p>
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        Automatisez l'envoi pour 1€/mois !<br />(0,70€ locataire supplémentaire)
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-900 whitespace-nowrap">
                        {formatRappelDate(locataire.date_rappel, locataire.heure_rappel, locataire.minute_rappel)}
                      </p>
                      {onEditRappel && (
                        <button
                          onClick={() => onEditRappel(locataire)}
                          className="flex items-center space-x-1 text-gray-400 hover:text-[#7CAA89] transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs whitespace-nowrap">Modifier</span>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              )}
              <td className="px-4 py-3 align-top">
                {planType === 'free' ? (
                  <div className="group relative">
                    <p className="text-gray-400 text-sm cursor-help whitespace-nowrap">Non disponible</p>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      Automatisez l'envoi pour 1€/mois !<br />(0,70€ locataire supplémentaire)
                    </div>
                  </div>
                ) : (
                  getStatutBadge(locataire.statut)
                )}
              </td>
              {planType === 'connectee_plus' && (
                <td className="px-4 py-3 align-top">
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
              {!isSubscriptionActive && (
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-[#2D5C3F] text-base whitespace-nowrap">
                    {calculatePrice(locataires.indexOf(locataire)).toFixed(2)} €/mois
                  </p>
                </td>
              )}
              <td className="px-2 py-3 align-top w-[200px]">
                <div className="flex flex-col gap-2 items-end pr-2">
                  {planType === 'free' && onDownloadQuittance && (
                    <button
                      onClick={() => onDownloadQuittance(locataire)}
                      className="bg-[#7CAA89] hover:bg-[#6b9378] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap w-[170px]"
                    >
                      Télécharger quittance
                    </button>
                  )}
                  {planType === 'free' ? (
                    <>
                      <div className="group relative w-[170px]">
                        <button
                          disabled
                          className="bg-gray-200 text-gray-400 px-4 py-1.5 rounded-full text-sm font-semibold cursor-not-allowed whitespace-nowrap w-full"
                        >
                          Envoi quittance
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          Automatisez l'envoi pour 1€/mois !<br />(0,70€ locataire supplémentaire)
                        </div>
                      </div>
                      <div className="group relative w-[140px]">
                        <button
                          disabled
                          className="bg-gray-200 text-gray-400 px-4 py-1.5 rounded-full text-sm font-semibold cursor-not-allowed whitespace-nowrap w-full"
                        >
                          Relancer
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          Automatisez l'envoi pour 1€/mois !<br />(0,70€ locataire supplémentaire)
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onSendQuittance(locataire)}
                        disabled={!isSubscriptionActive}
                        className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors whitespace-nowrap w-[140px] ${
                          isSubscriptionActive
                            ? 'bg-[#7CAA89] hover:bg-[#6b9378] text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Envoi quittance
                      </button>
                      <button
                        onClick={() => onSendReminder(locataire)}
                        disabled={!isSubscriptionActive}
                        className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors whitespace-nowrap w-[140px] ${
                          isSubscriptionActive
                            ? 'bg-[#ed7862] hover:bg-[#e56651] text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Relancer
                      </button>
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
      {!isSubscriptionActive && locataires.length > 0 && (
        <div className="mt-6 flex items-center justify-end gap-4 px-4">
          <span className="text-lg font-bold text-gray-900">Total mensuel :</span>
          <span className="text-xl font-bold text-[#2D5C3F]">{calculateTotal().toFixed(2)} €/mois</span>
          <button
            onClick={onProceedToPayment}
            className="bg-[#ed7862] hover:bg-[#e56651] text-white px-8 py-3 rounded-full text-lg font-bold transition-colors shadow-lg"
          >
            Valider et payer
          </button>
        </div>
      )}
    </div>
  );
};

export default LocatairesTable;
