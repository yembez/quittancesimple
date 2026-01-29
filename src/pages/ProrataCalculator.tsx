import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, Calendar, Euro, Info, ArrowRight, CheckCircle, Heart, Star, FileText, Clock } from 'lucide-react';
import Header from '../components/Header';

const ProrataCalculator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    montantMensuel: '',
    charges: '',
    dateEntree: '',
    dateSortie: '',
    typeCalcul: 'periode'
  });

  const [result, setResult] = useState({
    joursTotal: 0,
    joursOccupes: 0,
    montantProrata: 0,
    montantJournalier: 0,
    loyerProrata: 0,
    chargesProrata: 0,
    loyerJournalier: 0,
    chargesJournalier: 0
  });

  React.useEffect(() => {
    const savedGeneratorData = localStorage.getItem('generatorFormData');
    if (savedGeneratorData) {
      const parsedData = JSON.parse(savedGeneratorData);
      setFormData(prev => ({
        ...prev,
        montantMensuel: parsedData.loyer || '',
        charges: parsedData.charges || ''
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateProrata = () => {
    const loyer = parseFloat(formData.montantMensuel) || 0;
    const charges = parseFloat(formData.charges) || 0;
    const montantTotal = loyer + charges;

    if (montantTotal === 0) {
      setResult({
        joursTotal: 0,
        joursOccupes: 0,
        montantProrata: 0,
        montantJournalier: 0,
        loyerProrata: 0,
        chargesProrata: 0,
        loyerJournalier: 0,
        chargesJournalier: 0
      });
      return;
    }

    let dateDebut: Date;
    let dateFin: Date;
    let joursTotal: number;

    if (formData.typeCalcul === 'entree' && formData.dateEntree) {
      dateDebut = new Date(formData.dateEntree);
      dateFin = new Date(dateDebut.getFullYear(), dateDebut.getMonth() + 1, 0);
      joursTotal = dateFin.getDate();
    } else if (formData.typeCalcul === 'sortie' && formData.dateSortie) {
      dateFin = new Date(formData.dateSortie);
      dateDebut = new Date(dateFin.getFullYear(), dateFin.getMonth(), 1);
      joursTotal = new Date(dateFin.getFullYear(), dateFin.getMonth() + 1, 0).getDate();
    } else if (formData.typeCalcul === 'periode' && formData.dateEntree && formData.dateSortie) {
      dateDebut = new Date(formData.dateEntree);
      dateFin = new Date(formData.dateSortie);
      joursTotal = new Date(dateDebut.getFullYear(), dateDebut.getMonth() + 1, 0).getDate();
    } else {
      setResult({ joursTotal: 0, joursOccupes: 0, montantProrata: 0, montantJournalier: 0, loyerProrata: 0, chargesProrata: 0, loyerJournalier: 0, chargesJournalier: 0 });
      return;
    }

    let joursOccupes: number;

    if (formData.typeCalcul === 'entree') {
      joursOccupes = joursTotal - dateDebut.getDate() + 1;
    } else if (formData.typeCalcul === 'sortie') {
      joursOccupes = dateFin.getDate();
    } else {
      const diffTime = Math.abs(dateFin.getTime() - dateDebut.getTime());
      joursOccupes = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const loyerJournalier = loyer / joursTotal;
    const chargesJournalier = charges / joursTotal;
    const montantJournalier = montantTotal / joursTotal;

    const loyerProrata = loyerJournalier * joursOccupes;
    const chargesProrata = chargesJournalier * joursOccupes;
    const montantProrata = loyerProrata + chargesProrata;

    setResult({
      joursTotal,
      joursOccupes,
      montantProrata: Math.round(montantProrata * 100) / 100,
      montantJournalier: Math.round(montantJournalier * 100) / 100,
      loyerProrata: Math.round(loyerProrata * 100) / 100,
      chargesProrata: Math.round(chargesProrata * 100) / 100,
      loyerJournalier: Math.round(loyerJournalier * 100) / 100,
      chargesJournalier: Math.round(chargesJournalier * 100) / 100
    });
  };

  const copyToGenerator = () => {
    const periodLabel = getPeriodLabel();
    const generatorData = {
      loyer: result.loyerProrata.toFixed(2),
      charges: result.chargesProrata.toFixed(2),
      periode: periodLabel,
      isProrata: true,
      dateDebut: getDateDebut(),
      dateFin: getDateFin(),
      typeCalcul: formData.typeCalcul
    };

    localStorage.setItem('prorataData', JSON.stringify(generatorData));
    navigate('/generator');
  };

  const getDateDebut = () => {
    if (formData.typeCalcul === 'entree' && formData.dateEntree) {
      return formData.dateEntree;
    } else if (formData.typeCalcul === 'sortie' && formData.dateSortie) {
      const date = new Date(formData.dateSortie);
      return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    } else if (formData.typeCalcul === 'periode' && formData.dateEntree) {
      return formData.dateEntree;
    }
    return '';
  };

  const getDateFin = () => {
    if (formData.typeCalcul === 'entree' && formData.dateEntree) {
      const date = new Date(formData.dateEntree);
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (formData.typeCalcul === 'sortie' && formData.dateSortie) {
      return formData.dateSortie;
    } else if (formData.typeCalcul === 'periode' && formData.dateSortie) {
      return formData.dateSortie;
    }
    return '';
  };

  const getPeriodLabel = () => {
    if (formData.typeCalcul === 'entree' && formData.dateEntree) {
      const date = new Date(formData.dateEntree);
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      const month = monthNames[date.getMonth()];
      return `Prorata entrée ${month} ${date.getFullYear()}`;
    } else if (formData.typeCalcul === 'sortie' && formData.dateSortie) {
      const date = new Date(formData.dateSortie);
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      const month = monthNames[date.getMonth()];
      return `Prorata sortie ${month} ${date.getFullYear()}`;
    } else if (formData.typeCalcul === 'periode' && formData.dateEntree && formData.dateSortie) {
      const dateDebut = new Date(formData.dateEntree);
      const dateFin = new Date(formData.dateSortie);
      return `Prorata période ${dateDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${dateFin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return 'Prorata';
  };

  useEffect(() => {
    calculateProrata();
  }, [formData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-5 lg:px-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >

            <h1 className="text-xl lg:text-2xl font-bold text-[#1a1f20] mb-5">
              Calculateur gratuit de prorata de loyer
            </h1>
            <p className="text-lg text-[#1a1f20] leading-relaxed">
              Calculez facilement le montant du loyer au prorata pour les entrées et sorties en cours de mois. Conforme à la réglementation française.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 lg:px-7 py-12">
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-[#2D3436] rounded-2xl flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1f20]">Vos informations</h2>
            </div>

            <form className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-1.5">
                    <Euro className="w-3.5 h-3.5 inline mr-1" />
                    Loyer mensuel (€)
                  </label>
                  <input
                    type="number"
                    name="montantMensuel"
                    value={formData.montantMensuel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-[#2D3436] focus:outline-none transition-colors"
                    placeholder="800.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-1.5">
                    <Euro className="w-3.5 h-3.5 inline mr-1" />
                    Charges mensuelles (€)
                  </label>
                  <input
                    type="number"
                    name="charges"
                    value={formData.charges}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-[#2D3436] focus:outline-none transition-colors"
                    placeholder="100.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Date de début
                  </label>
                  <input
                    type="date"
                    name="dateEntree"
                    value={formData.dateEntree}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-[#2D3436] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#415052] mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Date de fin
                  </label>
                  <input
                    type="date"
                    name="dateSortie"
                    value={formData.dateSortie}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-[#2D3436] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-3xl p-6 shadow-xl lg:sticky lg:top-6 h-fit"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-[#ed7862] rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1f20]">Résultat du calcul</h3>
            </div>

            <div className="space-y-5">
              {result.montantProrata > 0 ? (
                <>
                  <div className="bg-gradient-to-br from-[#2D3436] to-[#6b9d82] rounded-2xl p-6 text-center shadow-lg">
                    <div className="text-sm font-medium text-white/80 mb-1.5">Montant total du prorata</div>
                    <div className="text-4xl font-bold text-white">
                      {result.montantProrata.toFixed(2)}€
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <div className="text-[10px] font-medium text-gray-500 mb-1.5">Loyer prorata</div>
                      <div className="text-xl font-bold text-[#1a1f20]">{result.loyerProrata.toFixed(2)}€</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <div className="text-[10px] font-medium text-gray-500 mb-1.5">Charges prorata</div>
                      <div className="text-xl font-bold text-[#1a1f20]">{result.chargesProrata.toFixed(2)}€</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-sm font-medium text-gray-600">
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        Période d'occupation
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#1a1f20]">{result.joursOccupes}</div>
                        <div className="text-[10px] text-gray-500">jours occupés</div>
                      </div>
                      <div className="text-gray-300">/</div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">{result.joursTotal}</div>
                        <div className="text-[10px] text-gray-500">jours total</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={copyToGenerator}
                    className="w-full bg-gradient-to-r from-[#ed7862] to-[#e56651] text-white px-5 py-3 text-sm rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Générer la quittance avec ce montant</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-5" />
                  <p className="text-gray-500 text-base font-medium">Remplissez le formulaire</p>
                  <p className="text-gray-400 text-sm mt-1.5">Le calcul s'affichera automatiquement</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 bg-white rounded-3xl p-9 shadow-xl"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-9">
              <h2 className="text-2xl font-bold text-[#1a1f20] mb-3">
                Comment fonctionne le calcul du prorata ?
              </h2>
              <p className="text-base text-[#415052]/70">
                Le calcul est simple et conforme à la législation française
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-[#2D3436]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calculator className="w-7 h-7 text-[#2D3436]" />
                </div>
                <h3 className="font-bold text-[#1a1f20] mb-1.5 text-base">Calcul automatique</h3>
                <p className="text-sm text-[#415052]/70 leading-relaxed">
                  Le montant est calculé au jour près selon le nombre de jours réellement occupés
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-[#ed7862]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-[#ed7862]" />
                </div>
                <h3 className="font-bold text-[#1a1f20] mb-1.5 text-base">100% conforme</h3>
                <p className="text-sm text-[#415052]/70 leading-relaxed">
                  Respecte la réglementation et la jurisprudence en matière de location
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-[#FFF8E7] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-7 h-7" style={{
                    background: 'linear-gradient(135deg, #FFD76F 0%, #FF7A7F 50%, #A46BFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }} />
                </div>
                <h3 className="font-bold text-[#1a1f20] mb-1.5 text-base">Toujours gratuit</h3>
                <p className="text-sm text-[#415052]/70 leading-relaxed">
                  Pas de compte requis, utilisez l'outil autant de fois que nécessaire
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ProrataCalculator;
