import React from 'react';
import SEOLandingPage from '../../components/SEOLandingPage';
import QuittanceImageBlock from '../../components/QuittanceImageBlock';
import type { HowItWorksSection, FAQItem } from '../../components/SEOLandingPage';

const SITE = 'https://www.quittancesimple.fr';

export default function AttestationLoyerCafPage() {
  const intro = (
    <>
      <p>L’attestation de loyer pour la CAF est un document par lequel le propriétaire certifie sur l’honneur les informations du bail (montant du loyer, adresse, identité du locataire). Elle est souvent demandée en complément ou à la place d’une quittance pour constituer le dossier d’aide au logement (APL).</p>
      <p>Contrairement à la quittance, qui prouve le paiement d’un mois donné, l’attestation de loyer décrit la situation du bail de façon plus générale. Les deux documents sont acceptés par la CAF lorsqu’ils contiennent les informations requises.</p>
    </>
  );

  const visualContent = (
    <div className="p-6 sm:p-8">
      <p className="text-sm text-gray-600 mb-4 text-center">La CAF accepte aussi une quittance de loyer conforme, qui contient les mêmes informations. Exemple :</p>
      <QuittanceImageBlock title="Exemple de quittance (valable comme justificatif CAF) :" />
    </div>
  );

  const howItWorks: HowItWorksSection[] = [
    {
      title: 'Qu’est-ce qu’une attestation de loyer pour la CAF ?',
      content: 'C’est un document sur l’honneur par lequel le bailleur indique : son identité, celle du locataire, l’adresse du logement, le montant du loyer et des charges. La CAF l’accepte comme justificatif pour l’instruction des dossiers d’aide au logement (APL, etc.).',
    },
    {
      title: 'Attestation de loyer vs quittance de loyer',
      content: 'La quittance prouve qu’un loyer a été payé pour une période précise (ex. : janvier 2026). L’attestation de loyer décrit la situation du bail (qui loue quoi, à quel prix) sans forcément attester du paiement d’un mois donné. La CAF peut demander l’un ou l’autre selon le cas.',
    },
    {
      title: 'Comment fournir une attestation ou une quittance à la CAF ?',
      content: 'Le locataire transmet le document (PDF ou photo lisible) à la CAF via son espace en ligne ou par courrier. En tant que bailleur, vous pouvez générer une quittance conforme (acceptée par la CAF) avec notre outil gratuit ; elle contient les mêmes types d’informations qu’une attestation et est souvent préférée car elle atteste en plus du paiement.',
    },
  ];

  const faq: FAQItem[] = [
    {
      q: 'La CAF accepte-t-elle une attestation de loyer au lieu d’une quittance ?',
      a: 'Oui. La CAF peut accepter soit une quittance de loyer, soit une attestation de loyer, selon ce qu’elle demande pour le dossier. Les deux servent de justificatif pour les aides au logement. Une quittance mensuelle est souvent demandée car elle prouve le paiement effectif.',
    },
    {
      q: 'Qui doit signer l’attestation de loyer pour la CAF ?',
      a: 'L’attestation de loyer doit être signée par le bailleur (propriétaire ou mandataire, ex. agence). Le locataire la transmet ensuite à la CAF. La signature peut être manuscrite ou électronique.',
    },
    {
      q: 'Puis-je générer une attestation de loyer en ligne ?',
      a: 'Notre outil génère des quittances de loyer conformes, acceptées par la CAF. Une quittance contient les informations nécessaires (bailleur, locataire, adresse, montants) et atteste en plus du paiement. Si la CAF demande spécifiquement une attestation sur l’honneur, vous pouvez vous en inspirer et rédiger un court texte avec les mêmes informations, puis le signer.',
    },
    {
      q: 'Quelles informations mettre dans une attestation de loyer pour la CAF ?',
      a: 'Il faut indiquer : nom et adresse du bailleur, nom du locataire, adresse du logement loué, montant du loyer, des charges et du total, et la date. Une phrase du type « Je certifie que les informations ci-dessus sont exactes » et la signature du bailleur suffisent.',
    },
  ];

  return (
    <SEOLandingPage
      metaTitle="Attestation de loyer pour la CAF | Modèle gratuit APL"
      metaDescription="Attestation de loyer pour la CAF : modèle et informations à inclure. Différence avec la quittance. Générez une quittance conforme CAF gratuitement."
      keywords="attestation de loyer CAF, attestation loyer CAF, attestation loyer APL, modèle attestation loyer"
      canonical={`${SITE}/attestation-loyer-caf`}
      h1="Attestation de loyer pour la CAF : modèle et utilisation"
      intro={intro}
      visualTitle="Exemple d’attestation de loyer pour la CAF"
      visualContent={visualContent}
      howItWorksTitle="Attestation de loyer et CAF : ce qu’il faut savoir"
      howItWorks={howItWorks}
      faqTitle="Attestation loyer CAF : questions fréquentes"
      faq={faq}
    />
  );
}
