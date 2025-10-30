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
    caution_initiale?: string;
    date_rappel: string;
    heure_rappel: string;
    minute_rappel: string;
    periodicite: string;
  };
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

const AddLocataireForm: React.FC<AddLocataireFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 z-10">
          <h3 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Modifier le locataire' : 'Ajouter un locataire'} - Plan Automatique
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Envoi automatique de quittances selon la date de rappel
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-[#79ae91]" />
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
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all"
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
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all"
                    placeholder="jean.dupont@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => onChange('telephone', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all"
                    placeholder="06 12 34 56 78"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logement */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-[#79ae91]" />
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
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all resize-none"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all"
                  placeholder="Appartement 2B, 3ème étage"
                />
              </div>
            </div>
          </div>

          {/* Montants */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Euro className="w-5 h-5 mr-2 text-[#79ae91]" />
              Montants
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
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
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all"
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
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all"
                    placeholder="100.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caution (optionnel)
                </label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.caution_initiale || ''}
                    onChange={(e) => onChange('caution_initiale', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all"
                    placeholder="1600.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration des rappels - PLAN AUTOMATIQUE */}
          {true && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Configuration des rappels automatiques
              </h4>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de rappel (jour du mois) *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.date_rappel}
                        onChange={(e) => onChange('date_rappel', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none bg-white"
                        required
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day} du mois</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.heure_rappel}
                        onChange={(e) => onChange('heure_rappel', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none bg-white"
                        required
                      >
                        {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                          <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}h</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minutes *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.minute_rappel}
                        onChange={(e) => onChange('minute_rappel', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none bg-white"
                        required
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map(minute => (
                          <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-2">
                  📧 Le système enverra un email de vérification à cette date et heure pour confirmer le paiement
                </p>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h5 className="font-semibold text-sm text-gray-900 mb-2">Comment ça marche ?</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>✓ À la date définie, vous recevrez un email de vérification</li>
                    <li>✓ Confirmez le paiement du loyer dans l'email</li>
                    <li>✓ La quittance est générée et envoyée automatiquement au locataire</li>
                    <li>✓ Si pas de confirmation, un rappel est envoyé au locataire</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Périodicité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Périodicité du loyer
            </label>
            <select
              value={formData.periodicite}
              onChange={(e) => onChange('periodicite', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#79ae91] focus:ring-2 focus:ring-[#79ae91]/20 transition-all appearance-none bg-white"
            >
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
            </select>
          </div>
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
            className="px-6 py-3 rounded-lg bg-[#79ae91] hover:bg-[#6a9d7f] text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (isEditing ? 'Enregistrement...' : 'Ajout en cours...') : (isEditing ? 'Enregistrer' : 'Ajouter le locataire')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLocataireForm;
