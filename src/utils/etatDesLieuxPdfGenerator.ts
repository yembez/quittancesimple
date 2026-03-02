import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * État des lieux calqué exactement sur le modèle type T4/T5 (jelouebien.com).
 * Structure et libellés identiques au PDF fourni.
 */
export interface EtatDesLieuxData {
  type: 'entree' | 'sortie';
  dateEtablissement: string;
  typeLocaux?: 'appartement' | 'maison' | 'autre';
  surfaceLogement?: string;
  nombrePieces?: string;
  adresseLogement: string;
  bailleur: {
    nom: string;
    prenom: string;
    adresse: string;
    email?: string;
    telephone?: string;
  };
  locataire: {
    nom: string;
    prenom: string;
    adresse: string;
    email?: string;
    telephone?: string;
    nouvelleAdresse?: string;
  };
  clesEtAcces?: string;
  cleType?: string;
  cleNombre?: string;
  /** Tableau de 5 lignes pour le tableau des clés (prioritaire sur cleType/cleNombre/clesEtAcces) */
  cles?: Array<{ type?: string; nombre?: string; commentaires?: string }>;
  compteurs?: {
    electricite?: string;
    electriciteHP?: string;
    electriciteHC?: string;
    eauChaude?: string;
    eau?: string;
    gaz?: string;
    gazNumero?: string;
  };
  nomAncienOccupant?: string;
  chauffageType?: string;
  eauChaudeType?: string;
  chauffageElectrique?: boolean;
  chauffageGaz?: boolean;
  chauffageAutre?: boolean;
  chauffageCollectif?: boolean;
  eauChaudeElectrique?: boolean;
  eauChaudeGaz?: boolean;
  eauChaudeAutre?: boolean;
  eauChaudeCollectif?: boolean;
  chauffageEtat?: string;
  chauffageDernierEntretien?: string;
  radiateursEau?: string;
  radiateursElectriques?: string;
  ballonEtat?: string;
  chaudiereEtat?: string;
  chaudierePresent?: boolean;
  radiateursEauPresent?: boolean;
  radiateursElectriquesPresent?: boolean;
  ballonPresent?: boolean;
  dateEtatDesLieuxEntree?: string;
  evolutionsSortie?: string;
  pieces?: Array<{
    nom: string;
    nomAutre?: string;
    observations?: string;
    etatEntree?: EtatPiece;
    etatSortie?: EtatPiece;
    lignes?: Array<{ entree?: EtatPiece; sortie?: EtatPiece; commentaires?: string }>;
  }>;
  partiesPrivatives?: Array<{ numero?: string; entree?: EtatPiece; sortie?: EtatPiece; commentaires?: string; nom?: string }>;
  equipements?: Array<{ entree?: EtatPiece; sortie?: EtatPiece; commentaires?: string; nom?: string }>;
  autresEquipementsCommentaires?: string;
  dateSortie?: string;
  dateSignatureEntreeBailleur?: string;
  dateSignatureSortieBailleur?: string;
  dateSignatureEntreeLocataire?: string;
  dateSignatureSortieLocataire?: string;
  dateSignatureAnnexe?: string;
  annexTravauxRows?: Array<{ element: string; commentaire: string }>;
  annexCommentaires?: string;
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 40;
const MARGIN_TOP = 45;
/** Zone réservée en bas de chaque page A4 pour la paraphe */
const FOOTER_HEIGHT = 38;
/* Typo lisible, moderne (Helvetica = sans-serif standard PDF) */
const FONT_SIZE = 10;
const FONT_SIZE_SMALL = 9;
const FONT_SIZE_TITLE = 13;
const LINE_HEIGHT = 12;
const HALF = (PAGE_WIDTH - MARGIN * 2) / 2;
const GAP = 14;

/** Limites de saisie alignées formulaire / PDF (éviter chevauchements) */
const MAX_CHARS_ADRESSE_COURTE = 38;
const MAX_LINES_ADRESSE_BLOC = 3;
const MAX_CHARS_ADRESSE_LOGEMENT = 90;
const MAX_LINES_ADRESSE_LOGEMENT = 4;
export const EDL_MAX_LENGTH_ADRESSE = MAX_CHARS_ADRESSE_COURTE * MAX_LINES_ADRESSE_BLOC;
export const EDL_MAX_LENGTH_ADRESSE_LOGEMENT = MAX_CHARS_ADRESSE_LOGEMENT * MAX_LINES_ADRESSE_LOGEMENT;

export type EtatPiece = 'tres_bon' | 'bon' | 'moyen' | 'mauvais';
const ETAT_LABELS: Record<EtatPiece, string> = { tres_bon: 'Très bon', bon: 'Bon', moyen: 'Moyen', mauvais: 'Mauvais' };

/** Ordre et libellés des pièces du modèle T4/T5 */
export const MODELE_PIECES = [
  { nom: 'Entrée', autreLabel: false },
  { nom: 'Salon / Pièce à vivre', autreLabel: false },
  { nom: 'Chambre 1', autreLabel: false },
  { nom: 'Chambre 2', autreLabel: false },
  { nom: 'Chambre 3 (ou autre pièce)', autreLabel: true },
  { nom: 'Chambre 4 (ou autre pièce)', autreLabel: true },
  { nom: 'WC 1', autreLabel: false },
  { nom: 'WC 2', autreLabel: false },
  { nom: 'Cuisine', autreLabel: false },
  { nom: 'Salle de bain', autreLabel: false },
] as const;

/** Éléments pour pièces standard (Salon, Chambres, Entrée) */
export const ELEMENTS_STANDARD = [
  'Portes, menuiseries',
  'Fenêtres, volets',
  'Plafond',
  'Sol, plinthes',
  'Murs, placards',
  'Prises, interrupteurs, éclairages',
  'Chauffage, tuyauterie',
];

/** Éléments pour WC */
export const ELEMENTS_WC = [
  'Portes, menuiseries',
  'Fenêtres, volets',
  'Plafond',
  'Sol, plinthes, murs',
  'Sanitaires',
  'Prises, interrupteurs, éclairages',
  'Chauffage, tuyauterie',
];

/** Éléments pour Cuisine (modèle T4/T5) */
export const ELEMENTS_CUISINE = [
  'Portes, menuiseries',
  'Fenêtres, volets',
  'Plafond, murs',
  'Sol, plinthes',
  'Rangements, plan de travail',
  'Prises, interrupteurs, éclairages',
  'Chauffage, tuyauterie',
  'Éviers, robinetterie',
  'Plaque de cuisson',
  'Hotte aspirante',
  'Four',
  'Réfrigérateur',
];

/** Éléments pour Salle de bain (modèle T4/T5) */
export const ELEMENTS_SALLE_BAIN = [
  'Portes, menuiseries',
  'Fenêtres, volets',
  'Plafond',
  'Sol, plinthes',
  'Murs, rangements',
  'Prises, interrupteurs, éclairages',
  'Baignoire, douche',
  'Éviers, robinetterie',
  'Chauffage, tuyauterie',
];

export const PIECES_TYPE = MODELE_PIECES.map((p) => p.nom);
export const ELEMENTS_ROWS = ELEMENTS_STANDARD;

export const PARTIES_PRIVATIVES_LABELS = ['Cave', 'Parking / Box / Garage', 'Jardin', 'Balcon / Terrasse'];
export const EQUIPEMENTS_LABELS = ['Sonnette / Interphone', 'Boîte aux lettres', 'Portail', 'Chenaux / Gouttières', 'Détecteur de fumée'];

type PDFPage = Awaited<ReturnType<PDFDocument['addPage']>>;

const CHECKBOX_SIZE = 8;
/** En pdf-lib le y de drawText est la baseline, le texte s'étend au-dessus (y croissant). On aligne la case sur la baseline. */
function drawCheckbox(page: PDFPage, x: number, baselineY: number, checked: boolean) {
  const boxBottom = baselineY;
  page.drawRectangle({
    x,
    y: boxBottom,
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 0.8,
  });
  if (checked) {
    const pad = 2;
    page.drawLine({
      start: { x: x + pad, y: boxBottom + pad },
      end: { x: x + CHECKBOX_SIZE - pad, y: boxBottom + CHECKBOX_SIZE - pad },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawLine({
      start: { x: x + pad, y: boxBottom + CHECKBOX_SIZE - pad },
      end: { x: x + CHECKBOX_SIZE - pad, y: boxBottom + pad },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });
  }
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, thickness = 0.5) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color: rgb(0.2, 0.2, 0.2),
  });
}

function drawParagraph(
  page: PDFPage,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number
): number {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const next = current ? current + ' ' + w : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  let yy = y;
  for (const line of lines) {
    page.drawText(line, { x, y: yy, size, font, color: rgb(0.1, 0.1, 0.1), maxWidth });
    yy -= size + 2;
  }
  return lines.length * (size + 2);
}

/** Dessine un paragraphe en limitant à maxLines lignes pour éviter les chevauchements. Retourne la hauteur utilisée. */
function drawParagraphMaxLines(
  page: PDFPage,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number,
  maxLines: number
): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const next = current ? current + ' ' + w : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  const toDraw = lines.slice(0, maxLines);
  const lineH = size + 2;
  let yy = y;
  for (const line of toDraw) {
    page.drawText(line, { x, y: yy, size, font, color: rgb(0.1, 0.1, 0.1), maxWidth });
    yy -= lineH;
  }
  return toDraw.length * lineH;
}

function getElementsForPiece(pieceNom: string): readonly string[] {
  if (pieceNom.startsWith('WC')) return ELEMENTS_WC;
  if (pieceNom === 'Cuisine') return ELEMENTS_CUISINE;
  if (pieceNom === 'Salle de bain') return ELEMENTS_SALLE_BAIN;
  return ELEMENTS_STANDARD;
}

export async function generateEtatDesLieuxPDF(data: EtatDesLieuxData): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const leftCol = MARGIN;
  const rightCol = MARGIN + HALF + GAP;
  const colWidth = HALF - GAP / 2;

  let y = PAGE_HEIGHT - MARGIN_TOP;
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const nextPage = () => {
    drawPageFooter(page);
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN_TOP;
  };

  const needSpace = (n: number) => {
    if (y - n < MARGIN + FOOTER_HEIGHT) nextPage();
  };

  const drawPageFooter = (p: PDFPage) => {
    const footerZoneTop = MARGIN + FOOTER_HEIGHT;
    const footerY = MARGIN + FOOTER_HEIGHT - 20;
    // Ligne de séparation en bas de page pour bien distinguer chaque page A4
    p.drawLine({
      start: { x: MARGIN, y: footerZoneTop },
      end: { x: PAGE_WIDTH - MARGIN, y: footerZoneTop },
      thickness: 0.8,
      color: rgb(0.25, 0.25, 0.25),
    });
    p.drawText('Paraphes :', {
      x: PAGE_WIDTH - MARGIN - 120,
      y: footerY,
      size: FONT_SIZE_SMALL,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    p.drawLine({
      start: { x: PAGE_WIDTH - MARGIN - 70, y: footerY - 4 },
      end: { x: PAGE_WIDTH - MARGIN, y: footerY - 4 },
      thickness: 0.5,
      color: rgb(0.2, 0.2, 0.2),
    });
  };

  const txt = (s: string, size = FONT_SIZE, bold = false, x = leftCol, maxW = contentWidth) => {
    needSpace(size + 2);
    page.drawText(s, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: maxW,
    });
    y -= size + 2;
  };

  const blank = (v: string | undefined, def = '_______________') => (v && v.trim()) || def;
  /** Affiche une date au format JJ/MM/AAAA (accepte JJ/MM/AAAA ou AAAA-MM-JJ) */
  const formatDateSig = (d: string | undefined): string => {
    if (!d || !d.trim()) return '___________';
    const s = d.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, day] = s.split('-');
      return `${day}/${m}/${y}`;
    }
    return s;
  };
  const pieces = data.pieces && data.pieces.length > 0
    ? data.pieces
    : MODELE_PIECES.map((p) => ({ nom: p.nom, observations: '', nomAutre: '' }));

  // ========== PAGE 1 (modèle T4/T5) ==========
  txt('État des lieux', 14, true);
  const dateEntreeStr = data.dateEtatDesLieuxEntree || data.dateEtablissement || '___ / ___ / ______';
  const dateSortieStr = data.dateSortie || data.dateEtablissement || '___ / ___ / ______';
  txt(`Entrée, réalisé le ${dateEntreeStr}   Sortie, réalisé le ${dateSortieStr}`, FONT_SIZE_SMALL);
  y -= 6;

  const legal =
    "L'état des lieux doit être établi de façon contradictoire entre les deux parties lors de la remise des clés au locataire et lors de leur restitution en fin de bail. L'état des lieux prévu à l'article 3-2 de la loi du 6 juillet 1989 doit porter sur l'ensemble des locaux et équipements d'usage privatif mentionnés au contrat de bail et dont le locataire a la jouissance exclusive.";
  needSpace(80);
  y -= drawParagraph(page, font, legal, leftCol, y, FONT_SIZE_SMALL, contentWidth) + 8;

  txt('Les locaux', FONT_SIZE, true);
  const typeStr = data.typeLocaux === 'maison' ? 'Maison' : data.typeLocaux === 'autre' ? 'Autre' : 'Appartement';
  txt(`Type : ${typeStr}   Surface : ${blank(data.surfaceLogement, '______')} m²   Nombre de pièces principales : ${blank(data.nombrePieces, '____')}`, FONT_SIZE_SMALL);
  y -= 4;
  txt('Adresse précise :', FONT_SIZE_SMALL);
  const addrLogement = (data.adresseLogement || '').trim().slice(0, MAX_CHARS_ADRESSE_LOGEMENT * MAX_LINES_ADRESSE_LOGEMENT);
  const lineHAddr = FONT_SIZE_SMALL + 2;
  needSpace(MAX_LINES_ADRESSE_LOGEMENT * lineHAddr);
  y -= drawParagraphMaxLines(page, font, addrLogement || '_________________________________________________________', leftCol, y, FONT_SIZE_SMALL, contentWidth, MAX_LINES_ADRESSE_LOGEMENT) + 10;

  const rowH = 18;
  needSpace(rowH);
  page.drawText('Le bailleur (ou son mandataire)', { x: leftCol, y: y - 2, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  page.drawText('Le(s) locataire(s)', { x: rightCol, y: y - 2, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  y -= rowH + 2;
  needSpace(rowH);
  page.drawText('Nom et prénom / dénomination :', { x: leftCol, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  page.drawText('Nom et prénom :', { x: rightCol, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  y -= rowH;
  const bailleurNom = `${(data.bailleur.prenom + ' ' + data.bailleur.nom).trim()}`.slice(0, 32) || '_________________________';
  const locataireNom = `${(data.locataire.prenom + ' ' + data.locataire.nom).trim()}`.slice(0, 32) || '_________________________';
  needSpace(rowH);
  page.drawText(bailleurNom, { x: leftCol, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  page.drawText(locataireNom, { x: rightCol, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  y -= rowH + 2;
  needSpace(rowH);
  page.drawText('Adresse (ou siège social) :', { x: leftCol, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  page.drawText('Adresse :', { x: rightCol, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  y -= rowH;
  const addrB = (data.bailleur.adresse || '').trim().slice(0, MAX_CHARS_ADRESSE_COURTE * MAX_LINES_ADRESSE_BLOC);
  const addrL = (data.locataire.adresse || '').trim().slice(0, MAX_CHARS_ADRESSE_COURTE * MAX_LINES_ADRESSE_BLOC);
  const maxHAddr = MAX_LINES_ADRESSE_BLOC * lineHAddr;
  needSpace(maxHAddr);
  const usedB = drawParagraphMaxLines(page, font, addrB || '_________________________', leftCol, y, FONT_SIZE_SMALL, colWidth, MAX_LINES_ADRESSE_BLOC);
  const usedL = drawParagraphMaxLines(page, font, addrL || '_________________________', rightCol, y, FONT_SIZE_SMALL, colWidth, MAX_LINES_ADRESSE_BLOC);
  y -= Math.max(usedB, usedL) + 8;

  txt('Relevé des compteurs', FONT_SIZE, true);
  y -= 2;
  txt('Électricité', FONT_SIZE_SMALL, true);
  txt(`N° compteur : ${blank(data.compteurs?.electricite)}`, FONT_SIZE_SMALL);
  txt(`HP (heures pleines) : ${blank(data.compteurs?.electriciteHP, '_________')}   HC (heures creuses) : ${blank(data.compteurs?.electriciteHC, '_________')}`, FONT_SIZE_SMALL);
  y -= 2;
  txt('Gaz naturel', FONT_SIZE_SMALL, true);
  txt(`N° compteur : ${blank(data.compteurs?.gazNumero, '_____________')}   Relevé : ${blank(data.compteurs?.gaz, '______________________')}`, FONT_SIZE_SMALL);
  y -= 2;
  txt('Eau', FONT_SIZE_SMALL, true);
  txt(`Eau chaude : ${blank(data.compteurs?.eauChaude, '___________')} m³   Eau froide : ${blank(data.compteurs?.eau, '___________')} m³`, FONT_SIZE_SMALL);
  y -= 2;
  txt(`Nom ancien occupant : ${blank(data.nomAncienOccupant, '________________________________________________')}`, FONT_SIZE_SMALL);
  y -= 4;
  txt('Équipements énergétiques', FONT_SIZE, true);
  const cbX = leftCol;
  let xRun = cbX;
  needSpace(FONT_SIZE_SMALL + 4);
  page.drawText('Chauffage :', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('Chauffage :', FONT_SIZE_SMALL) + 6;
  drawCheckbox(page, xRun, y - 2, !!data.chauffageElectrique);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('électrique', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('électrique', FONT_SIZE_SMALL) + 10;
  drawCheckbox(page, xRun, y - 2, !!data.chauffageGaz);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('gaz', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('gaz', FONT_SIZE_SMALL) + 10;
  drawCheckbox(page, xRun, y - 2, !!data.chauffageAutre);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('autre', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('autre', FONT_SIZE_SMALL) + 6;
  page.drawText((data.chauffageType || '').trim().slice(0, 18) || '_________________', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('_________________', FONT_SIZE_SMALL) + 10;
  drawCheckbox(page, xRun, y - 2, !!data.chauffageCollectif);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('collectif', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  y -= FONT_SIZE_SMALL + 6;
  needSpace(FONT_SIZE_SMALL + 4);
  xRun = cbX;
  page.drawText('Eau chaude :', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('Eau chaude :', FONT_SIZE_SMALL) + 6;
  drawCheckbox(page, xRun, y - 2, !!data.eauChaudeElectrique);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('électrique', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('électrique', FONT_SIZE_SMALL) + 10;
  drawCheckbox(page, xRun, y - 2, !!data.eauChaudeGaz);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('gaz', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('gaz', FONT_SIZE_SMALL) + 10;
  drawCheckbox(page, xRun, y - 2, !!data.eauChaudeAutre);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('autre', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('autre', FONT_SIZE_SMALL) + 6;
  page.drawText((data.eauChaudeType || '').trim().slice(0, 18) || '_________________', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('_________________', FONT_SIZE_SMALL) + 10;
  drawCheckbox(page, xRun, y - 2, !!data.eauChaudeCollectif);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('collectif', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  y -= FONT_SIZE_SMALL + 8;

  txt('Équipements de chauffage', FONT_SIZE, true);
  needSpace(FONT_SIZE_SMALL + 4);
  xRun = cbX;
  drawCheckbox(page, xRun, y - 2, !!data.chaudierePresent);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('Chaudière / état :', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('Chaudière / état :', FONT_SIZE_SMALL) + 6;
  page.drawText((data.chaudiereEtat || '').trim().slice(0, 20) || '____________________', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('____________________', FONT_SIZE_SMALL) + 12;
  page.drawText('dernier entretien :', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('dernier entretien :', FONT_SIZE_SMALL) + 6;
  page.drawText((data.chauffageDernierEntretien || '').trim().slice(0, 22) || '______________________', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  y -= FONT_SIZE_SMALL + 6;
  needSpace(FONT_SIZE_SMALL + 4);
  xRun = cbX;
  drawCheckbox(page, xRun, y - 2, !!data.radiateursEauPresent);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('Nombre de radiateurs à eau :', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('Nombre de radiateurs à eau :', FONT_SIZE_SMALL) + 6;
  page.drawText((data.radiateursEau || '').trim().slice(0, 6) || '____', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('____', FONT_SIZE_SMALL) + 14;
  drawCheckbox(page, xRun, y - 2, !!data.radiateursElectriquesPresent);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText('Nombre de radiateurs électriques :', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize('Nombre de radiateurs électriques :', FONT_SIZE_SMALL) + 6;
  page.drawText((data.radiateursElectriques || '').trim().slice(0, 6) || '____', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  y -= FONT_SIZE_SMALL + 6;
  needSpace(FONT_SIZE_SMALL + 4);
  xRun = cbX;
  drawCheckbox(page, xRun, y - 2, !!data.ballonPresent);
  xRun += CHECKBOX_SIZE + 4;
  page.drawText("Ballon d'eau chaude / état :", { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  xRun += font.widthOfTextAtSize("Ballon d'eau chaude / état :", FONT_SIZE_SMALL) + 6;
  page.drawText((data.ballonEtat || '').trim().slice(0, 35) || '_______________________________________', { x: xRun, y: y - 2, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1) });
  y -= FONT_SIZE_SMALL + 10;

  txt('Clés', FONT_SIZE, true);
  y -= 0;
  const keyTableTop = y + 8;
  const wKey1 = 100;
  const wKey2 = 50;
  const wKey3 = contentWidth - wKey1 - wKey2 - 10;
  const keyRowH = 14;
  const KEY_ROWS_COUNT = 5;
  const keyRows: Array<{ type: string; nombre: string; commentaires: string }> = (data.cles && data.cles.length > 0)
    ? Array.from({ length: KEY_ROWS_COUNT }, (_, i) => {
        const c = data.cles![i];
        return {
          type: (c?.type || '').trim().slice(0, 25),
          nombre: (c?.nombre || '').trim().slice(0, 10),
          commentaires: (c?.commentaires || '').trim().slice(0, 55),
        };
      })
    : [
        { type: (data.cleType || '').trim().slice(0, 25), nombre: (data.cleNombre || '').trim().slice(0, 10), commentaires: (data.clesEtAcces || '').trim().slice(0, 55) },
        ...Array.from({ length: KEY_ROWS_COUNT - 1 }, () => ({ type: '', nombre: '', commentaires: '' })),
      ];
  const tableKeyTop = keyTableTop;
  y = tableKeyTop;
  drawLine(page, leftCol, tableKeyTop, PAGE_WIDTH - MARGIN, tableKeyTop);
  y -= 6;
  const keyHeaderY = y - 10;
  page.drawText('Type de clé', { x: leftCol + 8, y: keyHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: wKey1 - 12 });
  page.drawText('Nombre', { x: leftCol + wKey1 + 8, y: keyHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: wKey2 - 12 });
  page.drawText('Commentaires', { x: leftCol + wKey1 + wKey2 + 8, y: keyHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: wKey3 - 12 });
  y -= keyRowH;
  drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
  y -= keyRowH;
  for (let ki = 0; ki < keyRows.length; ki++) {
    drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
    const kr = keyRows[ki];
    const rowY = y + 4;
    page.drawText(kr.type || '', { x: leftCol + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: wKey1 - 12 });
    page.drawText(kr.nombre || '', { x: leftCol + wKey1 + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: wKey2 - 12 });
    page.drawText(kr.commentaires || '', { x: leftCol + wKey1 + wKey2 + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: wKey3 - 12 });
    y -= keyRowH;
  }
  const tableKeyBottom = y;
  drawLine(page, leftCol, tableKeyTop, leftCol, tableKeyBottom);
  drawLine(page, leftCol + wKey1, tableKeyTop, leftCol + wKey1, tableKeyBottom);
  drawLine(page, leftCol + wKey1 + wKey2, tableKeyTop, leftCol + wKey1 + wKey2, tableKeyBottom);
  drawLine(page, PAGE_WIDTH - MARGIN, tableKeyTop, PAGE_WIDTH - MARGIN, tableKeyBottom);
  drawLine(page, leftCol, tableKeyBottom, PAGE_WIDTH - MARGIN, tableKeyBottom);
  y -= 12;

  // ========== PAGE 2 – Parties privatives, Autres équipements, Equipements (modèle) ==========
  nextPage();
  txt('Parties privatives attachées au logement', FONT_SIZE, true);
  y -= 0;
  const rowHTable = 20;
  const w1 = 120;
  const wNum = 28;
  const w2 = 44;
  const w3 = 44;
  const w4 = contentWidth - w1 - wNum - w2 - w3 - 8;
  const privTableTop = y;
  drawLine(page, leftCol, privTableTop, PAGE_WIDTH - MARGIN, privTableTop);
  y -= 8;
  const headerY = y - 14;
  page.drawText('Parties privatives', { x: leftCol + 8, y: headerY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: w1 - 12 });
  page.drawText('N°', { x: leftCol + w1 + 8, y: headerY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: wNum - 12 });
  page.drawText('Entrée', { x: leftCol + w1 + wNum + 8, y: headerY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: w2 - 12 });
  page.drawText('Sortie', { x: leftCol + w1 + wNum + w2 + 8, y: headerY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: w3 - 12 });
  page.drawText('Commentaires', { x: leftCol + w1 + wNum + w2 + w3 + 8, y: headerY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: w4 - 12 });
  y -= rowHTable;
  drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
  const privLabels = PARTIES_PRIVATIVES_LABELS;
  const privData = data.partiesPrivatives || [];
  const rowTextYOffset = 12;
  const privRowCount = privLabels.length + 1;
  for (let i = 0; i < privRowCount; i++) {
    needSpace(rowHTable);
    y -= rowHTable;
    const rowY = y + rowTextYOffset;
    drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
    const p = privData[i];
    const labelPriv = i < privLabels.length ? privLabels[i] : (p?.nom || '').trim().slice(0, 35);
    const num = (p?.numero || '').slice(0, 8);
    const eEnt = p?.entree ? ETAT_LABELS[p.entree] : '';
    const eSort = p?.sortie ? ETAT_LABELS[p.sortie] : '';
    const comm = (p?.commentaires || '').slice(0, 30);
    page.drawText(labelPriv, { x: leftCol + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: w1 - 12 });
    page.drawText(num, { x: leftCol + w1 + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: wNum - 8 });
    page.drawText(eEnt, { x: leftCol + w1 + wNum + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: w2 - 8 });
    page.drawText(eSort, { x: leftCol + w1 + wNum + w2 + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: w3 - 8 });
    page.drawText(comm, { x: leftCol + w1 + wNum + w2 + w3 + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: w4 - 12 });
  }
  const privBottom = y;
  drawLine(page, leftCol, privTableTop, leftCol, privBottom);
  drawLine(page, leftCol + w1, privTableTop, leftCol + w1, privBottom);
  drawLine(page, leftCol + w1 + wNum, privTableTop, leftCol + w1 + wNum, privBottom);
  drawLine(page, leftCol + w1 + wNum + w2, privTableTop, leftCol + w1 + wNum + w2, privBottom);
  drawLine(page, leftCol + w1 + wNum + w2 + w3, privTableTop, leftCol + w1 + wNum + w2 + w3, privBottom);
  drawLine(page, PAGE_WIDTH - MARGIN, privTableTop, PAGE_WIDTH - MARGIN, privBottom);
  drawLine(page, leftCol, privBottom, PAGE_WIDTH - MARGIN, privBottom);
  y -= 20;

  txt('Autres équipements et aménagements', FONT_SIZE, true);
  y -= 0;
  const eqTableTop = y;
  drawLine(page, leftCol, eqTableTop, PAGE_WIDTH - MARGIN, eqTableTop);
  y -= 6;
  const eqW1 = 120;
  const eqW2 = 50;
  const eqW3 = 50;
  const eqW4 = contentWidth - eqW1 - eqW2 - eqW3 - 8;
  const eqHeaderY = y - 13;
  page.drawText('Equipements', { x: leftCol + 8, y: eqHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: eqW1 - 12 });
  page.drawText('Entrée', { x: leftCol + eqW1 + 8, y: eqHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: eqW2 - 12 });
  page.drawText('Sortie', { x: leftCol + eqW1 + eqW2 + 8, y: eqHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: eqW3 - 12 });
  page.drawText('Commentaires', { x: leftCol + eqW1 + eqW2 + eqW3 + 8, y: eqHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: eqW4 - 12 });
  y -= rowHTable;
  drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
  const eqLabels = EQUIPEMENTS_LABELS;
  const eqData = data.equipements || [];
  const eqRowCount = eqLabels.length + 1;
  for (let i = 0; i < eqRowCount; i++) {
    needSpace(rowHTable);
    y -= rowHTable;
    const rowY = y + rowTextYOffset;
    drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
    const e = eqData[i];
    const labelEq = i < eqLabels.length ? eqLabels[i] : (e?.nom || '').trim().slice(0, 40);
    const eEnt = e?.entree ? ETAT_LABELS[e.entree] : '';
    const eSort = e?.sortie ? ETAT_LABELS[e.sortie] : '';
    const comm = (e?.commentaires || '').slice(0, 40);
    page.drawText(labelEq, { x: leftCol + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: eqW1 - 12 });
    page.drawText(eEnt, { x: leftCol + eqW1 + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: eqW2 - 8 });
    page.drawText(eSort, { x: leftCol + eqW1 + eqW2 + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: eqW3 - 8 });
    page.drawText(comm, { x: leftCol + eqW1 + eqW2 + eqW3 + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: eqW4 - 12 });
  }
  const eqBottom = y;
  drawLine(page, leftCol, eqTableTop, leftCol, eqBottom);
  drawLine(page, leftCol + eqW1, eqTableTop, leftCol + eqW1, eqBottom);
  drawLine(page, leftCol + eqW1 + eqW2, eqTableTop, leftCol + eqW1 + eqW2, eqBottom);
  drawLine(page, leftCol + eqW1 + eqW2 + eqW3, eqTableTop, leftCol + eqW1 + eqW2 + eqW3, eqBottom);
  drawLine(page, PAGE_WIDTH - MARGIN, eqTableTop, PAGE_WIDTH - MARGIN, eqBottom);
  drawLine(page, leftCol, eqBottom, PAGE_WIDTH - MARGIN, eqBottom);
  y -= 16;

  // ========== Pages pièces – Même structure que le formulaire : Éléments, Entrée, Sortie, Commentaires (données par ligne) ==========
  const colElem = 175;
  const colEntree = 48;
  const colSortie = 48;
  const colComm = contentWidth - colElem - colEntree - colSortie - 8;
  const elemRowH = 14;

  for (let i = 0; i < MODELE_PIECES.length; i++) {
    const modele = MODELE_PIECES[i];
    const p = pieces[i] || { nom: modele.nom, observations: '', etatEntree: undefined, etatSortie: undefined, nomAutre: '', lignes: [] };
    const pieceNom = p.nom || modele.nom;
    const elements = getElementsForPiece(pieceNom);
    const lignes = p.lignes || [];

    const pieceTableHeight = 50 + 10 + 6 + 24 + elements.length * elemRowH + 18;
    needSpace(pieceTableHeight);
    let titre = pieceNom;
    if (modele.autreLabel && (p as { nomAutre?: string }).nomAutre) titre = `${pieceNom} ${(p as { nomAutre?: string }).nomAutre}`;
    txt(titre, FONT_SIZE, true);
    y -= 0;

    const tableTop = y;
    drawLine(page, leftCol, tableTop, PAGE_WIDTH - MARGIN, tableTop);
    y -= 6;
    const pieceHeaderY = y - 9;
    page.drawText('Éléments', { x: leftCol + 8, y: pieceHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: colElem - 12 });
    page.drawText('Entrée', { x: leftCol + colElem + 8, y: pieceHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: colEntree - 12 });
    page.drawText('Sortie', { x: leftCol + colElem + colEntree + 8, y: pieceHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: colSortie - 12 });
    page.drawText('Commentaires', { x: leftCol + colElem + colEntree + colSortie + 8, y: pieceHeaderY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: colComm - 12 });
    y -= 12;
    drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
    y -= elemRowH;

    for (let elemIdx = 0; elemIdx < elements.length; elemIdx++) {
      const elem = elements[elemIdx];
      const ligne = lignes[elemIdx] || {};
      const eEnt = ligne.entree ? ETAT_LABELS[ligne.entree] : (elemIdx === 0 && p.etatEntree ? ETAT_LABELS[p.etatEntree] : '');
      const eSort = ligne.sortie ? ETAT_LABELS[ligne.sortie] : (elemIdx === 0 && p.etatSortie ? ETAT_LABELS[p.etatSortie] : '');
      const obs = (ligne.commentaires || '').slice(0, 35);
      y -= elemRowH;
      drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
      const rowY = y + 6;
      page.drawText(elem, { x: leftCol + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colElem - 12 });
      page.drawText(eEnt, { x: leftCol + colElem + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colEntree - 8 });
      page.drawText(eSort, { x: leftCol + colElem + colEntree + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colSortie - 8 });
      page.drawText(obs, { x: leftCol + colElem + colEntree + colSortie + 8, y: rowY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colComm - 12 });
    }

    const tableBottom = y;
    drawLine(page, leftCol, tableTop, leftCol, tableBottom);
    drawLine(page, leftCol + colElem, tableTop, leftCol + colElem, tableBottom);
    drawLine(page, leftCol + colElem + colEntree, tableTop, leftCol + colElem + colEntree, tableBottom);
    drawLine(page, leftCol + colElem + colEntree + colSortie, tableTop, leftCol + colElem + colEntree + colSortie, tableBottom);
    drawLine(page, PAGE_WIDTH - MARGIN, tableTop, PAGE_WIDTH - MARGIN, tableBottom);
    y -= 18;
  }

  // ========== Signatures (modèle page 5) ==========
  nextPage();
  txt('Signatures', FONT_SIZE_TITLE, true);
  const sigText1 =
    "Le locataire peut demander au bailleur ou à son représentant de compléter l'état des lieux d'entrée :\n- dans les 10 jours suivant sa date de réalisation pour tout élément concernant le logement,\n- le premier mois de la période de chauffe concernant l'état des éléments de chauffage.";
  needSpace(70);
  y -= drawParagraph(page, font, sigText1.replace(/\n/g, ' '), leftCol, y, FONT_SIZE_SMALL, contentWidth) + 6;
  const sigText2 =
    "Entretien courant et menues réparations – Le locataire doit veiller à maintenir en l'état le logement qu'il occupe. À ce titre, il doit assurer l'entretien normal du logement et de ses éléments d'équipement, ainsi que les menues réparations nécessaires à moins qu'il ne prouve qu'elles sont dues à la vétusté, à une malfaçon ou à la force majeure. À défaut, le bailleur peut retenir sur le dépôt de garantie les sommes correspondant aux réparations locatives qui n'ont pas été effectuées par le locataire, justificatifs à l'appui.";
  needSpace(80);
  y -= drawParagraph(page, font, sigText2, leftCol, y, FONT_SIZE_SMALL, contentWidth) + 12;

  txt('Le bailleur (ou son mandataire)', FONT_SIZE, true, leftCol, colWidth);
  txt('Le(s) locataire(s)', FONT_SIZE, true, rightCol, colWidth);
  y -= 6;
  txt('Signature précédée de « certifié exact »', FONT_SIZE_SMALL, false, leftCol, colWidth);
  txt("Signature précédée de votre nom, prénom et « certifié exact »", FONT_SIZE_SMALL, false, rightCol, colWidth);
  y -= 8;
  needSpace(42);
  y -= 42;
  needSpace(FONT_SIZE_SMALL + 2);
  const dEntB = formatDateSig(data.dateSignatureEntreeBailleur);
  const dSortB = formatDateSig(data.dateSignatureSortieBailleur);
  const dEntL = formatDateSig(data.dateSignatureEntreeLocataire);
  const dSortL = formatDateSig(data.dateSignatureSortieLocataire);
  const lineSigY = y - 2;
  page.drawText(`Entrée, le ${dEntB}   Sortie, le ${dSortB}`, { x: leftCol, y: lineSigY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  page.drawText(`Entrée, le ${dEntL}   Sortie, le ${dSortL}`, { x: rightCol, y: lineSigY, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: colWidth });
  y -= FONT_SIZE_SMALL + 12;

  // ========== Annexe sortie – toujours incluse (à remplir par le bailleur en temps voulu) ==========
  nextPage();
  txt('État des lieux de sortie (annexe)', FONT_SIZE_TITLE, true);
    const annexeIntro =
      "L'état des lieux de sortie est réalisé sur la base des éléments recueillis lors de l'état des lieux d'entrée réalisé le " +
      (data.dateEtatDesLieuxEntree || '___ / ___ / ______') +
      " (annexé au présent document). Seuls les éléments pour lequel l'état de sortie est non conforme à l'état d'entrée sont reportés dans le présent document.";
    needSpace(50);
    y -= drawParagraph(page, font, annexeIntro, leftCol, y, FONT_SIZE_SMALL, contentWidth) + 6;
    txt('Date de sortie du locataire : ' + (data.dateSortie || data.dateEtablissement || '___ / ___ / ______'), FONT_SIZE_SMALL);
    y -= 8;

    const col1W = contentWidth * 0.4;
    const col2W = contentWidth * 0.6 - 8;
    const rowAnnexH = 18;
    const annexRows = data.annexTravauxRows && data.annexTravauxRows.length > 0 ? data.annexTravauxRows : Array.from({ length: 8 }, () => ({ element: '', commentaire: '' }));
    const tableAnnexTop = y;
    drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
    y -= 6;
    page.drawText('Éléments et pièces concernées', { x: leftCol + 8, y: y - 2, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: col1W - 12 });
    page.drawText('Commentaires / montant estimé / devis de remise en état', { x: leftCol + col1W + 8, y: y - 2, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0.1, 0.1, 0.1), maxWidth: col2W - 12 });
    y -= 12;
    drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
    for (let i = 0; i < annexRows.length; i++) {
      needSpace(rowAnnexH);
      y -= rowAnnexH;
      drawLine(page, leftCol, y, PAGE_WIDTH - MARGIN, y);
      const r = annexRows[i];
      page.drawText((r.element || '').slice(0, 50), { x: leftCol + 8, y: y + rowAnnexH - 10, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: col1W - 12 });
      page.drawText((r.commentaire || '').slice(0, 60), { x: leftCol + col1W + 8, y: y + rowAnnexH - 10, size: FONT_SIZE_SMALL, font, color: rgb(0.1, 0.1, 0.1), maxWidth: col2W - 12 });
    }
    drawLine(page, leftCol, tableAnnexTop, leftCol, y);
    drawLine(page, leftCol + col1W, tableAnnexTop, leftCol + col1W, y);
    drawLine(page, PAGE_WIDTH - MARGIN, tableAnnexTop, PAGE_WIDTH - MARGIN, y);
    y -= 10;

    txt("Relevé des compteurs (au jour de l'état des lieux de sortie)", FONT_SIZE, true);
    y -= 2;
    txt('Électricité', FONT_SIZE_SMALL, true);
    txt(`N° compteur : ${blank(data.compteurs?.electricite)}   HP (heures pleines) : ${blank(data.compteurs?.electriciteHP, '_________')}   HC (heures creuses) : ${blank(data.compteurs?.electriciteHC, '_________')}`, FONT_SIZE_SMALL);
    y -= 2;
    txt('Gaz naturel', FONT_SIZE_SMALL, true);
    txt(`N° compteur : ${blank(data.compteurs?.gazNumero, '_____________')}   Relevé : ${blank(data.compteurs?.gaz, '______________________')}`, FONT_SIZE_SMALL);
    y -= 2;
    txt('Eau', FONT_SIZE_SMALL, true);
    txt(`Eau chaude : ${blank(data.compteurs?.eauChaude, '___________')} m³   Eau froide : ${blank(data.compteurs?.eau, '___________')} m³`, FONT_SIZE_SMALL);
    y -= 6;
    txt('Commentaires :', FONT_SIZE_SMALL);
    const annexComm = (data.annexCommentaires || data.evolutionsSortie || '').trim();
    if (annexComm) {
      needSpace(25);
      y -= drawParagraph(page, font, annexComm, leftCol, y, FONT_SIZE_SMALL, contentWidth) + 4;
    } else {
      y -= 10;
    }
    txt('Nouvelle adresse du (des) locataire(s) (Obligatoire)', FONT_SIZE, true);
    txt((data.locataire.nouvelleAdresse || '').trim().slice(0, 90) || '_________________________________________________________', FONT_SIZE_SMALL);
    y -= 14;
    txt('Le ' + (data.dateSignatureAnnexe || '___ / ___ / ______'), FONT_SIZE_SMALL);
    y -= 6;
    txt('Le bailleur (ou son mandataire)', FONT_SIZE_SMALL, true);
    txt('Signature précédée de « certifié exact »', FONT_SIZE_SMALL);
    y -= 32;
  txt('Le(s) locataire(s)', FONT_SIZE_SMALL, true);
  txt('Signature précédée de « certifié exact »', FONT_SIZE_SMALL);
  /* Pas de paraphe sur la page annexe */

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
