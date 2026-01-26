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
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Quittance Loyer Meublé | Modèle Gratuit Location Meublée Conforme"
        description="Générez gratuitement vos quittances pour location meublée. Modèle conforme aux spécificités de la location meublée, mentions obligatoires, téléchargement PDF instantané."
        keywords="quittance loyer meublé, location meublée quittance, modèle quittance meublé gratuit, LMNP quittance, bail meublé quittance"
        schema={schema}
        canonical="https://quittance-simple.fr/quittance-loyer-meuble"
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
              <Home className="w-4 h-4 text-[#7CAA89] mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Spécial Location Meublée</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              Quittance de loyer<br />
              <span className="text-[#7CAA89]">location meublée</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
              Créez vos quittances adaptées aux spécificités de la location meublée. Conformes à la loi ALUR et au régime LMNP/LMP.
            </p>

            <Link
              to="/generator"
              className="inline-flex items-center bg-[#ed7862] hover:bg-[#e56651] text-white px-5 py-2.5 rounded-full font-bold shadow-lg transition-all text-sm"
            >
              Créer ma quittance meublé
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Quittance en location meublée : ce qu'il faut savoir
          </h2>

          <div className="bg-[#7CAA89]/10 border-l-4 border-[#7CAA89] rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <Shield className="w-6 h-6 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                  Les mêmes obligations qu'en location vide
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Que votre logement soit meublé ou vide, les obligations concernant la quittance de loyer sont identiques. Vous devez fournir gratuitement une quittance au locataire qui en fait la demande, conformément à l'article 21 de la loi du 6 juillet 1989.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Mentions obligatoires pour une location meublée
          </h3>

          <div className="space-y-3 mb-8">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Identité du bailleur</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Nom, prénom et adresse du propriétaire. En LMNP, indiquez votre statut et numéro SIRET si applicable.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Identité du locataire</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Nom et prénom du locataire signataire du bail meublé.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Adresse du logement meublé</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Adresse complète du bien loué en meublé.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Détail des montants</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Loyer hors charges + montant des charges = total payé. En meublé, le loyer est souvent plus élevé que pour un logement vide.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#7CAA89] mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Période et signature</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Mois concerné et signature du bailleur (électronique ou manuscrite).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Spécificités de la location meublée
          </h3>

          <div className="space-y-4">
            <div className="bg-gray-100 rounded-xl p-4">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Durée du bail</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Un bail meublé dure 1 an minimum (ou 9 mois pour les étudiants), contre 3 ans pour un bail vide. Malgré cette différence, l'obligation de fournir une quittance reste identique.
              </p>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Loyer souvent plus élevé</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                En location meublée, le loyer est généralement 10 à 30% plus élevé qu'en location vide, car le logement est équipé. Indiquez toujours le montant exact sur la quittance.
              </p>
            </div>

            <div className="bg-[#7CAA89]/10 border-l-4 border-[#7CAA89] rounded-xl p-4">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Charges en location meublée : spécificités</h4>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Les charges locatives en meublé suivent les mêmes règles qu'en location vide, mais avec quelques particularités importantes :
              </p>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <h5 className="text-sm font-bold text-gray-900 mb-1">Charges récupérables identiques</h5>
                  <p className="text-xs text-gray-700">
                    Les charges récupérables sont les mêmes qu'en location vide (eau, chauffage collectif, entretien des parties communes, taxe ordures ménagères). Elles doivent être détaillées séparément du loyer sur la quittance.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <h5 className="text-sm font-bold text-gray-900 mb-1">Provisions sur charges plus élevées</h5>
                  <p className="text-xs text-gray-700">
                    En meublé, les provisions sur charges sont souvent plus importantes car elles peuvent inclure l'électricité, le gaz, internet si ces services sont inclus dans le bail. Ces provisions doivent apparaître sur chaque quittance mensuelle.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <h5 className="text-sm font-bold text-gray-900 mb-1">Régularisation annuelle obligatoire</h5>
                  <p className="text-xs text-gray-700">
                    Comme en location vide, vous devez procéder à une régularisation annuelle des charges. La différence entre les provisions et les charges réelles doit être remboursée au locataire ou réclamée en supplément.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <h5 className="text-sm font-bold text-gray-900 mb-1">Charges forfaitaires possibles</h5>
                  <p className="text-xs text-gray-700">
                    En meublé, vous pouvez opter pour des charges forfaitaires (montant fixe mensuel) au lieu de provisions avec régularisation. Dans ce cas, le forfait doit être mentionné sur la quittance et ne peut être modifié en cours de bail sans accord du locataire.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <h5 className="text-sm font-bold text-gray-900 mb-1">Justificatifs à conserver</h5>
                  <p className="text-xs text-gray-700">
                    En location meublée, conservez précieusement tous les justificatifs de charges (factures eau, électricité, internet, entretien) pendant au moins 3 ans. Ils peuvent être demandés par le locataire lors de la régularisation annuelle.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">LMNP et LMP</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Si vous louez en LMNP (Loueur Meublé Non Professionnel) ou LMP (Loueur Meublé Professionnel), les quittances que vous émettez servent également de pièces comptables pour votre activité. Conservez-les précieusement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Questions fréquentes sur la quittance en meublé
          </h2>

          <div className="space-y-3">
            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                La quittance diffère-t-elle entre meublé et non meublé ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Non, le format et les mentions obligatoires sont identiques. Seul le montant du loyer peut différer (souvent plus élevé en meublé). Les obligations légales restent les mêmes. Consultez notre page sur le <Link to="/modele-quittance-loyer-gratuit" className="text-[#7CAA89] underline font-semibold">modèle de quittance de loyer conforme 2026</Link> pour en savoir plus.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Dois-je mentionner que le logement est meublé ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Ce n'est pas obligatoire sur la quittance elle-même, mais vous pouvez le préciser si vous le souhaitez. L'important est de respecter les mentions légales obligatoires.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Comment gérer les quittances en LMNP ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                En LMNP, conservez toutes vos quittances pour votre comptabilité. Elles servent de justificatifs de revenus locatifs. Vous pouvez mentionner votre numéro SIRET sur la quittance si vous le souhaitez.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Puis-je facturer la quittance à mon locataire ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Non, jamais. Que ce soit en meublé ou non meublé, la quittance doit être fournie gratuitement sur demande du locataire. C'est une obligation légale.
              </p>
            </details>

            <details className="bg-white rounded-xl p-4 shadow-md cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-gray-900 cursor-pointer">
                Le locataire peut-il utiliser la quittance pour la CAF ?
              </summary>
              <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                Oui, absolument. Même en location meublée, votre locataire peut bénéficier d'aides au logement (APL, ALF). La quittance sert de justificatif de paiement auprès de la CAF.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#ed7862] rounded-2xl p-6 text-white text-center">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Créez vos quittances meublé en 30 secondes
            </h2>
            <p className="text-base sm:text-lg text-white/90 mb-6">
              Notre générateur s'adapte à tous les types de location : meublée, non meublée, LMNP, LMP, colocation...
            </p>
            <Link
              to="/generator"
              className="inline-flex items-center bg-white text-[#ed7862] px-5 py-2.5 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all text-sm"
            >
              Générer ma quittance maintenant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default QuittanceLoyerMeuble;
