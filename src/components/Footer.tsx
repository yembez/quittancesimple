import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Mail, Phone, MapPin, Star, Heart } from 'lucide-react';

const Footer = () => {
  const [isUserConnected, setIsUserConnected] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('proprietaireEmail');
    setIsUserConnected(!!email);
  }, []);

  const footerLinks = {
    product: [
      { name: 'Générateur gratuit', path: '/generator' },
      { name: 'Comment ça marche', path: '/fonctionnement' },
      { name: 'Automatisation', path: '/automation' },
      { name: 'Tarifs', path: '/pricing' },
      { name: 'Calculateur prorata', path: '/prorata' }
    ],
    resources: [
      { name: 'Quittance PDF gratuit', path: '/quittance-loyer-pdf-gratuit' },
      { name: 'Modèle quittance Word', path: '/modele-quittance-word' },
      { name: 'Modèle quittance Excel', path: '/modele-quittance-excel' },
      { name: 'Quittance meublé', path: '/quittance-loyer-meuble' },
      { name: 'Obligations légales', path: '/obligations-legales' },
      { name: 'Blog', path: '/blog' },
      { name: 'FAQ', path: '/faq' }
    ],
    company: [
      { name: 'À propos', path: '/about' }
    ],
    legal: [
      { name: 'Mentions légales', path: '/legal' },
      { name: 'CGU', path: '/terms' },
      { name: 'Confidentialité', path: '/privacy' }
    ]
  };

  return (
    <footer className="bg-[#2D3436] text-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-7 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-10">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-5">
              <div className="w-8 h-8 bg-[#ed7862] rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">Quittance Simple</span>
            </Link>
            <p className="text-sm text-gray-300 mb-5 leading-relaxed max-w-md">
              La solution simple et abordable pour gérer vos quittances de loyer. Gratuit ou automatisé, à vous de choisir.
            </p>
            <Link
              to={isUserConnected ? "/dashboard" : "/generator"}
              className="inline-flex items-center justify-center bg-[#ed7862] text-white px-5 py-2 rounded-full font-semibold shadow-lg hover:bg-[#e56651] transition-all mb-5 transform hover:scale-105 text-sm"
            >
              {isUserConnected ? "Accéder au tableau de bord" : "Créer une quittance gratuite"}
            </Link>

            <div className="flex items-center space-x-1.5 mb-5">
              <div className="flex space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-300">4.9/5 · 2 500+ propriétaires</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <span className="text-sm text-gray-300">contact@quittancesimple.fr</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <span className="text-sm text-gray-300">Paris, France</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3 text-white uppercase tracking-wide">Produit</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3 text-white uppercase tracking-wide">Ressources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3 text-white uppercase tracking-wide">Entreprise</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3 text-white uppercase tracking-wide">Légal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-3 lg:space-y-0">
            <p className="text-gray-400 text-xs">
              © 2025 Quittance Simple. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-1.5 text-gray-400 text-xs">
              <span>Fait avec</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-3 h-3 fill-current" style={{
                  background: 'linear-gradient(135deg, #FFD76F 0%, #FF7A7F 50%, #A46BFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }} />
              </motion.div>
              <span>à Paris</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;