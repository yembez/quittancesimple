import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function ExempleQuittanceLoyerPage() {
  const intro = (
    <>
      <p>Vous cherchez un exemple de quittance de loyer pour voir à quoi ressemble le document avant d’en créer une ? Un bon exemple doit montrer toutes les mentions obligatoires : bailleur, locataire, adresse, période, loyer, charges et total.</p>
      <p>Voici à quoi peut ressembler une quittance conforme, et comment en générer une en quelques clics à partir de notre outil gratuit.</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <QuittanceImageBlock title="Exemple de quittance de loyer conforme :" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'Comprendre la structure d’un exemple de quittance',
      content: 'Un exemple de quittance de loyer comprend toujours : le titre « Quittance de loyer », la période (mois et année), les noms et adresses du bailleur et du locataire, l’adresse du logement loué, le détail du loyer et des charges, le total, la date et la signature. Notre outil reprend cette structure de façon conforme.',
    },
    {
      title: 'Adapter l’exemple à votre situation',
      content: 'À partir de notre générateur, vous ne copiez pas un exemple à la main : vous saisissez vos propres informations (bailleur, locataire, adresse, montants). Le document généré suit le même modèle que l’exemple, mais avec vos données.',
    },
    {
      title: 'Obtenir un PDF prêt à l’emploi',
      content: 'Une fois les champs remplis, vous générez un PDF immédiatement utilisable. Vous pouvez vous en inspirer comme « exemple » pour vos prochaines quittances, ou l’envoyer directement au locataire et à la CAF.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'Où trouver un exemple de quittance de loyer gratuit ?',
      a: 'Sur notre site, vous avez à la fois un exemple visuel (sur cette page) et un générateur qui produit des quittances conformes. Vous n’avez pas besoin de télécharger un modèle Word ou Excel : le PDF est généré en ligne.',
    },
    {
      q: 'L’exemple de quittance est-il valable pour la CAF ?',
      a: 'Oui, si le document contient toutes les mentions obligatoires. Notre exemple et les quittances générées par notre outil les incluent toutes, ce qui les rend acceptables par la CAF pour les dossiers d’aide au logement.',
    },
    {
      q: 'Puis-je modifier un exemple de quittance pour mon locataire ?',
      a: 'Il est préférable de générer une nouvelle quittance avec les bonnes informations plutôt que de modifier un PDF existant. Notre générateur permet de créer une quittance sur mesure en quelques clics.',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Exemple de quittance de loyer conforme | Modèle gratuit"
      metaDescription="Consultez un exemple de quittance de loyer conforme à la loi. Structure et mentions obligatoires expliquées. Générez la vôtre en PDF gratuitement."
      keywords="exemple quittance de loyer, exemple quittance loyer, modèle quittance loyer, quittance loyer exemple"
      canonical={`${SITE}/exemple-quittance-loyer`}
      h1="Exemple de quittance de loyer : structure et mentions obligatoires"
      intro={intro}
      visualTitle="Exemple de quittance de loyer conforme"
      visualContent={visualContent}
      howItWorksTitle="De l’exemple à votre quittance en 3 étapes"
      howItWorks={howItWorks}
      faqTitle="Exemple quittance de loyer : questions fréquentes"
      faq={faq}
    />
  );
}
