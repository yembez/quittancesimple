import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function ModeleQuittanceLoyerPage() {
  const intro = (
    <>
      <p>En tant que propriétaire, vous devez fournir un modèle de quittance de loyer à chaque paiement de loyer. Ce document officiel atteste que le locataire a bien réglé son loyer et ses charges pour la période concernée.</p>
      <p>Un bon modèle de quittance de loyer doit être conforme à la loi (Loi du 6 juillet 1989 et Loi Alur) et contenir toutes les mentions obligatoires : identités du bailleur et du locataire, adresse du logement, période, détail des montants et date d’émission.</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <QuittanceImageBlock title="Exemple de quittance de loyer conforme :" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'Choisir un modèle conforme',
      content: 'Notre modèle de quittance de loyer respecte la loi du 6 juillet 1989 et la Loi Alur : identité du bailleur et du locataire, adresse du logement, période, détail du loyer et des charges, total payé, date et signature. Aucune mention obligatoire n’est oubliée.',
    },
    {
      title: 'Renseigner les informations',
      content: 'Sur notre outil en ligne, vous saisissez les informations du bailleur, du locataire, l’adresse du bien, la période concernée et les montants (loyer, charges). Les champs sont clairs et guidés pour éviter les erreurs.',
    },
    {
      title: 'Générer et télécharger la quittance',
      content: 'En un clic, la quittance est générée au format PDF, prête à être imprimée ou envoyée par e-mail au locataire. Vous pouvez aussi l’enregistrer pour votre comptabilité.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'Le modèle de quittance de loyer est-il gratuit ?',
      a: 'Oui. Notre générateur en ligne permet de créer autant de quittances que vous voulez, sans frais ni inscription. Le PDF est conforme à la loi et téléchargeable immédiatement.',
    },
    {
      q: 'Quelles mentions doit contenir un modèle de quittance ?',
      a: 'La loi impose : identité complète du bailleur (ou mandataire), identité du locataire, adresse du logement loué, période concernée, détail du loyer et des charges, total payé, date d’émission et signature du bailleur.',
    },
    {
      q: 'Puis-je utiliser le même modèle pour plusieurs mois ?',
      a: 'Chaque quittance doit correspondre à une période précise (un mois en général). Vous générez une quittance par mois en modifiant uniquement la période et, si besoin, les montants.',
    },
    {
      q: 'La quittance générée est-elle valable pour la CAF ?',
      a: 'Oui, si elle contient toutes les mentions obligatoires. Notre modèle inclut les informations demandées par la CAF pour les dossiers d’aide au logement.',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Modèle de quittance de loyer conforme 2026 | Gratuit et en ligne"
      metaDescription="Téléchargez un modèle de quittance de loyer conforme à la loi française. Gratuit, sans inscription. Toutes les mentions obligatoires incluses. Génération PDF en 2 minutes."
      keywords="modèle quittance de loyer, modèle quittance loyer gratuit, quittance loyer conforme, modèle quittance 2026"
      canonical={`${SITE}/modele-quittance-loyer`}
      h1="Modèle de quittance de loyer conforme : gratuit et prêt à l’emploi"
      intro={intro}
      visualTitle="Exemple de quittance de loyer"
      visualContent={visualContent}
      howItWorksTitle="Comment utiliser notre modèle de quittance de loyer ?"
      howItWorks={howItWorks}
      faqTitle="Modèle quittance de loyer : questions fréquentes"
      faq={faq}
    />
  );
}
