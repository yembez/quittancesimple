import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Shield, FileText, CheckCircle, AlertCircle, Scale, BookOpen, ArrowRight, Users, Lock, ScrollText } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';

interface LegalProps {
  tab?: 'legal' | 'cgu' | 'privacy';
}

const Legal = ({ tab }: LegalProps) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'legal' | 'cgu' | 'privacy'>(tab || 'legal');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as 'legal' | 'cgu' | 'privacy' | null;
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams, tab]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Obligations légales et mentions obligatoires d'une quittance de loyer",
    "description": "Guide complet sur la conformité légale des quittances de loyer en France : loi de 1989, mentions obligatoires, délais et obligations du bailleur.",
    "author": {
      "@type": "Organization",
      "name": "Quittance Simple"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Mentions légales, CGU et Confidentialité | Quittance Simple"
        description="Mentions légales, conditions générales d'utilisation et politique de confidentialité de Quittance Simple. Service conforme au RGPD."
        keywords="mentions légales, CGU, politique de confidentialité, RGPD, protection des données"
        schema={schema}
        canonical="https://quittance-simple.fr/legal"
      />

      <section className="pt-12 sm:pt-16 pb-8 sm:pb-12 bg-[#fefdf9]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center bg-white rounded-full px-3 py-1.5 shadow-sm mb-4">
              <Scale className="w-4 h-4 text-[#2D3436] mr-2" />
              <span className="text-xs sm:text-sm font-medium text-[#415052]">Conformité légale garantie</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-[#1a1f20] mb-4 leading-tight">
              <span className="text-[#ed7862]">Informations légales</span>
            </h1>

            <p className="text-base sm:text-lg text-[#415052] leading-relaxed">
              Mentions légales, conditions générales d'utilisation et politique de confidentialité
            </p>
          </motion.div>

          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            <button
              onClick={() => setActiveTab('legal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'legal'
                  ? 'bg-[#2D3436] text-white shadow-lg'
                  : 'bg-white text-[#415052] hover:bg-gray-50'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              Mentions légales
            </button>
            <button
              onClick={() => setActiveTab('cgu')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'cgu'
                  ? 'bg-[#2D3436] text-white shadow-lg'
                  : 'bg-white text-[#415052] hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              CGU
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'privacy'
                  ? 'bg-[#2D3436] text-white shadow-lg'
                  : 'bg-white text-[#415052] hover:bg-gray-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              Confidentialité
            </button>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">

          {activeTab === 'legal' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a1f20] mb-6">Mentions légales</h2>

              <div className="space-y-4 text-[#415052]">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Éditeur du site</h3>
                  <p className="text-sm leading-relaxed">
                    <strong>Raison sociale :</strong> Novalonga SAS<br />
                    <strong>Forme juridique :</strong> SASU<br />
                    <strong>Adresse :</strong> 8 reu Notre Dame de Lorette, 75009 PARIS<br />
                    <strong>SIRET :</strong> [Numéro SIRET à compléter]<br />
                    <strong>Email :</strong> contact@quittance-simple.fr<br />
                  
              
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Hébergeur du site</h3>
                  <p className="text-sm leading-relaxed">
                    <strong>Netlify, Inc.</strong><br />
                    2325 3rd Street, Suite 296<br />
                    San Francisco, California 94107<br />
                    États-Unis<br />
                    Site web : <a href="https://www.netlify.com" className="text-[#2D3436] hover:underline">www.netlify.com</a>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Propriété intellectuelle</h3>
                  <p className="text-sm leading-relaxed">
                    L'ensemble du contenu du site Quittance Simple (textes, images, graphismes, logo, icônes, sons, logiciels) est la propriété exclusive de Quittance Simple, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle, de ces différents éléments est strictement interdite sans l'accord exprès par écrit de Quittance Simple.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Données personnelles</h3>
                  <p className="text-sm leading-relaxed">
                    Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    Pour exercer ces droits, vous pouvez nous contacter à l'adresse : <strong>contact@quittance-simple.fr</strong>
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    Pour plus d'informations, consultez notre <button onClick={() => setActiveTab('privacy')} className="text-[#2D3436] hover:underline font-semibold">Politique de confidentialité</button>.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Cookies</h3>
                  <p className="text-sm leading-relaxed">
                    Le site utilise des cookies pour améliorer l'expérience utilisateur et analyser le trafic. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Responsabilité</h3>
                  <p className="text-sm leading-relaxed">
                    Quittance Simple s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, Quittance Simple ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    En conséquence, Quittance Simple décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Litiges</h3>
                  <p className="text-sm leading-relaxed">
                    Les présentes mentions légales sont régies par le droit français. En cas de litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux français conformément aux règles de compétence en vigueur.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'cgu' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a1f20] mb-6">Conditions Générales d'Utilisation</h2>

              <div className="space-y-4 text-[#415052]">
                <p className="text-xs text-gray-600">Dernière mise à jour : 31 octobre 2025</p>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">1. Objet</h3>
                  <p className="text-sm leading-relaxed">
                    Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation des services proposés sur le site Quittance Simple, ainsi que de définir les droits et obligations des parties dans ce cadre.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    L'accès au site et l'utilisation de ses services impliquent l'acceptation pleine et entière des présentes CGU.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">2. Services proposés</h3>
                  <p className="text-sm leading-relaxed">
                    Quittance Simple propose les services suivants :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4 text-xs sm:text-sm">
                    <li>Génération gratuite de quittances de loyer au format PDF</li>
                    <li>Envoi automatique de quittances par email (service premium)</li>
                    <li>Gestion de locataires et suivi des paiements (service premium)</li>
                    <li>Stockage sécurisé des données</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">3. Accès au service</h3>
                  <p className="text-sm leading-relaxed">
                    Le service gratuit est accessible sans inscription pour la génération ponctuelle de quittances.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    Les services premium nécessitent la création d'un compte utilisateur et le paiement d'un abonnement.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">4. Création et gestion du compte</h3>
                  <p className="text-sm leading-relaxed">
                    Pour accéder aux services premium, l'utilisateur doit créer un compte en fournissant des informations exactes et à jour. L'utilisateur est responsable de la confidentialité de ses identifiants de connexion.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    En cas d'utilisation frauduleuse ou non autorisée de votre compte, vous devez immédiatement nous en informer.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">5. Tarifs et paiement</h3>
                  <p className="text-sm leading-relaxed">
                    Les tarifs des services premium sont indiqués en euros TTC sur la page Tarifs du site. Quittance Simple se réserve le droit de modifier ses tarifs à tout moment, mais les services seront facturés sur la base des tarifs en vigueur au moment de la souscription.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    Le paiement s'effectue en ligne de manière sécurisée via Stripe. Les abonnements sont renouvelés automatiquement sauf résiliation.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">6. Droit de rétractation</h3>
                  <p className="text-sm leading-relaxed">
                    Conformément aux articles L221-18 et suivants du Code de la consommation, vous disposez d'un délai de 14 jours à compter de la souscription pour exercer votre droit de rétractation sans avoir à justifier de motifs ni à payer de pénalités.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">7. Résiliation</h3>
                  <p className="text-sm leading-relaxed">
                    L'utilisateur peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prendra effet à la fin de la période d'abonnement en cours.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    Quittance Simple se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">8. Obligations de l'utilisateur</h3>
                  <p className="text-sm leading-relaxed">
                    L'utilisateur s'engage à :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4 text-xs sm:text-sm">
                    <li>Fournir des informations exactes et sincères</li>
                    <li>Utiliser le service conformément à sa destination</li>
                    <li>Ne pas porter atteinte aux droits de propriété intellectuelle</li>
                    <li>Ne pas tenter de nuire au fonctionnement du service</li>
                    <li>Respecter la législation en vigueur</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">9. Responsabilité</h3>
                  <p className="text-sm leading-relaxed">
                    Quittance Simple met tout en œuvre pour assurer la disponibilité et la fiabilité du service. Toutefois, Quittance Simple ne peut être tenu responsable :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4 text-xs sm:text-sm">
                    <li>Des interruptions temporaires du service pour maintenance</li>
                    <li>Des dommages indirects résultant de l'utilisation du service</li>
                    <li>De l'utilisation incorrecte du service par l'utilisateur</li>
                    <li>Des problèmes techniques indépendants de sa volonté</li>
                  </ul>
                  <p className="text-sm leading-relaxed mt-2">
                    L'utilisateur reste seul responsable de la conformité des quittances générées avec sa situation juridique spécifique.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">10. Protection des données</h3>
                  <p className="text-sm leading-relaxed">
                    Les données personnelles collectées sont traitées conformément à notre <button onClick={() => setActiveTab('privacy')} className="text-[#2D3436] hover:underline font-semibold">Politique de confidentialité</button> et au RGPD.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">11. Propriété intellectuelle</h3>
                  <p className="text-sm leading-relaxed">
                    Tous les éléments du site (structure, logiciels, textes, images, graphismes, etc.) sont protégés par le droit d'auteur et appartiennent à Quittance Simple ou à leurs auteurs respectifs.
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    Toute reproduction, représentation, modification, publication ou adaptation totale ou partielle est strictement interdite sans autorisation écrite.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">12. Modification des CGU</h3>
                  <p className="text-sm leading-relaxed">
                    Quittance Simple se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou via le site. L'utilisation continue du service après modification vaut acceptation des nouvelles CGU.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">13. Droit applicable et juridiction</h3>
                  <p className="text-sm leading-relaxed">
                    Les présentes CGU sont régies par le droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. À défaut, les tribunaux français seront seuls compétents.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">14. Médiation</h3>
                  <p className="text-sm leading-relaxed">
                    Conformément à l'article L.612-1 du Code de la consommation, en cas de litige, vous pouvez recourir gratuitement au service de médiation proposé par Quittance Simple ou à tout autre service de médiation de votre choix.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">15. Contact</h3>
                  <p className="text-sm leading-relaxed">
                    Pour toute question concernant ces CGU, vous pouvez nous contacter à :<br />
                    <strong>Email :</strong> contact@quittance-simple.fr
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a1f20] mb-6">Politique de confidentialité</h2>

              <div className="space-y-4 text-[#415052]">
                <p className="text-xs text-gray-600">Dernière mise à jour : 31 octobre 2025</p>

                <div className="bg-[#2D3436]/10 border-l-4 border-[#2D3436] rounded-xl p-4">
                  <p className="text-sm leading-relaxed font-semibold">
                    Quittance Simple s'engage à protéger la confidentialité de vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">1. Responsable du traitement</h3>
                  <p className="text-sm leading-relaxed">
                    Le responsable du traitement des données est :<br />
                    <strong>Quittance Simple</strong><br />
                    Email : contact@quittance-simple.fr
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">2. Données collectées</h3>
                  <p className="text-sm leading-relaxed mb-2">
                    Nous collectons les données suivantes selon l'utilisation du service :
                  </p>

                  <h4 className="text-sm font-bold mb-1">Service gratuit (sans compte) :</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 mb-3 text-xs sm:text-sm">
                    <li>Informations du bailleur (nom, prénom, adresse, e-mail)</li>
                    <li>Informations du locataire (nom, prénom, adresse du logement)</li>
                    <li>Montants des loyers et charges</li>
                  </ul>

                  <h4 className="text-sm font-bold mb-1">Service premium (avec compte) :</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 mb-3 text-xs sm:text-sm">
                      <li>Informations du bailleur (nom, prénom, adresse)</li>
                    <li>Email et mot de passe (chiffré)</li>
                    <li>Numéro de téléphone (pour les notifications SMS exclusivement)</li>
                     <li>Informations du locataire (nom, prénom, adresse du logement, email)</li>
                    <li>Données de paiement (traitées par Stripe, non stockées sur nos serveurs)</li>
                    <li>Historique des quittances générées</li>
                    <li>Liste des locataires gérés</li>
                  </ul>

                  <h4 className="text-sm font-bold mb-1">Données techniques :</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-xs sm:text-sm">
                    <li>Adresse IP</li>
                    <li>Type de navigateur et système d'exploitation</li>
                    <li>Pages visitées et temps de consultation</li>
                    <li>Cookies (voir section dédiée)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">3. Finalités du traitement</h3>
                  <p className="text-sm leading-relaxed mb-2">
                    Vos données sont collectées et traitées pour les finalités suivantes :
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-xs sm:text-sm">
                    <li><strong>Fourniture du service :</strong> Génération et envoi de quittances</li>
                    <li><strong>Gestion du compte :</strong> Création et administration de votre espace personnel</li>
                    <li><strong>Facturation :</strong> Traitement des paiements et émission de factures</li>
                    <li><strong>Communication :</strong> Envoi d'emails transactionnels et notifications importantes</li>
                    <li><strong>Amélioration du service :</strong> Analyse statistique et amélioration de l'expérience utilisateur</li>
                    <li><strong>Sécurité :</strong> Prévention de la fraude et respect des obligations légales</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">4. Base légale du traitement</h3>
                  <p className="text-sm leading-relaxed">
                    Les bases légales du traitement de vos données sont :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4 text-xs sm:text-sm">
                    <li><strong>Exécution du contrat :</strong> Pour fournir les services demandés</li>
                    <li><strong>Intérêt légitime :</strong> Pour améliorer nos services et assurer la sécurité</li>
                    <li><strong>Consentement :</strong> Pour l'envoi de communications marketing (optionnel)</li>
                    <li><strong>Obligation légale :</strong> Conservation des factures, lutte anti-fraude</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">5. Destinataires des données</h3>
                  <p className="text-sm leading-relaxed mb-2">
                    Vos données peuvent être transmises aux destinataires suivants :
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-xs sm:text-sm">
                    <li><strong>Personnel autorisé de Quittance Simple :</strong> Pour la gestion du service</li>
                    <li><strong>Stripe :</strong> Pour le traitement sécurisé des paiements</li>
                    <li><strong>Supabase :</strong> Pour l'hébergement sécurisé des données</li>
                    <li><strong>Netlify :</strong> Pour l'hébergement du site web</li>
                    <li><strong>Fournisseur SMS :</strong> Pour l'envoi de notifications (uniquement si activé)</li>
                    <li><strong>Autorités légales :</strong> Sur demande légale uniquement</li>
                  </ul>
                  <p className="text-sm leading-relaxed mt-2">
                    Aucune donnée n'est vendue ou louée à des tiers à des fins commerciales.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">6. Durée de conservation</h3>
                  <p className="text-sm leading-relaxed mb-2">
                    Vos données sont conservées pour les durées suivantes :
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-xs sm:text-sm">
                    <li><strong>Compte actif :</strong> Pendant toute la durée d'utilisation du service</li>
                    <li><strong>Compte supprimé :</strong> 30 jours (délai de récupération), puis suppression définitive</li>
                    <li><strong>Factures :</strong> 10 ans (obligation légale comptable)</li>
                    <li><strong>Données de connexion :</strong> 12 mois maximum</li>
                    <li><strong>Cookies :</strong> 13 mois maximum</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">7. Sécurité des données</h3>
                  <p className="text-sm leading-relaxed">
                    Nous mettons en œuvre les mesures de sécurité suivantes pour protéger vos données :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4 text-xs sm:text-sm">
                    <li>Chiffrement SSL/TLS pour toutes les communications</li>
                    <li>Mots de passe chiffrés (hachage bcrypt)</li>
                    <li>Authentification sécurisée</li>
                    <li>Hébergement sécurisé certifié (Supabase)</li>
                    <li>Sauvegardes régulières</li>
                    <li>Accès restreint aux données (principe du moindre privilège)</li>
                    <li>Surveillance et journalisation des accès</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">8. Vos droits</h3>
                  <p className="text-sm leading-relaxed mb-2">
                    Conformément au RGPD, vous disposez des droits suivants :
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-xs sm:text-sm">
                    <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données</li>
                    <li><strong>Droit de rectification :</strong> Corriger vos données inexactes</li>
                    <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
                    <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données</li>
                    <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
                    <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
                    <li><strong>Droit de retirer votre consentement :</strong> Pour les traitements basés sur le consentement</li>
                  </ul>
                  <p className="text-sm leading-relaxed mt-2">
                    Pour exercer ces droits, contactez-nous à : <strong>contact@quittance-simple.fr</strong>
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    Nous répondrons à votre demande dans un délai d'un mois maximum.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">9. Cookies et mesure d'audience</h3>

                  <div className="bg-[#2D3436]/10 border-l-4 border-[#2D3436] rounded-lg p-3 mb-3">
                    <p className="text-sm leading-relaxed font-semibold">
                      Nous n'utilisons PAS de cookies publicitaires ni de traceurs nécessitant votre consentement.
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed mb-3">
                    Notre site utilise uniquement :
                  </p>

                  <h4 className="text-sm font-bold mb-1">Cookies strictement nécessaires :</h4>
                  <ul className="list-disc list-inside ml-4 mb-3 space-y-1 text-xs">
                    <li>Cookies d'authentification (pour maintenir votre session connectée)</li>
                    <li>Cookies de préférences (pour mémoriser vos choix sur le site)</li>
                    <li>Cookies de sécurité (pour protéger votre compte)</li>
                  </ul>
                  <p className="text-xs leading-relaxed ml-4 mb-3 text-gray-600">
                    Ces cookies sont indispensables au fonctionnement du site et ne nécessitent pas de consentement selon la CNIL.
                  </p>

                  <h4 className="text-sm font-bold mb-1">Mesure d'audience (Vercel Analytics) :</h4>
                  <p className="text-sm leading-relaxed ml-4 mb-2">
                    Nous utilisons Vercel Analytics pour analyser l'utilisation de notre site et améliorer votre expérience. Cette solution est configurée en mode <strong>exempté de consentement</strong> selon les recommandations de la CNIL :
                  </p>
                  <ul className="list-disc list-inside ml-8 mb-3 space-y-1 text-xs">
                    <li>Aucun cookie n'est déposé (mode sans cookies)</li>
                    <li>Les adresses IP sont automatiquement anonymisées</li>
                    <li>Les données ne sont pas utilisées à des fins publicitaires</li>
                    <li>Les données ne sont pas vendues à des tiers</li>
                    <li>Conformité RGPD et CCPA</li>
                    <li>Données collectées : pages visitées, pays, type d'appareil, navigateur</li>
                  </ul>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-xs sm:text-sm leading-relaxed">
                      <strong>Droit d'opposition :</strong> Vous pouvez vous opposer à tout moment au suivi statistique de votre navigation en nous contactant à <strong>contact@quittance-simple.fr</strong>.
                    </p>
                  </div>

                  <h4 className="text-sm font-bold mb-1 mt-3">Pas de cookies tiers :</h4>
                  <p className="text-sm leading-relaxed ml-4 mb-2">
                    Nous n'utilisons aucun cookie publicitaire, de réseaux sociaux ou de pistage (tracking). Votre vie privée est respectée.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">10. Transferts internationaux</h3>
                  <p className="text-sm leading-relaxed">
                    Vos données sont hébergées au sein de l'Union Européenne (Supabase - serveurs en Europe). Certains prestataires (Netlify, Stripe) peuvent traiter des données hors UE, mais disposent de garanties appropriées (clauses contractuelles types de la Commission Européenne, Privacy Shield).
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">11. Mineurs</h3>
                  <p className="text-sm leading-relaxed">
                    Le service n'est pas destiné aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de données de mineurs. Si vous pensez qu'un mineur nous a fourni des données, contactez-nous immédiatement.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">12. Modifications de la politique</h3>
                  <p className="text-sm leading-relaxed">
                    Cette politique de confidentialité peut être modifiée pour refléter les changements de nos pratiques. Nous vous informerons de toute modification importante par email ou via le site. La date de dernière mise à jour est indiquée en haut de cette page.
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">13. Réclamation</h3>
                  <p className="text-sm leading-relaxed">
                    Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL :
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    <strong>Commission Nationale de l'Informatique et des Libertés (CNIL)</strong><br />
                    3 Place de Fontenoy<br />
                    TSA 80715<br />
                    75334 PARIS CEDEX 07<br />
                    Téléphone : 01 53 73 22 22<br />
                    Site web : <a href="https://www.cnil.fr" className="text-[#2D3436] hover:underline">www.cnil.fr</a>
                  </p>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">14. Contact</h3>
                  <p className="text-sm leading-relaxed">
                    Pour toute question concernant la protection de vos données personnelles, vous pouvez nous contacter :
                  </p>
                  <p className="text-sm leading-relaxed mt-2">
                    <strong>Email :</strong> contact@quittance-simple.fr<br />
                    <strong>Objet :</strong> Protection des données personnelles - RGPD
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Legal;
