import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function GenerateurQuittanceLoyerPage() {
  const intro = (
    <>
      <p>Un générateur de quittance de loyer vous permet de créer des quittances conformes à la loi en quelques clics, sans passer par Word ou Excel. Idéal pour les propriétaires qui louent un ou plusieurs logements et qui veulent gagner du temps tout en rester en règle.</p>
      <p>Notre générateur en ligne est gratuit, sans inscription, et produit un PDF prêt à être envoyé au locataire ou à la CAF. Les mentions obligatoires sont incluses automatiquement.</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <QuittanceImageBlock title="Exemple de quittance générée par notre outil :" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'Accéder au générateur',
      content: 'Rendez-vous sur notre page générateur de quittance de loyer. Aucune inscription n’est nécessaire pour une utilisation ponctuelle. Vous remplissez un formulaire simple : bailleur, locataire, adresse du logement, période, montants du loyer et des charges.',
    },
    {
      title: 'Vérifier et valider',
      content: 'Les champs essentiels sont rappelés (nom, prénom, adresse, période, loyer, charges). Vous vérifiez les montants et la période, puis vous lancez la génération. Le PDF est créé en quelques secondes.',
    },
    {
      title: 'Télécharger ou envoyer',
      content: 'Vous pouvez télécharger la quittance en PDF sur votre appareil, l’imprimer ou l’envoyer par e-mail à votre locataire. Optionnellement, en créant un compte, vous pouvez automatiser l’envoi mensuel.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'Le générateur de quittance de loyer est-il vraiment gratuit ?',
      a: 'Oui. La création et le téléchargement de quittances sont gratuits et illimités. Aucune carte bancaire n’est demandée. Une offre payante existe pour automatiser l’envoi chaque mois, mais elle est optionnelle.',
    },
    {
      q: 'Faut-il créer un compte pour utiliser le générateur ?',
      a: 'Non. Vous pouvez générer et télécharger vos quittances sans compte. La création d’un compte est utile si vous souhaitez enregistrer vos informations pour les réutiliser ou activer l’envoi automatique mensuel.',
    },
    {
      q: 'Les quittances générées sont-elles conformes à la loi ?',
      a: 'Oui. Le générateur respecte la loi du 6 juillet 1989 et la Loi Alur : toutes les mentions obligatoires (identités, adresse, période, loyer, charges, total, date, signature) sont incluses. Le document est valable pour la CAF et les organismes sociaux.',
    },
    {
      q: 'Puis-je générer des quittances pour plusieurs locataires ?',
      a: 'Oui. Vous pouvez créer autant de quittances que vous avez de locataires ou de logements. Chaque quittance est indépendante ; il suffit de modifier les informations à chaque génération.',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Générateur de quittance de loyer gratuit | PDF conforme en 2 min"
      metaDescription="Générateur de quittance de loyer gratuit en ligne. Créez des quittances PDF conformes à la loi en 2 minutes. Sans inscription. Valable CAF et administrations."
      keywords="générateur quittance de loyer, générateur quittance loyer gratuit, créer quittance loyer en ligne"
      canonical={`${SITE}/generateur-quittance-loyer`}
      h1="Générateur de quittance de loyer : gratuit et conforme en 2 minutes"
      intro={intro}
      visualTitle="Comment fonctionne le générateur ?"
      visualContent={visualContent}
      howItWorksTitle="Comment utiliser le générateur de quittance de loyer ?"
      howItWorks={howItWorks}
      faqTitle="Générateur quittance de loyer : questions fréquentes"
      faq={faq}
    />
  );
}
