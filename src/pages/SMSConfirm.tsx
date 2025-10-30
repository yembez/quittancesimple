import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Send, X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SMSConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [locataire, setLocataire] = useState<any>(null);
  const [proprietaire, setProprietaire] = useState<any>(null);
  const [showRelanceConfirm, setShowRelanceConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const action = searchParams.get('action');
  const proprietaireId = searchParams.get('proprietaireId');
  const locataireId = searchParams.get('locataireId');
  const mois = searchParams.get('mois') || '';
  const annee = searchParams.get('annee') || new Date().getFullYear().toString();

  useEffect(() => {
    console.log('📱 SMSConfirm loaded with params:', {
      action,
      proprietaireId,
      locataireId,
      mois,
      annee
    });
    loadData();
  }, [locataireId, proprietaireId]);

  const loadData = async () => {
    if (!locataireId || !proprietaireId) return;

    try {
      const { data: locataireData } = await supabase
        .from('locataires')
        .select('*')
        .eq('id', locataireId)
        .maybeSingle();

      const { data: proprietaireData } = await supabase
        .from('proprietaires')
        .select('*')
        .eq('id', proprietaireId)
        .maybeSingle();

      setLocataire(locataireData);
      setProprietaire(proprietaireData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handlePaymentReceived = async () => {
    setLoading(true);
    setStatus('idle');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // L'edge function attend les paramètres via GET (URL params)
      const url = `${supabaseUrl}/functions/v1/confirm-payment-received?action=send&locataireId=${locataireId}&proprietaireId=${proprietaireId}&mois=${encodeURIComponent(mois)}&annee=${annee}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      // L'edge function renvoie du HTML, pas du JSON
      const result = await response.text();

      if (response.ok) {
        setStatus('success');
        const montantTotal = ((locataire?.loyer_mensuel || 0) + (locataire?.charges_mensuelles || 0)).toFixed(2);
        setMessage(
          `Quittance envoyée avec succès !\n\n` +
          `📄 Récapitulatif :\n` +
          `• Locataire : ${locataire?.nom}\n` +
          `• Période : ${mois} ${annee}\n` +
          `• Montant : ${montantTotal}€\n\n` +
          `✉️ Le locataire a reçu sa quittance par email.\n` +
          `📋 Une copie vous a été envoyée et elle est archivée dans votre historique.`
        );
      } else {
        setStatus('error');
        setMessage('Erreur lors de l\'envoi');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentNotReceived = () => {
    setShowRelanceConfirm(true);
  };

  const handleSendReminder = async () => {
    setLoading(true);
    setStatus('idle');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!locataire?.email) {
        setStatus('error');
        setMessage('Email du locataire non renseigné');
        setLoading(false);
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locataireEmail: locataire.email,
          locataireName: locataire.nom,
          baillorName: proprietaire?.nom || 'Propriétaire',
          periode: mois,
          loyer: locataire.loyer_mensuel || 0,
          charges: locataire.charges_mensuelles || 0
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        const montantTotal = ((locataire?.loyer_mensuel || 0) + (locataire?.charges_mensuelles || 0)).toFixed(2);
        setMessage(
          `Relance envoyée avec succès !\n\n` +
          `📄 Récapitulatif :\n` +
          `• Locataire : ${locataire.nom}\n` +
          `• Période : ${mois} ${annee}\n` +
          `• Montant : ${montantTotal}€\n\n` +
          `✉️ Le locataire a reçu une relance par email.\n` +
          `📋 Une copie vous a été envoyée.`
        );
        setShowRelanceConfirm(false);
      } else {
        setStatus('error');
        setMessage(result.message || 'Erreur lors de l\'envoi');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.close();
  };

  if (!locataire || !proprietaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Confirmation de paiement
          </h1>
          <p className="text-sm text-gray-600">
            {mois} {annee}
          </p>
        </div>

        {/* Infos */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold">Propriétaire:</span> {proprietaire.nom}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold">Locataire:</span> {locataire.nom}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Montant:</span> {((locataire.loyer_mensuel || 0) + (locataire.charges_mensuelles || 0)).toFixed(2)}€
          </p>
        </div>

        {/* Status Message */}
        {status !== 'idle' && (
          <div className={`p-4 rounded-xl mb-6 ${
            status === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-medium whitespace-pre-line text-left ${
              status === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message}
            </p>
          </div>
        )}

        {/* Question principale */}
        {!showRelanceConfirm && status === 'idle' && (
          <div>
            <p className="text-center text-lg font-semibold text-gray-900 mb-6">
              Avez-vous reçu le paiement ?
            </p>

            {/* Boutons OUI / NON */}
            <div className="space-y-3">
              <button
                onClick={handlePaymentReceived}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-lg">OUI - Paiement reçu</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePaymentNotReceived}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <XCircle className="w-6 h-6" />
                <span className="text-lg">NON - Pas encore reçu</span>
              </button>
            </div>
          </div>
        )}

        {/* Confirmation relance */}
        {showRelanceConfirm && status === 'idle' && (
          <div>
            <p className="text-center text-lg font-semibold text-gray-900 mb-2">
              Envoyer une relance ?
            </p>
            <p className="text-center text-sm text-gray-600 mb-6">
              Un email de rappel sera envoyé à {locataire.nom}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSendReminder}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Send className="w-6 h-6" />
                    <span className="text-lg">Envoyer la relance</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowRelanceConfirm(false)}
                disabled={loading}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Bouton fermer après action */}
        {status !== 'idle' && (
          <button
            onClick={handleClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 mt-4"
          >
            <X className="w-5 h-5" />
            <span>Fermer</span>
          </button>
        )}

        {/* Bouton annuler (si pas d'action) */}
        {status === 'idle' && !showRelanceConfirm && (
          <button
            onClick={handleClose}
            className="w-full mt-4 text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors duration-200"
          >
            Annuler / Fermer
          </button>
        )}
      </div>
    </div>
  );
};

export default SMSConfirm;
