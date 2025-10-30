import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Shield, CheckCircle, ArrowRight, Clock, Euro, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const QuittancePDFGratuit = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Modèle de Quittance de Loyer PDF Gratuit et Conforme",
    "description": "Téléchargez gratuitement vos quittances de loyer au format PDF. Modèle 100% conforme à la loi française, sans inscription.",
    "author": {
      "@type": "Organization",
      "name": "Quittance Simple"
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <SEOHead
        title="Quittance de Loyer PDF Gratuite | Modèle Conforme Téléchargement Immédiat"
        description="Téléchargez gratuitement votre quittance de loyer au format PDF. Modèle 100% conforme à la loi française, génération instantanée, sans inscription. Idéal pour propriétaires et bailleurs."
        keywords="quittance loyer pdf gratuit, modèle quittance pdf, télécharger quittance gratuite, quittance pdf conforme, modèle gratuit quittance loyer"
        schema={schema}
        canonical="https://quittance-simple.fr/quittance-loyer-pdf-gratuit"
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
              <Download className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">100% Gratuit · Sans inscription</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Quittance de loyer<br />
              <span className="text-orange-600">PDF gratuite</span>
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Générez et téléchargez gratuitement vos quittances de loyer au format PDF professionnel. Modèle 100% conforme à la législation française, prêt en 30 secondes.
            </p>

            <Link
              to="/generator"
              className="inline-flex items-center bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105"
            >
              Créer ma quittance PDF gratuite
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Pourquoi choisir notre modèle PDF gratuit ?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Euro className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">100% Gratuit</h3>
              <p className="text-gray-600">
                Aucun frais caché, aucun abonnement obligatoire. Générez autant de quittances que nécessaire.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">100% Conforme</h3>
              <p className="text-gray-600">
                Respect strict de la loi du 6 juillet 1989. Toutes les mentions obligatoires incluses.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Téléchargement instantané</h3>
              <p className="text-gray-600">
                Recevez votre quittance PDF par email immédiatement après génération.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sans inscription</h3>
              <p className="text-gray-600">
                Pas besoin de créer un compte. Remplissez le formulaire et c'est tout.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Que contient notre modèle de quittance PDF ?
          </h2>

          <div className="bg-white rounded-3xl p-8 shadow-xl mb-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              Notre générateur de quittance PDF gratuit crée automatiquement un document professionnel contenant toutes les mentions légales obligatoires selon la loi française :
            </p>

            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Identité complète du bailleur</h3>
                  <p className="text-gray-600">Nom, prénom et adresse du propriétaire ou de son mandataire.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Identité du locataire</h3>
                  <p className="text-gray-600">Nom et prénom du ou des locataires signataires du bail.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Adresse du logement</h3>
                  <p className="text-gray-600">Adresse complète du bien loué.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Période concernée</h3>
                  <p className="text-gray-600">Mois et année du loyer payé.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Détail des montants</h3>
                  <p className="text-gray-600">Loyer hors charges, montant des charges, total payé.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Date et signature</h3>
                  <p className="text-gray-600">Date d'émission et signature électronique du bailleur.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-600 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Format PDF professionnel</h3>
            <p className="text-gray-700 leading-relaxed">
              Le PDF généré est prêt à être imprimé ou envoyé par email à votre locataire. Il peut servir de justificatif de paiement pour la CAF, les impôts ou toute démarche administrative.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Comment générer votre quittance PDF gratuite ?
          </h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Remplissez le formulaire en ligne</h3>
                <p className="text-gray-700 leading-relaxed">
                  Entrez les informations du bailleur, du locataire, l'adresse du logement, et les montants du loyer et des charges. Le formulaire est simple et guidé, vous ne pouvez pas vous tromper.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Validez avec la signature électronique</h3>
                <p className="text-gray-700 leading-relaxed">
                  Cochez la case de signature électronique pour certifier que le paiement a bien été reçu. La signature électronique a la même valeur légale qu'une signature manuscrite.
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
                  Recevez immédiatement votre quittance au format PDF par email. Vous pouvez l'imprimer, l'envoyer par email à votre locataire, ou la conserver dans vos archives numériques.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/generator"
              className="inline-flex items-center bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:from-orange-700 hover:to-red-700 transition-all"
            >
              Générer ma quittance PDF maintenant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Questions fréquentes sur les quittances PDF
          </h2>

          <div className="space-y-4">
            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Le modèle PDF est-il vraiment gratuit ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui, à 100%. Vous pouvez générer autant de quittances PDF que nécessaire sans payer un centime. Aucune inscription n'est requise et il n'y a aucun frais caché.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Le PDF est-il conforme à la loi française ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Absolument. Notre modèle respecte toutes les exigences de la loi du 6 juillet 1989 et inclut toutes les mentions obligatoires. Vous pouvez l'utiliser en toute tranquillité.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Puis-je utiliser ce PDF pour la CAF ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui, le PDF généré est un justificatif de paiement officiel que votre locataire peut utiliser pour toutes ses démarches administratives, y compris auprès de la CAF.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Puis-je personnaliser le modèle PDF ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Le format est standardisé pour garantir la conformité légale. Cependant, vous pouvez ajuster toutes les informations personnelles, montants, dates et périodes directement dans le formulaire.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Combien de quittances puis-je créer ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Illimité ! Vous pouvez générer autant de quittances PDF gratuites que vous le souhaitez, pour autant de locataires et de périodes que nécessaire.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à créer votre quittance PDF gratuite ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Rejoignez plus de 2 500 propriétaires qui utilisent notre générateur gratuit chaque mois.
          </p>
          <Link
            to="/generator"
            className="inline-flex items-center bg-white text-orange-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Générer ma quittance maintenant
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default QuittancePDFGratuit;
