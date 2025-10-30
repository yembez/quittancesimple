import React from 'react';
import { ArrowLeft, Calendar, User, Clock, Tag } from 'lucide-react';

const Blog = () => {
  const articles = [
    {
      id: 1,
      title: "Comment rédiger une quittance de loyer conforme ?",
      excerpt: "Découvrez les mentions obligatoires et les bonnes pratiques pour établir une quittance de loyer légale et éviter tout problème avec vos locataires.",
      content: `
        <h2>Les mentions obligatoires</h2>
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

        <h2>Les bonnes pratiques</h2>
        <p>Pour éviter tout malentendu, il est recommandé de :</p>
        <ul>
          <li>Établir la quittance dès réception du paiement</li>
          <li>Conserver une copie pendant 3 ans minimum</li>
          <li>Utiliser un modèle standardisé</li>
          <li>Envoyer la quittance par email avec accusé de réception</li>
        </ul>
      `,
      date: "15 Jan 2025",
      author: "Équipe Quittance Simple",
      category: "Guide pratique",
      readTime: "5 min",
      tags: ["Juridique", "Quittance", "Bailleur"]
    },
    {
      id: 2,
      title: "Automatisation des quittances : gain de temps garanti",
      excerpt: "Comment l'automatisation peut vous faire économiser des heures chaque mois dans la gestion locative et réduire les risques d'erreur.",
      content: `
        <h2>Pourquoi automatiser ?</h2>
        <p>L'automatisation des quittances présente de nombreux avantages :</p>
        <ul>
          <li>Gain de temps considérable</li>
          <li>Réduction des erreurs humaines</li>
          <li>Suivi automatique des paiements</li>
          <li>Relances automatiques en cas d'impayé</li>
        </ul>

        <h2>Comment ça marche ?</h2>
        <p>Le processus d'automatisation est simple :</p>
        <ol>
          <li>Configuration initiale des informations locataires</li>
          <li>Réception automatique des notifications de paiement</li>
          <li>Génération automatique de la quittance</li>
          <li>Envoi automatique au locataire</li>
        </ol>
      `,
      date: "12 Jan 2025",
      author: "Équipe Quittance Simple",
      category: "Conseils",
      readTime: "3 min",
      tags: ["Automatisation", "Productivité", "Gestion"]
    },
    {
      id: 3,
      title: "Droits et devoirs du bailleur en 2025",
      excerpt: "Mise à jour complète des obligations légales du propriétaire bailleur pour cette nouvelle année avec les dernières évolutions législatives.",
      content: `
        <h2>Nouvelles obligations 2025</h2>
        <p>Cette année apporte son lot de nouveautés pour les bailleurs :</p>
        <ul>
          <li>Audit énergétique obligatoire pour certains logements</li>
          <li>Nouvelles règles sur les charges locatives</li>
          <li>Évolution du plafonnement des loyers</li>
        </ul>

        <h2>Rappel des obligations permanentes</h2>
        <p>N'oublions pas les obligations qui restent en vigueur :</p>
        <ul>
          <li>Délivrance gratuite de la quittance</li>
          <li>Entretien du logement</li>
          <li>Respect du préavis de résiliation</li>
          <li>Restitution du dépôt de garantie</li>
        </ul>
      `,
      date: "8 Jan 2025",
      author: "Équipe Quittance Simple",
      category: "Juridique",
      readTime: "7 min",
      tags: ["Juridique", "2025", "Obligations"]
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

              <h1 className="text-4xl font-bold text-[#415052] mb-4">{article.title}</h1>

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
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#415052] mb-4">Blog & Conseils</h1>
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

                <h2 className="text-xl font-bold text-[#415052] mb-3 hover:text-[#ed7862] transition-colors duration-200">
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
