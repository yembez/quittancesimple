import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';

const PaymentCancelled = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-orange-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Paiement annulé
          </h1>

          <p className="text-gray-600 mb-6">
            Votre paiement n'a pas été effectué. Aucun montant n'a été débité de votre compte.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6 text-left">
            <div className="flex items-start">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 text-sm mb-1">
                  Besoin d'aide ?
                </h3>
                <p className="text-xs text-blue-800">
                  Si vous avez rencontré un problème lors du paiement, n'hésitez pas à nous contacter.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/automation"
              className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-[#7CAA89] hover:bg-[#6a9d7f] text-white rounded-lg font-semibold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Réessayer le paiement</span>
            </Link>

            <Link
              to="/"
              className="block w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Retour à l'accueil
            </Link>

            <a
              href="mailto:contact@quittancesimple.fr"
              className="block w-full px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Contacter le support
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Des questions ? Écrivez-nous à{' '}
              <a href="mailto:contact@quittancesimple.fr" className="text-[#7CAA89] hover:underline">
                contact@quittancesimple.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
