import React, { useState } from 'react';
import { X, Mail, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEmailCapture } from '../hooks/useEmailCapture';
import { trackPdfDownload } from '../utils/analytics';

interface PDFEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  revisionData: {
    nouveauLoyer: number;
    ancienLoyer: number;
    gainMensuel: number;
    gainAnnuel: number;
  };
  letterData: {
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

export default function PDFEmailModal({ isOpen, onClose, onConfirm, revisionData, letterData }: PDFEmailModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [baillorName, setBaillorName] = useState('');
  const [baillorAddress, setBaillorAddress] = useState('');
  const [locataireName, setLocataireName] = useState('');
  const [locataireAddress, setLocataireAddress] = useState('');
  const [logementAddress, setLogementAddress] = useState('');
  const [logementAddressManuallyEdited, setLogementAddressManuallyEdited] = useState(false);

  // Email capture hook
  const { handleEmailChange: captureEmailHook, markComplete } = useEmailCapture({
    pageSource: 'irl_resultat',
    formType: 'revision_letter'
  });

  const handleLocataireAddressChange = (address: string) => {
    setLocataireAddress(address);
    if (!logementAddressManuallyEdited) {
      setLogementAddress(address);
    }
  };

  const handleLogementAddressChange = (address: string) => {
    setLogementAddress(address);
    setLogementAddressManuallyEdited(true);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !baillorName || !baillorAddress || !locataireName || !locataireAddress || !logementAddress) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const { error: prospectError } = await supabase
        .from('prospects_revision_loyer')
        .insert({
          email,
          nouveau_loyer: revisionData.nouveauLoyer,
          ancien_loyer: revisionData.ancienLoyer,
          gain_mensuel: revisionData.gainMensuel,
          gain_annuel: revisionData.gainAnnuel,
          date_relance_2_semaines: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          date_relance_1_mois: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (prospectError) throw prospectError;

      const { generateRevisionLetterPDF } = await import('../utils/revisionLetterPdfGenerator');

      const pdfBlob = await generateRevisionLetterPDF({
        baillorName,
        baillorAddress,
        locataireName,
        locataireAddress,
        logementAddress,
        ancienLoyer: revisionData.ancienLoyer,
        nouveauLoyer: revisionData.nouveauLoyer,
        irlAncien: letterData.irlAncien,
        irlNouveau: letterData.irlNouveau,
        trimestre: letterData.trimestre,
        anneeAncienne: letterData.anneeAncienne,
        anneeNouvelle: letterData.anneeNouvelle,
        dateEffet: new Date()
      });

      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-revision-letter-email`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            nouveauLoyer: revisionData.nouveauLoyer,
            ancienLoyer: revisionData.ancienLoyer,
            gainMensuel: revisionData.gainMensuel,
            gainAnnuel: revisionData.gainAnnuel,
            pdfBase64: base64data
          })
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'envoi de l\'email');
        }

        // Track PDF download and mark capture as complete
        trackPdfDownload('irl_resultat', 'revision_letter');
        markComplete();

        onConfirm(email);
        onClose();
      };
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'envoi du PDF par email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Download className="w-5 h-5 mr-2 text-[#7CAA89]" />
            Recevoir la lettre par email
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-5 text-sm">
          Entrez vos coordonnées et celles du locataire et votre lettre conforme se crée automatiquement.
        </p>

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
            <textarea
              value={logementAddress}
              onChange={(e) => handleLogementAddressChange(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
              placeholder="Adresse complète du bien loué"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Se remplit automatiquement avec l'adresse du locataire (modifiable si différente)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Votre email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  captureEmailHook(value);
                }}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0"
                placeholder="votre@email.fr"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-900">
              Nous vous enverrons également des conseils pour faciliter la gestion de vos quittances.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2.5 px-5 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#7CAA89] hover:bg-[#6a9479] text-white font-bold py-2.5 px-5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Recevoir le PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
