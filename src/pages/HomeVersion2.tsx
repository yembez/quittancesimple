import React from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, CheckCircle2, Zap, Shield, TrendingUp, Users, Clock, BarChart3 } from 'lucide-react';
import QuittancePreview from '../components/QuittancePreview';
import { sendQuittanceByEmail } from '../utils/emailService';

// VERSION 2 : "DASHBOARD PRO" - Style SaaS moderne (Stripe, Notion)
// Cards structurées, stats, badges, très pro et organisé

const HomeVersion2 = () => {
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

  const stats = [
    { label: 'Utilisateurs actifs', value: '2,500+', icon: Users, color: 'blue' },
    { label: 'Quittances générées', value: '50K+', icon: BarChart3, color: 'green' },
    { label: 'Temps moyen', value: '28s', icon: Clock, color: 'purple' },
    { label: 'Satisfaction', value: '98%', icon: TrendingUp, color: 'orange' }
  ];

  const features = [
    { icon: Shield, title: 'Conforme', desc: 'Respect total de la loi française' },
    { icon: Zap, title: 'Rapide', desc: 'Génération en moins de 30 secondes' },
    { icon: CheckCircle2, title: 'Fiable', desc: 'Architecture sécurisée et robuste' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero moderne avec stats */}
      <section className="pt-24 pb-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Trusted by 2,500+ landlords
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Gestion de quittances.<br />
                <span className="text-blue-600">Moderne et efficace.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                La plateforme professionnelle pour automatiser vos quittances de loyer en toute conformité.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Démarrer gratuitement
                </button>
                <Link
                  to="/automation"
                  className="border-2 border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors"
                >
                  Voir la démo
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Features cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-6"
                >
                  <Icon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Générateur - Style dashboard */}
      <section id="generator" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <div className="inline-flex items-center bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Gratuit et sans inscription
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Générer une quittance
            </h2>
            <p className="text-lg text-gray-600">
              Remplissez les informations ci-dessous pour créer votre document conforme
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Formulaire structuré en cards */}
            <div className="lg:col-span-2 space-y-6">
              {validationErrors.length > 0 && (
                <div id="validation-errors" className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 mb-2">Informations requises</h3>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Bailleur */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  Informations du bailleur
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                    <input
                      type="text"
                      name="baillorName"
                      value={formData.baillorName}
                      onChange={handleInputChange}
                      placeholder="Jean Dupont"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                    <input
                      type="text"
                      name="baillorAddress"
                      value={formData.baillorAddress}
                      onChange={handleInputChange}
                      placeholder="123 rue de la République, 75001 Paris"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="baillorEmail"
                      value={formData.baillorEmail}
                      onChange={handleInputChange}
                      placeholder="jean.dupont@email.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card Locataire */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-gray-600 font-bold">2</span>
                  </div>
                  Informations du locataire
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom du locataire</label>
                    <input
                      type="text"
                      name="locataireName"
                      value={formData.locataireName}
                      onChange={handleInputChange}
                      placeholder="Marie Martin"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse du logement</label>
                    <input
                      type="text"
                      name="logementAddress"
                      value={formData.logementAddress}
                      onChange={handleInputChange}
                      placeholder="45 avenue des Champs, 75008 Paris"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card Montants */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  Montants et période
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loyer (€)</label>
                      <input
                        type="number"
                        name="loyer"
                        value={formData.loyer}
                        onChange={handleInputChange}
                        placeholder="800"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Charges (€)</label>
                      <input
                        type="number"
                        name="charges"
                        value={formData.charges}
                        onChange={handleInputChange}
                        placeholder="100"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {!formData.isProrata && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
                      <select
                        name="periode"
                        value={formData.periode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="Septembre 2025">Septembre 2025</option>
                        <option value="Août 2025">Août 2025</option>
                        <option value="Juillet 2025">Juillet 2025</option>
                        <option value="Juin 2025">Juin 2025</option>
                        <option value="Mai 2025">Mai 2025</option>
                      </select>
                    </div>
                  )}

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isProrata}
                        onChange={(e) => setFormData(prev => ({ ...prev, isProrata: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">Calculer un prorata</span>
                    </label>
                  </div>

                  {formData.isProrata && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                        <input
                          type="date"
                          name="dateDebut"
                          value={formData.dateDebut}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                        <input
                          type="date"
                          name="dateFin"
                          value={formData.dateFin}
                          onChange={handleInputChange}
                          min={formData.dateDebut || undefined}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {formData.isProrata && prorataAmounts.total > 0 && (
                    <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">Total calculé :</span>
                        <span className="text-2xl font-bold text-gray-900">{prorataAmounts.total.toFixed(2)}€</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Validation */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isElectronicSignatureChecked}
                    onChange={(e) => setIsElectronicSignatureChecked(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Signature électronique</span>
                    <p className="text-sm text-gray-600 mt-1">Je certifie que le paiement a été encaissé</p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Générer la quittance
                    </>
                  )}
                </button>
                {hasContent() && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="border-2 border-gray-300 text-gray-700 px-6 py-3.5 rounded-lg font-semibold hover:border-gray-400 transition-colors flex items-center"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Aperçu
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <Shield className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">100% Conforme</h3>
                <p className="text-sm text-gray-600">
                  Toutes les mentions légales obligatoires sont automatiquement incluses dans votre quittance.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <Zap className="w-8 h-8 text-[#FFD76F] mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Besoin d'automatiser ?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Découvrez notre solution d'automatisation complète
                </p>
                <Link
                  to="/automation"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  En savoir plus <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {showPreview && hasAnyContent() && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
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
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Prêt à automatiser ?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Découvrez notre solution complète pour gérer vos quittances automatiquement
          </p>
          <Link
            to="/automation"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Voir les plans
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomeVersion2;