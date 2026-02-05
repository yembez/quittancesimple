import React from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, User, HomeIcon, Euro, Calendar, Eye, Shield } from 'lucide-react';
import QuittancePreview from '../components/QuittancePreview';
import { sendQuittanceByEmail } from '../utils/emailService';

// VERSION 1 : "CARTE POSTALE" - Minimaliste, épuré, très Apple-like
// Grandes photos, beaucoup d'espace blanc, typographie élégante

const HomeVersion1 = () => {
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = React.useState({
    baillorName: '',
    baillorAddress: '',
    baillorEmail: '',
    locataireName: '',
    logementAddress: '',
    loyer: '',
    charges: '',
    periode: 'Septembre 2025',
    isProrata: false,
    dateDebut: '',
    dateFin: '',
    typeCalcul: ''
  });

  const [isElectronicSignatureChecked, setIsElectronicSignatureChecked] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [prorataAmounts, setProrataAmounts] = React.useState({ loyer: 0, charges: 0, total: 0 });
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (searchParams.get('from') === 'prorata') {
      const prorataData = localStorage.getItem('prorataData');
      if (prorataData) {
        const data = JSON.parse(prorataData);
        setFormData(prev => ({
          ...prev,
          loyer: data.loyer,
          charges: data.charges,
          periode: data.periode,
          isProrata: data.isProrata || false,
          dateDebut: data.dateDebut || '',
          dateFin: data.dateFin || '',
          typeCalcul: data.typeCalcul || ''
        }));
        setShowPreview(true);
        localStorage.removeItem('prorataData');
        setTimeout(() => {
          document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [searchParams]);

  const calculateProrata = React.useCallback(() => {
    if (!formData.isProrata || !formData.dateDebut || !formData.dateFin || !formData.loyer) {
      setProrataAmounts({ loyer: 0, charges: 0, total: 0 });
      return;
    }
    const dateDebut = new Date(formData.dateDebut);
    const dateFin = new Date(formData.dateFin);
    if (dateDebut >= dateFin) {
      setProrataAmounts({ loyer: 0, charges: 0, total: 0 });
      return;
    }
    const mois = dateDebut.getMonth();
    const annee = dateDebut.getFullYear();
    const joursTotal = new Date(annee, mois + 1, 0).getDate();
    const joursPresence = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
    const loyerMensuel = parseFloat(formData.loyer) || 0;
    const chargesMensuelles = parseFloat(formData.charges) || 0;
    const loyerProrata = (loyerMensuel * joursPresence) / joursTotal;
    const chargesProrata = (chargesMensuelles * joursPresence) / joursTotal;
    const totalProrata = loyerProrata + chargesProrata;
    setProrataAmounts({
      loyer: loyerProrata,
      charges: chargesProrata,
      total: totalProrata
    });
  }, [formData.isProrata, formData.dateDebut, formData.dateFin, formData.loyer, formData.charges]);

  const hasContent = () => {
    return formData.baillorName || formData.locataireName || formData.loyer || formData.charges;
  };

  const hasAnyContent = () => {
    return Object.values(formData).some(value => value && value.toString().trim().length > 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'dateDebut' || name === 'dateFin') {
      const updatedFormData = { ...formData, [name]: value };
      if (name === 'dateDebut' && updatedFormData.dateFin) {
        const dateDebut = new Date(value);
        const dateFin = new Date(updatedFormData.dateFin);
        if (dateDebut >= dateFin) {
          updatedFormData.dateFin = '';
        }
      }
      if (name === 'dateFin' && updatedFormData.dateDebut) {
        const dateDebut = new Date(updatedFormData.dateDebut);
        const dateFin = new Date(value);
        if (dateFin <= dateDebut) {
          return;
        }
      }
      setFormData(updatedFormData);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (value.trim().length > 0 || hasAnyContent()) {
      setShowPreview(true);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    const errors: string[] = [];
    if (!formData.baillorName.trim()) errors.push('Le nom du bailleur est obligatoire');
    if (!formData.baillorAddress.trim()) errors.push('L\'adresse du bailleur est obligatoire');
    if (!formData.baillorEmail.trim()) errors.push('L\'email du bailleur est obligatoire');
    if (!formData.locataireName.trim()) errors.push('Le nom du locataire est obligatoire');
    if (!formData.logementAddress.trim()) errors.push('L\'adresse du logement est obligatoire');
    if (!formData.loyer.trim()) errors.push('Le montant du loyer est obligatoire');
    if (!formData.charges.trim()) errors.push('Le montant des charges est obligatoire');
    if (!isElectronicSignatureChecked) errors.push('La signature électronique est obligatoire');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.baillorEmail.trim() && !emailRegex.test(formData.baillorEmail)) {
      errors.push('L\'adresse email n\'est pas valide');
    }
    if (formData.loyer.trim() && (isNaN(Number(formData.loyer)) || Number(formData.loyer) <= 0)) {
      errors.push('Le montant du loyer doit être un nombre positif');
    }
    if (formData.charges.trim() && (isNaN(Number(formData.charges)) || Number(formData.charges) < 0)) {
      errors.push('Le montant des charges doit être un nombre positif ou zéro');
    }
    if (formData.isProrata) {
      if (!formData.dateDebut) errors.push('La date de début est obligatoire pour le prorata');
      if (!formData.dateFin) errors.push('La date de fin est obligatoire pour le prorata');
      if (formData.dateDebut && formData.dateFin && new Date(formData.dateDebut) >= new Date(formData.dateFin)) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }
    setValidationErrors(errors);
    if (errors.length > 0) {
      setIsLoading(false);
      document.getElementById('validation-errors')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    try {
      const quittanceData = {
        baillorName: formData.baillorName,
        baillorAddress: formData.baillorAddress,
        baillorEmail: formData.baillorEmail,
        locataireName: formData.locataireName,
        logementAddress: formData.logementAddress,
        loyer: formData.isProrata && prorataAmounts.loyer > 0 ? prorataAmounts.loyer.toFixed(2) : formData.loyer,
        charges: formData.isProrata && prorataAmounts.charges > 0 ? prorataAmounts.charges.toFixed(2) : formData.charges,
        periode: formData.periode,
        isProrata: formData.isProrata,
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin,
        typeCalcul: formData.typeCalcul,
        isElectronicSignature: isElectronicSignatureChecked
      };
      const result = await sendQuittanceByEmail(quittanceData);
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        if (result.message.includes('Configuration')) {
          alert(`${result.message}\n\n🔄 EN ATTENDANT : Le PDF a été téléchargé sur votre ordinateur.\n📧 Vous pouvez l'envoyer manuellement par email.`);
          const { generateQuittancePDF } = await import('../utils/pdfGenerator');
          const pdfBlob = generateQuittancePDF({
            baillorName: formData.baillorName,
            baillorAddress: formData.baillorAddress,
            baillorEmail: formData.baillorEmail,
            locataireName: formData.locataireName,
            logementAddress: formData.logementAddress,
            loyer: formData.isProrata && prorataAmounts.loyer > 0 ? prorataAmounts.loyer.toFixed(2) : formData.loyer,
            charges: formData.isProrata && prorataAmounts.charges > 0 ? prorataAmounts.charges.toFixed(2) : formData.charges,
            periode: formData.periode,
            isProrata: formData.isProrata,
            dateDebut: formData.dateDebut,
            dateFin: formData.dateFin,
            typeCalcul: formData.typeCalcul,
            isElectronicSignature: isElectronicSignatureChecked
          });
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          const now = new Date();
          const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
          const currentPeriod = `${monthNames[now.getMonth()]}-${now.getFullYear()}`;
          a.download = `quittance-${formData.locataireName || 'locataire'}-${formData.periode ? formData.periode.toLowerCase().replace(/\s+/g, '-') : currentPeriod}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi:', error);
      alert('❌ Erreur lors de l\'envoi de la quittance. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    calculateProrata();
  }, [calculateProrata]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero minimaliste avec grande photo */}
      <section className="relative h-screen flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/Lucid_Origin_A_relaxed_man_about_45_years_old_lying_on_a_deck__3 copy.jpg"
            alt="Propriétaire serein"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl lg:text-8xl font-light text-gray-900 mb-8 tracking-tight">
              Quittances.<br />Simplifiées.
            </h1>
            <p className="text-2xl text-gray-600 font-light mb-12 max-w-2xl mx-auto">
              La solution élégante pour les propriétaires modernes
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-black text-white px-12 py-5 rounded-full text-lg font-light tracking-wide hover:bg-gray-800 transition-all"
            >
              Commencer
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Section générateur ultra épuré */}
      <section id="generator" className="py-32 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">
              Créer une quittance
            </h2>
            <p className="text-xl text-gray-500 font-light">
              Quelques informations suffisent
            </p>
          </motion.div>

          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100">
            <form className="space-y-12">
              {validationErrors.length > 0 && (
                <div id="validation-errors" className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <p className="text-red-900 font-medium mb-3">Informations manquantes :</p>
                  <ul className="space-y-2">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-red-700 text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-8">
                <h3 className="text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">Vous</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    name="baillorName"
                    value={formData.baillorName}
                    onChange={handleInputChange}
                    placeholder="Nom complet"
                    className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light placeholder-gray-400 bg-transparent transition-all"
                  />
                  <input
                    type="email"
                    name="baillorEmail"
                    value={formData.baillorEmail}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light placeholder-gray-400 bg-transparent transition-all"
                  />
                </div>
                <input
                  type="text"
                  name="baillorAddress"
                  value={formData.baillorAddress}
                  onChange={handleInputChange}
                  placeholder="Adresse complète"
                  className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light placeholder-gray-400 bg-transparent transition-all"
                />
              </div>

              <div className="space-y-8">
                <h3 className="text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">Locataire</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    name="locataireName"
                    value={formData.locataireName}
                    onChange={handleInputChange}
                    placeholder="Nom du locataire"
                    className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light placeholder-gray-400 bg-transparent transition-all"
                  />
                  <input
                    type="text"
                    name="logementAddress"
                    value={formData.logementAddress}
                    onChange={handleInputChange}
                    placeholder="Adresse du logement"
                    className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light placeholder-gray-400 bg-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">Montants</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <input
                    type="number"
                    name="loyer"
                    value={formData.loyer}
                    onChange={handleInputChange}
                    placeholder="Loyer (€)"
                    className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light placeholder-gray-400 bg-transparent transition-all"
                  />
                  <input
                    type="number"
                    name="charges"
                    value={formData.charges}
                    onChange={handleInputChange}
                    placeholder="Charges (€)"
                    className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light placeholder-gray-400 bg-transparent transition-all"
                  />
                  {!formData.isProrata && (
                    <select
                      name="periode"
                      value={formData.periode}
                      onChange={handleInputChange}
                      className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light bg-transparent transition-all"
                    >
                      <option value="Septembre 2025">Septembre 2025</option>
                      <option value="Août 2025">Août 2025</option>
                      <option value="Juillet 2025">Juillet 2025</option>
                      <option value="Juin 2025">Juin 2025</option>
                      <option value="Mai 2025">Mai 2025</option>
                    </select>
                  )}
                </div>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isProrata}
                    onChange={(e) => setFormData(prev => ({ ...prev, isProrata: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-gray-600 font-light">Calculer un prorata</span>
                </label>

                {formData.isProrata && (
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <input
                      type="date"
                      name="dateDebut"
                      value={formData.dateDebut}
                      onChange={handleInputChange}
                      className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light bg-transparent"
                    />
                    <input
                      type="date"
                      name="dateFin"
                      value={formData.dateFin}
                      onChange={handleInputChange}
                      min={formData.dateDebut || undefined}
                      className="w-full px-0 py-4 border-0 border-b border-gray-200 focus:border-gray-900 focus:ring-0 text-lg font-light bg-transparent"
                    />
                  </div>
                )}

                {formData.isProrata && prorataAmounts.total > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-6 text-center">
                    <p className="text-gray-600 text-sm mb-2">Total calculé</p>
                    <p className="text-4xl font-light text-gray-900">{prorataAmounts.total.toFixed(2)}€</p>
                  </div>
                )}
              </div>

              <div className="pt-8">
                <label className="flex items-start space-x-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isElectronicSignatureChecked}
                    onChange={(e) => setIsElectronicSignatureChecked(e.target.checked)}
                    className="w-5 h-5 mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div>
                    <p className="text-gray-900 font-light mb-1">Signature électronique</p>
                    <p className="text-sm text-gray-500 font-light">
                      Je certifie que le paiement a été encaissé
                    </p>
                  </div>
                </label>
              </div>
            </form>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                disabled={isLoading}
                className="flex-1 bg-black text-white px-8 py-5 rounded-full text-lg font-light tracking-wide hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Envoi...' : 'Recevoir la quittance'}
              </motion.button>
              {hasContent() && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex-1 border border-gray-300 text-gray-900 px-8 py-5 rounded-full text-lg font-light tracking-wide hover:border-gray-900 transition-all"
                >
                  {showPreview ? 'Masquer' : 'Aperçu'}
                </button>
              )}
            </div>
          </div>

          {showPreview && hasAnyContent() && (
            <div className="mt-12">
              <QuittancePreview
                formData={{
                  ...formData,
                  loyer: formData.isProrata && prorataAmounts.loyer > 0 ? prorataAmounts.loyer.toFixed(2) : formData.loyer,
                  charges: formData.isProrata && prorataAmounts.charges > 0 ? prorataAmounts.charges.toFixed(2) : formData.charges
                }}
                isElectronicSignatureChecked={isElectronicSignatureChecked}
                onClose={() => setShowPreview(false)}
              />
            </div>
          )}
        </div>
      </section>

      {/* CTA section épurée */}
      <section className="py-32 bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-light mb-8 tracking-tight">
            Automatiser vos quittances
          </h2>
          <p className="text-xl text-gray-400 font-light mb-12">
            Pour ne plus jamais y penser
          </p>
          <Link
            to="/automation"
            className="inline-block bg-white text-black px-12 py-5 rounded-full text-lg font-light tracking-wide hover:bg-gray-100 transition-all"
          >
            Découvrir
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomeVersion1;