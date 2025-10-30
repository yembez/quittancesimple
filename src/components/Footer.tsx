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
    <footer className="bg-[#415052] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#ed7862] rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Quittance Simple</span>
            </Link>
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              La solution simple et abordable pour gérer vos quittances de loyer. Gratuit ou automatisé, à vous de choisir.
            </p>
            <Link
              to={isUserConnected ? "/dashboard" : "/generator"}
              className="inline-flex items-center justify-center bg-[#ed7862] text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-[#e56651] transition-all mb-6 transform hover:scale-105"
            >
              {isUserConnected ? "Accéder au tableau de bord" : "Créer une quittance gratuite"}
            </Link>

            <div className="flex items-center space-x-2 mb-6">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-gray-300 text-sm">4.9/5 · 2 500+ propriétaires</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-300" />
                </div>
                <span className="text-gray-300 text-sm">contact@quittancesimple.fr</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-gray-300" />
                </div>
                <span className="text-gray-300 text-sm">Paris, France</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">Produit</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-[#ed7862] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">Ressources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-[#ed7862] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">Entreprise</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-[#ed7862] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4 text-white uppercase tracking-wide">Légal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-[#ed7862] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 Quittance Simple. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <span>Fait avec</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 text-red-500 fill-current" />
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