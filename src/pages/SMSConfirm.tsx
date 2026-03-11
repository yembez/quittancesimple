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
  const isDemo = searchParams.get('demo') === '1';

  useEffect(() => {
    console.log('📱 SMSConfirm loaded with params:', {
      action,
      proprietaireId,
      locataireId,
      mois,
      annee,
      isDemo
    });
    if (isDemo) {
      setLocataire({
        id: 'demo-loc',
        nom: 'Dupont',
        prenom: 'Marie',
        email: 'marie.dupont@exemple.fr',
        loyer_mensuel: 650,
        charges_mensuelles: 45,
        adresse: '12 rue Example, 75001 Paris',
        adresse_logement: '12 rue Example, 75001 Paris',
        detail_adresse: ''
      });
      setProprietaire({
        id: 'demo-prop',
        nom: 'Martin',
        prenom: 'Jean',
        email: 'jean.martin@exemple.fr',
        adresse: '5 avenue Test, 69000 Lyon'
      });
      return;
    }
    loadData();
  }, [locataireId, proprietaireId, isDemo]);

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

      const periode = `${mois} ${annee}`;
      const loyer = locataire?.loyer_mensuel || 0;
      const charges = locataire?.charges_mensuelles || 0;
      const montantTotal = loyer + charges;

      const nomCompletLocataire = [locataire?.prenom, locataire?.nom].filter(Boolean).join(' ') || locataire?.nom || '';
      const nomCompletProprietaire = [proprietaire?.prenom, proprietaire?.nom].filter(Boolean).join(' ') || proprietaire?.nom || 'Propriétaire';
      
      const payload = {
        locataireId: locataireId,
        locataireEmail: locataire?.email,
        locataireName: nomCompletLocataire,
        locataireDomicileAddress: locataire?.detail_adresse || '',
        logementAddress: locataire?.adresse_logement || locataire?.adresse || '',
        baillorEmail: proprietaire?.email,
        baillorName: nomCompletProprietaire,
        baillorAddress: proprietaire?.adresse || '',
        nomProprietaire: proprietaire?.nom || '',
        prenomProprietaire: proprietaire?.prenom || '',
        periode: periode,
        loyer: loyer.toString(),
        charges: charges.toString(),
        isElectronicSignature: true
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/send-quittance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        setMessage(
          `Quittance envoyée avec succès !\n\n` +
          `📄 Récapitulatif :\n` +
          `• Locataire : ${locataire?.nom}\n` +
          `• Période : ${mois} ${annee}\n` +
          `• Montant : ${montantTotal.toFixed(2)}€\n\n` +
          `✉️ Le locataire a reçu sa quittance par email.\n` +
          `📋 Une copie vous a été envoyée et elle est archivée dans votre historique.`
        );
      } else {
        setStatus('error');
        setMessage(result.error || 'Erreur lors de l\'envoi');
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

      const adresseLogement = [locataire.adresse_logement, locataire.adresse, locataire.detail_adresse].filter(Boolean).join(', ') || '';
      const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locataireEmail: locataire.email,
          locataireName: [locataire.prenom, locataire.nom].filter(Boolean).join(' ') || locataire.nom,
          baillorName: proprietaire?.nom || 'Propriétaire',
          loyer: locataire.loyer_mensuel || 0,
          charges: locataire.charges_mensuelles || 0,
          adresseLogement: adresseLogement || 'ce logement',
          proprietaireEmail: proprietaire?.email || undefined
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
    // Essayer de fermer la fenêtre (fonctionne si ouverte via JS)
    window.close();

    // Si la fenêtre ne se ferme pas (ouvert depuis un lien), afficher un message
    setTimeout(() => {
      setStatus('success');
      setMessage('✅ Action terminée.\n\nVous pouvez maintenant fermer cet onglet et retourner à votre téléphone.');
    }, 100);
  };

  if (!locataire || !proprietaire) {
    return (
      <div className="min-h-screen bg-[#f7f5fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.08)] p-8 max-w-md w-full text-center border border-[#e8e7ef]">
          <Loader2 className="w-12 h-12 text-[#212a3e] animate-spin mx-auto mb-4" />
          <p className="text-[#5e6478]">Chargement...</p>
        </div>
      </div>
    );
  }

  const nomCompletLocataire = [locataire.prenom, locataire.nom].filter(Boolean).join(' ') || locataire.nom || '';
  const adresseLocataire = [locataire.adresse_logement || locataire.adresse, locataire.detail_adresse].filter(Boolean).join(', ') || '';
  const locataireAffichage = adresseLocataire ? `${nomCompletLocataire} – ${adresseLocataire}` : nomCompletLocataire;
  const moisAffiche = mois ? mois.charAt(0).toUpperCase() + mois.slice(1).toLowerCase() : mois;
  const montantTotal = ((locataire.loyer_mensuel || 0) + (locataire.charges_mensuelles || 0)).toFixed(2);

  return (
    <div className="min-h-screen bg-white flex flex-col min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 flex flex-col items-center px-3 py-4 sm:px-6 sm:py-6 min-h-0 w-full">
        <div className="w-full max-w-md min-w-0 flex flex-col flex-1 min-h-0">
          {/* Section haute : titre + infos — centrée verticalement et horizontalement, remplit l'espace selon la hauteur */}
          <div className="flex-1 flex flex-col justify-center items-center min-h-0 py-[clamp(0.5rem,4vh,2rem)]">
            <div className="w-full flex-shrink-0 text-center mx-auto">
              {/* Titre : "Quittance prête" + ":" sur une ligne, puis mois/année — taille fluide dès 360px */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-[clamp(1.2rem,4vw+1rem,1.875rem)] font-bold text-[#212a3e] mb-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                  Quittance prête :
                </h1>
                <p className="text-[clamp(1rem,2.2vw+0.8rem,1.25rem)] text-[#5e6478] font-medium mt-0.5">
                  {moisAffiche} {annee}
                </p>
              </div>

              {/* Bloc infos — texte fluide dès 360px */}
              <div className="bg-[#e8f4f8] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#cce5ec]/60 text-left">
                <p className="text-[#212a3e] text-[clamp(0.875rem,1.8vw+0.7rem,1.0625rem)] font-medium mb-2 break-words">
                  <span className="font-semibold">Locataire :</span> {locataireAffichage}
                </p>
                <p className="text-[#212a3e] text-[clamp(0.875rem,1.8vw+0.7rem,1.0625rem)] font-medium">
                  <span className="font-semibold">Montant :</span> {montantTotal}€
                </p>
              </div>
            </div>
          </div>

          {/* Section basse : boutons — positionnée pour accessibilité pouce */}
          <div className="flex-shrink-0 flex flex-col justify-end min-h-0">
            {/* Message statut (succès / erreur) */}
            {status !== 'idle' && (
              <div className={`p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 ${
                status === 'success'
                  ? 'bg-[#e8f4f8] border border-[#cce5ec]'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm font-medium whitespace-pre-line text-left ${
                  status === 'success' ? 'text-[#212a3e]' : 'text-red-800'
                }`}>
                  {message}
                </p>
              </div>
            )}

            {/* Question + boutons principaux — "Valider l'envoi ?" en taille fluide */}
            {!showRelanceConfirm && status === 'idle' && (
              <div className="mb-2 sm:mb-3">
                <p className="text-center text-[clamp(1.0625rem,2.5vw+0.85rem,1.375rem)] font-bold text-[#212a3e] mb-3 sm:mb-4">
                  Valider l'envoi ?
                </p>

              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handlePaymentReceived}
                  disabled={loading}
                  className="w-full bg-[#4a732f] hover:bg-[#3d6228] text-white font-bold py-3 px-4 sm:py-4 sm:px-5 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin shrink-0" />
                  ) : (
                    <>
                      <span className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2} />
                      </span>
                      <span className="flex-1 flex flex-col items-center justify-center leading-tight text-center min-w-0">
                        <span className="text-xl sm:text-2xl md:text-3xl">OUI - Envoyer</span>
                        <span className="text-sm sm:text-base font-semibold mt-0.5">la quittance</span>
                      </span>
                      <span className="w-8 sm:w-10 shrink-0" aria-hidden />
                    </>
                  )}
                </button>

                <button
                  onClick={handlePaymentNotReceived}
                  disabled={loading}
                  className="w-full bg-[#e07a5f] hover:bg-[#c96a50] text-white font-bold py-3 px-4 sm:py-4 sm:px-5 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <span className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                    <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2} />
                  </span>
                  <span className="flex-1 flex flex-col items-center justify-center leading-tight text-center min-w-0">
                    <span className="text-xl sm:text-2xl md:text-3xl">NON - Relancer</span>
                    <span className="text-sm sm:text-base font-semibold mt-0.5">le locataire</span>
                  </span>
                  <span className="w-8 sm:w-10 shrink-0" aria-hidden />
                </button>
              </div>
            </div>
          )}

            {/* Confirmation relance */}
            {showRelanceConfirm && status === 'idle' && (
              <div className="mb-2 sm:mb-3">
                <p className="text-center text-base sm:text-lg font-bold text-[#212a3e] mb-1">
                  Envoyer une relance ?
                </p>
                <p className="text-center text-xs sm:text-sm text-[#5e6478] mb-3 sm:mb-4">
                  Un email de rappel sera envoyé à {nomCompletLocataire}
                </p>

              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handleSendReminder}
                  disabled={loading}
                  className="w-full bg-[#4a732f] hover:bg-[#3d6228] text-white font-bold py-3 px-4 sm:py-4 sm:px-5 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all duration-200 flex items-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin shrink-0" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 shrink-0" />
                      <span className="flex-1 text-center">Envoyer la relance</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowRelanceConfirm(false)}
                  disabled={loading}
                  className="w-full bg-transparent border-2 border-[#5e6478] text-[#5e6478] hover:bg-[#e8e7ef]/50 font-semibold py-2.5 px-4 sm:py-3 sm:px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full bg-[#4a732f] hover:bg-[#3d6228] text-white font-bold py-3 px-4 sm:py-4 sm:px-5 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all duration-200 flex items-center gap-2 sm:gap-3 mb-2 shadow-lg"
              >
                <X className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-center">Fermer cet onglet</span>
              </button>
            )}

            {/* Lien Annuler / Fermer — taille fluide dès 360px, toujours visible */}
            {status === 'idle' && !showRelanceConfirm && (
              <button
                onClick={handleClose}
                className="w-full mb-2 text-[clamp(0.75rem,1.2vw+0.65rem,0.9375rem)] text-[#5e6478] hover:text-[#212a3e] font-medium py-2 transition-colors duration-200"
              >
                Annuler / Fermer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer — quittancesimple.fr — padding safe area */}
      <footer className="py-3 sm:py-4 text-center border-t border-[#e8e7ef] flex-shrink-0">
        <a href="https://quittancesimple.fr" className="text-xs sm:text-sm text-[#212a3e] font-medium hover:underline" target="_blank" rel="noopener noreferrer">
          quittancesimple.fr
        </a>
      </footer>
    </div>
  );
};

export default SMSConfirm;
