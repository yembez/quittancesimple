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
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Générateur quittance de loyer PDF gratuit | Téléchargement immédiat"
        description="Générateur quittance de loyer PDF gratuit en ligne. Créez et téléchargez vos quittances au format PDF sécurisé. 100% conforme à la loi française, génération instantanée, sans inscription."
        keywords="générateur quittance de loyer PDF, quittance loyer pdf gratuit, créer quittance pdf, télécharger quittance gratuite, quittance pdf conforme, générateur pdf quittance loyer"
        schema={schema}
        canonical="https://quittance-simple.fr/quittance-loyer-pdf-gratuit"
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
              <Download className="w-4 h-4 text-[#7CAA89] mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">100% Gratuit · Sans inscription</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              Générateur quittance de loyer<br />
              <span className="text-[#7CAA89]">PDF gratuit</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
              Générateur quittance de loyer PDF gratuit en ligne. Créez et téléchargez instantanément vos quittances au format PDF sécurisé. Modèle 100% conforme à la législation française, prêt en 30 secondes.
            </p>

            <Link
              to="/generator"
              className="inline-flex items-center bg-[#ed7862] hover:bg-[#e56651] text-white px-5 py-2.5 rounded-full font-bold shadow-lg transition-all text-sm"
            >
              Créer ma quittance PDF gratuite
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
            Pourquoi choisir notre générateur PDF gratuit ?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#7CAA89]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Euro className="w-6 h-6 text-[#7CAA89]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">100% Gratuit</h3>
              <p className="text-sm text-gray-600">
                Aucun frais caché, aucun abonnement obligatoire. Générez autant de quittances que nécessaire.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#7CAA89]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-[#7CAA89]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">100% Conforme</h3>
              <p className="text-sm text-gray-600">
                Respect strict de la loi du 6 juillet 1989. Toutes les mentions obligatoires incluses.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#7CAA89]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-[#7CAA89]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Téléchargement instantané</h3>
              <p className="text-sm text-gray-600">
                Recevez votre quittance PDF par email immédiatement après génération.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#7CAA89]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-[#7CAA89]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Sans inscription</h3>
              <p className="text-sm text-gray-600">
                Pas besoin de créer un compte. Remplissez le formulaire et c'est tout.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Pourquoi le PDF est-il le format le plus sûr pour vos quittances ?
          </h2>

          <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Shield className="w-6 h-6 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Protection contre les modifications</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Le format PDF garantit que le document ne peut pas être modifié après sa génération. Contrairement à Word ou Excel, personne ne peut altérer les montants, dates ou signatures. C'est essentiel pour la sécurité juridique du propriétaire et du locataire.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Rendu identique sur tous les appareils</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Un PDF s'affiche exactement de la même manière sur PC, Mac, smartphone ou tablette. Pas de problème de compatibilité, pas de mise en page qui saute. Votre quittance reste professionnelle partout.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FileText className="w-6 h-6 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Valeur légale reconnue</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Le format PDF est reconnu par toutes les administrations françaises (CAF, impôts, banques). C'est le format standard pour les documents officiels et les justificatifs de paiement.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="w-6 h-6 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Archivage et conservation optimaux</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Les PDF se conservent parfaitement dans le temps, sans risque de corruption de fichier. Idéal pour conserver vos quittances pendant les 3 ans légalement requis (voire 5 ans recommandés).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 mt-8">
            Que contient notre générateur de quittance PDF ?
          </h2>

          <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
              Notre générateur de quittance PDF gratuit crée automatiquement un document professionnel contenant toutes les mentions légales obligatoires selon la loi française :
            </p>

            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Identité complète du bailleur</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Nom, prénom et adresse du propriétaire ou de son mandataire.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Identité du locataire</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Nom et prénom du ou des locataires signataires du bail.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Adresse du logement</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Adresse complète du bien loué.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Période concernée</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Mois et année du loyer payé.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Détail des montants</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Loyer hors charges, montant des charges, total payé.</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Date et signature</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Date d'émission et signature électronique du bailleur.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#7CAA89]/10 border-l-4 border-[#7CAA89] rounded-xl p-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">Format PDF professionnel</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Le PDF généré est prêt à être imprimé ou envoyé par email à votre locataire. Il peut servir de justificatif de paiement pour la CAF, les impôts ou toute démarche administrative. Pour en savoir plus sur les obligations légales, consultez notre page sur le <Link to="/modele-quittance-loyer-gratuit" className="text-[#7CAA89] underline font-semibold">modèle de quittance de loyer conforme 2026</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Comment générer votre quittance PDF gratuite ?
          </h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-gray-700 text-white rounded-xl flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Remplissez le formulaire en ligne</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Entrez les informations du bailleur, du locataire, l'adresse du logement, et les montants du loyer et des charges. Le formulaire est simple et guidé, vous ne pouvez pas vous tromper.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-10 h-10 bg-gray-700 text-white rounded-xl flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Validez avec la signature électronique</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Cochez la case de signature électronique pour certifier que le paiement a bien été reçu. La signature électronique a la même valeur légale qu'une signature manuscrite.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-10 h-10 bg-gray-700 text-white rounded-xl flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Téléchargez votre PDF</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Recevez immédiatement votre quittance au format PDF par email. Vous pouvez l'imprimer, l'envoyer par email à votre locataire, ou la conserver dans vos archives numériques.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/generator"
              className="inline-flex items-center bg-[#ed7862] hover:bg-[#e56651] text-white px-5 py-2.5 rounded-full font-bold shadow-lg transition-all text-sm"
            >
              Générer ma quittance PDF maintenant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Questions fréquentes sur les quittances PDF
          </h2>

          <div className="space-y-3">
            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Le modèle PDF est-il vraiment gratuit ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Oui, à 100%. Vous pouvez générer autant de quittances PDF que nécessaire sans payer un centime. Aucune inscription n'est requise et il n'y a aucun frais caché.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Le PDF est-il conforme à la loi française ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Absolument. Notre modèle respecte toutes les exigences de la loi du 6 juillet 1989 et inclut toutes les mentions obligatoires. Vous pouvez l'utiliser en toute tranquillité.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Puis-je utiliser ce PDF pour la CAF ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Oui, le PDF généré est un justificatif de paiement officiel que votre locataire peut utiliser pour toutes ses démarches administratives, y compris auprès de la CAF. Notre <Link to="/" className="text-[#7CAA89] underline font-semibold">générateur de quittance gratuite en ligne</Link> crée des documents 100% conformes.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Puis-je personnaliser le modèle PDF ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Le format est standardisé pour garantir la conformité légale. Cependant, vous pouvez ajuster toutes les informations personnelles, montants, dates et périodes directement dans le formulaire.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Combien de quittances puis-je créer ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Illimité ! Vous pouvez générer autant de quittances PDF gratuites que vous le souhaitez, pour autant de locataires et de périodes que nécessaire.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-[#ed7862]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Prêt à créer votre quittance PDF gratuite ?
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-6">
            Rejoignez plus de 2 500 propriétaires qui utilisent notre générateur gratuit chaque mois.
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

export default QuittancePDFGratuit;
