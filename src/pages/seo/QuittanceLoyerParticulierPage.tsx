import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function QuittanceLoyerParticulierPage() {
  const intro = (
    <>
      <p>En tant que propriétaire particulier, vous devez délivrer une quittance de loyer à chaque paiement. Ce document prouve que le locataire a bien réglé son loyer et ses charges ; il est utile pour la CAF, les banques et votre propre comptabilité.</p>
      <p>Pas besoin d’être un professionnel : notre outil est conçu pour les particuliers qui louent un ou plusieurs logements. La quittance générée est conforme à la loi et prête en quelques clics.</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <QuittanceImageBlock title="Exemple de quittance pour propriétaire particulier :" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'Pourquoi le particulier doit délivrer une quittance',
      content: 'La loi n’impose pas explicitement de remettre une quittance chaque mois, mais c’est une pratique courante et recommandée. Le locataire en a besoin pour la CAF, pour un prêt, ou pour justifier son adresse. En tant que bailleur particulier, vous gagnez à avoir un document propre et conforme pour éviter les litiges et faciliter les démarches de votre locataire.',
    },
    {
      title: 'Un outil adapté aux propriétaires particuliers',
      content: 'Notre générateur ne demande ni compétences juridiques ni logiciel payant. Vous remplissez un formulaire avec vos coordonnées, celles du locataire, l’adresse du logement, la période et les montants. Le PDF est généré automatiquement avec toutes les mentions obligatoires.',
    },
    {
      title: 'Gratuit et sans engagement',
      content: 'La création de quittances est gratuite et illimitée. Vous n’avez pas besoin de créer un compte pour une utilisation occasionnelle. Si vous avez plusieurs biens ou locataires, vous pouvez générer autant de quittances que nécessaire.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'Le propriétaire particulier est-il obligé de donner une quittance ?',
      a: 'La loi ne impose pas formellement de remettre une quittance à chaque paiement, mais c’est une obligation courante dans les baux et une pratique attendue. Le locataire a souvent besoin de ce justificatif (CAF, banque, administration). Délivrer une quittance conforme évite aussi les litiges.',
    },
    {
      q: 'Comment faire une quittance en tant que particulier ?',
      a: 'Vous pouvez utiliser notre générateur en ligne : vous saisissez les informations du bailleur (vous), du locataire, l’adresse du logement, la période et les montants (loyer, charges). Le PDF conforme est généré en quelques secondes, sans Word ni Excel.',
    },
    {
      q: 'La quittance du particulier a-t-elle la même valeur qu’une quittance d’agence ?',
      a: 'Oui. Une quittance établie par un propriétaire particulier a la même valeur juridique qu’une quittance délivrée par une agence, dès lors qu’elle contient les mentions obligatoires (identités, adresse, période, montants, date, signature).',
    },
    {
      q: 'Puis-je signer la quittance électroniquement en tant que particulier ?',
      a: 'Oui. La signature électronique est reconnue par la loi (loi du 13 mars 2000). Vous pouvez générer la quittance en PDF et la signer électroniquement, ou l’imprimer et la signer à la main avant de la remettre au locataire.',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Quittance de loyer pour particulier | Gratuite et conforme"
      metaDescription="Quittance de loyer pour propriétaire particulier : gratuite, conforme à la loi. Générez vos quittances en PDF en 2 minutes, sans logiciel."
      keywords="quittance de loyer particulier, quittance loyer propriétaire particulier, quittance bailleur particulier"
      canonical={`${SITE}/quittance-loyer-particulier`}
      h1="Quittance de loyer pour le propriétaire particulier"
      intro={intro}
      visualTitle="Besoin du propriétaire particulier"
      visualContent={visualContent}
      howItWorksTitle="Quittance de loyer en tant que particulier : comment faire ?"
      howItWorks={howItWorks}
      faqTitle="Quittance loyer particulier : questions fréquentes"
      faq={faq}
    />
  );
}
