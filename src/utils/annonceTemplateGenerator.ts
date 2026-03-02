export interface AnnonceData {
  // Bien
  type: string; // "Appartement", "Maison", "Studio", "Chambre en colocation"
  surface: number;
  pieces: number;
  chambres?: number;
  etage?: number;
  
  // Financier
  loyer: number;
  charges: number;
  
  // Localisation
  adresse?: string;
  quartier?: string;
  ville: string;
  
  // Proximités (générées automatiquement via API)
  proximites: string[]; // ["Parc à 40m", "Commerces à 110m"]
  
  // Caractéristiques
  meuble: boolean;
  pointsForts: string[]; // ["Terrasse", "Calme", "Lumineux", "Parking", "Ascenseur"]
  contraintes: string[]; // ["Garant demandé", "Non fumeur"]
  
  // Pratique
  disponibilite: string;
  caution?: number;
  residenceSecurisee?: boolean;
}

export interface AnnonceResult {
  titre: string;
  description: string;
  titresAlternatifs: string[];
}

// Priorité des points forts pour le titre
const PRIORITE_POINTS_FORTS = ['Terrasse', 'Balcon', 'Parking', 'Rénové', 'Calme', 'Lumineux', 'Jardin'];

function getPointFortPrincipal(pointsForts: string[]): string {
  for (const pf of PRIORITE_POINTS_FORTS) {
    if (pointsForts.includes(pf)) {
      return pf.toLowerCase();
    }
  }
  return '';
}

function getAdjectifIntro(pointsForts: string[]): string {
  if (pointsForts.includes('Rénové')) return 'Magnifique';
  if (pointsForts.includes('Calme') && pointsForts.includes('Lumineux')) return 'Charmant';
  if (pointsForts.includes('Terrasse')) return 'Bel';
  if (pointsForts.includes('Jardin')) return 'Agréable';
  return '';
}

function getTypeAppartement(pieces: number): string {
  if (pieces === 1) return 'studio';
  return `T${pieces}`;
}

/** Retire le nom de la ville en préfixe du quartier pour éviter la redondance (ex: "Paris 9e arrondissement" + ville "Paris" → "9e arrondissement"). */
function quartierSansVille(ville: string, quartier: string): string {
  const v = ville.trim();
  const q = quartier.trim();
  if (!v || !q) return quartier;
  if (q.toLowerCase().startsWith(v.toLowerCase())) {
    const rest = q.slice(v.length).replace(/^[\s,\-–—]+/, '').trim();
    return rest || quartier;
  }
  return quartier;
}

export function generateTemplateAnnonce(data: AnnonceData): AnnonceResult {
  const typeAppartement = getTypeAppartement(data.pieces);
  const totalCC = data.loyer + data.charges;
  const meubleText = data.meuble ? 'meublé' : 'vide';
  
  const quartierAffiche = data.quartier ? quartierSansVille(data.ville, data.quartier) : undefined;
  
  // Génération du titre principal
  const pointFortPrincipal = getPointFortPrincipal(data.pointsForts);
  const localisation = quartierAffiche ? `${quartierAffiche}, ${data.ville}` : data.ville;
  
  let titre = `${data.type} ${typeAppartement}`;
  if (data.meuble) titre += ` ${meubleText}`;
  titre += ` de ${data.surface}m²`;
  if (pointFortPrincipal) {
    const avec = pointFortPrincipal === 'terrasse' || pointFortPrincipal === 'balcon' || pointFortPrincipal === 'parking' || pointFortPrincipal === 'jardin' ? 'avec' : '';
    titre += ` ${avec} ${pointFortPrincipal}`;
  }
  titre += ` à ${localisation}`;
  
  // Génération de la description
  const adjectif = getAdjectifIntro(data.pointsForts);
  const typeBien = data.type.toLowerCase();
  
  // 1. Intro accrocheuse
  let description = '';
  if (adjectif) {
    description += `${adjectif} ${typeBien} ${typeAppartement} de ${data.surface}m²`;
    if (quartierAffiche) {
      description += `, situé dans le quartier ${quartierAffiche}`;
    } else {
      description += ` à ${data.ville}`;
    }
    if (data.pointsForts.includes('Calme') && data.pointsForts.includes('Lumineux')) {
      description += ', calme et lumineux';
    } else if (data.pointsForts.includes('Calme')) {
      description += ', calme';
    } else if (data.pointsForts.includes('Lumineux')) {
      description += ', lumineux';
    }
    description += '.\n\n';
  } else {
    description += `${data.type} ${typeAppartement} de ${data.surface}m²`;
    if (quartierAffiche) {
      description += `, situé dans le quartier ${quartierAffiche}`;
    } else {
      description += ` à ${data.ville}`;
    }
    description += '.\n\n';
  }
  
  // 2. Description du bien
  description += `Ce bien se compose de ${data.pieces} pièce${data.pieces > 1 ? 's' : ''} pour une surface de ${data.surface}m²`;
  
  if (data.etage !== undefined && data.etage !== null) {
    const etageText = data.etage === 1 ? '1er' : `${data.etage}ème`;
    description += `. Situé au ${etageText} étage`;
    if (data.pointsForts.includes('Ascenseur')) {
      description += ' avec ascenseur';
    }
  }
  
  if (data.residenceSecurisee) {
    description += '. Dans une résidence sécurisée calme et tranquille';
  }
  
  description += '.\n\n';
  
  // Équipements et ambiance
  const equipements: string[] = [];
  if (data.pointsForts.includes('Terrasse')) equipements.push('terrasse');
  if (data.pointsForts.includes('Balcon')) equipements.push('balcon');
  if (data.pointsForts.includes('Parking')) equipements.push('parking');
  if (data.pointsForts.includes('Cave')) equipements.push('cave');
  if (data.pointsForts.includes('Jardin')) equipements.push('jardin');
  
  if (equipements.length > 0) {
    if (equipements.includes('jardin')) {
      description += 'Vous disposez aussi d\'un agréable jardin';
    } else if (equipements.includes('terrasse')) {
      description += 'Vous disposez aussi d\'une agréable terrasse';
    } else if (equipements.includes('balcon')) {
      description += 'Vous disposez aussi d\'un agréable balcon';
    } else {
      description += `Il dispose d'${equipements.length === 1 ? 'un' : 'un'} ${equipements[0]}`;
      if (equipements.length > 1) {
        description += ` et d'${equipements.slice(1).join(', ')}`;
      }
    }
    description += '.\n\n';
  }
  
  // Ambiance
  if (data.pointsForts.includes('Calme') || data.pointsForts.includes('Lumineux')) {
    const ambiance: string[] = [];
    if (data.pointsForts.includes('Calme')) ambiance.push('calme');
    if (data.pointsForts.includes('Lumineux')) ambiance.push('lumineux');
    if (ambiance.length > 0) {
      description += `L'${typeBien} est ${ambiance.join(' et ')}.\n\n`;
    }
  }
  
  // 3. Proximités
  if (data.proximites && data.proximites.length > 0) {
    description += 'Proximités :\n';
    data.proximites.forEach(prox => {
      description += `- ${prox}\n`;
    });
    description += '\n';
  }
  
  // 4. Conditions
  description += 'Conditions :\n';
  description += `- Loyer hors charges : ${data.loyer}€\n`;
  description += `- Charges : ${data.charges}€\n`;
  description += `- Total charges comprises : ${totalCC}€\n`;
  if (data.caution) {
    description += `- Caution : ${data.caution} mois de loyer (${data.caution * data.loyer}€)\n`;
  }
  description += `- Disponibilité : ${data.disponibilite}\n`;
  description += '- Location directe propriétaire\n';
  
  // 5. Contraintes
  if (data.contraintes && data.contraintes.length > 0) {
    description += '\n';
    data.contraintes.forEach(contrainte => {
      description += `- ${contrainte}\n`;
    });
  }
  
  // Titres alternatifs
  const titresAlternatifs: string[] = [];
  
  // Format court
  const pointFortCourt = pointFortPrincipal || '';
  titresAlternatifs.push(`${typeAppartement.toUpperCase()} ${data.surface}m² ${pointFortCourt ? pointFortCourt + ' - ' : ''}${data.ville}`);
  
  // Format descriptif
  const adjectifTitre = adjectif || 'Bel';
  titresAlternatifs.push(`${adjectifTitre} ${data.type} ${typeAppartement} de ${data.surface}m² ${localisation}`);
  
  // Format proximité
  if (data.proximites && data.proximites.length > 0) {
    const premiereProximite = data.proximites[0].split(' à ')[0].toLowerCase();
    titresAlternatifs.push(`${data.type} ${typeAppartement} ${data.surface}m² proche ${premiereProximite} à ${data.ville}`);
  } else {
    titresAlternatifs.push(`${data.type} ${typeAppartement} ${data.surface}m² ${meubleText} à ${data.ville}`);
  }
  
  return {
    titre,
    description,
    titresAlternatifs,
  };
}
