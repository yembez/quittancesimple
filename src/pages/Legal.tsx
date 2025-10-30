import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, CheckCircle, AlertCircle, Scale, BookOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const Legal = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Obligations légales et mentions obligatoires d'une quittance de loyer",
    "description": "Guide complet sur la conformité légale des quittances de loyer en France : loi de 1989, mentions obligatoires, délais et obligations du bailleur.",
    "author": {
      "@type": "Organization",
      "name": "Quittance Simple"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Quittance de loyer : obligations légales et mentions obligatoires 2025 | Guide complet"
        description="Tout savoir sur les obligations légales d'une quittance de loyer en France : loi de 1989, mentions obligatoires, délais d'envoi, conformité et droits du locataire."
        keywords="quittance loyer loi 1989, mentions obligatoires quittance, obligations bailleur quittance, conformité quittance loyer, légal quittance, modèle conforme quittance"
        schema={schema}
        canonical="https://quittance-simple.fr/obligations-legales"
      />

      <section className="pt-20 pb-16 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm mb-6">
              <Scale className="w-4 h-4 text-[#79ae91] mr-2" />
              <span className="text-sm font-medium text-[#415052]">Conformité légale garantie</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-[#415052] mb-6 leading-tight">
              Quittances de loyer :<br />
              <span className="text-[#ed7862]">obligations et conformité légale</span>
            </h1>

            <p className="text-xl text-[#415052] leading-relaxed">
              Découvrez tout ce que la loi française impose concernant les quittances de loyer. Guide complet pour les propriétaires et bailleurs.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#ed7862]/10 border-l-4 border-[#ed7862] rounded-2xl p-8 mb-12">
            <div className="flex items-start">
              <Shield className="w-8 h-8 text-[#ed7862] mr-4 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-[#415052] mb-3">
                  La quittance de loyer est-elle obligatoire ?
                </h2>
                <p className="text-[#415052] leading-relaxed mb-4">
                  <strong>Non, elle n'est pas obligatoire</strong> pour le bailleur, SAUF si le locataire en fait la demande. L'article 21 de la loi du 6 juillet 1989 stipule clairement :
                </p>
                <p className="text-gray-800 font-semibold italic bg-white p-4 rounded-lg border border-[#ed7862]/20">
                  "Le bailleur est tenu de transmettre gratuitement une quittance au locataire qui en fait la demande."
                </p>
                <p className="text-[#415052] leading-relaxed mt-4">
                  En résumé : vous devez fournir une quittance dès que votre locataire vous la demande, et ce, sans frais supplémentaires.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-[#415052] mb-8 flex items-center">
            <FileText className="w-8 h-8 text-[#ed7862] mr-3" />
            Mentions obligatoires d'une quittance de loyer
          </h2>

          <p className="text-[#415052] leading-relaxed mb-8">
            Pour qu'une quittance de loyer soit conforme à la législation française, elle doit impérativement contenir les informations suivantes :
          </p>

          <div className="space-y-6 mb-12">
            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-[#415052] mb-2">1. Identité complète du bailleur</h3>
                  <p className="text-[#415052] leading-relaxed">
                    Nom et prénom (ou raison sociale pour une société), adresse complète du propriétaire ou de son mandataire (agence immobilière, gérant).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-[#415052] mb-2">2. Identité complète du locataire</h3>
                  <p className="text-[#415052] leading-relaxed">
                    Nom et prénom du ou des locataires signataires du bail.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-[#415052] mb-2">3. Adresse précise du logement loué</h3>
                  <p className="text-[#415052] leading-relaxed">
                    Numéro, rue, code postal, ville, et si nécessaire : étage, bâtiment, numéro d'appartement.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-[#415052] mb-2">4. Période concernée</h3>
                  <p className="text-[#415052] leading-relaxed">
                    Mois et année du loyer payé (ex. : "Septembre 2025"). Si le paiement est effectué au prorata, préciser les dates exactes.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-[#415052] mb-2">5. Montant du loyer hors charges</h3>
                  <p className="text-[#415052] leading-relaxed">
                    Le montant du loyer principal (sans les charges) doit être indiqué clairement en euros.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-[#415052] mb-2">6. Montant des charges</h3>
                  <p className="text-[#415052] leading-relaxed">
                    Les charges locatives (provisions sur charges, charges forfaitaires) doivent être distinctes du loyer.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-[#415052] mb-2">7. Montant total payé</h3>
                  <p className="text-[#415052] leading-relaxed">
                    Somme du loyer et des charges. C'est le montant effectivement réglé par le locataire.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-[#415052] mb-2">8. Date d'émission de la quittance</h3>
                  <p className="text-[#415052] leading-relaxed">
                    La date à laquelle la quittance est établie et signée.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-[#415052] mb-2">9. Signature du bailleur</h3>
                  <p className="text-[#415052] leading-relaxed">
                    La quittance doit être signée par le bailleur ou son représentant légal. La signature électronique est acceptée et a la même valeur légale qu'une signature manuscrite.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#ed7862]/10 border border-[#ed7862]/20 rounded-2xl p-6 mb-12">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-[#ed7862] mr-4 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-[#415052] mb-2">Important</h3>
                <p className="text-[#415052] leading-relaxed">
                  Une quittance ne peut être délivrée que si le paiement a été intégralement reçu. Si le locataire n'a payé qu'une partie du loyer, vous devez émettre un <strong>reçu partiel de loyer</strong>, pas une quittance.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-[#415052] mb-8 flex items-center">
            <BookOpen className="w-8 h-8 text-[#ed7862] mr-3" />
            Cadre légal : la loi du 6 juillet 1989
          </h2>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 mb-12">
            <p className="text-[#415052] leading-relaxed mb-6">
              La <strong>loi n° 89-462 du 6 juillet 1989</strong> (modifiée par la loi ALUR de 2014) encadre les relations entre bailleurs et locataires pour les locations vides ou meublées à usage d'habitation principale.
            </p>

            <h3 className="text-xl font-bold text-[#415052] mb-4">Article 21 : Quittance de loyer</h3>
            <div className="bg-gray-50 border-l-4 border-[#ed7862] p-6 rounded-lg mb-6">
              <p className="text-gray-800 italic leading-relaxed">
                "Le bailleur est tenu de transmettre gratuitement une quittance au locataire qui en fait la demande. La quittance porte le détail des sommes versées par le locataire en précisant le montant du loyer et celui des charges. Elle est adressée par voie dématérialisée, sauf opposition du locataire."
              </p>
            </div>

            <h4 className="font-bold text-[#415052] mb-3">Ce que cela signifie concrètement :</h4>
            <ul className="space-y-2 text-[#415052]">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span>La quittance est <strong>gratuite</strong> pour le locataire.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span>Elle doit être fournie <strong>sur demande</strong> du locataire.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span>L'envoi par email (voie dématérialisée) est privilégié, sauf si le locataire préfère un format papier.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span>Le détail loyer/charges doit être clairement indiqué.</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-[#415052] mb-8">
            Délais et modalités d'envoi
          </h2>

          <div className="space-y-6 mb-12">
            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-[#415052] mb-3">Quand envoyer la quittance ?</h3>
              <p className="text-[#415052] leading-relaxed mb-4">
                La loi n'impose pas de délai précis, mais il est d'usage de l'envoyer <strong>dès réception du paiement</strong>, généralement début du mois suivant.
              </p>
              <p className="text-[#415052] leading-relaxed">
                Exemple : le loyer de septembre est payé début septembre, la quittance peut être envoyée immédiatement après encaissement ou dans les premiers jours d'octobre.
              </p>
            </div>

            <div className="bg-white border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-[#415052] mb-3">Par quel moyen ?</h3>
              <ul className="space-y-2 text-[#415052]">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span><strong>Email (recommandé)</strong> : rapide, écologique, conforme à la loi.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span><strong>Courrier postal</strong> : si le locataire le demande expressément.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span><strong>Remise en main propre</strong> : possible, mais pensez à conserver une preuve.</span>
                </li>
              </ul>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-[#415052] mb-8">
            Quittance vs Reçu partiel : quelle différence ?
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-green-900 mb-4">Quittance de loyer</h3>
              <p className="text-[#415052] mb-4">
                Document attestant que le locataire a <strong>payé la totalité</strong> du loyer et des charges pour la période indiquée.
              </p>
              <p className="text-sm text-green-800 font-semibold">
                ✓ Paiement intégral reçu
              </p>
            </div>

            <div className="bg-[#ed7862]/10 border-2 border-[#ed7862]/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-orange-900 mb-4">Reçu partiel</h3>
              <p className="text-[#415052] mb-4">
                Document attestant qu'un <strong>paiement partiel</strong> a été effectué. Il précise le montant versé et le solde restant dû.
              </p>
              <p className="text-sm text-orange-800 font-semibold">
                ⚠ Paiement incomplet
              </p>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-600 rounded-2xl p-8 mb-12">
            <div className="flex items-start">
              <AlertCircle className="w-8 h-8 text-red-600 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-red-900 mb-3">
                  Attention : ne délivrez jamais de quittance en cas de paiement partiel !
                </h3>
                <p className="text-[#415052] leading-relaxed">
                  Émettre une quittance alors que le loyer n'est pas entièrement payé pourrait être interprété comme une renonciation à réclamer le solde. Utilisez toujours un reçu partiel dans ce cas.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-[#415052] mb-8">
            Cas particuliers et situations spécifiques
          </h2>

          <div className="space-y-6 mb-12">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-[#415052] mb-3">Location meublée</h3>
              <p className="text-[#415052] leading-relaxed">
                Les mêmes règles s'appliquent. La quittance est obligatoire sur demande du locataire, qu'il s'agisse d'une location vide ou meublée.
              </p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-[#415052] mb-3">Colocation</h3>
              <p className="text-[#415052] leading-relaxed">
                Si plusieurs locataires sont signataires du bail avec un loyer global, une seule quittance peut être émise au nom de tous. Si les baux sont séparés, chaque colocataire doit recevoir sa propre quittance.
              </p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-[#415052] mb-3">SCI et LMNP</h3>
              <p className="text-[#415052] leading-relaxed">
                Si vous gérez vos locations via une SCI ou en LMNP, les obligations restent identiques. La quittance doit être émise au nom de la société ou de l'exploitant.
              </p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-[#415052] mb-3">Quittance et CAF</h3>
              <p className="text-[#415052] leading-relaxed">
                Les locataires bénéficiant d'aides au logement (APL, ALF, ALS) ont besoin de quittances pour justifier de leurs paiements auprès de la CAF. Fournissez-les régulièrement pour faciliter leurs démarches.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br bg-[#ed7862] rounded-3xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              Générez vos quittances conformes en 30 secondes
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Avec Quittance Simple, toutes les mentions obligatoires sont automatiquement incluses. Aucun risque d'erreur, conformité garantie.
            </p>
            <Link
              to="/generator"
              className="inline-block bg-white text-[#ed7862] px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Créer ma quittance conforme
              <ArrowRight className="w-5 h-5 inline-block ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#fefdf9]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#415052] mb-8 text-center">
            Questions fréquentes sur la légalité
          </h2>

          <div className="space-y-4">
            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-[#415052] cursor-pointer">
                Puis-je refuser de fournir une quittance à mon locataire ?
              </summary>
              <p className="text-[#415052] mt-4 leading-relaxed">
                Non. Si le locataire en fait la demande et que le loyer est entièrement payé, vous êtes légalement obligé de lui fournir gratuitement une quittance. Le refus constitue une infraction.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-[#415052] cursor-pointer">
                Puis-je facturer la quittance au locataire ?
              </summary>
              <p className="text-[#415052] mt-4 leading-relaxed">
                Non, absolument pas. L'article 21 de la loi de 1989 précise que la quittance doit être transmise <strong>gratuitement</strong>. Tout frais facturé au locataire pour l'obtention d'une quittance est illégal.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-[#415052] cursor-pointer">
                La signature électronique est-elle valable ?
              </summary>
              <p className="text-[#415052] mt-4 leading-relaxed">
                Oui, la signature électronique a la même valeur juridique qu'une signature manuscrite, conformément au règlement européen eIDAS. Quittance Simple utilise une signature électronique conforme pour tous vos documents.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-[#415052] cursor-pointer">
                Combien de temps dois-je conserver les quittances ?
              </summary>
              <p className="text-[#415052] mt-4 leading-relaxed">
                En tant que bailleur, il est recommandé de conserver les quittances pendant au moins <strong>3 ans</strong> (délai de prescription des loyers). Pour le locataire, elles peuvent servir de justificatif pour des démarches administratives (CAF, impôts) pendant plusieurs années.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-[#415052] cursor-pointer">
                Que risque un bailleur qui ne fournit pas de quittance ?
              </summary>
              <p className="text-[#415052] mt-4 leading-relaxed">
                Le refus de fournir une quittance sur demande peut entraîner des sanctions, notamment dans le cadre d'un litige devant la commission départementale de conciliation ou le tribunal. De plus, cela peut nuire à la relation locative et compliquer d'éventuelles procédures ultérieures.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Legal;
