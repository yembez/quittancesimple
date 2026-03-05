import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function QuittanceLoyerPdfPage() {
  const intro = (
    <>
      <p>La quittance de loyer au format PDF est le format le plus pratique et le plus sûr pour prouver le paiement du loyer. Reconnue par les administrations, les banques et la CAF, elle se conserve facilement et s’envoie par e-mail en une seconde.</p>
      <p>Créer une quittance de loyer en PDF ne demande ni logiciel payant ni compétences particulières : avec notre outil en ligne, vous générez un document conforme en quelques clics, sans inscription.</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <QuittanceImageBlock title="À quoi ressemble une quittance de loyer en PDF ?" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'Remplir le formulaire en ligne',
      content: 'Indiquez les informations du bailleur, du locataire, l’adresse du logement, la période et les montants (loyer, charges). L’interface est simple et adaptée aux propriétaires particuliers.',
    },
    {
      title: 'Génération automatique du PDF',
      content: 'Notre outil génère instantanément un PDF conforme à la loi, avec toutes les mentions obligatoires. Le fichier est prêt à être téléchargé ou envoyé par e-mail au locataire.',
    },
    {
      title: 'Téléchargement et envoi',
      content: 'Vous téléchargez la quittance de loyer en PDF sur votre ordinateur ou vous l’envoyez directement au locataire. Le document est valable pour la CAF, les banques et votre comptabilité.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'La quittance de loyer PDF est-elle gratuite ?',
      a: 'Oui. Vous pouvez générer autant de quittances PDF que nécessaire, sans frais ni abonnement. Aucune inscription n’est requise pour une utilisation occasionnelle.',
    },
    {
      q: 'Le PDF est-il accepté par la CAF ?',
      a: 'Oui. Notre quittance PDF contient toutes les mentions exigées par la CAF pour les dossiers d’aide au logement (APL, etc.). Le format PDF est d’ailleurs recommandé pour les pièces justificatives.',
    },
    {
      q: 'Puis-je envoyer la quittance PDF par e-mail à mon locataire ?',
      a: 'Oui. Le PDF peut être envoyé par e-mail, déposé sur un espace partagé ou remis en main propre. La valeur juridique est la même que pour une quittance papier dès lors qu’elle est signée (manuscrite ou électroniquement).',
    },
    {
      q: 'Comment conserver mes quittances PDF ?',
      a: 'Nous vous conseillons de les enregistrer par mois et par locataire (ex. : quittance-2026-01.pdf). Vous pouvez aussi les imprimer pour un classeur. La loi n’impose pas de durée de conservation pour le bailleur, mais 3 ans est un minimum prudent en cas de litige.',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Quittance de loyer PDF gratuite | Conforme et immédiate"
      metaDescription="Générez votre quittance de loyer en PDF gratuitement. Conforme à la loi, valable CAF et banques. Téléchargement immédiat, sans inscription."
      keywords="quittance de loyer PDF, quittance loyer pdf gratuit, créer quittance pdf, télécharger quittance loyer"
      canonical={`${SITE}/quittance-loyer-pdf`}
      h1="Quittance de loyer en PDF : gratuite, conforme et immédiate"
      intro={intro}
      visualTitle="À quoi ressemble une quittance de loyer en PDF ?"
      visualContent={visualContent}
      howItWorksTitle="Comment obtenir une quittance de loyer en PDF ?"
      howItWorks={howItWorks}
      faqTitle="Quittance loyer PDF : questions fréquentes"
      faq={faq}
    />
  );
}
