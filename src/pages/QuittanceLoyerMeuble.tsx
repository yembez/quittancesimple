import React from 'react';
import { Link } from 'react-router-dom';
import { Home, CheckCircle, ArrowRight, FileText, Shield, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const QuittanceLoyerMeuble = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Quittance de Loyer pour Location Meublée - Guide Complet",
    "description": "Tout savoir sur les quittances de loyer en location meublée : obligations, spécificités, modèle gratuit conforme."
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <SEOHead
        title="Quittance Loyer Meublé | Modèle Gratuit Location Meublée Conforme"
        description="Générez gratuitement vos quittances pour location meublée. Modèle conforme aux spécificités de la location meublée, mentions obligatoires, téléchargement PDF instantané."
        keywords="quittance loyer meublé, location meublée quittance, modèle quittance meublé gratuit, LMNP quittance, bail meublé quittance"
        schema={schema}
        canonical="https://quittance-simple.fr/quittance-loyer-meuble"
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
              <Home className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Spécial Location Meublée</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Quittance de loyer<br />
              <span className="text-orange-600">location meublée</span>
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Créez vos quittances adaptées aux spécificités de la location meublée. Conformes à la loi ALUR et au régime LMNP/LMP.
            </p>

            <Link
              to="/generator"
              className="inline-flex items-center bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105"
            >
              Créer ma quittance meublé
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Quittance en location meublée : ce qu'il faut savoir
          </h2>

          <div className="bg-orange-50 border-l-4 border-orange-600 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <Shield className="w-8 h-8 text-orange-600 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Les mêmes obligations qu'en location vide
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Que votre logement soit meublé ou vide, les obligations concernant la quittance de loyer sont identiques. Vous devez fournir gratuitement une quittance au locataire qui en fait la demande, conformément à l'article 21 de la loi du 6 juillet 1989.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Mentions obligatoires pour une location meublée
          </h3>

          <div className="space-y-4 mb-12">
            <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Identité du bailleur</h4>
                  <p className="text-gray-700">
                    Nom, prénom et adresse du propriétaire. En LMNP, indiquez votre statut et numéro SIRET si applicable.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Identité du locataire</h4>
                  <p className="text-gray-700">
                    Nom et prénom du locataire signataire du bail meublé.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Adresse du logement meublé</h4>
                  <p className="text-gray-700">
                    Adresse complète du bien loué en meublé.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Détail des montants</h4>
                  <p className="text-gray-700">
                    Loyer hors charges + montant des charges = total payé. En meublé, le loyer est souvent plus élevé que pour un logement vide.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Période et signature</h4>
                  <p className="text-gray-700">
                    Mois concerné et signature du bailleur (électronique ou manuscrite).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Spécificités de la location meublée
          </h3>

          <div className="space-y-6">
            <div className="bg-orange-50 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-3">Durée du bail</h4>
              <p className="text-gray-700 leading-relaxed">
                Un bail meublé dure 1 an minimum (ou 9 mois pour les étudiants), contre 3 ans pour un bail vide. Malgré cette différence, l'obligation de fournir une quittance reste identique.
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-3">Loyer souvent plus élevé</h4>
              <p className="text-gray-700 leading-relaxed">
                En location meublée, le loyer est généralement 10 à 30% plus élevé qu'en location vide, car le logement est équipé. Indiquez toujours le montant exact sur la quittance.
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-3">LMNP et LMP</h4>
              <p className="text-gray-700 leading-relaxed">
                Si vous louez en LMNP (Loueur Meublé Non Professionnel) ou LMP (Loueur Meublé Professionnel), les quittances que vous émettez servent également de pièces comptables pour votre activité. Conservez-les précieusement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Questions fréquentes sur la quittance en meublé
          </h2>

          <div className="space-y-4">
            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                La quittance diffère-t-elle entre meublé et non meublé ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Non, le format et les mentions obligatoires sont identiques. Seul le montant du loyer peut différer (souvent plus élevé en meublé). Les obligations légales restent les mêmes.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Dois-je mentionner que le logement est meublé ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Ce n'est pas obligatoire sur la quittance elle-même, mais vous pouvez le préciser si vous le souhaitez. L'important est de respecter les mentions légales obligatoires.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Comment gérer les quittances en LMNP ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                En LMNP, conservez toutes vos quittances pour votre comptabilité. Elles servent de justificatifs de revenus locatifs. Vous pouvez mentionner votre numéro SIRET sur la quittance si vous le souhaitez.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Puis-je facturer la quittance à mon locataire ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Non, jamais. Que ce soit en meublé ou non meublé, la quittance doit être fournie gratuitement sur demande du locataire. C'est une obligation légale.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Le locataire peut-il utiliser la quittance pour la CAF ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui, absolument. Même en location meublée, votre locataire peut bénéficier d'aides au logement (APL, ALF). La quittance sert de justificatif de paiement auprès de la CAF.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl p-8 text-white text-center">
            <FileText className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Créez vos quittances meublé en 30 secondes
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Notre générateur s'adapte à tous les types de location : meublée, non meublée, LMNP, LMP, colocation...
            </p>
            <Link
              to="/generator"
              className="inline-flex items-center bg-white text-orange-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Générer ma quittance maintenant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default QuittanceLoyerMeuble;
