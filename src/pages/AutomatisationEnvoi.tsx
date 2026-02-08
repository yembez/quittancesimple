import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Send, CheckCircle, ArrowRight, Clock, Mail, Smartphone, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

const AutomatisationEnvoi = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Automatisation Envoi de Quittances",
    "applicationCategory": "BusinessApplication",
    "description": "Automatisez l'envoi de vos quittances de loyer par email et SMS",
    "offers": {
      "@type": "Offer",
      "price": "1",
      "priceCurrency": "EUR"
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <SEOHead
        title="Automatisation Envoi Quittances | Envoyer Pack Automatiquement dès 0,99€"
        description="Automatisez l'envoi de vos quittances de loyer par email et SMS. Génération automatique, envoi programmé, rappels automatiques. Solution complète dès 0,99€/mois."
        keywords="automatisation envoi quittance, envoyer quittance automatiquement, envoi automatique quittance loyer, automatiser quittances, quittance automatique email, envoi quittance programmé, automatisation gestion locative"
        schema={schema}
        canonical="https://quittance-simple.fr/automatisation-envoi-quittances"
      />

      <section className="pt-20 pb-16 bg-gradient-to-b from-orange-100 to-amber-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm mb-6">
              <Zap className="w-4 h-4 text-[#FFD76F] mr-2" />
              <span className="text-sm font-medium text-gray-700">Automatisation complète · Dès 0,99€/mois</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Automatisez l'envoi<br />
              <span className="text-[#FFD76F]">de vos quittances</span>
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Fini les oublis et la paperasse ! Vos quittances de loyer sont créées et envoyées automatiquement par email et SMS chaque mois. Gagnez des heures de gestion.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/automation-setup"
                className="inline-flex items-center bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105"
              >
                Activer l'automatisation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/fonctionnement"
                className="inline-flex items-center bg-white text-gray-700 border-2 border-gray-300 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                Comment ça marche ?
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Comment fonctionne l'automatisation ?
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <div className="inline-block bg-orange-100 text-orange-800 px-4 py-1 rounded-full text-sm font-bold mb-4">
                ÉTAPE 1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Configurez une seule fois</h3>
              <p className="text-gray-600 leading-relaxed">
                Enregistrez les informations de vos locataires : noms, emails, téléphones, montants des loyers. Vous ne le ferez qu'une seule fois.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <div className="inline-block bg-orange-100 text-orange-800 px-4 py-1 rounded-full text-sm font-bold mb-4">
                ÉTAPE 2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Le système génère automatiquement</h3>
              <p className="text-gray-600 leading-relaxed">
                Chaque mois, vos quittances sont créées automatiquement dès réception du paiement. Aucune action manuelle nécessaire.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Send className="w-10 h-10 text-white" />
              </div>
              <div className="inline-block bg-orange-100 text-orange-800 px-4 py-1 rounded-full text-sm font-bold mb-4">
                ÉTAPE 3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Envoi automatique</h3>
              <p className="text-gray-600 leading-relaxed">
                Vos locataires reçoivent leur quittance par email (et SMS si activé). Vous êtes notifié de chaque envoi réussi.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Tous les avantages de l'automatisation
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start">
                <CheckCircle className="w-8 h-8 text-gray-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Envoi automatique par email</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Vos quittances sont envoyées automatiquement par email à vos locataires dès leur génération. Format PDF professionnel, livraison instantanée.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start">
                <CheckCircle className="w-8 h-8 text-gray-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Rappels SMS automatiques</h3>
                  <p className="text-gray-700 leading-relaxed">
                    En cas de retard de paiement, des rappels SMS sont envoyés automatiquement à vos locataires. Vous n'avez plus à relancer manuellement.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start">
                <CheckCircle className="w-8 h-8 text-gray-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Détection automatique des paiements</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Avec la synchronisation bancaire (option Connectée+), le système détecte automatiquement quand un loyer est payé et déclenche l'envoi de la quittance.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start">
                <CheckCircle className="w-8 h-8 text-gray-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Génération programmée</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Configurez la date d'envoi mensuelle (début du mois, 5 du mois, etc.). Le système s'occupe du reste, mois après mois.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start">
                <CheckCircle className="w-8 h-8 text-gray-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Historique complet</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Accédez à l'historique complet de toutes les quittances envoyées : dates, montants, statuts de lecture, confirmations de réception.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start">
                <CheckCircle className="w-8 h-8 text-gray-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-locataires</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Gérez plusieurs locataires simultanément. L'automatisation fonctionne pour tous vos biens locatifs en parallèle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Gain de temps : avant vs après automatisation
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-red-900 mb-6">❌ Sans automatisation</h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <Clock className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-1" />
                  <span>10 minutes par quittance (Word/Excel)</span>
                </li>
                <li className="flex items-start">
                  <Clock className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-1" />
                  <span>5 minutes pour l'envoi par email</span>
                </li>
                <li className="flex items-start">
                  <Clock className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-1" />
                  <span>Risque d'oubli chaque mois</span>
                </li>
                <li className="flex items-start">
                  <Clock className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-1" />
                  <span>Relances manuelles en cas de retard</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-red-100 rounded-xl">
                <p className="font-bold text-red-900 text-center">
                  ~15 minutes par locataire/mois<br />
                  = 3 heures/an pour 1 locataire
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">✓ Avec automatisation</h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <Zap className="w-5 h-5 text-gray-600 mr-3 flex-shrink-0 mt-1" />
                  <span>0 minute : génération automatique</span>
                </li>
                <li className="flex items-start">
                  <Zap className="w-5 h-5 text-gray-600 mr-3 flex-shrink-0 mt-1" />
                  <span>0 minute : envoi automatique</span>
                </li>
                <li className="flex items-start">
                  <Zap className="w-5 h-5 text-gray-600 mr-3 flex-shrink-0 mt-1" />
                  <span>Impossible d'oublier</span>
                </li>
                <li className="flex items-start">
                  <Zap className="w-5 h-5 text-gray-600 mr-3 flex-shrink-0 mt-1" />
                  <span>Rappels automatiques en cas de retard</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-gray-100 rounded-xl">
                <p className="font-bold text-gray-900 text-center">
                  0 minute par locataire/mois<br />
                  = 0 heure/an · 100% automatique
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Questions fréquentes sur l'automatisation
          </h2>

          <div className="space-y-4">
            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Comment activer l'envoi automatique de quittances ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Il suffit de vous inscrire au plan Automatique (0,99€/mois pour 1-2 locataires, 1,49€/mois pour 3-4, 2,49€/mois pour 5+), d'enregistrer les informations de vos locataires, et de configurer la date d'envoi mensuelle. Le système s'occupe du reste automatiquement.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Mes locataires recevront-ils vraiment les quittances automatiquement ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui, à 100%. Chaque mois, à la date que vous avez configurée, vos locataires reçoivent automatiquement leur quittance par email au format PDF. Vous êtes notifié de chaque envoi réussi.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Puis-je envoyer des quittances automatiquement par SMS ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui, vous pouvez activer les rappels SMS en cas de retard de paiement. L'envoi principal se fait toujours par email (avec la quittance PDF), mais les rappels SMS sont très efficaces pour les locataires qui tardent à payer.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Comment le système sait-il quand un loyer est payé ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Avec le plan Automatique, vous validez manuellement chaque paiement en 1 clic. Avec le plan Connectée+ (1,50€/mois), la synchronisation bancaire détecte automatiquement les paiements entrants et déclenche l'envoi sans intervention de votre part.
              </p>
            </details>

            <details className="bg-white rounded-2xl p-6 shadow-md cursor-pointer">
              <summary className="text-lg font-bold text-gray-900 cursor-pointer">
                Puis-je automatiser pour plusieurs locataires ?
              </summary>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Oui ! Le prix est de 0,99€/mois pour 1-2 locataires, 1,49€/mois pour 3-4 locataires, et 2,49€/mois pour 5 locataires et plus. Vous pouvez gérer autant de locataires que nécessaire avec l'automatisation.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à automatiser vos quittances ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Rejoignez des centaines de propriétaires qui ont automatisé leur gestion locative.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/automation-setup"
              className="inline-flex items-center bg-white text-[#FFD76F] px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Activer l'automatisation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center bg-transparent border-2 border-white text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AutomatisationEnvoi;
