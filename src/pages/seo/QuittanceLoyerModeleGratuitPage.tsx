import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function QuittanceLoyerModeleGratuitPage() {
  const intro = (
    <>
      <p>Un modèle de quittance de loyer gratuit vous permet de créer des quittances conformes sans acheter de logiciel ni payer d’abonnement. Idéal pour les propriétaires qui veulent un document professionnel et légal en quelques clics.</p>
      <p>Notre modèle gratuit est en ligne : vous n’avez rien à télécharger. Vous renseignez vos informations, et le PDF est généré immédiatement avec toutes les mentions obligatoires.</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <QuittanceImageBlock title="Exemple de quittance avec notre modèle gratuit :" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'Pourquoi utiliser un modèle de quittance gratuit ?',
      content: 'Un modèle gratuit en ligne évite de créer un document from scratch sous Word ou Excel, où il est facile d’oublier une mention. Le générateur s’occupe de la structure et des mentions obligatoires ; vous n’avez qu’à remplir les champs. Gain de temps et conformité garantie.',
    },
    {
      title: 'Modèle gratuit sans limite',
      content: 'Vous pouvez générer autant de quittances que vous voulez, pour un ou plusieurs logements, sans créer de compte ni payer. Le modèle reste le même ; seules les données (noms, adresses, période, montants) changent à chaque fois.',
    },
    {
      title: 'Du modèle à votre PDF en moins de 2 minutes',
      content: 'Après avoir saisi les informations du bailleur, du locataire, l’adresse du logement, la période et les montants, vous lancez la génération. Le PDF est téléchargeable immédiatement. Vous pouvez l’envoyer au locataire par e-mail ou l’imprimer.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'Le modèle de quittance gratuit est-il vraiment conforme ?',
      a: 'Oui. Notre modèle intègre toutes les mentions imposées par la loi du 6 juillet 1989 et la Loi Alur : identités, adresse du logement, période, loyer, charges, total, date et signature. Il est accepté par la CAF et les organismes qui demandent une quittance.',
    },
    {
      q: 'Faut-il s’inscrire pour utiliser le modèle gratuit ?',
      a: 'Non. Vous pouvez générer et télécharger vos quittances sans créer de compte. L’inscription est optionnelle si vous souhaitez enregistrer vos informations pour les réutiliser ou activer l’envoi automatique mensuel.',
    },
    {
      q: 'Le modèle gratuit a-t-il une limite d’utilisation ?',
      a: 'Non. Vous pouvez créer autant de quittances que nécessaire, pour un ou plusieurs locataires, sans frais ni limite. Le modèle est le même ; vous changez simplement les données à chaque génération.',
    },
    {
      q: 'Modèle gratuit quittance : PDF ou Word ?',
      a: 'Notre outil produit directement un PDF, plus pratique pour l’envoi par e-mail et la conservation. Si vous préférez modifier le contenu sous Word, vous pouvez utiliser un modèle Word téléchargeable ailleurs ; notre solution en ligne reste la plus simple pour un PDF conforme immédiat.',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Modèle de quittance de loyer gratuit | PDF conforme 2026"
      metaDescription="Modèle de quittance de loyer gratuit en ligne. PDF conforme à la loi, sans inscription. Utilisation illimitée pour tous vos locataires."
      keywords="modèle quittance de loyer gratuit, quittance loyer modèle gratuit, template quittance gratuit"
      canonical={`${SITE}/quittance-loyer-modele-gratuit`}
      h1="Modèle de quittance de loyer gratuit : conforme et sans limite"
      intro={intro}
      visualTitle="Ce que propose notre modèle gratuit"
      visualContent={visualContent}
      howItWorksTitle="Utiliser un modèle de quittance gratuit"
      howItWorks={howItWorks}
      faqTitle="Modèle quittance loyer gratuit : questions fréquentes"
      faq={faq}
    />
  );
}
