export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'L\'email est obligatoire' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Format d\'email invalide' };
  }

  return { isValid: true };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Le numéro de téléphone est obligatoire' };
  }

  const cleanedPhone = phone.replace(/[\s\.\-]/g, '');

  if (!/^\d+$/.test(cleanedPhone)) {
    return { isValid: false, error: 'Le numéro ne doit contenir que des chiffres' };
  }

  if (cleanedPhone.length !== 10) {
    return { isValid: false, error: 'Le numéro doit contenir 10 chiffres' };
  }

  const validPrefixes = ['01', '02', '03', '04', '05', '06', '07', '09'];
  const prefix = cleanedPhone.substring(0, 2);

  if (!validPrefixes.includes(prefix)) {
    return { isValid: false, error: 'Le numéro doit commencer par 01, 02, 03, 04, 05, 06, 07 ou 09' };
  }

  return { isValid: true };
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[\s\.\-]/g, '');

  if (cleaned.length === 10) {
    return cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
  }

  return phone;
};
