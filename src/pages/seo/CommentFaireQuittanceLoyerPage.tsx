import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function CommentFaireQuittanceLoyerPage() {
  const intro = (
    <>
      <p>Vous vous demandez comment faire une quittance de loyer ? Pas besoin de logiciel compliqué : avec un outil en ligne, vous remplissez vos informations et celles du locataire, la période et les montants, et vous obtenez un PDF conforme en quelques secondes.</p>
      <p>Nous vous expliquons les étapes et les mentions à ne pas oublier pour que votre quittance soit valable partout (CAF, banque, administration).</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <QuittanceImageBlock title="Résultat : une quittance de loyer conforme comme celle-ci :" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'Rassembler les informations nécessaires',
      content: 'Pour faire une quittance de loyer, vous avez besoin : des noms et adresses du bailleur et du locataire, de l’adresse du logement loué, de la période concernée (mois et année), du montant du loyer hors charges, du montant des charges et du total payé. Si vous avez un bail et les derniers relevés, vous avez tout sous la main.',
    },
    {
      title: 'Choisir un support : papier, Word ou outil en ligne',
      content: 'Vous pouvez rédiger une quittance à la main, avec un modèle Word ou Excel, ou utiliser un générateur en ligne. L’avantage du générateur : aucune mention obligatoire n’est oubliée, et le PDF est propre et immédiat. Idéal pour les propriétaires qui veulent aller vite sans se tromper.',
    },
    {
      title: 'Générer, signer et remettre la quittance',
      content: 'Une fois le document généré, vous le signez (manuscrite ou électroniquement) et vous le remettez au locataire : par e-mail, en main propre ou par courrier. Le locataire peut l’utiliser pour la CAF, un prêt ou ses archives.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'Comment faire une quittance de loyer gratuitement ?',
      a: 'Utilisez un générateur en ligne gratuit comme le nôtre : vous remplissez un formulaire avec les informations du bailleur, du locataire, l’adresse, la période et les montants. Le PDF conforme est généré sans frais et sans inscription.',
    },
    {
      q: 'Quelles informations mettre sur une quittance ?',
      a: 'Il faut indiquer : identité du bailleur (nom, prénom, adresse), identité du locataire, adresse du logement loué, période (mois et année), montant du loyer, montant des charges, total payé, date d’émission et signature du bailleur.',
    },
    {
      q: 'Comment envoyer la quittance au locataire ?',
      a: 'Vous pouvez envoyer le PDF par e-mail, le déposer sur un espace partagé ou le remettre en main propre. L’envoi par e-mail est le plus simple et garde une trace. Certains outils permettent aussi d’automatiser l’envoi chaque mois.',
    },
    {
      q: 'Faut-il faire une quittance par mois ?',
      a: 'En général, oui : une quittance par mois de loyer payé. Chaque document atteste du paiement d’une période précise. Vous pouvez générer plusieurs quittances d’affilée en changeant uniquement la période (et les montants si besoin).',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Comment faire une quittance de loyer ? Guide 2026"
      metaDescription="Comment faire une quittance de loyer : étapes, mentions obligatoires et outil gratuit. Guide pour propriétaires. PDF conforme en 2 minutes."
      keywords="comment faire quittance de loyer, faire une quittance loyer, créer quittance loyer"
      canonical={`${SITE}/comment-faire-quittance-loyer`}
      h1="Comment faire une quittance de loyer ? Guide pas à pas"
      intro={intro}
      visualTitle="Les 3 étapes pour faire une quittance"
      visualContent={visualContent}
      howItWorksTitle="Comment faire une quittance de loyer : la méthode"
      howItWorks={howItWorks}
      faqTitle="Faire une quittance de loyer : questions fréquentes"
      faq={faq}
    />
  );
}
