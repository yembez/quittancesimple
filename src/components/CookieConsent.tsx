import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#2D3436]/10 rounded-xl flex items-center justify-center">
                    <Cookie className="w-6 h-6 text-[#2D3436]" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-[#415052] mb-2">
                    Nous respectons votre vie privée
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-4">
                    Nous utilisons des cookies essentiels pour assurer le bon fonctionnement du site et des cookies analytiques pour améliorer votre expérience. Vos données sont protégées conformément au RGPD.
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Pour en savoir plus, consultez notre{' '}
                    <Link to="/privacy" className="text-[#2D3436] hover:underline font-semibold">
                      politique de confidentialité
                    </Link>
                    .
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAccept}
                      className="bg-[#2D3436] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6b9979] transition-colors shadow-md"
                    >
                      Accepter tous les cookies
                    </button>
                    <button
                      onClick={handleReject}
                      className="bg-gray-100 text-[#415052] px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cookies essentiels uniquement
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleReject}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
