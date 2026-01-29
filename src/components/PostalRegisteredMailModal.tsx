import React, { useState } from 'react';
import { X, Mail, CreditCard, Package } from 'lucide-react';

interface PostalRegisteredMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisionData: {
    nouveauLoyer: number;
    ancienLoyer: number;
    gainMensuel: number;
    irlAncien: number;
    irlNouveau: number;
    trimestre: number;
    anneeAncienne: number;
    anneeNouvelle: number;
  };
  dateBail?: string;
}

export default function PostalRegisteredMailModal({
  isOpen,
  onClose,
  revisionData,
  dateBail
}: PostalRegisteredMailModalProps) {
  const [baillorName, setBaillorName] = useState('');
  const [baillorAddress, setBaillorAddress] = useState('');
  const [baillorEmail, setBaillorEmail] = useState('');
  const [locataireName, setLocataireName] = useState('');
  const [locataireAddress, setLocataireAddress] = useState('');
  const [logementAddress, setLogementAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLocataireAddressChange = (address: string) => {
    setLocataireAddress(address);
    if (!logementAddress) {
      setLogementAddress(address);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!baillorName || !baillorAddress || !baillorEmail || !locataireName || !locataireAddress || !logementAddress) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      console.log('Envoi recommandé postal:', {
        baillorName,
        baillorAddress,
        baillorEmail,
        locataireName,
        locataireAddress,
        logementAddress,
        revisionData,
        dateBail
      });

      alert('Service en cours de développement. Vous serez redirigé vers le paiement Stripe pour 11,60€');

    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-[#ed7862]" />
              Envoi recommandé postal
            </h3>
            <p className="text-sm text-gray-600 mt-1">11,60€ TTC - Impression, mise sous pli et envoi par La Poste</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-sm">Vos coordonnées (bailleur)</h4>
              <input
                type="text"
                value={baillorName}
                onChange={(e) => setBaillorName(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                placeholder="Votre nom complet"
                required
              />
              <textarea
                value={baillorAddress}
                onChange={(e) => setBaillorAddress(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                placeholder="Votre adresse complète"
                rows={3}
                required
              />
              <input
                type="email"
                value={baillorEmail}
                onChange={(e) => setBaillorEmail(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                placeholder="Votre email (pour la confirmation)"
                required
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-sm">Coordonnées du locataire</h4>
              <input
                type="text"
                value={locataireName}
                onChange={(e) => setLocataireName(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                placeholder="Nom complet du locataire"
                required
              />
              <textarea
                value={locataireAddress}
                onChange={(e) => handleLocataireAddressChange(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                placeholder="Adresse du locataire"
                rows={3}
                required
              />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-2">Adresse du logement concerné</h4>
            <input
              type="text"
              value={logementAddress}
              onChange={(e) => setLogementAddress(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
              placeholder="Adresse complète du bien loué"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">Ce qui est inclus</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ Impression professionnelle de votre lettre</li>
              <li>✓ Mise sous pli et affranchissement</li>
              <li>✓ Envoi en recommandé avec AR</li>
              <li>✓ Vous recevez une copie du PDF par email</li>
              <li>✓ Suivi de l'envoi avec numéro de suivi La Poste</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-5 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#ed7862] hover:bg-[#e56651] text-white font-bold py-3 px-5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{loading ? 'Chargement...' : 'Payer 11,60€ et envoyer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
