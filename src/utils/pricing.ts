/**
 * Fonction utilitaire pour calculer les prix selon la nouvelle tarification
 */

export interface PricingInfo {
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyEquivalent: number; // Prix mensuel équivalent pour le plan annuel (arrondi)
  savings?: number; // Économies avec le plan annuel
}

/**
 * Calcule les prix selon le nombre de locataires
 * @param numberOfTenants Nombre de locataires
 * @returns Informations de tarification
 */
export function getPricing(numberOfTenants: number): PricingInfo {
  let monthlyPrice: number;
  let yearlyPrice: number;

  if (numberOfTenants >= 1 && numberOfTenants <= 2) {
    monthlyPrice = 3.90;
    yearlyPrice = 39.00;
  } else if (numberOfTenants >= 3 && numberOfTenants <= 5) {
    monthlyPrice = 5.90;
    yearlyPrice = 59.00;
  } else {
    // 6 locataires et plus
    monthlyPrice = 8.90;
    yearlyPrice = 89.00;
  }

  // Calculer le prix mensuel équivalent pour le plan annuel (valeurs harmonisées)
  let monthlyEquivalent: number;
  if (yearlyPrice === 39.00) {
    monthlyEquivalent = 3.25;
  } else if (yearlyPrice === 59.00) {
    monthlyEquivalent = 4.92;
  } else if (yearlyPrice === 89.00) {
    monthlyEquivalent = 7.42;
  } else {
    // Fallback pour d'autres valeurs
    const monthlyEquivalentRaw = yearlyPrice / 12;
    if (monthlyEquivalentRaw % 0.1 < 0.05) {
      monthlyEquivalent = Math.round(monthlyEquivalentRaw * 10) / 10;
    } else {
      monthlyEquivalent = Math.round(monthlyEquivalentRaw * 100) / 100;
    }
  }

  // Calculer les économies (différence entre mensuel et annuel sur 12 mois)
  const savings = (monthlyPrice * 12) - yearlyPrice;

  return {
    monthlyPrice,
    yearlyPrice,
    monthlyEquivalent,
    savings: savings > 0 ? savings : undefined
  };
}

/**
 * Formate le prix pour l'affichage
 * @param price Prix à formater
 * @param decimals Nombre de décimales (par défaut 2)
 * @returns Prix formaté avec virgule comme séparateur décimal
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return price.toFixed(decimals).replace('.', ',');
}
