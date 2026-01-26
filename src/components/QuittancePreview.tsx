import React from 'react';
import { X, FileText, Shield, Stamp } from 'lucide-react';

// Fonction pour convertir un nombre en lettres (français)
const numberToFrench = (num: number): string => {
  // Arrondir à 2 décimales pour éviter les problèmes d'arrondi
  num = Math.round(num * 100) / 100;
  
  if (num === 0) return 'zéro';
  
  const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  
  const convertHundreds = (n: number): string => {
    let result = '';
    
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      if (hundreds === 1) {
        result += 'cent';
      } else {
        result += ones[hundreds] + ' cent';
      }
      if (n % 100 === 0 && hundreds > 1) {
        result += 's';
      }
      n %= 100;
      if (n > 0) result += ' ';
    }
    
    if (n >= 20) {
      const tensDigit = Math.floor(n / 10);
      const onesDigit = n % 10;
      
      if (tensDigit === 7 || tensDigit === 9) {
        result += tens[tensDigit - 1];
        if (tensDigit === 7) {
          result += '-' + teens[onesDigit];
        } else {
          result += '-' + teens[onesDigit];
        }
      } else {
        result += tens[tensDigit];
        if (tensDigit === 8 && onesDigit === 0) {
          result += 's';
        }
        if (onesDigit > 0) {
          if (onesDigit === 1 && (tensDigit === 2 || tensDigit === 3 || tensDigit === 4 || tensDigit === 5 || tensDigit === 6)) {
            result += ' et un';
          } else {
            result += '-' + ones[onesDigit];
          }
        }
      }
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += ones[n];
    }
    
    return result;
  };
  
  const convertThousands = (n: number): string => {
    if (n === 0) return '';
    
    let result = '';
    
    if (n >= 1000000) {
      const millions = Math.floor(n / 1000000);
      if (millions === 1) {
        result += 'un million';
      } else {
        result += convertHundreds(millions) + ' millions';
      }
      n %= 1000000;
      if (n > 0) result += ' ';
    }
    
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      if (thousands === 1) {
        result += 'mille';
      } else {
        result += convertHundreds(thousands) + ' mille';
      }
      n %= 1000;
      if (n > 0) result += ' ';
    }
    
    if (n > 0) {
      result += convertHundreds(n);
    }
    
    return result;
  };
  
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  
  // Si les centimes arrondis atteignent 100, ajuster
  let finalIntegerPart = integerPart;
  let finalDecimalPart = decimalPart;
  
  if (finalDecimalPart >= 100) {
    finalIntegerPart += Math.floor(finalDecimalPart / 100);
    finalDecimalPart = finalDecimalPart % 100;
  }
  
  let result = '';
  
  if (finalIntegerPart === 0) {
    result = 'zéro euro';
  } else {
    result = convertThousands(finalIntegerPart);
    if (finalIntegerPart === 1) {
      result += ' euro';
    } else {
      result += ' euros';
    }
  }
  
  if (finalDecimalPart > 0) {
    result += ' et ' + convertHundreds(finalDecimalPart);
    if (finalDecimalPart === 1) {
      result += ' centime';
    } else {
      result += ' centimes';
    }
  }
  
  return result;
};

interface QuittancePreviewProps {
  data?: {
    proprietaireNom?: string;
    proprietaireAdresse?: string;
    locataireNom?: string;
    locataireAdresse?: string;
    locataireDetailAdresse?: string;
    periode?: string;
    loyer?: string;
    charges?: string;
    caution?: string;
  };
  formData?: {
    baillorName: string;
    baillorAddress: string;
    baillorEmail: string;
    locataireName: string;
    logementAddress: string;
    locataireDomicileAddress?: string;
    loyer: string;
    charges: string;
    periode: string;
    isProrata?: boolean;
    dateDebut?: string;
    dateFin?: string;
    typeCalcul?: string;
  };
  isElectronicSignatureChecked?: boolean;
  onClose?: () => void;
}

const QuittancePreview: React.FC<QuittancePreviewProps> = ({ data, formData, isElectronicSignatureChecked = false, onClose }) => {
  // Normalize data from either prop
  const normalizedData = data ? {
    baillorName: data.proprietaireNom || '',
    baillorAddress: data.proprietaireAdresse || '',
    baillorEmail: '',
    locataireName: data.locataireNom || '',
    logementAddress: `${data.locataireAdresse || ''} ${data.locataireDetailAdresse || ''}`.trim(),
    loyer: data.loyer || '0',
    charges: data.charges || '0',
    periode: data.periode || '',
    isProrata: false,
    dateDebut: undefined,
    dateFin: undefined,
    typeCalcul: undefined
  } : formData || {
    baillorName: '',
    baillorAddress: '',
    baillorEmail: '',
    locataireName: '',
    logementAddress: '',
    loyer: '0',
    charges: '0',
    periode: '',
    isProrata: false
  };

  // Calcul automatique du total
  const loyer = parseFloat(normalizedData.loyer) || 0;
  const charges = parseFloat(normalizedData.charges) || 0;
  const total = loyer + charges;

  // Génération de la date actuelle
  const currentDate = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Extraction du mois et année de la période
  const getPeriodDates = (periode: string) => {
    // Si c'est un prorata avec des dates précises
    if (normalizedData.isProrata && normalizedData.dateDebut && normalizedData.dateFin) {
      const startDate = new Date(normalizedData.dateDebut);
      const endDate = new Date(normalizedData.dateFin);
      
      return {
        start: startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        end: endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      };
    }
    
    // Logique existante pour les périodes normales
    const [month, year] = periode.split(' ');
    const monthNames: { [key: string]: number } = {
      'Janvier': 0, 'Février': 1, 'Mars': 2, 'Avril': 3, 'Mai': 4, 'Juin': 5,
      'Juillet': 6, 'Août': 7, 'Septembre': 8, 'Octobre': 9, 'Novembre': 10, 'Décembre': 11
    };
    
    const monthIndex = monthNames[month] || 8; // Default to September
    const yearNum = parseInt(year) || 2025;
    
    const startDate = new Date(yearNum, monthIndex, 1);
    const endDate = new Date(yearNum, monthIndex + 1, 0);
    
    return {
      start: startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      end: endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  };

  const periodDates = getPeriodDates(normalizedData.periode);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="space-y-6">
        {/* En-tête */}
        <div className="text-center border-b-2 border-gray-300 pb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-[#7caa89] rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">QUITTANCE DE LOYER</h1>
          </div>
          <p className="text-gray-600">Document généré le {formatDate(currentDate)}</p>
        </div>

        {/* Informations des parties */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">BAILLEUR</h3>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-blue-900">{normalizedData.baillorName || '[Nom du bailleur]'}</p>
              <p className="font-semibold text-blue-900">{normalizedData.baillorAddress || '[Adresse du bailleur]'}</p>
              <p className="font-semibold text-blue-900">{normalizedData.baillorEmail || '[Email du bailleur]'}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">LOCATAIRE</h3>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-blue-900">{normalizedData.locataireName || '[Nom du locataire]'}</p>
              <p className="text-gray-600">Locataire du bien ci-dessous</p>
              {formData?.locataireDomicileAddress && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="text-xs text-gray-500 font-semibold">Adresse de domicile :</p>
                  <p className="text-xs text-gray-600">{formData.locataireDomicileAddress}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bien loué */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-gray-900 mb-2">BIEN LOUÉ</h3>
          <p className="font-semibold text-blue-900">{normalizedData.logementAddress || '[Adresse du logement loué]'}</p>
        </div>

        {/* Déclaration */}
        <div className="bg-white border-2 border-gray-300 p-6 rounded-lg">
          <p className="text-sm leading-relaxed text-gray-800">
            Je soussigné(e) <strong>{normalizedData.baillorName || '[Nom du bailleur]'}</strong>, 
            propriétaire du logement désigné ci-dessus, déclare avoir reçu de{' '}
            <strong><a className="font-semibold text-blue-900">{normalizedData.locataireName || '[Nom du locataire]'}</a></strong>, la somme de{' '}
            <a className="text-sm text-blue-900">
              {total > 0 ? `${total.toFixed(2)} €` : '[Montant]'}
            {' '}
            ({total > 0 ? numberToFrench(total) : '[Montant en lettres]'}) </a>
            au titre du paiement du loyer et des charges pour la période du{' '}
            <strong>{periodDates.start}</strong> au <strong>{periodDates.end}</strong>{' '}
            et lui en donne quittance, sous réserve de tous mes droits.
          </p>
        </div>

        {/* Détail des montants */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2">
            <h3 className="font-bold text-gray-900">DÉTAIL DU RÈGLEMENT</h3>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="flex justify-between px-4 py-2">
              <span>Loyer</span>
              <span className="font-semibold text-blue-900">{loyer > 0 ? `${loyer.toFixed(2)} €` : '0,00 €'}</span>
            </div>
            <div className="flex justify-between px-4 py-2">
              <span>Provision pour charges</span>
              <span className="font-semibold text-blue-900">{charges > 0 ? `${charges.toFixed(2)} €` : '0,00 €'}</span>
            </div>
            <div className="flex justify-between px-4 py-3 bg-gray-50 font-bold text-lg">
              <span>TOTAL</span>
              <span className="text-blue-900">{total > 0 ? `${total.toFixed(2)} €` : '0,00 €'}</span>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="flex justify-end">
          <div className="text-center space-y-4">
            {/* Lieu et date */}
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Fait à :</strong><span className="font-semibold text-blue-900"> {(() => {
                const address = normalizedData.baillorAddress || '';
                if (!address) return '[Ville]'; 

                // Essayer de trouver la ville dans l'adresse
                // Format possible: "123 rue X, 75001 Paris" ou "123 rue X Paris" ou "123 rue X, Paris"
                const parts = address.split(',');
                const lastPart = parts[parts.length - 1].trim();

                // Extraire la ville du dernier morceau (enlever le code postal s'il existe)
                const words = lastPart.split(' ').filter(w => w.length > 0);
                // Prendre le dernier mot qui n'est pas un nombre (code postal)
                const ville = words.reverse().find(w => isNaN(Number(w)));

                return ville || 'Paris';
              })()}</span></p>
              <p><strong>Le :</strong> {formatDate(currentDate)}</p>
            </div>
            
            <p className="text-sm font-semibold mb-4">Signature du bailleur</p>
            {isElectronicSignatureChecked ? (
              <div className="relative">
                <div className="w-32 h-20 border-2 border-red-500 rounded-lg bg-red-50 flex flex-col items-center justify-center transform -rotate-2">
                  <Stamp className="w-6 h-6 text-red-600 mb-1" />
                  <div className="text-red-700 font-bold text-xs text-center">
                    <div>SIGNÉ</div>
                    <div>ÉLECTRONIQUEMENT</div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">{normalizedData.baillorName}</p>
              </div>
            ) : (
              <div className="w-32 h-16 border-b-2 border-gray-400"></div>
            )}
          </div>
        </div>

        {/* Mentions légales */}
        <div className="bg-gray-50 p-4 rounded-lg border-t-2 border-gray-300">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold mb-1">Mentions légales :</p>
              <p>
                Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du montant du présent terme. 
                Elle est à conserver pendant trois ans par le locataire (loi n° 89-462 du 6 juillet 1989 : art. 7-1).
              </p>
              {isElectronicSignatureChecked && (
                <p className="mt-2 text-gray-700">
                  ✓ Quittance validée électroniquement par le bailleur via Quittance Simple, le {formatDate(currentDate)} à {currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}, conformément à l'article 1367 du Code civil sur la valeur juridique de la signature électronique.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuittancePreview;