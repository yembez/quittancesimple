import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function ShortLinkRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const resolveLink = async () => {
      if (!code) {
        setError('Code invalide');
        return;
      }

      try {
        // Normaliser en majuscules car les codes sont générés en majuscules
        const normalizedCode = code.toUpperCase();
        console.log('🔍 Resolving short link:', normalizedCode);

        const { data, error } = await supabase
          .from('short_links')
          .select('*')
          .eq('id', normalizedCode)
          .maybeSingle();

        console.log('📊 Short link data:', data);

        if (error || !data) {
          console.error('❌ Error fetching short link:', error);
          setError('Lien introuvable ou expiré');
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          console.error('⏰ Link expired:', data.expires_at);
          setError('Ce lien a expiré');
          return;
        }

        await supabase
          .from('short_links')
          .update({ used_at: new Date().toISOString() })
          .eq('id', normalizedCode);

        const redirectUrl = `/sms-confirm?action=${data.action}&proprietaireId=${data.proprietaire_id}&locataireId=${data.locataire_id}&mois=${encodeURIComponent(data.mois)}&annee=${data.annee}&source=${data.source}`;

        console.log('➡️ Redirecting to:', redirectUrl);
        navigate(redirectUrl, { replace: true });
      } catch (err) {
        console.error('Erreur résolution lien:', err);
        setError('Erreur lors de la redirection');
      }
    };

    resolveLink();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  );
}
