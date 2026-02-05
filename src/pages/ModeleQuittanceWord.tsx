import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, Shield, CheckCircle, ArrowRight, Zap, Clock, Users, Star, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const ModeleQuittanceWord = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Modèle quittance Word Gratuit - Conforme 2026",
    "description": "Alternative au modèle Word : générez vos quittances de loyer conformes en PDF sans mise en page manuelle ni risque d'erreur.",
    "author": {
      "@type": "Organization",
      "name": "Quittance Simple"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Modèle quittance Word Gratuit - Conforme 2026"
        description="Téléchargez un modèle de quittance Word ou générez automatiquement vos quittances PDF conformes 2026. Sans mise en page manuelle, sans risque d'oublis juridiques."
        keywords="modèle quittance word, quittance word gratuit, template quittance word, quittance loyer word 2026, modèle word quittance"
        schema={schema}
        canonical="https://quittance-simple.fr/modele-quittance-word"
      />

      <section className="pt-12 sm:pt-16 pb-8 sm:pb-12 bg-[#fefdf9]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center bg-white rounded-full px-3 py-1.5 shadow-sm mb-4">
              <FileText className="w-4 h-4 text-[#7CAA89] mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Alternative moderne au modèle Word · 100% gratuit</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              Modèle quittance Word<br />
              <span className="text-[#7CAA89]">Gratuit - Conforme 2026</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
              Vous cherchez un modèle de quittance Word ? Découvrez une solution plus rapide et sécurisée : générez vos quittances PDF conformes en 30 secondes, sans mise en page manuelle ni risque d'oublis juridiques.
            </p>

            <Link
              to="/generator"
              className="inline-flex items-center bg-[#ed7862] hover:bg-[#e56651] text-white px-5 py-2.5 rounded-full font-bold shadow-lg transition-all text-sm"
            >
              Générer ma quittance PDF maintenant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
            Pourquoi abandonner les modèles Word pour vos quittances ?
          </h2>

          <div className="space-y-6 mb-12">
            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Problème 1 : Mise en page chronophage et répétitive
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Avec un modèle Word, vous devez <strong>modifier manuellement</strong> chaque champ à chaque nouvelle quittance : nom du locataire, montant, mois, date... Cela prend <strong>5 à 10 minutes par quittance</strong> alors que vous pourriez faire ça en 30 secondes.
                  </p>
                  <p className="text-sm text-red-800 font-semibold">
                    → Perte de temps importante, surtout si vous gérez plusieurs locataires.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Problème 2 : Risque d'erreurs et d'oublis légaux
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    En remplissant un document Word manuellement, vous risquez d'<strong>oublier une mention obligatoire</strong> (détail des charges, période concernée, adresse complète...). Une quittance incomplète peut être <strong>rejetée par la CAF</strong> ou poser problème lors d'un litige.
                  </p>
                  <p className="text-sm text-red-800 font-semibold">
                    → Risque juridique important pour une simple erreur de frappe.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Problème 3 : Formatage instable et conversion PDF manuelle
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Le formatage Word peut <strong>sauter ou se décaler</strong> selon la version utilisée. Ensuite, vous devez <strong>convertir manuellement</strong> votre document en PDF pour l'envoyer, ce qui rajoute encore une étape.
                  </p>
                  <p className="text-sm text-red-800 font-semibold">
                    → Rendu peu professionnel et étape supplémentaire fastidieuse.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Problème 4 : Logiciel payant et compatibilité limitée
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Microsoft Word nécessite un <strong>abonnement Office 365</strong> ou une licence payante. Si vous utilisez LibreOffice ou OpenOffice, le formatage peut être différent et les fichiers .doc/.docx peuvent ne pas s'afficher correctement.
                  </p>
                  <p className="text-sm text-red-800 font-semibold">
                    → Coût supplémentaire et problèmes de compatibilité.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-2xl p-8">
            <div className="flex items-start">
              <CheckCircle className="w-8 h-8 text-green-600 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  La solution : Quittance Simple
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Notre générateur en ligne remplace avantageusement les modèles Word :
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>Formulaire guidé</strong> : remplissez uniquement les champs nécessaires, aucune mise en page à gérer</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>100% conforme</strong> : toutes les mentions légales obligatoires sont automatiquement incluses</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>PDF instantané</strong> : téléchargement direct au format PDF professionnel, aucune conversion nécessaire</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>Totalement gratuit</strong> : aucun logiciel à acheter, accessible depuis n'importe quel appareil</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>30 secondes chrono</strong> : 10 fois plus rapide qu'un modèle Word à remplir</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">
            Comparatif : Modèle Word vs Quittance Simple
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
              <thead className="bg-[#7CAA89] text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Critère</th>
                  <th className="px-6 py-4 text-center">Quittance Simple</th>
                  <th className="px-6 py-4 text-center">Modèle Word</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Temps de création</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-green-600">30 secondes</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-600">5-10 minutes</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Mise en page</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-semibold">Automatique</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Manuelle</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Risque d'erreur</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-semibold">Aucun</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Élevé</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Conformité légale</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌ À vérifier</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Format PDF</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-semibold">Direct</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Conversion manuelle</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Logiciel requis</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-semibold">Aucun</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Word payant</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Envoi automatique</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Compatible tous appareils</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌ Limité</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Questions fréquentes sur les modèles Word
          </h2>

          <div className="space-y-3">
            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Où trouver un modèle de quittance Word gratuit ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Vous pouvez trouver des modèles Word sur divers sites, mais ils sont souvent <strong>obsolètes ou incomplets</strong>. Nous vous recommandons plutôt d'utiliser notre <Link to="/generator" className="text-[#7CAA89] underline font-semibold">générateur en ligne gratuit</Link> qui garantit une conformité 100% et un gain de temps considérable.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Les modèles Word sont-ils conformes à la loi ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Cela dépend de la source. Beaucoup de modèles Word téléchargeables sont <strong>périmés et ne respectent pas les dernières obligations légales</strong> (Loi Alur, mentions obligatoires mises à jour en 2026). Avec notre outil, vous êtes garanti d'avoir une quittance conforme à 100%.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Puis-je modifier un modèle Word facilement ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Techniquement oui, mais c'est <strong>long et fastidieux</strong>. Vous devez modifier manuellement chaque champ à chaque nouvelle quittance, gérer le formatage, puis convertir en PDF. Avec Quittance Simple, vous remplissez un formulaire une seule fois et le PDF est généré instantanément.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Le générateur Quittance Simple est-il vraiment gratuit ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                <strong>Oui, totalement gratuit !</strong> Vous pouvez générer autant de quittances que vous voulez sans payer. Si vous souhaitez automatiser l'envoi mensuel, des options payantes existent à partir de 0,99€/mois, mais le générateur manuel reste gratuit à vie.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Puis-je utiliser Quittance Simple sur mobile ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Absolument ! Contrairement aux modèles Word qui nécessitent un ordinateur et un logiciel installé, notre générateur fonctionne <strong>sur tous les appareils</strong> : smartphone, tablette, ordinateur. Créez vos quittances depuis n'importe où.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-[#ed7862]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Prêt à créer votre quittance sans Word ?
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-6">
            Créez vos quittances conformes en 30 secondes au lieu de 10 minutes.
          </p>
          <Link
            to="/generator"
            className="inline-flex items-center bg-white text-[#ed7862] px-5 py-2.5 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all text-sm"
          >
            Générer ma quittance maintenant
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ModeleQuittanceWord;
