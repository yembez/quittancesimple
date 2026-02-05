import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

interface RevisionLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisionData: {
    nouveauLoyer: number;
    ancienLoyer: number;
    gainMensuel: number;
    gainAnnuel: number;
    irlAncien: number;
    irlNouveau: number;
    trimestre: number;
    anneeAncienne: number;
    anneeNouvelle: number;
  };
}

export default function RevisionLetterModal({ isOpen, onClose, revisionData }: RevisionLetterModalProps) {
  const [loading, setLoading] = useState(false);
  const [baillorName, setBaillorName] = useState('');
  const [baillorAddress, setBaillorAddress] = useState('');
  const [locataireName, setLocataireName] = useState('');
  const [locataireAddress, setLocataireAddress] = useState('');
  const [logementAddress, setLogementAddress] = useState('');
  const [logementAddressManuallyEdited, setLogementAddressManuallyEdited] = useState(false);

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

  const handleDownloadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baillorName || !baillorAddress || !locataireName || !locataireAddress || !logementAddress) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const { generateRevisionLetterPDF } = await import('../utils/revisionLetterPdfGenerator');

      const pdfBlob = await generateRevisionLetterPDF({
        baillorName,
        baillorAddress,
        locataireName,
        locataireAddress,
        logementAddress,
        ancienLoyer: revisionData.ancienLoyer,
        nouveauLoyer: revisionData.nouveauLoyer,
        irlAncien: revisionData.irlAncien,
        irlNouveau: revisionData.irlNouveau,
        trimestre: revisionData.trimestre,
        anneeAncienne: revisionData.anneeAncienne,
        anneeNouvelle: revisionData.anneeNouvelle,
        dateEffet: new Date()
      });

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lettre_revision_loyer_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('✅ Lettre téléchargée avec succès !');
      onClose();

      setBaillorName('');
      setBaillorAddress('');
      setLocataireName('');
      setLocataireAddress('');
      setLogementAddress('');
      setLogementAddressManuallyEdited(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la génération du PDF');
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
            Télécharger la lettre de révision
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-5 text-sm">
          Remplissez les informations ci-dessous pour générer votre lettre de révision IRL conforme.
        </p>

        <form onSubmit={handleDownloadPDF} className="space-y-5">
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

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-900">
              La lettre sera générée selon les normes en vigueur avec les indices IRL officiels de l'INSEE.
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
              className="flex-1 bg-[#7CAA89] hover:bg-[#6a9479] text-white font-bold py-2.5 px-5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <span>Génération...</span>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  <span>Télécharger le PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
