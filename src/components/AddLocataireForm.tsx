import React from 'react';
import { User, Mail, Phone, MapPin, Euro, Calendar, Building2, Clock } from 'lucide-react';

interface AddLocataireFormProps {
  planType: 'auto';
  formData: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    adresse_logement: string;
    detail_adresse?: string;
    loyer_mensuel: string;
    charges_mensuelles: string;
    date_rappel: string;
    heure_rappel: string;
    minute_rappel: string;
  };
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  isBeforePayment?: boolean;
}

const AddLocataireForm: React.FC<AddLocataireFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
  isBeforePayment = false
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editer les infos du locataire' : 'Ajouter un locataire'}
            </h3>
            <span className="text-sm font-medium text-[#FF6B6B]">
              Plan Automatique
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Envoi automatique de quittances selon la date de rappel
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-[#2D3436]" />
              Informations personnelles
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => onChange('nom', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => onChange('prenom', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                  placeholder="Jean"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => onChange('email', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="jean.dupont@email.com"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Nécessaire pour l'envoi des quittances</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone (optionnel)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => onChange('telephone', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Optionnel, utile pour les rappels SMS</p>
              </div>

            </div>
          </div>

          {/* Logement */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-[#2D3436]" />
              Logement
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse du logement *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.adresse_logement}
                    onChange={(e) => onChange('adresse_logement', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all resize-none"
                    rows={2}
                    placeholder="45 avenue des Champs, 75008 Paris"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Détail du logement (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.detail_adresse || ''}
                  onChange={(e) => onChange('detail_adresse', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                  placeholder="Appartement 2B, 3ème étage"
                />
              </div>
            </div>
          </div>

          {/* Montants */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Euro className="w-5 h-5 mr-2 text-[#2D3436]" />
              Montants
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loyer mensuel *
                </label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.loyer_mensuel}
                    onChange={(e) => onChange('loyer_mensuel', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="800.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charges mensuelles *
                </label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.charges_mensuelles}
                    onChange={(e) => onChange('charges_mensuelles', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#2D3436] focus:ring-2 focus:ring-[#2D3436]/20 transition-all"
                    placeholder="100.00"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration des rappels - PLAN AUTOMATIQUE */}
          {true && (
            <div className={`rounded-xl p-6 ${isBeforePayment ? 'bg-gray-50 border border-gray-300' : 'bg-blue-50 border border-blue-200'}`}>
              <h4 className={`font-semibold mb-4 flex items-center ${isBeforePayment ? 'text-gray-600' : 'text-gray-900'}`}>
                <Calendar className={`w-5 h-5 mr-2 ${isBeforePayment ? 'text-gray-400' : 'text-blue-600'}`} />
                {isBeforePayment ? 'Configuration des rappels (après paiement)' : 'Configurez votre rappel automatique'}
              </h4>

              {isBeforePayment && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    La configuration de la date et l'heure de rappel sera disponible après la finalisation du paiement. Vous pourrez alors personnaliser vos rappels automatiques dans votre tableau de bord.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 relative group">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isBeforePayment ? 'text-gray-400' : 'text-gray-700'}`}>
                      Date de rappel (jour du mois) {!isBeforePayment && '*'}
                    </label>
                    <div className="relative">
                      <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isBeforePayment ? 'text-gray-300' : 'text-gray-400'}`} />
                      <select
                        value={formData.date_rappel}
                        onChange={(e) => onChange('date_rappel', e.target.value)}
                        disabled={isBeforePayment}
                        className={`w-full pl-11 pr-4 py-3 rounded-lg border transition-all appearance-none ${
                          isBeforePayment
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                        required={!isBeforePayment}
                      >
                        {isBeforePayment ? (
                          <option value="">Configuration après paiement</option>
                        ) : (
                          Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day} du mois</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isBeforePayment ? 'text-gray-400' : 'text-gray-700'}`}>
                      Heure {!isBeforePayment && '*'}
                    </label>
                    <div className="relative">
                      <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isBeforePayment ? 'text-gray-300' : 'text-gray-400'}`} />
                      <select
                        value={formData.heure_rappel}
                        onChange={(e) => onChange('heure_rappel', e.target.value)}
                        disabled={isBeforePayment}
                        className={`w-full pl-11 pr-4 py-3 rounded-lg border transition-all appearance-none ${
                          isBeforePayment
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                        required={!isBeforePayment}
                      >
                        {isBeforePayment ? (
                          <option value="">Configuration après paiement</option>
                        ) : (
                          Array.from({ length: 24 }, (_, i) => i).map(hour => (
                            <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}h</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isBeforePayment ? 'text-gray-400' : 'text-gray-700'}`}>
                      Minutes {!isBeforePayment && '*'}
                    </label>
                    <div className="relative">
                      <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isBeforePayment ? 'text-gray-300' : 'text-gray-400'}`} />
                      <select
                        value={formData.minute_rappel}
                        onChange={(e) => onChange('minute_rappel', e.target.value)}
                        disabled={isBeforePayment}
                        className={`w-full pl-11 pr-4 py-3 rounded-lg border transition-all appearance-none ${
                          isBeforePayment
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                        }`}
                        required={!isBeforePayment}
                      >
                        {isBeforePayment ? (
                          <option value="">Configuration après paiement</option>
                        ) : (
                          Array.from({ length: 60 }, (_, i) => i).map(minute => (
                            <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {!isBeforePayment && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h5 className="font-semibold text-sm text-gray-900 mb-3">Fonctionnement :</h5>
                    <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                      <li>Vous recevez un rappel par SMS + e-mail à la date programmée</li>
                      <li>La quittance est générée et envoyée automatiquement quand vous validez en un clic (clic sur OUI)</li>
                      <li>Si vous ne validez pas (clic sur NON) vous pouvez envoyer une relance générée automatiquement au locataire</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Boutons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="px-6 py-3 rounded-lg bg-[#2D3436] hover:bg-[#6a9d7f] text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (isEditing ? 'Enregistrement...' : 'Ajout en cours...') : (isEditing ? 'Enregistrer' : 'Ajouter le locataire')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLocataireForm;
