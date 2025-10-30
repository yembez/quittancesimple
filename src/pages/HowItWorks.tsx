import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Send, CheckCircle, Clock, Shield, Users, Zap, Calendar, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const HowItWorks = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Comment générer une quittance de loyer automatiquement",
    "description": "Guide complet pour créer et envoyer vos quittances de loyer en quelques clics avec Quittance Simple",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Remplissez le formulaire",
        "text": "Entrez les informations du bailleur, du locataire et les montants (loyer + charges)",
        "position": 1
      },
      {
        "@type": "HowToStep",
        "name": "Validez et signez",
        "text": "Certifiez que le paiement a été reçu avec la signature électronique",
        "position": 2
      },
      {
        "@type": "HowToStep",
        "name": "Recevez votre PDF",
        "text": "Téléchargez immédiatement votre quittance conforme à la loi française",
        "position": 3
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Comment ça marche ? Générer vos quittances de loyer en 3 étapes | Quittance Simple"
        description="Découvrez comment créer et envoyer automatiquement vos quittances de loyer en quelques clics. Processus simple, rapide et 100% conforme à la loi française. Essai gratuit."
        keywords="comment faire quittance loyer, générer quittance automatique, créer quittance PDF, envoyer quittance locataire, outil quittance en ligne, processus quittance"
        schema={schema}
        canonical="https://quittance-simple.fr/fonctionnement"
      />

      <section className="pt-20 pb-16 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm mb-6">
              <Zap className="w-4 h-4 text-[#79ae91] mr-2" />
              <span className="text-sm font-medium text-[#415052]">Simple comme bonjour</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-[#415052] mb-6 leading-tight">
              Comment générer vos<br />
              <span className="text-[#79ae91]">quittances de loyer ?</span>
            </h1>

            <p className="text-xl text-[#415052] leading-relaxed mb-8">
              Fini la paperasse et les modèles Word compliqués. Avec Quittance Simple, créez et envoyez vos quittances de loyer conformes en quelques clics. 100% légal, rapide et sans prise de tête.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/generator"
                className="bg-[#ed7862] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-[#e56651] transition-all flex items-center justify-center"
              >
                Essayer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#415052] text-center mb-16">
            3 étapes pour votre quittance de loyer
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#79ae91] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div className="inline-block bg-[#79ae91]/20 text-[#415052] px-4 py-1 rounded-full text-sm font-bold mb-4">
                ÉTAPE 1
              </div>
              <h3 className="text-2xl font-bold text-[#415052] mb-4">Remplissez le formulaire</h3>
              <p className="text-[#415052] leading-relaxed mb-4">
                Entrez simplement vos informations : nom du bailleur et du locataire, adresse du logement, montant du loyer et des charges. Quelques secondes suffisent.
              </p>
              <p className="text-sm text-[#415052]/70">
                Tous les champs nécessaires sont guidés pour une quittance 100% conforme à la loi du 6 juillet 1989.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#79ae91] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="inline-block bg-[#79ae91]/20 text-[#415052] px-4 py-1 rounded-full text-sm font-bold mb-4">
                ÉTAPE 2
              </div>
              <h3 className="text-2xl font-bold text-[#415052] mb-4">Validez et signez</h3>
              <p className="text-[#415052] leading-relaxed mb-4">
                Cochez la case de signature électronique pour certifier que le paiement a bien été reçu. Votre quittance sera automatiquement datée et signée.
              </p>
              <p className="text-sm text-[#415052]/70">
                La signature électronique a la même valeur légale qu'une signature manuscrite selon le règlement eIDAS.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[#79ae91] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Send className="w-10 h-10 text-white" />
              </div>
              <div className="inline-block bg-[#79ae91]/20 text-[#415052] px-4 py-1 rounded-full text-sm font-bold mb-4">
                ÉTAPE 3
              </div>
              <h3 className="text-2xl font-bold text-[#415052] mb-4">Recevez votre PDF</h3>
              <p className="text-[#415052] leading-relaxed mb-4">
                Téléchargez immédiatement votre quittance au format PDF. Vous pouvez l'envoyer par email à votre locataire ou l'imprimer.
              </p>
              <p className="text-sm text-[#415052]/70">
                Format professionnel et légal prêt à être utilisé comme justificatif de paiement pour la CAF ou toute démarche administrative.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#415052] text-center mb-4">
            Mode gratuit vs Mode automatique
          </h2>
          <p className="text-xl text-[#415052] text-center mb-12 max-w-3xl mx-auto">
            Choisissez le mode qui correspond à vos besoins : gratuit pour un usage ponctuel, ou automatique pour gagner du temps chaque mois.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <div className="bg-[#415052] h-32 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-[#415052] mb-4">Mode Gratuit</h3>
              <p className="text-[#415052] mb-6 leading-relaxed">
                Parfait si vous générez vos quittances occasionnellement ou si vous avez seulement quelques locataires.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Génération de quittances illimitée</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Format PDF professionnel</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">100% conforme à la législation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Aucune inscription requise</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Téléchargement immédiat</span>
                </li>
              </ul>
              <Link
                to="/generator"
                className="block text-center bg-[#415052] text-white px-6 py-3 rounded-full font-bold hover:bg-[#344042] transition-all"
              >
                Générer gratuitement
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl relative">
              <div className="absolute -top-3 -right-3 bg-[#ed7862] text-white text-xs px-4 py-1.5 rounded-full font-medium shadow-lg">
                Le plus populaire
              </div>
              <div className="bg-[#79ae91] h-32 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-[#415052] mb-4">Mode Automatique</h3>
              <p className="text-[#415052] mb-6 leading-relaxed">
                Pour les propriétaires qui veulent automatiser complètement la gestion de leurs quittances.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Tout du mode gratuit inclus</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Création automatique chaque mois</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Envoi automatique par email</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Rappels SMS et email automatiques</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Détection des paiements bancaires</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#79ae91] mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-[#415052]">Historique complet des loyers</span>
                </li>
              </ul>
              <Link
                to="/automation"
                className="block text-center bg-[#79ae91] text-white px-6 py-3 rounded-full font-bold hover:bg-[#6a9d7f] transition-all"
              >
                Découvrir l'automatisation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#415052] text-center mb-12">
            Pourquoi choisir Quittance Simple ?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#79ae91]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-[#79ae91]" />
              </div>
              <h3 className="text-xl font-bold text-[#415052] mb-2">Gain de temps</h3>
              <p className="text-[#415052]">
                30 secondes pour créer une quittance contre 10 minutes avec Word ou Excel
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#79ae91]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#79ae91]" />
              </div>
              <h3 className="text-xl font-bold text-[#415052] mb-2">100% Conforme</h3>
              <p className="text-[#415052]">
                Respect de la loi du 6 juillet 1989 et de toutes les mentions obligatoires
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#79ae91]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#79ae91]" />
              </div>
              <h3 className="text-xl font-bold text-[#415052] mb-2">Facile d'utilisation</h3>
              <p className="text-[#415052]">
                Interface intuitive conçue pour les propriétaires particuliers
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#79ae91]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-[#79ae91]" />
              </div>
              <h3 className="text-xl font-bold text-[#415052] mb-2">Envoi automatique</h3>
              <p className="text-[#415052]">
                Option d'envoi direct par email à vos locataires en un clic
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#79ae91]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à simplifier la gestion de vos quittances ?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Rejoignez plus de 2 500 propriétaires qui nous font confiance pour gérer leurs quittances de loyer en toute simplicité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/generator"
              className="bg-white text-[#79ae91] px-8 py-4 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center"
            >
              Essayer gratuitement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/pricing"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-all flex items-center justify-center"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#415052] mb-8">Questions fréquentes sur le fonctionnement</h2>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-[#415052] mb-3">
                Ai-je besoin de créer un compte pour générer une quittance ?
              </h3>
              <p className="text-[#415052] leading-relaxed">
                Non ! Le mode gratuit ne nécessite aucune inscription. Vous remplissez le formulaire et recevez immédiatement votre quittance PDF par email. Simple et rapide.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-[#415052] mb-3">
                Les quittances générées sont-elles conformes à la loi française ?
              </h3>
              <p className="text-[#415052] leading-relaxed">
                Oui, à 100%. Toutes nos quittances respectent les exigences de la loi du 6 juillet 1989 et incluent toutes les mentions obligatoires : identité du bailleur et du locataire, adresse du logement, période concernée, montants détaillés du loyer et des charges, et signature.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-[#415052] mb-3">
                Puis-je personnaliser mes quittances ?
              </h3>
              <p className="text-[#415052] leading-relaxed">
                Le format est standardisé pour garantir la conformité légale, mais vous pouvez ajuster tous les montants, dates et informations personnelles. Pour les abonnés du mode automatique, des options de personnalisation avancées sont disponibles.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-[#415052] mb-3">
                Combien de temps faut-il pour générer une quittance ?
              </h3>
              <p className="text-[#415052] leading-relaxed">
                Environ 30 secondes si vous avez toutes les informations sous la main. Le formulaire est rapide à remplir et la génération du PDF est instantanée.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-[#415052] mb-3">
                Que se passe-t-il avec le mode automatique ?
              </h3>
              <p className="text-[#415052] leading-relaxed">
                Avec le mode automatique, vous enregistrez une fois les informations de vos locataires. Ensuite, Quittance Simple génère et envoie automatiquement les quittances chaque mois dès réception du paiement. Vous n'avez plus qu'à valider d'un simple clic. Idéal pour les propriétaires gérant plusieurs logements.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/faq"
              className="text-[#79ae91] font-semibold hover:text-[#6a9d7f] inline-flex items-center"
            >
              Voir toutes les questions fréquentes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
