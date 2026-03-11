import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LocataireInfo {
  nom: string;
  prenom?: string;
  adresse_logement: string;
  detail_adresse?: string;
  email?: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
}

interface ProprietaireInfo {
  nom: string;
  prenom?: string;
  email: string;
  adresse: string;
}

const OwnerConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const proprietaireId = searchParams.get('proprietaireId');
  const locataireId = searchParams.get('locataireId');
  const mois = searchParams.get('mois');
  const token = searchParams.get('token');
  const action = searchParams.get('action');
  const autoExecute = searchParams.get('autoExecute') === 'true';

  const [locataire, setLocataire] = useState<LocataireInfo | null>(null);
  const [proprietaire, setProprietaire] = useState<ProprietaireInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoExecute && !loading && locataire && proprietaire && !processing && !success && !error) {
      if (action === 'send') {
        handlePaymentReceived();
      } else if (action === 'remind') {
        handleSendReminder();
      }
    }
  }, [autoExecute, loading, locataire, proprietaire, action]);

  const loadData = async () => {
    try {
      if (!proprietaireId || !locataireId) {
        setError('Lien invalide');
        setLoading(false);
        return;
      }

      // Charger les infos du locataire
      const { data: locataireData, error: locataireError } = await supabase
        .from('locataires')
        .select('nom, prenom, adresse_logement, detail_adresse, email, loyer_mensuel, charges_mensuelles')
        .eq('id', locataireId)
        .maybeSingle();

      if (locataireError || !locataireData) {
        setError('Locataire non trouvé');
        setLoading(false);
        return;
      }

      // Charger les infos du propriétaire
      const { data: proprietaireData, error: proprietaireError } = await supabase
        .from('proprietaires')
        .select('nom, prenom, email, adresse')
        .eq('id', proprietaireId)
        .maybeSingle();

      if (proprietaireError || !proprietaireData) {
        setError('Propriétaire non trouvé');
        setLoading(false);
        return;
      }

      setLocataire(locataireData);
      setProprietaire(proprietaireData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Erreur lors du chargement des données');
      setLoading(false);
    }
  };

  const handlePaymentReceived = async () => {
    setProcessing(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Envoyer la quittance au locataire avec BCC bailleur (mode auto_send)
      const response = await fetch(`${supabaseUrl}/functions/v1/send-quittance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'auto_send',
          source: searchParams.get('source') || 'modal_sms',
          locataireId: locataireId,
          nomProprietaire: proprietaire?.nom,
          prenomProprietaire: proprietaire?.prenom,
          baillorAddress: proprietaire?.adresse,
          baillorEmail: proprietaire?.email,
          locataireName: [locataire?.prenom, locataire?.nom].filter(Boolean).join(' ') || locataire?.nom || '',
          locataireEmail: locataire?.email,
          locataireDomicileAddress: locataire?.detail_adresse || '',
          logementAddress: locataire?.adresse_logement,
          loyer: locataire?.loyer_mensuel?.toString() || '0',
          charges: locataire?.charges_mensuelles?.toString() || '0',
          periode: mois || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          isElectronicSignature: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const montantTotal = (locataire?.loyer_mensuel || 0) + (locataire?.charges_mensuelles || 0);
        setSuccess(
          `Quittance envoyée avec succès !\n\n` +
          `📄 Récapitulatif :\n` +
          `• Locataire : ${locataire?.nom} ${locataire?.prenom || ''}\n` +
          `• Période : ${mois || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}\n` +
          `• Montant : ${montantTotal.toFixed(2)}€\n\n` +
          `✉️ Le locataire a reçu sa quittance par email.\n` +
          `📋 Une copie vous a été envoyée et elle est archivée dans votre historique.`
        );
      } else {
        setError(result.error || 'Erreur lors de l\'envoi de la quittance');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'envoi de la quittance');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReminder = async () => {
    setProcessing(true);
    setError(null);

    try {
      if (!locataire?.email) {
        setError('Email du locataire manquant');
        setProcessing(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const adresseLogement = [
        locataire.adresse_logement,
        locataire.adresse,
        locataire.detail_adresse,
      ]
        .filter(Boolean)
        .join(', ');

      // Envoyer un email de relance simple (pas la quittance PDF)
      const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locataireEmail: locataire.email,
          locataireName: `${locataire.prenom || ''} ${locataire.nom}`.trim(),
          baillorName: `${proprietaire?.prenom || ''} ${proprietaire?.nom || ''}`.trim() || 'Votre bailleur',
          loyer: locataire.loyer_mensuel || 0,
          charges: locataire.charges_mensuelles || 0,
          adresseLogement: adresseLogement || undefined,
          proprietaireEmail: proprietaire?.email || undefined,
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const montantTotal = (locataire?.loyer_mensuel || 0) + (locataire?.charges_mensuelles || 0);
        setSuccess(
          `Relance envoyée avec succès !\n\n` +
          `📄 Récapitulatif :\n` +
          `• Locataire : ${locataire.nom} ${locataire.prenom || ''}\n` +
          `• Période : ${mois || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}\n` +
          `• Montant : ${montantTotal.toFixed(2)}€\n\n` +
          `✉️ Le locataire a reçu une relance par email.\n` +
          `📋 Une copie vous a été envoyée.`
        );
      } else {
        setError(result.error || 'Erreur lors de l\'envoi de la relance');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'envoi de la relance');
    } finally {
      setProcessing(false);
    }
  };

  const getMessageForAction = () => {
    if (action === 'send') {
      return {
        title: 'Pack Automatique',
        message: 'Vous avez validé le paiement du loyer, la quittance est générée et envoyée automatiquement.'
      };
    } else if (action === 'remind') {
      return {
        title: 'Relance Automatique',
        message: 'La relance de paiement est en cours d\'envoi à votre locataire.'
      };
    }
    return {
      title: 'Traitement en cours',
      message: 'Veuillez patienter...'
    };
  };

  const { title, message } = getMessageForAction();

  if (loading || processing || success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100 animate-fadeIn">
          <div className="mb-5">
            {success ? (
              <CheckCircle className="w-16 h-16 text-gray-500 mx-auto animate-scaleIn" />
            ) : (
              <div className="relative w-16 h-16 mx-auto">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>

          <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line text-left">
            {success || message}
          </p>

          {!success && (
            <div className="mt-5 flex justify-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          {success && (
            <button
              onClick={() => window.close()}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <X className="w-5 h-5" />
              <span>Fermer</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error && !locataire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OwnerConfirmation;
