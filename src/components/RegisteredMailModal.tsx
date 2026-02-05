import React, { useState } from 'react';
import { X, Mail, MapPin, User, AtSign, Check, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { generateRevisionLetterHTML } from '../utils/registeredMailLetterGenerator';

interface RegisteredMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisionData: {
    nouveauLoyer: number;
    ancienLoyer: number;
    gainMensuel: number;
  };
  letterData?: {
    baillorName: string;
    baillorAddress: string;
    locataireName: string;
    locataireAddress: string;
    logementAddress: string;
    irlAncien: number;
    irlNouveau: number;
    trimestre: number;
    anneeAncienne: number;
    anneeNouvelle: number;
    dateBail?: string;
  };
}

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export default function RegisteredMailModal({ isOpen, onClose, revisionData, letterData }: RegisteredMailModalProps) {
  const [step, setStep] = useState(1);
  const [sendType, setSendType] = useState<'electronique' | 'postal'>('electronique');
  const [formData, setFormData] = useState({
    locataireNom: '',
    locataireAdresse: '',
    locataireEmail: '',
    baillorNom: '',
    baillorAdresse: '',
    baillorEmail: '',
  });
  const [processing, setProcessing] = useState(false);

  const prices = {
    electronique: { ht: 5.75, ttc: 6.90 },
    postal: { ht: 10.75, ttc: 12.90 }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!formData.locataireNom || !formData.locataireAdresse) {
        alert('Veuillez remplir les coordonnées du locataire');
        return;
      }
      if (sendType === 'electronique' && !formData.locataireEmail) {
        alert('L\'email du locataire est obligatoire pour un envoi électronique');
        return;
      }
      if (!formData.baillorNom || !formData.baillorAdresse || !formData.baillorEmail) {
        alert('Veuillez remplir toutes vos coordonnées');
        return;
      }
      setStep(3);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Vous devez être connecté pour effectuer un paiement');
        setProcessing(false);
        return;
      }

      const { data: proprietaire } = await supabase
        .from('proprietaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!proprietaire) {
        alert('Profil propriétaire introuvable');
        setProcessing(false);
        return;
      }

      const priceAmount = Math.round(prices[sendType].ttc * 100);

      let documentContent = '';
      if (letterData) {
        documentContent = generateRevisionLetterHTML({
          baillorName: formData.baillorNom,
          baillorAddress: formData.baillorAdresse,
          locataireName: formData.locataireNom,
          locataireAddress: formData.locataireAdresse,
          logementAddress: letterData.logementAddress,
          ancienLoyer: revisionData.ancienLoyer,
          nouveauLoyer: revisionData.nouveauLoyer,
          irlAncien: letterData.irlAncien,
          irlNouveau: letterData.irlNouveau,
          trimestre: letterData.trimestre,
          anneeAncienne: letterData.anneeAncienne,
          anneeNouvelle: letterData.anneeNouvelle,
          dateEffet: new Date(),
          dateBail: letterData.dateBail,
        });
      }

      // Créer d'abord la request en DB avec le document HTML complet
      const { data: mailRequest, error: mailRequestError } = await supabase
        .from('registered_mail_requests')
        .insert({
          proprietaire_id: proprietaire.id,
          baillor_name: formData.baillorNom,
          baillor_address: formData.baillorAdresse,
          baillor_email: formData.baillorEmail,
          locataire_name: formData.locataireNom,
          locataire_address: formData.locataireAdresse,
          locataire_email: formData.locataireEmail || null,
          logement_address: letterData?.logementAddress || '',
          ancien_loyer: revisionData.ancienLoyer,
          nouveau_loyer: revisionData.nouveauLoyer,
          irl_ancien: letterData?.irlAncien || 0,
          irl_nouveau: letterData?.irlNouveau || 0,
          trimestre: letterData?.trimestre || 1,
          annee_ancienne: letterData?.anneeAncienne || new Date().getFullYear(),
          annee_nouvelle: letterData?.anneeNouvelle || new Date().getFullYear(),
          date_bail: letterData?.dateBail || null,
          send_mode: sendType,
          document_html: documentContent,
          status: 'pending_payment',
        })
        .select()
        .single();

      if (mailRequestError || !mailRequest) {
        console.error('Erreur création request:', mailRequestError);
        throw new Error('Erreur lors de la création de la demande');
      }

      // Passer seulement des metadata courtes à Stripe (max 200 chars par value)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: null,
          mode: 'payment',
          metadata: {
            type: 'registered_mail',
            request_id: mailRequest.id,
            mail_type: sendType,
            proprietaire_id: proprietaire.id,
          },
          lineItems: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Courrier recommandé ${sendType === 'electronique' ? 'électronique' : 'postal'}`,
                description: `Envoi de lettre de révision de loyer à ${formData.locataireNom}`,
              },
              unit_amount: priceAmount,
            },
            quantity: 1,
          }],
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('URL de paiement manquante');
      }

      window.location.href = url;
    } catch (error) {
      console.error('Erreur paiement:', error);
      alert('Erreur lors du paiement');
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Envoi en recommandé
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Étape {step} sur 3
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#7CAA89]/10 to-[#6a9479]/10 rounded-xl p-6 border border-[#7CAA89]/20">
                <h4 className="font-bold text-gray-900 mb-3">Récapitulatif de votre révision</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Loyer actuel</p>
                    <p className="text-lg font-bold text-gray-900">{revisionData.ancienLoyer.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nouveau loyer</p>
                    <p className="text-lg font-bold text-[#7CAA89]">{revisionData.nouveauLoyer.toFixed(2)} €</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Gain mensuel</p>
                    <p className="text-2xl font-bold text-[#7CAA89]">+{revisionData.gainMensuel.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-4">Choisissez votre mode d'envoi</h4>

                <div className="space-y-3">
                  <button
                    onClick={() => setSendType('electronique')}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      sendType === 'electronique'
                        ? 'border-[#7CAA89] bg-[#7CAA89]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Mail className="w-5 h-5 text-[#7CAA89]" />
                          <h5 className="font-bold text-gray-900">Recommandé électronique</h5>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Rapide et avec preuve d'envoi et de réception
                        </p>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-bold text-gray-900">{prices.electronique.ttc.toFixed(2)} €</span>
                          <span className="text-sm text-gray-500">TTC</span>
                        </div>
                      </div>
                      {sendType === 'electronique' && (
                        <div className="w-6 h-6 bg-[#7CAA89] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setSendType('postal')}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      sendType === 'postal'
                        ? 'border-[#7CAA89] bg-[#7CAA89]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-5 h-5 text-[#ed7862]" />
                          <h5 className="font-bold text-gray-900">Recommandé postal</h5>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Courrier papier via La Poste
                        </p>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-bold text-gray-900">{prices.postal.ttc.toFixed(2)} €</span>
                          <span className="text-sm text-gray-500">TTC</span>
                        </div>
                      </div>
                      {sendType === 'postal' && (
                        <div className="w-6 h-6 bg-[#7CAA89] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="w-full bg-[#7CAA89] hover:bg-[#6a9479] text-white font-bold py-4 px-6 rounded-xl transition-colors"
              >
                Continuer
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#7CAA89]" />
                  Coordonnées du locataire
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.locataireNom}
                      onChange={(e) => handleInputChange('locataireNom', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse postale complète *
                    </label>
                    <textarea
                      value={formData.locataireAdresse}
                      onChange={(e) => handleInputChange('locataireAdresse', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                      placeholder="123 Rue de la République, 75001 Paris"
                      rows={3}
                      required
                    />
                  </div>
                  {sendType === 'electronique' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.locataireEmail}
                        onChange={(e) => handleInputChange('locataireEmail', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                        placeholder="jean.dupont@email.fr"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <AtSign className="w-5 h-5 mr-2 text-[#ed7862]" />
                  Vos coordonnées (bailleur)
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.baillorNom}
                      onChange={(e) => handleInputChange('baillorNom', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                      placeholder="Marie Martin"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse postale *
                    </label>
                    <textarea
                      value={formData.baillorAdresse}
                      onChange={(e) => handleInputChange('baillorAdresse', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                      placeholder="456 Avenue des Champs, 75008 Paris"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email (confirmation et suivi) *
                    </label>
                    <input
                      type="email"
                      value={formData.baillorEmail}
                      onChange={(e) => handleInputChange('baillorEmail', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                      placeholder="marie.martin@email.fr"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-4 px-6 rounded-xl transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 bg-[#7CAA89] hover:bg-[#6a9479] text-white font-bold py-4 px-6 rounded-xl transition-colors"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                  Récapitulatif de votre commande
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type d'envoi:</span>
                    <span className="font-semibold text-gray-900">
                      {sendType === 'electronique' ? 'Recommandé électronique' : 'Recommandé postal'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destinataire:</span>
                    <span className="font-semibold text-gray-900">{formData.locataireNom}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-blue-200">
                    <span className="font-bold text-gray-900">Total TTC:</span>
                    <span className="text-2xl font-bold text-[#7CAA89]">
                      {prices[sendType].ttc.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-900">
                  L'envoi est réalisé par courrier recommandé, électronique ou postal, via un prestataire certifié.
                  Une preuve d'envoi est conservée.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-4 px-6 rounded-xl transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="flex-1 bg-[#ed7862] hover:bg-[#e56651] text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
                >
                  {processing ? 'Traitement...' : 'Payer et envoyer'}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Votre recommandé sera pris en charge immédiatement après paiement.
                Vous recevrez une confirmation par email avec votre preuve d'envoi.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
