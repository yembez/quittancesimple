import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function QuittanceLoyerCafPage() {
  const intro = (
    <>
      <p>La CAF demande une quittance de loyer (ou une attestation de loyer) pour instruire les dossiers d’aide au logement (APL, etc.). Le document doit contenir des informations précises : identité du bailleur et du locataire, adresse du logement, période, montant du loyer et des charges.</p>
      <p>Une quittance de loyer pour la CAF doit être conforme à la loi et comporter toutes les mentions obligatoires. Notre outil génère un PDF accepté par la CAF, sans frais et en quelques clics.</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <QuittanceImageBlock title="Exemple de quittance acceptée par la CAF :" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'Qu’est-ce que la CAF exige sur la quittance ?',
      content: 'La CAF a besoin d’un justificatif de paiement du loyer contenant : l’identité du bailleur (nom, prénom, adresse), celle du locataire, l’adresse du logement, la période concernée, le détail du loyer et des charges et le total payé. Une quittance de loyer classique, conforme à la loi, remplit ces conditions.',
    },
    {
      title: 'Générer une quittance acceptée par la CAF',
      content: 'Notre générateur produit des quittances avec toutes les mentions obligatoires. Le PDF peut être remis par le locataire à la CAF comme pièce justificative pour l’APL ou les autres aides au logement. Aucune formulation spécifique « pour la CAF » n’est requise : une quittance conforme suffit.',
    },
    {
      title: 'Attestation de loyer ou quittance : quelle différence pour la CAF ?',
      content: 'La CAF accepte soit une quittance de loyer (preuve du paiement d’un mois donné), soit une attestation de loyer sur l’honneur (document par lequel le bailleur certifie les montants et les informations du bail). Les deux sont des justificatifs valables ; la quittance est plus courante car elle atteste d’un paiement effectif.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'La CAF accepte-t-elle une quittance de loyer générée en ligne ?',
      a: 'Oui. La CAF accepte les quittances dès lors qu’elles contiennent les informations requises (bailleur, locataire, adresse, période, montants, signature). Le format PDF généré en ligne a la même valeur qu’une quittance manuscrite ou tapée sous Word.',
    },
    {
      q: 'Quittance ou attestation de loyer pour la CAF ?',
      a: 'Les deux sont valables. La quittance prouve le paiement du loyer pour une période donnée. L’attestation de loyer est une déclaration du bailleur sur les conditions du bail. Pour un dossier CAF, une quittance mensuelle est souvent demandée ; notre outil permet de la générer gratuitement.',
    },
    {
      q: 'Faut-il une quittance par mois pour la CAF ?',
      a: 'En général, la CAF demande des justificatifs de loyer (quittances ou attestations) pour les mois concernés par l’aide. Une quittance par mois est donc habituelle. Notre générateur permet de créer une quittance par période en quelques clics.',
    },
    {
      q: 'Puis-je signer la quittance pour la CAF électroniquement ?',
      a: 'Oui. La signature électronique a la même valeur légale que la signature manuscrite (loi du 13 mars 2000). Une quittance générée en PDF et signée électroniquement est acceptée par la CAF. Vous pouvez aussi l’imprimer et la signer à la main avant de la remettre au locataire.',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Quittance de loyer pour la CAF | Modèle accepté APL"
      metaDescription="Générez une quittance de loyer acceptée par la CAF pour l’APL. Conforme, gratuite, en PDF. Toutes les mentions demandées par la CAF incluses."
      keywords="quittance de loyer CAF, quittance loyer CAF, quittance APL, attestation loyer CAF"
      canonical={`${SITE}/quittance-loyer-caf`}
      h1="Quittance de loyer pour la CAF : conforme et acceptée pour l’APL"
      intro={intro}
      visualTitle="Quelles mentions pour une quittance CAF ?"
      visualContent={visualContent}
      howItWorksTitle="Quittance de loyer et CAF : ce qu’il faut savoir"
      howItWorks={howItWorks}
      faqTitle="Quittance loyer CAF : questions fréquentes"
      faq={faq}
    />
  );
}
