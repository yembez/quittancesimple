import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function QuittanceLoyerObligatoirePage() {
  const intro = (
    <>
      <p>La quittance de loyer n’est pas obligatoire en tant que telle dans la loi, mais sa délivrance est très souvent prévue dans le contrat de bail. En pratique, le locataire en a besoin pour la CAF, les banques ou d’autres démarches, et le bailleur a tout intérêt à fournir un document conforme.</p>
      <p>Ce qui est obligatoire, en revanche, ce sont les mentions qui doivent figurer sur la quittance lorsqu’elle est délivrée : identités, adresse du logement, période, montants et signature. Notre outil intègre toutes ces mentions.</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <QuittanceImageBlock title="Exemple de quittance avec toutes les mentions obligatoires :" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'La quittance est-elle obligatoire ?',
      content: 'La loi ne dit pas explicitement que le bailleur doit remettre une quittance à chaque paiement. En revanche, beaucoup de baux le prévoient, et le locataire est en droit de demander un justificatif de paiement. Délivrer une quittance conforme évite les litiges et répond aux attentes des organismes (CAF, banques) qui en demandent.',
    },
    {
      title: 'Les mentions obligatoires sur la quittance',
      content: 'Dès lors qu’une quittance est délivrée, elle doit contenir les informations imposées par la loi du 6 juillet 1989 et la Loi Alur : identité complète du bailleur (ou mandataire), identité du locataire, adresse du logement, période, détail du loyer et des charges, total, date et signature. Une quittance incomplète peut être rejetée par la CAF ou en cas de litige.',
    },
    {
      title: 'Rester en règle sans se compliquer la vie',
      content: 'Avec notre générateur, vous ne risquez pas d’oublier une mention obligatoire : le modèle est conçu pour inclure automatiquement toutes les informations requises. Vous restez conforme à la loi en quelques clics.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'Le bailleur est-il obligé de donner une quittance chaque mois ?',
      a: 'La loi n’impose pas explicitement la remise mensuelle d’une quittance, mais le bail le prévoit souvent. En tout cas, le locataire peut demander un justificatif de paiement, et la quittance est le document adapté. Il est donc recommandé de la délivrer à chaque paiement.',
    },
    {
      q: 'Que se passe-t-il si ma quittance ne contient pas toutes les mentions ?',
      a: 'Une quittance incomplète peut être refusée par la CAF, une banque ou un juge en cas de litige. Pour être valable, elle doit contenir les mentions imposées par la loi (identités, adresse, période, loyer, charges, total, date, signature). Notre outil les inclut toutes.',
    },
    {
      q: 'La signature sur la quittance est-elle obligatoire ?',
      a: 'Oui. La quittance doit être signée par le bailleur (ou son mandataire). La signature peut être manuscrite ou électronique ; les deux ont la même valeur légale.',
    },
    {
      q: 'Quittance obligatoire pour la CAF ?',
      a: 'Pour constituer un dossier d’aide au logement (APL, etc.), la CAF demande un justificatif de loyer, en général une quittance ou une attestation. Une quittance conforme (avec toutes les mentions) est acceptée par la CAF.',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Quittance de loyer obligatoire ? Mentions légales 2026"
      metaDescription="Quittance de loyer : est-elle obligatoire ? Quelles mentions sont imposées par la loi ? Générer une quittance conforme gratuitement."
      keywords="quittance de loyer obligatoire, mentions obligatoires quittance, quittance loyer loi"
      canonical={`${SITE}/quittance-loyer-obligatoire`}
      h1="Quittance de loyer : obligatoire ou pas ? Mentions imposées par la loi"
      intro={intro}
      visualTitle="Mentions obligatoires sur la quittance"
      visualContent={visualContent}
      howItWorksTitle="Quittance de loyer et obligations légales"
      howItWorks={howItWorks}
      faqTitle="Quittance loyer obligatoire : questions fréquentes"
      faq={faq}
    />
  );
}
