import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Zap, Shield, CheckCircle, ArrowRight, Download, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const QuittanceGratuiteEnLigne = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Quittance de Loyer Gratuite En Ligne",
    "applicationCategory": "BusinessApplication",
    "description": "Créez vos quittances de loyer gratuitement en ligne, sans inscription",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <SEOHead
        title="Quittance de Loyer Gratuite En Ligne | Créer Quittance Sans Inscription"
        description="Générez gratuitement vos quittances de loyer en ligne. Outil 100% gratuit, sans inscription, conforme à la loi. Téléchargement PDF immédiat. Accessible depuis tout appareil."
        keywords="quittance gratuite en ligne, quittance loyer en ligne gratuite, créer quittance en ligne, générateur quittance en ligne, quittance en ligne sans inscription, outil quittance gratuit en ligne"
        schema={schema}
        canonical="https://quittance-simple.fr/quittance-gratuite-en-ligne"
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
              <Globe className="w-4 h-4 text-[#FFD76F] mr-2" />
              <span className="text-sm font-medium text-gray-700">100% En ligne · 100% Gratuit</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Quittance de loyer<br />
              <span className="text-[#FFD76F]">gratuite en ligne</span>
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              L'outil en ligne le plus simple pour créer vos quittances de loyer gratuitement. Sans inscription, sans téléchargement, accessible depuis n'importe quel appareil.
            </p>

            <Link
              to="/generator"
              className="inline-flex items-center bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105 mb-4"
            >
              Créer ma quittance en ligne
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <p className="text-sm text-gray-600">
              ✓ Sans inscription · ✓ Sans téléchargement · ✓ Résultat immédiat
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Pourquoi choisir un outil en ligne ?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-[#FFD76F]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Accessible partout</h3>
              <p className="text-gray-600">
                Depuis votre ordinateur, tablette ou smartphone. Où que vous soyez, quand vous voulez.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#FFD76F]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune installation</h3>
              <p className="text-gray-600">
                Pas besoin de Word, Excel ou autre logiciel. Tout fonctionne directement dans votre navigateur.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-[#FFD76F]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mise à jour automatique</h3>
              <p className="text-gray-600">
                Toujours conforme aux dernières lois. Pas de mise à jour à télécharger.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#FFD76F]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sécurisé et confidentiel</h3>
              <p className="text-gray-600">
                Vos données sont protégées et ne sont jamais partagées avec des tiers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Avantages de l'outil en ligne vs logiciels traditionnels
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-gray-600">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ✓ Pas d'installation requise
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Contrairement à Word ou Excel, vous n'avez rien à installer. Ouvrez votre navigateur, remplissez le formulaire, et recevez votre PDF. C'est tout.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-gray-600">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ✓ Compatible tous appareils
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Que vous soyez sur PC, Mac, iPhone, iPad ou Android, l'outil fonctionne parfaitement. Même depuis votre smartphone en déplacement.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-gray-600">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ✓ Toujours à jour
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Les modèles Word/Excel deviennent vite obsolètes quand la loi change. Notre outil en ligne est automatiquement mis à jour pour rester conforme.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-gray-600">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ✓ Plus rapide qu'Excel ou Word
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Formulaire guidé, calculs automatiques, PDF généré instantanément. 30 secondes au lieu de 10 minutes avec les logiciels classiques.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-gray-600">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ✓ Aucune compétence technique requise
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Pas besoin de maîtriser Excel ou Word. L'interface est intuitive et vous guide à chaque étape.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-gray-600">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ✓ 100% gratuit, pour toujours
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Contrairement à certains logiciels qui passent payants après l'essai, notre générateur en ligne reste gratuit à vie. Créez autant de quittances que nécessaire, sans limite.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Comment utiliser l'outil en ligne ?
          </h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Accédez au générateur</h3>
                <p className="text-gray-700 leading-relaxed">
                  Cliquez sur le bouton "Créer ma quittance" ci-dessous. Aucune inscription, aucun téléchargement. Le formulaire s'ouvre immédiatement dans votre navigateur.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Remplissez le formulaire en ligne</h3>
                <p className="text-gray-700 leading-relaxed">
                  Entrez les informations demandées : noms du bailleur et locataire, adresse du logement, montants. Le formulaire vous guide et calcule automatiquement les totaux.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Téléchargez votre PDF</h3>
                <p className="text-gray-700 leading-relaxed">
                  Cliquez sur "Générer". Votre quittance PDF est créée instantanément et envoyée par email. Vous pouvez l'imprimer ou la transférer directement à votre locataire.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/generator"
              className="inline-flex items-center bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:from-orange-700 hover:to-red-700 transition-all"
            >
              Essayer l'outil en ligne maintenant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Questions fréquentes sur l'outil en ligne
          </h2>

          <div className="space-y-4">
            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Est-ce vraiment gratuit et en ligne ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui, à 100%. Notre générateur est entièrement en ligne et totalement gratuit. Aucune inscription, aucun abonnement caché. Vous pouvez créer autant de quittances que nécessaire sans payer un centime.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Dois-je installer un logiciel ou une application ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Non, absolument pas. Tout fonctionne directement dans votre navigateur web (Chrome, Firefox, Safari, Edge...). Aucune installation, aucun téléchargement requis.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Puis-je utiliser l'outil depuis mon smartphone ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui ! L'outil est entièrement responsive et fonctionne parfaitement sur smartphone et tablette. Créez vos quittances depuis n'importe où, même en déplacement.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Mes données sont-elles sécurisées ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui, toutes vos données sont chiffrées et sécurisées. Nous ne partageons jamais vos informations avec des tiers. Vous pouvez utiliser l'outil en toute confiance.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                L'outil fonctionne-t-il sans connexion internet ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Une connexion internet est nécessaire pour utiliser l'outil en ligne et générer vos PDF. Cependant, une fois le PDF téléchargé, vous pouvez le consulter hors ligne.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Combien de quittances puis-je créer en ligne ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Illimité ! Vous pouvez générer autant de quittances que vous le souhaitez, pour autant de locataires et de périodes que nécessaire. C'est 100% gratuit et sans limite.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à créer votre quittance en ligne ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Rejoignez plus de 2 500 propriétaires qui utilisent notre outil en ligne chaque mois.
          </p>
          <Link
            to="/generator"
            className="inline-flex items-center bg-white text-[#FFD76F] px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Créer ma quittance maintenant
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default QuittanceGratuiteEnLigne;
