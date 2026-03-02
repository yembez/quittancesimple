import React from 'react';
import { ArrowLeft, Calendar, User, Clock, Tag, Zap, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackCtaClick } from '../utils/analytics';

const Blog = () => {
  const navigate = useNavigate();

  const articles = [
    {
      id: 1,
      title: "Quittance de Loyer 2026 : Le Guide pour être Conforme sans y passer des heures",
      excerpt: "Découvrez les mentions obligatoires et comment automatiser vos quittances pour rester conforme sans perdre de temps chaque mois.",
      content: `
        <h2>Les mentions obligatoires en 2026</h2>
        <p>Une quittance de loyer doit obligatoirement contenir certaines informations pour être valide juridiquement :</p>
        <ul>
          <li>Le nom et l'adresse du bailleur</li>
          <li>Le nom du locataire</li>
          <li>L'adresse du logement loué</li>
          <li>La période de location concernée</li>
          <li>Le détail des sommes versées (loyer, charges)</li>
          <li>La date d'établissement</li>
          <li>La signature du bailleur</li>
        </ul>

        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-left: 4px solid #ed7862; padding: 24px; margin: 32px 0; border-radius: 12px;">
          <h3 style="color: #1a1f20; margin-top: 0; font-size: 1.2em; font-weight: 600;">⏱️ Marre de faire vos quittances manuellement ?</h3>
          <p style="color: #415052; margin-bottom: 16px;">Découvrez <strong>Pack Automatique</strong> : Rappels SMS, envois e-mails et relances en 1 clic pour seulement <strong>0,82€/mois</strong>.</p>
          <p style="color: #415052; font-size: 0.95em; margin: 0;">✓ Plus d'oublis &nbsp;&nbsp; ✓ Plus de retards &nbsp;&nbsp; ✓ Gestion 100% automatisée</p>
        </div>

        <h2>Ne perdez plus de temps : automatisez vos quittances</h2>
        <p>Générer une quittance manuellement chaque mois, c'est une perte de temps considérable. Entre la recherche du modèle, la saisie des informations, l'envoi et le suivi, vous y passez facilement 15-20 minutes par locataire. Multipliez par 12 mois et plusieurs locataires : <strong>des heures perdues chaque année !</strong></p>

        <p>L'automatisation mensuelle vous permet de :</p>
        <ul>
          <li><strong>Configurer une seule fois</strong> vos informations locataires</li>
          <li><strong>Recevoir des rappels SMS</strong> quand un paiement est détecté</li>
          <li><strong>Envoyer la quittance en 1 clic</strong> depuis votre mobile</li>
          <li><strong>Relancer votre locataire automatiquement</strong> en cas de retard</li>
        </ul>

        <p style="background-color: #fff3e0; padding: 16px; border-radius: 8px; margin-top: 24px;">
          <strong>💡 Bon à savoir :</strong> Avec Pack Automatique, vos quittances sont toujours conformes aux obligations légales 2026, mises à jour automatiquement. Vous n'avez plus à vous soucier de rien !
        </p>
      `,
      date: "15 Jan 2026",
      author: "Équipe Quittance Simple",
      category: "Guide pratique",
      readTime: "5 min",
      tags: ["Juridique", "Quittance", "Bailleur", "2026"]
    },
    {
      id: 2,
      title: "Automatisation : Comment ne plus jamais oublier une quittance (et dormir serein)",
      excerpt: "Découvrez comment l'automatisation vous libère de la charge mentale et vous garantit des quittances envoyées à temps, tous les mois.",
      content: `
        <h2>La charge mentale du bailleur</h2>
        <p>Chaque début de mois, c'est la même chose : "Ai-je bien reçu le loyer ? Ai-je pensé à envoyer la quittance ? Mon locataire va-t-il me la réclamer ?" Cette charge mentale vous pèse et vous fait perdre un temps précieux.</p>

        <p><strong>La solution ?</strong> L'automatisation complète de vos quittances. Ne plus y penser, tout en restant 100% conforme.</p>

        <h2>Les avantages de l'automatisation</h2>
        <ul>
          <li><strong>Gain de temps massif :</strong> Plus de génération manuelle chaque mois</li>
          <li><strong>Zéro erreur :</strong> Fini les oublis de mentions obligatoires</li>
          <li><strong>Suivi automatique :</strong> Vous savez qui a reçu quoi et quand</li>
          <li><strong>Relance en 1 clic :</strong> Votre locataire en retard ? Relancez-le directement par SMS</li>
        </ul>

        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-left: 4px solid #ed7862; padding: 24px; margin: 32px 0; border-radius: 12px;">
          <h3 style="color: #1a1f20; margin-top: 0; font-size: 1.2em; font-weight: 600;">🎯 Passez en mode sérénité avec Pack Automatique</h3>
          <p style="color: #415052; margin-bottom: 16px;">Pour <strong>0,82€/mois</strong> seulement, automatisez l'envoi de vos quittances par email, recevez des rappels SMS pour confirmer l'envoi, et relancez vos locataires en 1 clic en cas de retard de paiement.</p>
          <p style="color: #415052; font-size: 0.95em; margin: 0;">📱 Tout depuis votre téléphone &nbsp;&nbsp; ⚡ Envoi instantané &nbsp;&nbsp; 🔔 Rappels automatiques</p>
        </div>

        <h2>Comment ça marche concrètement ?</h2>
        <p>Le processus est ultra-simple, pensé pour vous faire gagner du temps :</p>
        <ol>
          <li><strong>Configuration initiale :</strong> Renseignez une seule fois les informations de vos locataires (5 minutes par locataire)</li>
          <li><strong>Détection automatique :</strong> Dès que le loyer est versé, vous recevez un SMS de rappel</li>
          <li><strong>Envoi en 1 clic :</strong> Confirmez l'envoi directement depuis le SMS, la quittance part automatiquement</li>
          <li><strong>Relance automatique :</strong> En cas de retard, relancez votre locataire en 1 clic par SMS ou email</li>
        </ol>

        <p style="background-color: #e8f5e9; padding: 16px; border-radius: 8px; margin-top: 24px;">
          <strong>✅ Résultat :</strong> Vous économisez 15-20 minutes par locataire chaque mois. Soit plusieurs heures par an que vous pouvez consacrer à ce qui compte vraiment pour vous.
        </p>
      `,
      date: "12 Jan 2026",
      author: "Équipe Quittance Simple",
      category: "Conseils",
      readTime: "4 min",
      tags: ["Automatisation", "Productivité", "Gestion", "Sérénité"]
    },
    {
      id: 3,
      title: "Bailleurs 2026 : Gérez vos obligations en 1 clic grâce à la Pack Automatique",
      excerpt: "Mise à jour complète des obligations légales 2026 et comment l'automatisation vous garantit d'être toujours conforme sans effort.",
      content: `
        <h2>Nouvelles obligations 2026</h2>
        <p>L'année 2026 apporte son lot de nouveautés pour les bailleurs. Rester à jour devient chronophage quand on gère tout manuellement :</p>
        <ul>
          <li>Audit énergétique obligatoire pour certains logements</li>
          <li>Nouvelles règles sur les charges locatives</li>
          <li>Évolution du plafonnement des loyers</li>
          <li>Conformité renforcée des documents locatifs</li>
        </ul>

        <p><strong>Le problème ?</strong> Chaque changement législatif vous oblige à mettre à jour manuellement vos modèles de quittances. Un vrai casse-tête juridique qui vous fait perdre du temps et augmente les risques d'erreur.</p>

        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-left: 4px solid #ed7862; padding: 24px; margin: 32px 0; border-radius: 12px;">
          <h3 style="color: #1a1f20; margin-top: 0; font-size: 1.2em; font-weight: 600;">🛡️ Restez conforme automatiquement avec Pack Automatique</h3>
          <p style="color: #415052; margin-bottom: 16px;">Vos quittances sont <strong>automatiquement mises à jour</strong> selon les évolutions législatives 2026. Plus de veille juridique, plus de mises à jour manuelles. Tout est géré pour vous.</p>
          <p style="color: #415052; margin-bottom: 16px;">En plus : <strong>Relances locataires en 1 clic</strong> par SMS ou email en cas de retard de paiement.</p>
          <p style="color: #ed7862; font-weight: 600; margin: 0;">Tout ça pour seulement 0,82€/mois</p>
        </div>

        <h2>Rappel des obligations permanentes</h2>
        <p>Au-delà des nouveautés 2026, n'oublions pas les obligations qui restent en vigueur. Avec la génération manuelle, chaque obligation est une tâche supplémentaire :</p>
        <ul>
          <li><strong>Délivrance gratuite de la quittance :</strong> À faire tous les mois, pour chaque locataire</li>
          <li><strong>Envoi dans les délais :</strong> À suivre et gérer manuellement</li>
          <li><strong>Conservation des documents :</strong> Archivage pendant 3 ans minimum</li>
          <li><strong>Traçabilité des envois :</strong> Preuves d'envoi et accusés de réception</li>
        </ul>

        <h2>L'automatisation : votre meilleur allié conformité</h2>
        <p>Plutôt que de perdre des heures chaque mois à générer et envoyer vos quittances manuellement, l'automatisation vous permet de :</p>

        <ul>
          <li><strong>Être toujours à jour :</strong> Les modèles suivent automatiquement les évolutions légales</li>
          <li><strong>Archiver automatiquement :</strong> Toutes vos quittances sont sauvegardées et accessibles en 1 clic</li>
          <li><strong>Prouver vos envois :</strong> Historique complet avec dates et confirmations de lecture</li>
          <li><strong>Relancer en 1 clic :</strong> La vraie fonctionnalité qui change tout ! Votre locataire est en retard ? Un SMS part automatiquement avec un lien de paiement</li>
        </ul>

        <p style="background-color: #fff3e0; padding: 16px; border-radius: 8px; margin-top: 24px;">
          <strong>⚖️ Sécurité juridique :</strong> Avec Pack Automatique, vous disposez d'un historique complet et traçable de tous vos envois. En cas de litige, vous avez toutes les preuves nécessaires.
        </p>

        <p style="margin-top: 32px; font-size: 1.1em; color: #415052;">
          <strong>En résumé :</strong> La gestion manuelle vous fait perdre du temps, augmente les risques d'erreur et vous expose à des problèmes de conformité. L'automatisation vous libère de tout ça pour moins d'1€ par mois.
        </p>
      `,
      date: "8 Jan 2026",
      author: "Équipe Quittance Simple",
      category: "Juridique",
      readTime: "6 min",
      tags: ["Juridique", "2026", "Obligations", "Conformité"]
    }
  ];

  const [selectedArticle, setSelectedArticle] = React.useState(null);

  if (selectedArticle) {
    const article = articles.find(a => a.id === selectedArticle);
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center space-x-2 text-[#ed7862] hover:text-[#e56651] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux articles</span>
          </button>

          <article className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="bg-[#ed7862]/20 text-[#415052] px-3 py-1 rounded-full text-sm font-medium">
                  {article.category}
                </span>
                <div className="flex items-center space-x-2 text-[#415052]/70 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime}</span>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-[#1a1f20] mb-4">{article.title}</h1>

              <div className="flex items-center space-x-6 text-[#415052] mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{article.author}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-[#415052] px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="prose prose-lg max-w-none prose-headings:text-[#1a1f20] prose-p:text-[#415052] prose-li:text-[#415052] prose-strong:text-[#1a1f20]"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="bg-gradient-to-br from-[#ed7862] to-[#e56651] rounded-2xl p-8 text-white text-center">
                <div className="flex justify-center mb-4">
                  <Zap className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Prêt à gagner du temps et dormir serein ?</h3>
                <p className="text-lg mb-6 opacity-95">
                  Activez Pack Automatique et ne vous souciez plus jamais de vos quittances mensuelles.<br/>
                  Rappels SMS, envoi automatique et relances en 1 clic pour seulement 0,82€/mois.
                </p>
                <button
                  onClick={() => {
                    trackCtaClick('activer_pack_automatique_blog', 'blog', '/pricing');
                    navigate('/pricing');
                  }}
                  className="bg-white text-[#ed7862] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Activer Pack Automatique</span>
                </button>
                <p className="mt-4 text-sm opacity-90">✓ Sans engagement &nbsp;&nbsp; ✓ Annulation à tout moment &nbsp;&nbsp; ✓ Premiers envois offerts</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1a1f20] mb-4">Blog & Conseils</h1>
          <p className="text-xl text-[#415052]">
            Guides pratiques et conseils d'experts pour optimiser votre gestion locative
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article key={article.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-[#ed7862]/20 text-[#415052] px-3 py-1 rounded-full text-sm font-medium">
                    {article.category}
                  </span>
                  <span className="text-sm text-[#415052]/70">{article.readTime}</span>
                </div>

                <h2 className="text-xl font-bold text-[#1a1f20] mb-3 hover:text-[#ed7862] transition-colors duration-200">
                  {article.title}
                </h2>

                <p className="text-[#415052] mb-4 leading-relaxed">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between text-sm text-[#415052]/70 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{article.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{article.author}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedArticle(article.id)}
                  className="text-[#ed7862] hover:text-[#e56651] font-medium transition-colors duration-200"
                >
                  Lire l'article →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
