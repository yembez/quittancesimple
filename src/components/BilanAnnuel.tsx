import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Locataire {
  id: string;
  nom: string;
  prenom?: string;
}

interface Quittance {
  id: string;
  locataire_id: string;
  periode_debut: string;
  periode_fin: string;
  loyer: number;
  charges: number;
  date_generation: string;
}

interface BilanAnnuelProps {
  proprietaireId: string;
  locataires: Locataire[];
}

const BilanAnnuel: React.FC<BilanAnnuelProps> = ({ proprietaireId, locataires }) => {
  const currentYear = new Date().getFullYear();
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [selectedLocataireId, setSelectedLocataireId] = useState<string>('tous');
  const [loading, setLoading] = useState(true);
  const [editingMontantsAnterieurs, setEditingMontantsAnterieurs] = useState(false);
  const [loyersAnterieurs, setLoyersAnterieurs] = useState<string>('0');
  const [chargesAnterieures, setChargesAnterieures] = useState<string>('0');
  const [premiereDateQuittance, setPremiereDateQuittance] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, [proprietaireId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les quittances de l'année en cours
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

      const { data: quittancesData } = await supabase
        .from('quittances')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .gte('date_generation', startOfYear)
        .lte('date_generation', endOfYear)
        .order('date_generation', { ascending: true });

      if (quittancesData && quittancesData.length > 0) {
        setQuittances(quittancesData);
        setPremiereDateQuittance(new Date(quittancesData[0].date_generation));
      } else {
        setQuittances([]);
        setPremiereDateQuittance(null);
      }

      // Charger les montants antérieurs
      const { data: bilanData } = await supabase
        .from('bilan_annuel_manuel')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .eq('annee', currentYear)
        .maybeSingle();

      if (bilanData) {
        setLoyersAnterieurs(bilanData.loyers_anterieurs?.toString() || '0');
        setChargesAnterieures(bilanData.charges_anterieures?.toString() || '0');
      }
    } catch (error) {
      console.error('Erreur chargement bilan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMontantsAnterieurs = async () => {
    try {
      const loyers = parseFloat(loyersAnterieurs) || 0;
      const charges = parseFloat(chargesAnterieures) || 0;

      const { error } = await supabase
        .from('bilan_annuel_manuel')
        .upsert({
          proprietaire_id: proprietaireId,
          annee: currentYear,
          loyers_anterieurs: loyers,
          charges_anterieures: charges,
        }, {
          onConflict: 'proprietaire_id,annee'
        });

      if (error) throw error;

      setEditingMontantsAnterieurs(false);
      alert('Montants antérieurs enregistrés avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  // Calcul des totaux automatiques depuis les quittances
  const calculateTotals = () => {
    let totalLoyersAuto = 0;
    let totalChargesAuto = 0;

    const filteredQuittances = selectedLocataireId === 'tous'
      ? quittances
      : quittances.filter(q => q.locataire_id === selectedLocataireId);

    filteredQuittances.forEach(q => {
      totalLoyersAuto += parseFloat(q.loyer?.toString() || '0');
      totalChargesAuto += parseFloat(q.charges?.toString() || '0');
    });

    const loyersAnt = parseFloat(loyersAnterieurs) || 0;
    const chargesAnt = parseFloat(chargesAnterieures) || 0;

    return {
      totalLoyersAuto,
      totalChargesAuto,
      totalLoyersAnnuel: totalLoyersAuto + (selectedLocataireId === 'tous' ? loyersAnt : 0),
      totalChargesAnnuel: totalChargesAuto + (selectedLocataireId === 'tous' ? chargesAnt : 0),
    };
  };

  const totals = calculateTotals();

  // Regrouper les quittances par locataire
  const quittancesByLocataire = locataires.reduce((acc, locataire) => {
    acc[locataire.id] = quittances.filter(q => q.locataire_id === locataire.id);
    return acc;
  }, {} as Record<string, Quittance[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CAA89]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-[#2b2b2b] flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#7CAA89]" />
            <span>Bilan annuel – {currentYear}</span>
          </h2>
        </div>

        {premiereDateQuittance && (
          <div className="flex items-start space-x-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-2">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              Ce bilan inclut les quittances générées à partir du{' '}
              <strong>{premiereDateQuittance.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            </p>
          </div>
        )}

        {!premiereDateQuittance && (
          <p className="text-xs text-gray-500">Aucune quittance générée en {currentYear}.</p>
        )}
      </div>

      {/* Bloc montants antérieurs optionnels */}
      {premiereDateQuittance && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#2b2b2b]">
              Montants perçus avant le {premiereDateQuittance.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} (optionnel)
            </h3>
            {!editingMontantsAnterieurs ? (
              <button
                onClick={() => setEditingMontantsAnterieurs(true)}
                className="flex items-center space-x-1 text-[#7CAA89] hover:text-[#6b9378] transition-colors text-xs"
              >
                <Edit2 className="w-3 h-3" />
                <span>Modifier</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveMontantsAnterieurs}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors text-xs"
                >
                  <Save className="w-3 h-3" />
                  <span>Enregistrer</span>
                </button>
                <button
                  onClick={() => {
                    setEditingMontantsAnterieurs(false);
                    loadData();
                  }}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-600 transition-colors text-xs"
                >
                  <X className="w-3 h-3" />
                  <span>Annuler</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Loyers perçus à compter du 1er janvier {currentYear}
              </label>
              {editingMontantsAnterieurs ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={loyersAnterieurs}
                  onChange={(e) => setLoyersAnterieurs(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7CAA89] focus:border-transparent"
                  placeholder="0.00"
                />
              ) : (
                <p className="text-sm font-semibold text-gray-900">
                  {parseFloat(loyersAnterieurs).toFixed(2)} €
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Charges récupérées à compter du 1er janvier {currentYear}
              </label>
              {editingMontantsAnterieurs ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={chargesAnterieures}
                  onChange={(e) => setChargesAnterieures(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7CAA89] focus:border-transparent"
                  placeholder="0.00"
                />
              ) : (
                <p className="text-sm font-semibold text-gray-900">
                  {parseFloat(chargesAnterieures).toFixed(2)} €
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onglets par locataire */}
      {quittances.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-4 pt-3">
            <div className="flex space-x-1 overflow-x-auto">
              <button
                onClick={() => setSelectedLocataireId('tous')}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                  selectedLocataireId === 'tous'
                    ? 'bg-[#7CAA89] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tous les locataires
              </button>
              {locataires.map((locataire) => (
                <button
                  key={locataire.id}
                  onClick={() => setSelectedLocataireId(locataire.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                    selectedLocataireId === locataire.id
                      ? 'bg-[#7CAA89] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {locataire.nom} {locataire.prenom}
                </button>
              ))}
            </div>
          </div>

          {/* Tableau des quittances */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Période</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date génération</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Loyer</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Charges</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedLocataireId === 'tous' ? (
                  // Afficher toutes les quittances groupées par locataire
                  <>
                    {locataires.map((locataire) => {
                      const locataireQuittances = quittancesByLocataire[locataire.id] || [];
                      if (locataireQuittances.length === 0) return null;

                      const locataireTotals = locataireQuittances.reduce(
                        (acc, q) => ({
                          loyers: acc.loyers + parseFloat(q.loyer?.toString() || '0'),
                          charges: acc.charges + parseFloat(q.charges?.toString() || '0'),
                        }),
                        { loyers: 0, charges: 0 }
                      );

                      return (
                        <React.Fragment key={locataire.id}>
                          <tr className="bg-gray-100">
                            <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-gray-700">
                              {locataire.nom} {locataire.prenom}
                            </td>
                          </tr>
                          {locataireQuittances.map((q) => (
                            <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2 text-xs text-gray-900">
                                {new Date(q.periode_debut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600">
                                {new Date(q.date_generation).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-4 py-2 text-xs text-right text-gray-900">
                                {parseFloat(q.loyer?.toString() || '0').toFixed(2)} €
                              </td>
                              <td className="px-4 py-2 text-xs text-right text-gray-900">
                                {parseFloat(q.charges?.toString() || '0').toFixed(2)} €
                              </td>
                              <td className="px-4 py-2 text-xs text-right font-semibold text-gray-900">
                                {(parseFloat(q.loyer?.toString() || '0') + parseFloat(q.charges?.toString() || '0')).toFixed(2)} €
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-gray-700">
                              Total {locataire.nom} {locataire.prenom}
                            </td>
                            <td className="px-4 py-2 text-xs text-right font-semibold text-[#7CAA89]">
                              {locataireTotals.loyers.toFixed(2)} €
                            </td>
                            <td className="px-4 py-2 text-xs text-right font-semibold text-[#7CAA89]">
                              {locataireTotals.charges.toFixed(2)} €
                            </td>
                            <td className="px-4 py-2 text-xs text-right font-semibold text-[#7CAA89]">
                              {(locataireTotals.loyers + locataireTotals.charges).toFixed(2)} €
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </>
                ) : (
                  // Afficher les quittances du locataire sélectionné
                  <>
                    {quittances
                      .filter(q => q.locataire_id === selectedLocataireId)
                      .map((q) => (
                        <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs text-gray-900">
                            {new Date(q.periode_debut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(q.date_generation).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-2 text-xs text-right text-gray-900">
                            {parseFloat(q.loyer?.toString() || '0').toFixed(2)} €
                          </td>
                          <td className="px-4 py-2 text-xs text-right text-gray-900">
                            {parseFloat(q.charges?.toString() || '0').toFixed(2)} €
                          </td>
                          <td className="px-4 py-2 text-xs text-right font-semibold text-gray-900">
                            {(parseFloat(q.loyer?.toString() || '0') + parseFloat(q.charges?.toString() || '0')).toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Total global */}
          <div className="bg-[#7CAA89]/5 border-t-2 border-[#7CAA89] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Total annuel des loyers</p>
                <p className="text-lg font-bold text-[#2b2b2b]">
                  {totals.totalLoyersAnnuel.toFixed(2)} €
                </p>
                {selectedLocataireId === 'tous' && parseFloat(loyersAnterieurs) > 0 && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    dont {totals.totalLoyersAuto.toFixed(2)} € depuis Quittance Simple
                    <br />
                    + {parseFloat(loyersAnterieurs).toFixed(2)} € antérieurs
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Total annuel des charges récupérées</p>
                <p className="text-lg font-bold text-[#2b2b2b]">
                  {totals.totalChargesAnnuel.toFixed(2)} €
                </p>
                {selectedLocataireId === 'tous' && parseFloat(chargesAnterieures) > 0 && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    dont {totals.totalChargesAuto.toFixed(2)} € depuis Quittance Simple
                    <br />
                    + {parseFloat(chargesAnterieures).toFixed(2)} € antérieures
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BilanAnnuel;
