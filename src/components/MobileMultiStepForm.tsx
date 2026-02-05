import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Home as HomeIcon, Euro, Shield, Check } from 'lucide-react';

interface FormData {
  baillorName: string;
  baillorAddress: string;
  baillorEmail: string;
  locataireName: string;
  logementAddress: string;
  locataireDomicileAddress: string;
  hasDifferentDomicile: boolean;
  loyer: string;
  charges: string;
  periode: string;
  isProrata: boolean;
  dateDebut: string;
  dateFin: string;
  typeCalcul: string;
}

interface MobileMultiStepFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isElectronicSignatureChecked: boolean;
  setIsElectronicSignatureChecked: React.Dispatch<React.SetStateAction<boolean>>;
  prorataAmounts: { loyer: number; charges: number; total: number };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  isLoading: boolean;
  validationErrors: string[];
}

const MobileMultiStepForm: React.FC<MobileMultiStepFormProps> = ({
  formData,
  setFormData,
  isElectronicSignatureChecked,
  setIsElectronicSignatureChecked,
  prorataAmounts,
  handleInputChange,
  handleBlur,
  handleSubmit,
  isLoading,
  validationErrors
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStepErrors = (step: number): string[] => {
    switch(step) {
      case 1:
        return validationErrors.filter(error =>
          error.includes('bailleur') || error.includes('email')
        );
      case 2:
        return validationErrors.filter(error =>
          error.includes('locataire') || error.includes('logement')
        );
      case 3:
        return validationErrors.filter(error =>
          error.includes('loyer') || error.includes('charges') || error.includes('date')
        );
      case 4:
        return validationErrors.filter(error =>
          error.includes('signature')
        );
      default:
        return [];
    }
  };

  const canProceedToNextStep = (step: number): boolean => {
    switch(step) {
      case 1:
        return formData.baillorName.trim() !== '' &&
               formData.baillorAddress.trim() !== '' &&
               formData.baillorEmail.trim() !== '';
      case 2:
        return formData.locataireName.trim() !== '' &&
               formData.logementAddress.trim() !== '';
      case 3:
        return formData.loyer.trim() !== '' &&
               formData.charges.trim() !== '';
      default:
        return true;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-[#2b2b2b]">
            Créer ma quittance
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            Étape {currentStep} / {totalSteps}
          </span>
        </div>

        <div className="flex gap-1">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step <= currentStep ? 'bg-[#7CAA89]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {getStepErrors(currentStep).length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-900 mb-1">Veuillez corriger :</p>
              {getStepErrors(currentStep).map((error, index) => (
                <p key={index} className="text-xs text-red-800">• {error}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-[#7CAA89] rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-bold text-[#2b2b2b]">Vos informations</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                  Votre nom complet *
                </label>
                <input
                  type="text"
                  name="baillorName"
                  value={formData.baillorName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                  Votre adresse complète *
                </label>
                <input
                  type="text"
                  name="baillorAddress"
                  value={formData.baillorAddress}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                  placeholder="Ex: 123 rue de la République, 75001 Paris"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                  Votre email *
                </label>
                <input
                  type="email"
                  name="baillorEmail"
                  value={formData.baillorEmail}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                  placeholder="Ex: jean.dupont@email.com"
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-[#7CAA89] rounded-lg flex items-center justify-center">
                  <HomeIcon className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-bold text-[#2b2b2b]">Informations locataire</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                  Nom du locataire *
                </label>
                <input
                  type="text"
                  name="locataireName"
                  value={formData.locataireName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                  placeholder="Ex: Marie Martin"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                  Adresse du bien loué *
                </label>
                <input
                  type="text"
                  name="logementAddress"
                  value={formData.logementAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                  placeholder="Ex: 45 avenue des Champs, 75008 Paris"
                  required
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasDifferentDomicile}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hasDifferentDomicile: e.target.checked,
                      locataireDomicileAddress: e.target.checked ? prev.locataireDomicileAddress : ''
                    }))}
                    className="w-4 h-4 text-[#7CAA89] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#7CAA89]/20 mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#415052] mb-0.5">
                      Adresse différente du domicile
                    </div>
                    <div className="text-[10px] text-[#545454]">
                      Cochez si le locataire habite ailleurs
                    </div>
                  </div>
                </label>
              </div>

              {formData.hasDifferentDomicile && (
                <div>
                  <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                    Adresse du domicile
                  </label>
                  <input
                    type="text"
                    name="locataireDomicileAddress"
                    value={formData.locataireDomicileAddress}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                    placeholder="Ex: 12 rue Victor Hugo, 75016 Paris"
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-[#7CAA89] rounded-lg flex items-center justify-center">
                  <Euro className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-bold text-[#2b2b2b]">Loyer & période</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                    Loyer mensuel (€) *
                  </label>
                  <input
                    type="number"
                    name="loyer"
                    value={formData.loyer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                    placeholder="800"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                    Charges (€) *
                  </label>
                  <input
                    type="number"
                    name="charges"
                    value={formData.charges}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                    placeholder="100"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {!formData.isProrata && (
                <div>
                  <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                    Période *
                  </label>
                  <select
                    name="periode"
                    value={formData.periode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all appearance-none bg-white text-sm"
                  >
                    {(() => {
                      const now = new Date();
                      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                      const options = [];
                      for (let i = -12; i <= 12; i++) {
                        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
                        const period = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                        options.push(<option key={i} value={period}>{period}</option>);
                      }
                      return options;
                    })()}
                  </select>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isProrata}
                    onChange={(e) => setFormData(prev => ({ ...prev, isProrata: e.target.checked }))}
                    className="w-4 h-4 text-[#7CAA89] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#7CAA89]/20 mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#415052] mb-0.5">
                      Calculer un prorata
                    </div>
                    <div className="text-[10px] text-[#545454]">
                      Pour une période spécifique
                    </div>
                  </div>
                </label>
              </div>

              {formData.isProrata && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                        Date d'entrée
                      </label>
                      <input
                        type="date"
                        name="dateDebut"
                        value={formData.dateDebut}
                        onChange={handleInputChange}
                        className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#545454] mb-1.5">
                        Date de sortie
                      </label>
                      <input
                        type="date"
                        name="dateFin"
                        value={formData.dateFin}
                        onChange={handleInputChange}
                        min={formData.dateDebut || undefined}
                        className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:border-[#7CAA89] focus:ring-2 focus:ring-[#7CAA89]/20 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {prorataAmounts.total > 0 && (
                    <div className="bg-[#7CAA89]/10 border border-[#7CAA89]/20 rounded-xl p-3">
                      <div className="text-xs font-semibold text-[#2b2b2b] mb-1">
                        Total prorata calculé
                      </div>
                      <div className="text-sm font-bold text-[#7CAA89]">
                        {prorataAmounts.total.toFixed(2)}€
                      </div>
                      <div className="text-[10px] text-[#545454] mt-1">
                        Loyer: {prorataAmounts.loyer.toFixed(2)}€ + Charges: {prorataAmounts.charges.toFixed(2)}€
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-[#7CAA89] rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-bold text-[#2b2b2b]">Validation</h4>
              </div>

              <div className="bg-[#7CAA89]/5 border border-[#7CAA89]/20 rounded-xl p-4 space-y-3">
                <h5 className="text-xs font-bold text-[#2b2b2b] mb-2">Récapitulatif</h5>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bailleur:</span>
                    <span className="font-semibold text-[#2b2b2b]">{formData.baillorName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Locataire:</span>
                    <span className="font-semibold text-[#2b2b2b]">{formData.locataireName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loyer:</span>
                    <span className="font-semibold text-[#2b2b2b]">
                      {formData.isProrata && prorataAmounts.loyer > 0
                        ? `${prorataAmounts.loyer.toFixed(2)}€`
                        : `${formData.loyer || '0'}€`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Charges:</span>
                    <span className="font-semibold text-[#2b2b2b]">
                      {formData.isProrata && prorataAmounts.charges > 0
                        ? `${prorataAmounts.charges.toFixed(2)}€`
                        : `${formData.charges || '0'}€`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#7CAA89]/20">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-semibold">Total:</span>
                      <span className="font-bold text-[#7CAA89] text-base">
                        {formData.isProrata && prorataAmounts.total > 0
                          ? `${prorataAmounts.total.toFixed(2)}€`
                          : `${(parseFloat(formData.loyer || '0') + parseFloat(formData.charges || '0')).toFixed(2)}€`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isElectronicSignatureChecked}
                    onChange={(e) => setIsElectronicSignatureChecked(e.target.checked)}
                    className="w-4 h-4 text-[#7CAA89] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#7CAA89]/20 mt-0.5"
                    required
                  />
                  <div>
                    <div className="text-sm font-bold text-[#2b2b2b] mb-1">
                      Signature électronique *
                    </div>
                    <div className="text-xs text-[#415052] leading-relaxed">
                      Je certifie que le paiement a été encaissé et j'approuve l'émission de la quittance.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex gap-2">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}

        {currentStep < totalSteps ? (
          <button
            onClick={nextStep}
            disabled={!canProceedToNextStep(currentStep)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              canProceedToNextStep(currentStep)
                ? 'bg-[#7CAA89] hover:bg-[#6b9378] text-white shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#ed7862] hover:bg-[#e56651] text-white font-bold text-sm shadow-lg transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Recevoir ma quittance</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileMultiStepForm;
