import React from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Heart, Star, MessageCircle, Users, ThumbsUp, Coffee } from 'lucide-react';
import QuittancePreview from '../components/QuittancePreview';
import { sendQuittanceByEmail } from '../utils/emailService';

// VERSION 3 : "SERVICE DE PROXIMITÉ" - Ambiance locale et chaleureuse
// Comme un artisan de confiance, photos authentiques, témoignages, très humain

const HomeVersion3 = () => {
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

  const testimonials = [
    {
      name: 'Sophie M.',
      role: 'Propriétaire à Lyon',
      comment: 'Enfin un service qui comprend vraiment nos besoins ! Simple et efficace.',
      rating: 5
    },
    {
      name: 'Thomas B.',
      role: 'Propriétaire à Paris',
      comment: 'Je recommande à tous mes amis propriétaires. Prix imbattable, service impeccable.',
      rating: 5
    },
    {
      name: 'Marie D.',
      role: 'Propriétaire à Marseille',
      comment: 'Plus de prise de tête avec les quittances. Merci pour ce service !',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Hero chaleureux avec photo authentique */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-orange-100 to-amber-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm mb-6">
                <Heart className="w-4 h-4 mr-2 fill-current" style={{
                  background: 'linear-gradient(135deg, #FFD76F 0%, #FF7A7F 50%, #A46BFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }} />
                <span className="text-sm font-medium text-gray-700">Fait par des propriétaires, pour des propriétaires</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Vos quittances,<br />
                <span className="text-[#FFD76F]">sans galère</span>
              </h1>

              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                On sait ce que c'est d'être propriétaire. On a créé la solution qu'on aurait aimé avoir : simple, abordable, et qui marche vraiment.
              </p>

              <div className="flex items-center mb-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 border-2 border-white"></div>
                  ))}
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Plus de 2 500 propriétaires satisfaits</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-[#FFD76F] text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-[#d4a03f] transition-all transform hover:scale-105"
                >
                  Créer ma première quittance
                </button>
                <Link
                  to="/automation"
                  className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all border-2 border-gray-200"
                >
                  Découvrir l'automatisation
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/Lucid_Origin_A_relaxed_man_about_45_years_old_lying_on_a_deck__3 copy.jpg"
                  alt="Propriétaire détendu"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge flottant */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 max-w-xs">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 rounded-full p-3">
                    <ThumbsUp className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">98% satisfaits</p>
                    <p className="text-sm text-gray-600">Propriétaires comme vous</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Confiance */}
      <section className="py-12 bg-white border-y border-orange-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Coffee className="w-12 h-12 text-[#FFD76F] mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Simple comme bonjour</h3>
              <p className="text-gray-600">Aucune formation nécessaire. Si vous savez envoyer un email, vous savez utiliser notre service.</p>
            </div>
            <div>
              <Users className="w-12 h-12 text-[#FFD76F] mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">On est là pour vous</h3>
              <p className="text-gray-600">Une vraie équipe disponible pour répondre à toutes vos questions. Pas de robot, que des humains.</p>
            </div>
            <div>
              <Heart className="w-12 h-12 mx-auto mb-4 fill-current" style={{
                background: 'linear-gradient(135deg, #FFD76F 0%, #FF7A7F 50%, #A46BFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }} />
              <h3 className="font-bold text-gray-900 mb-2">Prix mini, qualité maxi</h3>
              <p className="text-gray-600">On ne vous prend pas pour un porte-monnaie. Des tarifs honnêtes pour un service qui tient ses promesses.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Générateur - Style chaleureux */}
      <section id="generator" className="py-16 bg-amber-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center bg-gray-100 text-gray-800 px-4 py-2 rounded-full font-semibold mb-4">
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-2 animate-pulse"></span>
              Gratuit • Aucune inscription • Résultat immédiat
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Créez votre quittance en 2 minutes
            </h2>
            <p className="text-xl text-gray-700">
              Juste quelques infos basiques, et hop, c'est fait !
            </p>
          </motion.div>

          <div className="bg-white rounded-3xl shadow-2xl border-4 border-orange-200 p-8 lg:p-12">
            <form className="space-y-8">
              {validationErrors.length > 0 && (
                <div id="validation-errors" className="bg-red-100 border-l-4 border-red-500 rounded-xl p-6">
                  <h3 className="text-red-900 font-bold text-lg mb-3">Oups ! Il manque quelques infos :</h3>
                  <ul className="space-y-2">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-red-800 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section Vous */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="bg-[#FFD76F] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
                  C'est vous !
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="baillorName"
                    value={formData.baillorName}
                    onChange={handleInputChange}
                    placeholder="Votre nom complet"
                    className="w-full px-4 py-4 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:outline-none text-lg"
                  />
                  <input
                    type="text"
                    name="baillorAddress"
                    value={formData.baillorAddress}
                    onChange={handleInputChange}
                    placeholder="Votre adresse"
                    className="w-full px-4 py-4 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:outline-none text-lg"
                  />
                  <input
                    type="email"
                    name="baillorEmail"
                    value={formData.baillorEmail}
                    onChange={handleInputChange}
                    placeholder="Votre email"
                    className="w-full px-4 py-4 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:outline-none text-lg"
                  />
                </div>
              </div>

              {/* Section Locataire */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
                  Votre locataire
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="locataireName"
                    value={formData.locataireName}
                    onChange={handleInputChange}
                    placeholder="Nom du locataire"
                    className="w-full px-4 py-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none text-lg"
                  />
                  <input
                    type="text"
                    name="logementAddress"
                    value={formData.logementAddress}
                    onChange={handleInputChange}
                    placeholder="Adresse du logement"
                    className="w-full px-4 py-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none text-lg"
                  />
                </div>
              </div>

              {/* Section Montants */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
                  Les montants
                </h3>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Loyer (€)</label>
                      <input
                        type="number"
                        name="loyer"
                        value={formData.loyer}
                        onChange={handleInputChange}
                        placeholder="Ex: 800"
                        className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:outline-none text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Charges (€)</label>
                      <input
                        type="number"
                        name="charges"
                        value={formData.charges}
                        onChange={handleInputChange}
                        placeholder="Ex: 100"
                        className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:outline-none text-lg"
                      />
                    </div>
                  </div>

                  {!formData.isProrata && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Pour quel mois ?</label>
                      <select
                        name="periode"
                        value={formData.periode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:outline-none text-lg bg-white"
                      >
                        <option value="Septembre 2025">Septembre 2025</option>
                        <option value="Août 2025">Août 2025</option>
                        <option value="Juillet 2025">Juillet 2025</option>
                        <option value="Juin 2025">Juin 2025</option>
                        <option value="Mai 2025">Mai 2025</option>
                      </select>
                    </div>
                  )}

                  <div className="bg-white rounded-xl p-4 border-2 border-gray-300">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isProrata}
                        onChange={(e) => setFormData(prev => ({ ...prev, isProrata: e.target.checked }))}
                        className="w-6 h-6 mt-1 text-gray-600 border-2 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="font-semibold text-gray-900">Entrée ou sortie en cours de mois ?</span>
                        <p className="text-sm text-gray-600 mt-1">Cochez si vous avez besoin d'un prorata temporis</p>
                      </div>
                    </label>
                  </div>

                  {formData.isProrata && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Date d'entrée</label>
                        <input
                          type="date"
                          name="dateDebut"
                          value={formData.dateDebut}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:outline-none text-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Date de sortie</label>
                        <input
                          type="date"
                          name="dateFin"
                          value={formData.dateFin}
                          onChange={handleInputChange}
                          min={formData.dateDebut || undefined}
                          className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:outline-none text-lg"
                        />
                      </div>
                    </div>
                  )}

                  {formData.isProrata && prorataAmounts.total > 0 && (
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-500 text-center">
                      <p className="text-gray-600 mb-2">Montant calculé :</p>
                      <p className="text-4xl font-bold text-gray-600">{prorataAmounts.total.toFixed(2)}€</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isElectronicSignatureChecked}
                    onChange={(e) => setIsElectronicSignatureChecked(e.target.checked)}
                    className="w-6 h-6 mt-1 text-amber-600 border-2 border-gray-300 rounded"
                  />
                  <div className="ml-4">
                    <span className="text-lg font-bold text-gray-900">Je certifie avoir reçu le paiement</span>
                    <p className="text-gray-600 mt-1">Cette case valide électroniquement votre quittance</p>
                  </div>
                </label>
              </div>
            </form>

            {/* Boutons d'action */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    C'est parti...
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6 mr-3" />
                    Recevoir ma quittance par email
                  </>
                )}
              </button>
              {hasContent() && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="border-4 border-orange-300 text-gray-900 px-8 py-5 rounded-2xl font-bold text-xl hover:border-orange-400 transition-all bg-white"
                >
                  Voir l'aperçu
                </button>
              )}
            </div>

            {showPreview && hasAnyContent() && (
              <div className="mt-8">
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
      </section>

      {/* Témoignages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Ce qu'en disent les propriétaires
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-800 italic mb-4">"{testimonial.comment}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Envie d'automatiser tout ça ?
          </h2>
          <p className="text-2xl mb-10 opacity-90">
            Découvrez comment on peut vous faire gagner des heures chaque mois
          </p>
          <Link
            to="/automation"
            className="inline-flex items-center bg-white text-[#FFD76F] px-10 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <MessageCircle className="w-6 h-6 mr-3" />
            Discutons de l'automatisation
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomeVersion3;