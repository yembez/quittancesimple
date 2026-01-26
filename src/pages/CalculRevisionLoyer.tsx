import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Calculator, AlertCircle, Euro } from 'lucide-react';
import SEOHead from '../components/SEOHead';

export default function CalculRevisionLoyer() {
  const navigate = useNavigate();
  const [loyerActuel, setLoyerActuel] = useState('');
  const [trimestreSelectionne, setTrimestreSelectionne] = useState('');
  const [moisSelectionne, setMoisSelectionne] = useState('');
  const [anneeSelectionnee, setAnneeSelectionnee] = useState('');
  const [loading, setLoading] = useState(false);

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
      const params = new URLSearchParams({
        loyer: loyerActuel,
      });

      if (trimestreSelectionne) {
        const [trimestre, annee] = trimestreSelectionne.split('-');
        params.append('trimestre', trimestre);
        const date = `${annee}-${(parseInt(trimestre) * 3).toString().padStart(2, '0')}-01`;
        params.append('date', date);
      } else if (moisSelectionne && anneeSelectionnee) {
        const date = `${anneeSelectionnee}-${moisSelectionne.padStart(2, '0')}-01`;
        params.append('date', date);
      }

      navigate(`/irl/resultat?${params.toString()}`);
    } catch (error) {
      console.error('Erreur calcul:', error);
      alert('Erreur lors du calcul');
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Calcul de révision de loyer (IRL) - Gratuit et envoi lettre automatique"
        description="Calculez gratuitement la révision de votre loyer avec l'indice IRL, générez votre lettre juridiquement conforme et envoyez-la en recommandé en un clic."
      />

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#7CAA89]/10 rounded-2xl mb-4">
              <TrendingUp className="w-6 h-6 text-[#7CAA89]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Calcul de révision de loyer (IRL)
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Calcul IRL gratuit, lettre prête et envoi recommandé clé en main
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Indice IRL - source INSEE
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
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
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0 transition-colors"
                      placeholder="800"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0 transition-colors bg-white"
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
                        Date de signature du bail (si aucun trimestre)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={moisSelectionne}
                          onChange={(e) => setMoisSelectionne(e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0 transition-colors bg-white text-sm"
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
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#7CAA89] focus:ring-0 transition-colors bg-white text-sm"
                        >
                          <option value="">Année</option>
                          {generateAnneeOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        À utiliser uniquement si aucun trimestre n'est indiqué dans le bail
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                  <p className="text-sm text-blue-900">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    La révision du loyer est possible uniquement si une clause de révision est prévue dans le bail.
                  </p>
                </div>

                <button
                  onClick={calculateRevision}
                  disabled={loading}
                  className="w-full bg-[#7CAA89] hover:bg-[#6a9479] text-white font-bold py-3 px-5 rounded-xl transition-colors flex items-center justify-center space-x-2"
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
        </div>
      </div>
    </>
  );
}
