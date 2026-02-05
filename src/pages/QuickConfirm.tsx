import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const QuickConfirm = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Ouvrir la popup immédiatement
    const action = searchParams.get('action');
    const proprietaireId = searchParams.get('proprietaireId');
    const locataireId = searchParams.get('locataireId');
    const mois = searchParams.get('mois');
    const annee = searchParams.get('annee');
    const source = searchParams.get('source');

    const popupUrl = `/owner-confirmation?action=${action}&proprietaireId=${proprietaireId}&locataireId=${locataireId}&mois=${encodeURIComponent(mois || '')}&annee=${annee}&autoExecute=true&source=${source || 'email'}`;

    // Ouvrir une popup centrée
    const width = 500;
    const height = 650;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      popupUrl,
      'QuittanceConfirmation',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );

    // Si la popup s'ouvre, fermer la page intermédiaire après 1 seconde
    if (popup) {
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ouverture...</h2>
        <p className="text-sm text-gray-600">
          Une fenêtre popup va s'ouvrir
        </p>
        <p className="text-xs text-gray-500 mt-4">
          Si la popup ne s'ouvre pas, vérifiez que les popups ne sont pas bloquées
        </p>
      </div>
    </div>
  );
};

export default QuickConfirm;
