interface IBANResult {
  isValid: boolean;
  formatted?: string;
  error?: string;
}

export async function processIBANInput(input: string): Promise<IBANResult> {
  if (!input || input.trim() === '') {
    return {
      isValid: false,
      error: 'L\'IBAN est requis'
    };
  }

  const cleaned = input.replace(/\s/g, '').toUpperCase();

  if (cleaned.length < 15 || cleaned.length > 34) {
    return {
      isValid: false,
      error: 'L\'IBAN doit contenir entre 15 et 34 caractères'
    };
  }

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Format IBAN invalide. L\'IBAN doit commencer par 2 lettres (code pays) suivies de 2 chiffres (clé de contrôle)'
    };
  }

  const countryCode = cleaned.substring(0, 2);
  const checkDigits = cleaned.substring(2, 4);
  const bban = cleaned.substring(4);

  const rearranged = bban + countryCode + checkDigits;

  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged[i];
    if (char >= 'A' && char <= 'Z') {
      numericString += (char.charCodeAt(0) - 55).toString();
    } else {
      numericString += char;
    }
  }

  let remainder = 0;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
  }

  if (remainder !== 1) {
    return {
      isValid: false,
      error: 'IBAN invalide (échec de la vérification de la clé de contrôle)'
    };
  }

  const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;

  return {
    isValid: true,
    formatted
  };
}
