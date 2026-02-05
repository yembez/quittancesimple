import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqItems = [
    {
      question: "La génération de quittance PDF est-elle vraiment gratuite ?",
      answer: "Oui, absolument ! Vous pouvez générer autant de quittances PDF que vous le souhaitez, gratuitement et sans limitation. Seul le service d'automatisation est payant à partir de 0,99€/mois pour 1-2 logements avec Mode Tranquillité."
    },
    {
      question: "Comment automatiser mes avis d'échéance et quittances ?",
      answer: "Notre service Mode Tranquillité vous permet d'automatiser complètement l'envoi de vos quittances de loyer. Une fois configuré, vous recevez chaque mois un rappel automatique par SMS et email pour confirmer le paiement. En un clic, la quittance automatique est générée au format PDF conforme et envoyée directement à votre locataire par email. Plus besoin d'y penser chaque mois ! Tarif : à partir de 0,99€/mois pour 1-2 logements. Découvrez tous les détails sur notre page d'automatisation. Vous pouvez également automatiser l'envoi d'avis d'échéance avant la date de paiement pour rappeler à votre locataire l'échéance du loyer."
    },
    {
      question: "Comment fonctionne l'automatisation des quittances ?",
      answer: "C'est très simple : vous configurez une fois les informations de vos locataires, puis chaque mois Quittance Simple vous envoie un rappel par SMS et email. Vous validez le paiement en un clic, la quittance est générée automatiquement et envoyée à votre locataire. À l'avenir, nous proposerons aussi Quittance Connectée+ avec synchronisation bancaire PSD2 pour une automatisation complète."
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Absolument. Nous utilisons un chiffrement de niveau bancaire pour protéger toutes vos données. Vos informations personnelles et celles de vos locataires sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers."
    },
    {
      question: "Puis-je annuler mon abonnement à tout moment ?",
      answer: "Oui, vous pouvez annuler votre abonnement à tout moment sans frais ni pénalité. L'annulation prend effet à la fin de votre période de facturation en cours."
    },
    {
      question: "Que se passe-t-il si mon locataire ne paie pas ?",
      answer: "Le système détecte automatiquement les impayés et vous envoie une alerte. Vous pouvez alors envoyer une relance automatique à votre locataire en un clic. L'historique de tous les paiements est conservé pour faciliter le suivi."
    },
    {
      question: "Les quittances générées sont-elles conformes à la loi ?",
      answer: "Oui, toutes nos quittances respectent scrupuleusement la législation française en vigueur. Elles contiennent toutes les mentions obligatoires : identité du bailleur et du locataire, adresse du logement, période concernée, détail des montants, etc."
    },
    {
      question: "Puis-je gérer plusieurs locataires ?",
      answer: "Bien sûr ! Vous pouvez gérer autant de locataires que vous le souhaitez. Pour le service gratuit, il n'y a aucune limite. Pour l'automatisation, le tarif est de 0,99€/mois par locataire."
    },
    {
      question: "Y a-t-il un engagement ?",
      answer: "Non, il n'y a aucun engagement. Vous pouvez résilier votre abonnement à tout moment sans frais ni pénalité. L'annulation prend effet à la fin de votre période de facturation en cours."
    },
    {
      question: "Puis-je personnaliser mes quittances ?",
      answer: "Oui, vous pouvez personnaliser certains éléments de vos quittances comme vos informations de contact, le logo de votre agence si vous en avez une, et ajouter des mentions spécifiques si nécessaire."
    },
    {
      question: "Que faire si j'ai un problème technique ?",
      answer: "Notre équipe support est disponible par email à contact@quittancesimple.fr. Nous nous engageons à répondre dans les 24h maximum. Vous pouvez aussi consulter notre centre d'aide en ligne."
    },
    {
      question: "Les quittances sont-elles envoyées automatiquement au locataire ?",
      answer: "Avec le service d'automatisation, oui ! Une fois que vous avez validé le paiement, la quittance est générée et peut être envoyée automatiquement par email à votre locataire. Vous gardez toujours le contrôle final."
    },
    {
      question: "Puis-je importer mes données existantes ?",
      answer: "Oui, nous proposons des outils d'import pour faciliter la migration depuis d'autres solutions. Vous pouvez importer vos informations locataires et l'historique de vos paiements via un fichier Excel."
    },
    {
      question: "Qu'est-ce que Quittance Connectée+ ?",
      answer: "Quittance Connectée+ est notre future formule premium avec synchronisation bancaire PSD2. Elle permettra à notre système de détecter automatiquement les paiements de loyer sur votre compte bancaire et d'envoyer les quittances sans aucune action de votre part. Cette formule sera lancée prochainement et offrira une automatisation complète et zéro-effort."
    },
    {
      question: "Quand sera disponible Quittance Connectée+ ?",
      answer: "Quittance Connectée+ est actuellement en cours de développement. Nous travaillons à l'intégration sécurisée de la synchronisation bancaire PSD2. Vous pouvez vous inscrire pour être notifié lors de son lancement."
    },
    {
      question: "Quel sera le prix de Quittance Connectée+ ?",
      answer: "Quittance Connectée+ sera proposée à partir de 1,49€/mois pour 1-2 logements, 2,49€ pour 3-4 logements, et 3,49€ pour 5-8 logements. Ce tarif est actuellement en phase de validation avant le lancement."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <SEOHead
        title="FAQ – Quittance Simple | Questions fréquentes sur les quittances de loyer"
        description="Réponses rapides sur la quittance de loyer : conformité, PDF, automatisation, envoi, relance et abonnement Mode Tranquillité."
        keywords="faq quittance loyer, questions quittances, quittance automatique, automatiser quittances, quittance loyer gratuite"
        canonical="https://www.quittancesimple.fr/faq"
        robots="index, follow"
      />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#ed7862] hover:bg-[#e56651] text-white px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Générez vos quittances gratuites ou automatisez l'envoi en 1 clic
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-[#ed7862] rounded-lg flex items-center justify-center shadow-lg">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#1a1f20]">
              Questions Fréquentes
            </h1>
          </div>
          <p className="text-xl text-[#415052]">
            Trouvez rapidement les réponses à vos questions sur Quittance Simple
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-[#1a1f20] pr-4">
                  {item.question}
                </h3>
                {openItems.includes(index) ? (
                  <ChevronUp className="w-5 h-5 text-[#ed7862] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#415052]/40 flex-shrink-0" />
                )}
              </button>

              {openItems.includes(index) && (
                <div className="px-6 pb-4">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-[#415052] leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#ed7862] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Vous ne trouvez pas votre réponse ?
          </h2>
          <p className="text-white/90 mb-6">
            Notre équipe est là pour vous aider ! Contactez-nous et nous vous répondrons rapidement.
          </p>
          <a
            href="mailto:contact@quittancesimple.fr?subject=Question depuis la FAQ"
            className="inline-block bg-white text-[#ed7862] px-8 py-3 rounded-full font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
