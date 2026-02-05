import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, Shield, CheckCircle, ArrowRight, Zap, Clock, Users, Star, XCircle, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const ModeleQuittanceExcel = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Modèle quittance Excel avec calcul automatique - 2026",
    "description": "Alternative au modèle Excel : générez vos quittances de loyer avec calculs automatiques sans erreur ni perte de temps.",
    "author": {
      "@type": "Organization",
      "name": "Quittance Simple"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Modèle quittance Excel avec calcul automatique - 2026"
        description="Modèle Excel de quittance avec calculs automatiques ou générez vos quittances PDF conformes 2026. Plus simple qu'Excel, résultat plus professionnel."
        keywords="modèle quittance excel, quittance excel gratuit, template quittance excel, quittance loyer excel 2026, tableur quittance"
        schema={schema}
        canonical="https://quittance-simple.fr/modele-quittance-excel"
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
              <Calculator className="w-4 h-4 text-[#7CAA89] mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Alternative intelligente à Excel · Calculs automatiques</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              Modèle quittance Excel<br />
              <span className="text-[#7CAA89]">avec calcul automatique - 2026</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
              Vous gérez vos loyers sur Excel ? Découvrez une solution plus fiable : générez vos quittances PDF conformes avec calculs automatiques, sans erreur de formule ni perte de temps.
            </p>

            <Link
              to="/generator"
              className="inline-flex items-center bg-[#ed7862] hover:bg-[#e56651] text-white px-5 py-2.5 rounded-full font-bold shadow-lg transition-all text-sm"
            >
              Automatiser mes calculs gratuitement
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
            Pourquoi Excel n'est pas fait pour les quittances de loyer
          </h2>

          <div className="space-y-6 mb-12">
            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Problème 1 : Erreurs de calcul fréquentes
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Avec Excel, <strong>une formule peut facilement se casser</strong> : copier-coller une cellule, supprimer une ligne par erreur, modifier une référence... Un montant incorrect sur une quittance peut entraîner des <strong>litiges avec votre locataire</strong> ou des refus de la CAF.
                  </p>
                  <p className="text-sm text-red-800 font-semibold">
                    → Risque élevé d'erreurs de calcul difficiles à détecter.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Problème 2 : Rendu peu professionnel
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Excel est un <strong>tableur, pas un outil de mise en page</strong>. Les documents générés ont rarement un rendu professionnel : lignes de grille apparentes, formatage instable, marges incorrectes lors de l'impression... Votre locataire ou la CAF peuvent <strong>douter de l'authenticité</strong> du document.
                  </p>
                  <p className="text-sm text-red-800 font-semibold">
                    → Apparence amateur qui nuit à votre crédibilité.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Problème 3 : Temps perdu en maintenance
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Gérer un fichier Excel demande un <strong>entretien constant</strong> : vérifier les formules, ajuster les montants, copier les lignes pour les nouveaux mois, sauvegarder plusieurs versions... Vous passez plus de temps à <strong>maintenir votre tableur</strong> qu'à gérer votre bien locatif.
                  </p>
                  <p className="text-sm text-red-800 font-semibold">
                    → Perte de temps considérable chaque mois.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Problème 4 : Courbe d'apprentissage et maîtrise requise
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Excel nécessite de <strong>maîtriser les formules</strong>, la mise en forme conditionnelle, les références de cellules... Si vous n'êtes pas à l'aise avec le logiciel, créer un modèle de quittance conforme peut prendre <strong>plusieurs heures</strong>. Et une seule erreur de conception peut tout faire planter.
                  </p>
                  <p className="text-sm text-red-800 font-semibold">
                    → Complexité technique inutile pour une simple quittance.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Problème 5 : Conversion PDF manuelle et résultat aléatoire
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Une fois votre quittance créée dans Excel, vous devez <strong>l'exporter en PDF</strong> manuellement. Selon votre version d'Excel et les paramètres d'export, le résultat peut être différent : <strong>mise en page coupée, texte tronqué, colonnes décalées</strong>...
                  </p>
                  <p className="text-sm text-red-800 font-semibold">
                    → Étape supplémentaire avec résultat imprévisible.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-2xl p-8">
            <div className="flex items-start">
              <Calculator className="w-8 h-8 text-green-600 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  La solution : Quittance Simple (plus simple qu'Excel)
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Notre générateur remplace avantageusement Excel pour vos quittances :
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>Calculs automatiques 100% fiables</strong> : loyer + charges = total, aucun risque d'erreur de formule</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>Rendu PDF professionnel</strong> : document officiel conforme aux standards, accepté partout</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>Zéro maintenance</strong> : pas de fichier Excel à gérer, tout est automatique</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>Interface ultra-simple</strong> : aucune compétence technique requise, utilisable par tous</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>Conformité légale garantie</strong> : toutes les mentions obligatoires automatiquement incluses</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700"><strong>30 secondes chrono</strong> : 20 fois plus rapide qu'un tableur Excel</span>
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
            Comparatif : Modèle Excel vs Quittance Simple
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
              <thead className="bg-[#7CAA89] text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Critère</th>
                  <th className="px-6 py-4 text-center">Quittance Simple</th>
                  <th className="px-6 py-4 text-center">Modèle Excel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Calculs automatiques</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-green-600">100% fiables</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Risque d'erreurs</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Temps de création</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-green-600">30 secondes</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-600">3-5 minutes</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Rendu professionnel</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Non optimal</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Compétences requises</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-semibold">Aucune</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Maîtrise Excel</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Maintenance</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-semibold">Aucune</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Constante</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Format PDF</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-semibold">Automatique</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Export manuel</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Conformité légale</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌ À vérifier</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Envoi automatique</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Gestion multi-locataires</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600">Complexe</span>
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
            Questions fréquentes sur les modèles Excel
          </h2>

          <div className="space-y-3">
            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Où trouver un modèle Excel de quittance avec formules ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Vous pouvez télécharger des modèles Excel sur Internet, mais <strong>les formules sont souvent incomplètes ou non protégées</strong>. Une cellule supprimée par erreur peut tout casser. Nous recommandons d'utiliser notre <Link to="/generator" className="text-[#7CAA89] underline font-semibold">générateur automatique</Link> qui garantit des calculs 100% fiables.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Excel est-il adapté pour gérer des quittances de loyer ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Excel est excellent pour faire des <strong>calculs et tableaux de suivi</strong>, mais <strong>pas pour créer des documents officiels</strong>. Le rendu est peu professionnel et les formules peuvent se casser facilement. Pour les quittances, un outil dédié comme Quittance Simple est bien plus approprié.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Comment éviter les erreurs de calcul sur Excel ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Vous pouvez <strong>protéger les cellules avec formules</strong> et vérifier manuellement chaque mois, mais cela reste contraignant. La meilleure solution : utiliser un générateur qui fait <strong>tous les calculs automatiquement</strong> sans risque d'erreur humaine.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Puis-je automatiser mes quittances depuis Excel ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                <strong>Non, Excel ne peut pas envoyer automatiquement des emails</strong> avec les quittances. Vous devez exporter en PDF puis envoyer manuellement chaque mois. Avec Quittance Simple, l'envoi automatique mensuel est possible à partir de 0,99€/mois.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Quittance Simple fonctionne-t-il sur mobile ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Oui ! Contrairement à Excel qui nécessite un ordinateur pour être confortable, notre générateur fonctionne <strong>parfaitement sur smartphone et tablette</strong>. Créez vos quittances depuis n'importe où en quelques secondes.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-[#ed7862]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Prêt à automatiser vos calculs ?
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-6">
            Zéro formule à gérer. Calculs automatiques garantis. PDF professionnel en 30 secondes.
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

export default ModeleQuittanceExcel;
