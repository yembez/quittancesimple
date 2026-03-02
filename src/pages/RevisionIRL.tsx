import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Calculator, AlertCircle, Euro, Calendar, Bell, X, Check, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import RevisionLetterModal from '../components/RevisionLetterModal';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';

interface IRLIndex {
  annee: number;
  trimestre: number;
  valeur: number;
}

interface IRLReminder {
  id: string;
  reminder_date: string;
  status: string;
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

export default function RevisionIRL() {
  const navigate = useNavigate();
  const { proprietaire } = useEspaceBailleur();
  const proprietaireId = proprietaire?.id ?? '';
  const proprietaireEmail = proprietaire?.email ?? '';
  const [planType, setPlanType] = useState<string>('');
  const [loyerActuel, setLoyerActuel] = useState('');
  const [trimestreSelectionne, setTrimestreSelectionne] = useState('');
  const [moisSelectionne, setMoisSelectionne] = useState('');
  const [anneeSelectionnee, setAnneeSelectionnee] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculResult, setCalculResult] = useState<CalculResult | null>(null);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [indices, setIndices] = useState<IRLIndex[]>([]);

  const [reminderDate, setReminderDate] = useState('');
  const [existingReminder, setExistingReminder] = useState<IRLReminder | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState(false);
  const [showRevisionLetterModal, setShowRevisionLetterModal] = useState(false);

  useEffect(() => {
    loadIRLIndices();
  }, []);

  useEffect(() => {
    if (proprietaire?.plan_type === 'free') {
      navigate(`/free-dashboard?email=${encodeURIComponent(proprietaire.email || '')}`);
      return;
    }
    if (proprietaire?.plan_type) {
      setPlanType(proprietaire.plan_type);
    }
  }, [proprietaire?.plan_type, proprietaire?.email, navigate]);

  useEffect(() => {
    if (proprietaireId) {
      loadExistingReminder();
    }
  }, [proprietaireId]);

  // Préremplir le loyer actuel depuis le premier locataire (éditable)
  useEffect(() => {
    if (!proprietaireId) return;
    let cancelled = false;
    (async () => {
      const { data: locs } = await supabase
        .from('locataires')
        .select('loyer_mensuel')
        .eq('proprietaire_id', proprietaireId)
        .order('created_at', { ascending: true })
        .limit(1);
      if (cancelled || !locs?.length) return;
      const loyer = locs[0].loyer_mensuel;
      if (loyer != null && loyer > 0) {
        setLoyerActuel((prev) => (prev === '' ? String(loyer) : prev));
      }
    })();
    return () => { cancelled = true; };
  }, [proprietaireId]);

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

  const loadExistingReminder = async () => {
    if (!proprietaireId) return;

    const { data, error } = await supabase
      .from('irl_reminders')
      .select('*')
      .eq('proprietaire_id', proprietaireId)
      .eq('status', 'scheduled')
      .maybeSingle();

    if (!error && data) {
      setExistingReminder(data);
      setReminderDate(data.reminder_date);
    }
  };

  const generateTrimestreOptions = () => {
    const options = [];
    const currentYear = 2026;
    const startYear = 2015;

    for (let year = currentYear; year >= startYear; year--) {
      for (let trimestre = 4; trimestre >= 1; trimestre--) {
        if (year === currentYear && trimestre > 1) continue;
        options.push({ value: `${trimestre}-${year}`, label: `T${trimestre} ${year}` });
      }
    }
    return options;
  };

  const moisOptions = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
  ];

  const generateAnneeOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const startYear = 2010;

    for (let year = currentYear; year >= startYear; year--) {
      options.push({ value: year.toString(), label: year.toString() });
    }
    return options;
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

  const calculateRevision = () => {
    if (!loyerActuel) {
      alert('Veuillez indiquer le montant du loyer actuel');
      return;
    }

    if (!trimestreSelectionne && (!moisSelectionne || !anneeSelectionnee)) {
      alert('Veuillez indiquer soit le trimestre IRL, soit la date de signature du bail.');
      return;
    }

    setLoading(true);

    try {
      const loyer = parseFloat(loyerActuel);

      let dateSignature: Date;
      let trimestre: number;

      if (trimestreSelectionne) {
        const [trim, annee] = trimestreSelectionne.split('-');
        trimestre = parseInt(trim);
        const mois = parseInt(trim) * 3;
        dateSignature = new Date(`${annee}-${mois.toString().padStart(2, '0')}-01`);
      } else {
        dateSignature = new Date(`${anneeSelectionnee}-${moisSelectionne.padStart(2, '0')}-01`);
        trimestre = getTrimestreFromDate(dateSignature);
      }

      const today = new Date();
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
        alert('Impossible de trouver les indices IRL pour cette période.');
        setLoading(false);
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
      alert('Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const saveReminder = async () => {
    if (!reminderDate) {
      alert('Veuillez sélectionner une date de rappel');
      return;
    }

    const selectedDate = new Date(reminderDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert('La date de rappel doit être dans le futur');
      return;
    }

    setReminderLoading(true);

    try {
      if (existingReminder) {
        const { error } = await supabase
          .from('irl_reminders')
          .update({
            reminder_date: reminderDate,
            irl_calculation_data: calculResult,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReminder.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('irl_reminders')
          .insert({
            proprietaire_id: proprietaireId,
            reminder_date: reminderDate,
            status: 'scheduled',
            irl_calculation_data: calculResult
          });

        if (error) throw error;
      }

      setReminderSuccess(true);
      setTimeout(() => setReminderSuccess(false), 3000);
      loadExistingReminder();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement du rappel');
    } finally {
      setReminderLoading(false);
    }
  };

  const deleteReminder = async () => {
    if (!existingReminder) return;

    if (!confirm('Voulez-vous vraiment supprimer ce rappel ?')) return;

    setReminderLoading(true);

    try {
      const { error } = await supabase
        .from('irl_reminders')
        .update({ status: 'cancelled' })
        .eq('id', existingReminder.id);

      if (error) throw error;

      setExistingReminder(null);
      setReminderDate('');
      alert('Rappel supprimé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du rappel');
    } finally {
      setReminderLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!proprietaire || !proprietaireId) return null;

  return (
    <>
    <main className="flex-1 bg-gray-50 px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-[#7CAA89]" />
                Calculer votre révision
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loyer actuel (hors charges) *
                  </label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={loyerActuel}
                      onChange={(e) => setLoyerActuel(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-md focus:border-[#1e3a5f] focus:ring-0 transition-colors"
                      placeholder="800"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-5 border-2 border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-900">
                      Période de référence du loyer *
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Indiquée dans votre bail ou votre dernière quittance
                    </p>
                  </div>

                  <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Trimestre indiqué dans le bail
                      </label>
                      <select
                        value={trimestreSelectionne}
                        onChange={(e) => setTrimestreSelectionne(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-md focus:border-[#1e3a5f] focus:ring-0 transition-colors bg-white"
                      >
                        <option value="">Ex : T3 2024</option>
                        {generateTrimestreOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-center pt-8">
                      <span className="text-sm font-bold text-gray-400 px-3">OU</span>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date de signature du bail
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={moisSelectionne}
                          onChange={(e) => setMoisSelectionne(e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-md focus:border-[#1e3a5f] focus:ring-0 transition-colors bg-white text-sm"
                        >
                          <option value="">Mois</option>
                          {moisOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={anneeSelectionnee}
                          onChange={(e) => setAnneeSelectionnee(e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-md focus:border-[#1e3a5f] focus:ring-0 transition-colors bg-white text-sm"
                        >
                          <option value="">Année</option>
                          {generateAnneeOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5">
                  <p className="text-sm text-blue-900">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    La révision du loyer est possible uniquement si une clause de révision est prévue dans le bail.
                  </p>
                </div>

                <button
                  onClick={calculateRevision}
                  disabled={loading}
                  className="w-full bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white font-bold py-3 px-5 rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <span>Calcul en cours...</span>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4" />
                      <span>Calculer ma révision</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {calculResult && (
              <div className="bg-gradient-to-br from-[#7CAA89] to-[#6a9479] rounded-2xl shadow-xl p-6 md:p-8 text-white mb-6">
                <h2 className="text-xl font-bold mb-6">Résultat de votre révision</h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-white/70 text-sm mb-2">Loyer actuel</p>
                    <p className="text-2xl font-bold">{calculResult.loyerActuel.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-2">Nouveau loyer</p>
                    <p className="text-4xl font-bold">{calculResult.nouveauLoyer.toFixed(2)} €</p>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-6 mb-6">
                  <p className="text-white/80 text-sm mb-4">Votre gain potentiel</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-white/70 text-sm mb-2">Par mois</p>
                      <p className="text-3xl font-bold">+{calculResult.gainMensuel.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm mb-2">Par an</p>
                      <p className="text-3xl font-bold">+{calculResult.gainAnnuel.toFixed(2)} €</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4">
                  <p className="text-white/70 text-sm mb-3">Indices de référence (source INSEE)</p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/80">
                        IRL {calculResult.anneeAncienne} T{calculResult.trimestreUtilise}: <span className="font-semibold">{calculResult.irlAncien}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-white/80">
                        IRL {calculResult.anneeNouvelle} T{calculResult.trimestreUtilise}: <span className="font-semibold">{calculResult.irlNouveau}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {showWarning && (
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-white flex items-start text-sm">
                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      {showWarning}
                    </p>
                  </div>
                )}
              </div>
            )}

            {calculResult && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Générer votre lettre de révision
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Téléchargez votre lettre de révision de loyer conforme, pré-remplie avec les indices IRL officiels.
                </p>

                <button
                  onClick={() => setShowRevisionLetterModal(true)}
                  className="w-full bg-[#7CAA89] hover:bg-[#6a9479] text-white font-bold py-4 px-5 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Télécharger la lettre en PDF</span>
                </button>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    La lettre sera générée avec vos informations et sera conforme aux exigences légales.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl border border-blue-200 p-6 sticky top-6">
              <div className="flex items-center mb-4">
                <Bell className="w-5 h-5 text-[#7CAA89] mr-2" />
                <h2 className="text-xl font-bold text-gray-900">
                  Rappel IRL
                </h2>
              </div>

              {existingReminder && (
                <div className="bg-white/60 rounded-lg p-3 mb-4 border border-blue-200">
                  <p className="text-sm text-gray-700 mb-1 font-semibold">Prochain rappel</p>
                  <p className="text-gray-900 font-bold">
                    {new Date(existingReminder.reminder_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <p className="text-gray-700 mb-4 text-sm">
                Choisissez une date : nous vous enverrons un e-mail de rappel pour penser à réviser votre loyer.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de rappel
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    min={getTodayDate()}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0 transition-colors"
                  />
                </div>
              </div>

              {reminderSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800 font-medium">Rappel enregistré avec succès</p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={saveReminder}
                  disabled={reminderLoading || !reminderDate}
                  className="w-full bg-[#7CAA89] hover:bg-[#6a9479] text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reminderLoading ? (
                    <span>Enregistrement...</span>
                  ) : existingReminder ? (
                    <span>Modifier le rappel</span>
                  ) : (
                    <span>Enregistrer le rappel</span>
                  )}
                </button>

                {existingReminder && (
                  <button
                    onClick={deleteReminder}
                    disabled={reminderLoading}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Supprimer le rappel
                  </button>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-600">
                  Le rappel sera envoyé par e-mail à l'adresse : <span className="font-semibold">{proprietaireEmail}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
          </div>
        </main>

      {calculResult && (
        <RevisionLetterModal
          isOpen={showRevisionLetterModal}
          onClose={() => setShowRevisionLetterModal(false)}
          revisionData={{
            nouveauLoyer: calculResult.nouveauLoyer,
            ancienLoyer: calculResult.loyerActuel,
            gainMensuel: calculResult.gainMensuel,
            gainAnnuel: calculResult.gainAnnuel,
            irlAncien: calculResult.irlAncien,
            irlNouveau: calculResult.irlNouveau,
            trimestre: calculResult.trimestreUtilise,
            anneeAncienne: calculResult.anneeAncienne,
            anneeNouvelle: calculResult.anneeNouvelle
          }}
        />
      )}
    </>
  );
}
