import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Shield, CheckCircle, ArrowRight, Zap, Clock, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const ModeleQuittanceLoyer = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Modèle de Quittance de Loyer Gratuit - Téléchargement Immédiat",
    "description": "Téléchargez gratuitement le meilleur modèle de quittance de loyer conforme à la loi française. Format PDF, Word, Excel disponibles.",
    "author": {
      "@type": "Organization",
      "name": "Quittance Simple"
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <SEOHead
        title="Modèle Quittance Loyer Gratuit 2025 | PDF Word Excel Téléchargement Immédiat"
        description="Téléchargez gratuitement votre modèle de quittance de loyer conforme 2025. Format PDF, Word, Excel. Modèle officiel 100% légal selon loi 1989. Génération automatique en ligne."
        keywords="modèle quittance loyer gratuit, modèle quittance pdf gratuit, modèle quittance word, modèle quittance excel gratuit, modèle de quittance de loyer, template quittance gratuit, exemple quittance loyer, modèle officiel quittance"
        schema={schema}
        canonical="https://quittance-simple.fr/modele-quittance-loyer-gratuit"
      />

      <section className="pt-20 pb-16 bg-gradient-to-b from-orange-100 to-amber-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm mb-6">
              <Star className="w-4 h-4 text-orange-600 mr-2 fill-current" />
              <span className="text-sm font-medium text-gray-700">Modèle officiel 2025 · 100% gratuit</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Modèle de quittance<br />
              <span className="text-orange-600">de loyer gratuit</span>
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Téléchargez gratuitement le meilleur modèle de quittance de loyer conforme à la loi française. Disponible en PDF, Word et Excel. Génération automatique en 30 secondes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                to="/generator"
                className="inline-flex items-center bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105"
              >
                Générer ma quittance maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            <p className="text-sm text-gray-600">
              ✓ Sans inscription · ✓ Téléchargement immédiat · ✓ Format PDF professionnel
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Pourquoi notre modèle de quittance est le meilleur ?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">100% Conforme</h3>
              <p className="text-gray-600">
                Modèle officiel respectant la loi du 6 juillet 1989 et toutes les mentions obligatoires.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Formats multiples</h3>
              <p className="text-gray-600">
                Téléchargez en PDF, Word ou Excel selon vos besoins. Compatible tous logiciels.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Génération rapide</h3>
              <p className="text-gray-600">
                Créez votre quittance en 30 secondes au lieu de 10 minutes avec Word ou Excel.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">2500+ utilisateurs</h3>
              <p className="text-gray-600">
                Rejoignez des milliers de propriétaires qui nous font confiance chaque mois.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Comparatif : Notre modèle vs Modèles traditionnels
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
              <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Fonctionnalité</th>
                  <th className="px-6 py-4 text-center">Quittance Simple</th>
                  <th className="px-6 py-4 text-center">Modèle Word/Excel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Gratuit</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">100% Conforme loi 1989</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌ Pas toujours</span>
                  </td>
                </tr>
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
                  <td className="px-6 py-4 font-medium text-gray-900">Envoi automatique</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Signature électronique</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Format PDF professionnel</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌ Conversion nécessaire</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Automatisation possible</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Sans logiciel requis</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">❌ Word/Excel requis</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Pourquoi abandonner les modèles Word et Excel ?
          </h2>

          <div className="space-y-6">
            <div className="bg-orange-50 border-l-4 border-orange-600 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ❌ Modèles Word : lents et risqués
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Les modèles de quittance Word nécessitent de modifier manuellement chaque champ à chaque fois. Risque d'erreur, perte de temps, formatage qui saute... Et il faut ensuite convertir en PDF manuellement.
              </p>
              <p className="text-sm text-orange-800 font-semibold">
                → Avec Quittance Simple : formulaire guidé, aucune erreur possible, PDF automatique.
              </p>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-600 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ❌ Modèles Excel : complexes et peu professionnels
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Excel n'est pas fait pour créer des documents officiels. Les formules peuvent se casser, le rendu n'est pas professionnel, et il faut maîtriser le logiciel.
              </p>
              <p className="text-sm text-orange-800 font-semibold">
                → Avec Quittance Simple : interface simple, rendu PDF professionnel garanti.
              </p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ✓ Solution en ligne : rapide et moderne
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Notre générateur en ligne est accessible de partout, sur tous les appareils. Aucun logiciel à installer, aucune mise à jour à faire. Toujours conforme aux dernières lois.
              </p>
              <p className="text-sm text-green-800 font-semibold">
                → Générez votre quittance en 30 secondes depuis n'importe où.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Questions fréquentes sur les modèles de quittance
          </h2>

          <div className="space-y-4">
            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Quel est le meilleur format : PDF, Word ou Excel ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Le <strong>PDF est le meilleur format</strong> pour une quittance de loyer car il garantit que le document ne sera pas modifié et conserve un rendu professionnel sur tous les appareils. Word et Excel sont pratiques pour créer le modèle, mais le document final doit être en PDF.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Où trouver un modèle de quittance gratuit conforme ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Utilisez notre générateur gratuit en ligne ! Il crée automatiquement des quittances 100% conformes à la loi française. Beaucoup plus simple et rapide qu'un modèle Word ou Excel à remplir manuellement.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Les modèles Word/Excel sont-ils conformes à la loi ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Ça dépend d'où vous les téléchargez. De nombreux modèles gratuits en ligne sont <strong>obsolètes ou incomplets</strong>. Notre générateur garantit que toutes les mentions obligatoires de la loi du 6 juillet 1989 sont toujours présentes et à jour.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Puis-je personnaliser le modèle de quittance ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui ! Notre générateur vous permet d'ajuster toutes les informations : noms, adresses, montants, périodes. Le format reste standardisé pour garantir la conformité légale, mais toutes les données sont personnalisables.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Combien coûte votre modèle de quittance ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                <strong>0€, totalement gratuit !</strong> Vous pouvez générer autant de quittances que vous voulez sans payer un centime. Si vous souhaitez automatiser l'envoi, des options payantes existent à partir de 1€/mois, mais le générateur reste gratuit à vie.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Puis-je utiliser le même modèle pour location meublée et non meublée ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui ! Les mentions obligatoires sont identiques pour les locations meublées et non meublées. Seul le montant du loyer peut différer. Notre modèle convient aux deux types de location.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Téléchargements de modèles de quittance disponibles
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/generator"
              className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 hover:shadow-xl transition-all"
            >
              <FileText className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Modèle PDF</h3>
              <p className="text-gray-700 mb-4">
                Format professionnel prêt à imprimer ou envoyer par email.
              </p>
              <div className="flex items-center text-orange-600 font-semibold">
                Générer PDF
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <Link
              to="/generator"
              className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 hover:shadow-xl transition-all"
            >
              <FileText className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Alternative Word</h3>
              <p className="text-gray-700 mb-4">
                Notre générateur est plus rapide qu'un modèle Word à remplir.
              </p>
              <div className="flex items-center text-orange-600 font-semibold">
                Essayer maintenant
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <Link
              to="/generator"
              className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 hover:shadow-xl transition-all"
            >
              <FileText className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Alternative Excel</h3>
              <p className="text-gray-700 mb-4">
                Plus simple qu'Excel, résultat plus professionnel.
              </p>
              <div className="flex items-center text-orange-600 font-semibold">
                Essayer maintenant
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à utiliser le meilleur modèle de quittance ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Oubliez Word et Excel. Créez vos quittances professionnelles en 30 secondes.
          </p>
          <Link
            to="/generator"
            className="inline-flex items-center bg-white text-orange-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Générer ma quittance gratuitement
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ModeleQuittanceLoyer;
