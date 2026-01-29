import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TrendingUp, AlertCircle, Download, Mail, Package, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SEOHead from '../components/SEOHead';
import PDFEmailModal from '../components/PDFEmailModal';
import { captureEmail } from '../utils/analytics';

interface IRLIndex {
  annee: number;
  trimestre: number;
  valeur: number;
}

interface CalculResult {
  loyerActuel: number;
  nouveauLoyer: number;
  gainMensuel: number;
  gainAnnuel: number;
  irlAncien: number;
  irlNouveau: number;
  dateRevision: Date;
  trimestreUtilise: number;
  anneeAncienne: number;
  anneeNouvelle: number;
}

export default function IRLResultat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [calculResult, setCalculResult] = useState<CalculResult | null>(null);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [indices, setIndices] = useState<IRLIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPDFEmailModal, setShowPDFEmailModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEmail, setReminderEmail] = useState('');

  const loyerActuel = searchParams.get('loyer');
  const dateBail = searchParams.get('date');
  const trimestreIRL = searchParams.get('trimestre');

  useEffect(() => {
    loadIRLIndices();
  }, []);

  useEffect(() => {
    if (indices.length > 0 && loyerActuel && dateBail) {
      performCalculation();
    }
  }, [indices, loyerActuel, dateBail, trimestreIRL]);

  const loadIRLIndices = async () => {
    const { data, error } = await supabase
      .from('indices_irl')
      .select('*')
      .order('annee', { ascending: true })
      .order('trimestre', { ascending: true });

    if (!error && data) {
      setIndices(data);
    }
  };

  const getTrimestreFromDate = (date: Date): number => {
    const month = date.getMonth() + 1;
    if (month >= 1 && month <= 3) return 1;
    if (month >= 4 && month <= 6) return 2;
    if (month >= 7 && month <= 9) return 3;
    return 4;
  };

  const getIRLValue = (annee: number, trimestre: number): number | null => {
    const index = indices.find(i => i.annee === annee && i.trimestre === trimestre);
    return index ? index.valeur : null;
  };

  const performCalculation = () => {
    if (!loyerActuel || !dateBail) {
      navigate('/calcul-revision-loyer');
      return;
    }

    try {
      const loyer = parseFloat(loyerActuel);
      const dateSignature = new Date(dateBail);
      const today = new Date();

      let trimestre = trimestreIRL ? parseInt(trimestreIRL) : getTrimestreFromDate(dateSignature);

      const ageInMonths = (today.getTime() - dateSignature.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (ageInMonths < 12) {
        setShowWarning('La révision n\'est pas encore applicable (moins de 12 mois depuis la signature du bail).');
      } else if (ageInMonths > 24) {
        setShowWarning('La demande est en retard de plus d\'un an. La révision est probablement perdue pour cette période.');
      } else if (ageInMonths > 13) {
        setShowWarning('Votre demande est au delà des 1 an, mais la révision reste possible.');
      }

      const anneeAncienne = dateSignature.getFullYear();
      let anneeNouvelle = today.getFullYear();

      const irlAncien = getIRLValue(anneeAncienne, trimestre);
      let irlNouveau = getIRLValue(anneeNouvelle, trimestre);

      if (!irlNouveau) {
        anneeNouvelle = anneeNouvelle - 1;
        irlNouveau = getIRLValue(anneeNouvelle, trimestre);
      }

      if (!irlAncien || !irlNouveau) {
        navigate('/calcul-revision-loyer');
        return;
      }

      const nouveauLoyer = loyer * (irlNouveau / irlAncien);
      const gainMensuel = nouveauLoyer - loyer;
      const gainAnnuel = gainMensuel * 12;

      setCalculResult({
        loyerActuel: loyer,
        nouveauLoyer: Math.round(nouveauLoyer * 100) / 100,
        gainMensuel: Math.round(gainMensuel * 100) / 100,
        gainAnnuel: Math.round(gainAnnuel * 100) / 100,
        irlAncien,
        irlNouveau,
        dateRevision: today,
        trimestreUtilise: trimestre,
        anneeAncienne,
        anneeNouvelle
      });
    } catch (error) {
      console.error('Erreur calcul:', error);
      navigate('/calcul-revision-loyer');
    } finally {
      setLoading(false);
    }
  };

  const handlePDFEmailConfirm = async (email: string) => {
    console.log('Envoi PDF à:', email);
    alert(`PDF envoyé à ${email}. Vous recevrez également des conseils pour faciliter la gestion de vos quittances.`);
  };

  const handleSetReminder = () => {
    setShowReminderModal(true);
  };

  const handleSaveReminder = async () => {
    if (!reminderEmail || !calculResult) return;

    const dateRappel = new Date();
    dateRappel.setMonth(dateRappel.getMonth() + 1);

    const { error } = await supabase
      .from('rappels_nouveau_loyer')
      .insert({
        email: reminderEmail,
        nouveau_loyer: calculResult.nouveauLoyer,
        date_rappel: dateRappel.toISOString().split('T')[0],
        envoye: false
      });

    if (error) {
      alert('Erreur lors de l\'enregistrement du rappel');
    } else {
      alert('Rappel enregistré ! Vous recevrez un email au moment opportun.');
      setShowReminderModal(false);
      setReminderEmail('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CAA89]"></div>
          <p className="mt-4 text-gray-600">Calcul en cours...</p>
        </div>
      </div>
    );
  }

  if (!calculResult) {
    return null;
  }

  return (
    <>
      <SEOHead
        title="Résultat de votre révision de loyer IRL - Calcul gratuit"
        description="Découvrez le montant de votre nouveau loyer après révision IRL. Téléchargez votre lettre préécrite et envoyez-la en recommandé."
      />

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-2 lg:px-2">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#7CAA89]/10 rounded-2xl mb-2">
              <TrendingUp className="w-6 h-6 text-[#7CAA89]" />
            </div>
            <h1 className="text-1xl md:text-4xl font-bold text-gray-900 mb-">
              Résultat de votre révision de loyer
            </h1>
            <p className="font-[15px] font-bold font-text-gray-600 max-w32xl mx-auto leading-relaxed">
              N'oubliez pas de notifier vos locataires !   </p><span className="font-[15px]font-text-gray-600 max-w32xl mx-auto leading-relaxed">Avec notre outil gratuit, créez et recevez en pdf votre lettre remplie automatiquement<br /> et conforme en moins d'une minute.</span>
          
          </div>

          <div className="space-y-2">
          

            <div className="bg-gradient-to-br from-[#7CAA89] to-[#6a9479] rounded-2xl shadow-xl p-2 md:p-8 text-white">
              <h2 className="text-xl font-bold mb-6">Votre nouveau loyer</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-white/70 text-xs mb-2">Loyer actuel</p>
                  <p className="text-2xl font-bold">{calculResult.loyerActuel.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs mb-2">Nouveau loyer</p>
                  <p className="text-4xl font-bold">{calculResult.nouveauLoyer.toFixed(2)} €</p>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6 mb-6">
                <p className="text-white/80 text-sm mb-4">Votre gain potentiel</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-white/70 text-xs mb-2">Par mois</p>
                    <p className="text-4xl font-bold">+{calculResult.gainMensuel.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs mb-2">Par an</p>
                    <p className="text-4xl font-bold">+{calculResult.gainAnnuel.toFixed(2)} €</p>
                  </div>
                </div>
              
              </div>

              <div className="border-t border-white/20 pt-2">
                <p className="text-white/70 text-xs mb-3">Indices de référence (source INSEE)</p>
                <div className="grid md:grid-cols-2 gap-1 text-sm">
                  <div>
                    <p className="text-white/80">IRL {calculResult.anneeAncienne} T{calculResult.trimestreUtilise}
                    <span className="font-semibold">{calculResult.irlAncien}</span></p>
                  </div>
                  <div>
                    <p className="text-white/80">IRL {calculResult.anneeNouvelle} T{calculResult.trimestreUtilise}
                    <span className="font-semibold">{calculResult.irlNouveau}</span></p>
                  </div>
                </div>
              </div>
  {showWarning && (
              <div className="mt-6 pt-2 border-t border-white/20">
                <p className="text-white flex items-start text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  {showWarning}
                </p>
              </div>
            )}
              <div>
                <p className="text-white/90 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Sans un envoi de lettre recommandé de votre part, ce montant n'est pas automatiquement appliqué.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Notifier votre locataire
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Pour que la révision soit valable, elle doit être portée à la connaissance du locataire avec preuve d'envoi.
              </p>

              <div className="grid md:grid-cols-3 gap-3">
                <button
                  onClick={() => setShowPDFEmailModal(true)}
                  className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-[#7CAA89] text-gray-900 font-semibold py-4 px-4 rounded-xl transition-all"
                >
                  <Download className="w-6 h-6 mb-2 text-[#7CAA89]" />
                  <span className="text-sm text-center">Recevoir le PDF par email</span>
                  <span className="text-xs text-green-600 font-bold mt-1">GRATUIT</span>
                </button>

                <button
                  disabled
                  className="relative flex flex-col items-center justify-center bg-gray-100 border-2 border-gray-300 text-gray-400 font-semibold py-4 px-4 rounded-xl opacity-60 cursor-not-allowed"
                >
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    EN COURS
                  </div>
                  <Mail className="w-6 h-6 mb-2" />
                  <span className="text-sm text-center">Recommandé électronique</span>
                  <span className="text-xs font-bold mt-1">6,90€</span>
                </button>

                <button
                  disabled
                  className="relative flex flex-col items-center justify-center bg-gray-100 border-2 border-gray-300 text-gray-400 font-semibold py-4 px-4 rounded-xl opacity-60 cursor-not-allowed"
                >
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    EN COURS
                  </div>
                  <Package className="w-6 h-6 mb-2" />
                  <span className="text-sm text-center">Recommandé postal</span>
                  <span className="text-xs font-bold mt-1">11,60€</span>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Et après ?
              </h2>
              <p className="text-gray-700 mb-5 text-sm">
                Une fois le nouveau loyer appliqué, il devra être utilisé sur vos prochaines quittances.
                Nous vous rappellerons au bon moment pour éviter tout oubli.
              </p>
              <button
                onClick={handleSetReminder}
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-2.5 px-5 rounded-xl transition-colors border border-gray-200"
              >
                Me rappeler d'appliquer le nouveau loyer
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/calcul-revision-loyer')}
                className="text-gray-600 hover:text-gray-900 font-medium inline-flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Faire un nouveau calcul
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Configurer mon rappel
            </h3>
            <p className="text-gray-600 mb-5 text-sm">
              Entrez votre email pour recevoir un rappel d'appliquer le nouveau loyer sur vos prochaines quittances.
            </p>
            <input
              type="email"
              value={reminderEmail}
              onChange={(e) => {
                const value = e.target.value;
                setReminderEmail(value);
                captureEmail(value, 'irl_resultat', 'reminder_subscription');
              }}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0 mb-5"
              placeholder="votre@email.fr"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReminderModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2.5 px-5 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveReminder}
                className="flex-1 bg-[#7CAA89] hover:bg-[#6a9479] text-white font-bold py-2.5 px-5 rounded-xl"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {calculResult && dateBail && (
        <PDFEmailModal
          isOpen={showPDFEmailModal}
          onClose={() => setShowPDFEmailModal(false)}
          onConfirm={handlePDFEmailConfirm}
          revisionData={{
            nouveauLoyer: calculResult.nouveauLoyer,
            ancienLoyer: calculResult.loyerActuel,
            gainMensuel: calculResult.gainMensuel,
            gainAnnuel: calculResult.gainAnnuel
          }}
          letterData={{
            baillorName: '',
            baillorAddress: '',
            locataireName: '',
            locataireAddress: '',
            logementAddress: '',
            irlAncien: calculResult.irlAncien,
            irlNouveau: calculResult.irlNouveau,
            trimestre: calculResult.trimestreUtilise,
            anneeAncienne: calculResult.anneeAncienne,
            anneeNouvelle: calculResult.anneeNouvelle,
            dateBail
          }}
        />
      )}
    </>
  );
}
