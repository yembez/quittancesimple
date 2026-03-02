import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Génère un PDF de bail vierge avec champs éditables (AcroForm)
 * Conforme à la loi ALUR - Formulations réécrites pour Quittance Simple
 */
export async function generateBailVidePDF(): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  const lineHeight = 14;
  const fieldHeight = 15;
  
  let currentY = pageHeight - margin;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  const form = pdfDoc.getForm();
  let lastWasTitle = false; // Pour éviter qu'une page commence par une fin de paragraphe
  
  // Fonction pour ajouter une nouvelle page si nécessaire
  // S'assure qu'une nouvelle page commence toujours par un titre
  const checkNewPage = (requiredSpace: number, isTitle: boolean = false) => {
    if (currentY - requiredSpace < margin + 30) {
      // Si on n'est pas en train d'ajouter un titre, on doit s'assurer que la page suivante commence par un titre
      if (!isTitle && !lastWasTitle) {
        // On force une nouvelle page maintenant pour éviter qu'elle commence par une fin de paragraphe
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
        lastWasTitle = false;
      } else {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
        lastWasTitle = isTitle;
      }
    }
    if (isTitle) {
      lastWasTitle = true;
    }
  };
  
  // Fonction pour ajouter du texte
  const addText = (text: string, size: number, bold: boolean = false, x: number = margin, spacing: number = lineHeight, isTitle: boolean = false) => {
    checkNewPage(size + spacing, isTitle);
    page.drawText(text, {
      x,
      y: currentY,
      size,
      font: bold ? helveticaBold : helvetica,
      color: rgb(0, 0, 0),
    });
    currentY -= spacing;
    if (isTitle) {
      lastWasTitle = true;
    } else {
      lastWasTitle = false;
    }
  };
  
  // Fonction pour ajouter un champ texte (ne décrémente PAS currentY automatiquement pour permettre plusieurs champs sur une ligne)
  const addTextField = (name: string, width: number, height: number = fieldHeight, defaultValue: string = '', xOffset: number = 0, updateY: boolean = true) => {
    checkNewPage(height + 10, false);
    const field = form.createTextField(name);
    field.setText(defaultValue);
    const fieldY = currentY - 5;
    // Vérifier que le champ ne sort pas de la page
    const fieldX = margin + xOffset;
    const maxX = pageWidth - margin;
    if (fieldX + width > maxX) {
      // Ajuster la largeur pour qu'elle ne dépasse pas
      const adjustedWidth = maxX - fieldX;
      if (adjustedWidth > 0) {
        field.addToPage(page, {
          x: fieldX,
          y: fieldY,
          width: adjustedWidth,
          height,
          fontSize: 10,
          font: helvetica,
          textColor: rgb(0, 0, 0),
          borderColor: rgb(0.5, 0.5, 0.5),
          borderWidth: 0.5,
        });
      }
    } else {
      field.addToPage(page, {
        x: fieldX,
        y: fieldY,
        width,
        height,
        fontSize: 10,
        font: helvetica,
        textColor: rgb(0, 0, 0),
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 0.5,
      });
    }
    if (updateY) {
      currentY = fieldY - 8;
    }
    return field;
  };
  
  // Fonction pour ajouter une case à cocher (ne décrémente PAS currentY)
  const addCheckBox = (name: string, xOffset: number = 0, checked: boolean = false) => {
    checkNewPage(15, false);
    const checkbox = form.createCheckBox(name);
    if (checked) checkbox.check();
    const checkboxSize = 12;
    const checkboxY = currentY - checkboxSize / 2;
    checkbox.addToPage(page, {
      x: margin + xOffset,
      y: checkboxY,
      width: checkboxSize,
      height: checkboxSize,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 0.5,
    });
    return checkbox;
  };
  
  // Fonction pour ajouter du texte sur la même ligne
  const addTextOnLine = (text: string, x: number, size: number = 10) => {
    page.drawText(text, {
      x,
      y: currentY,
      size,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  };
  
  // Fonction pour sauter une ligne
  const skipLine = (spacing: number = lineHeight) => {
    currentY -= spacing;
  };
  
  // ========== EN-TÊTE ==========
  addText('CONTRAT DE LOCATION', 16, true, margin, 20, true);
  addText('(Soumis au titre Ier bis de la loi du 6 juillet 1989 et portant modification de la loi n° 86-1290', 9, false, margin, 12);
  addText('du 23 décembre 1986 – Bail type conforme aux dispositions de la loi ALUR de 2014,', 9, false, margin, 12);
  addText('mis en application par le décret du 29 mai 2015)', 9, false, margin, 15);
  addText('LOCAUX VIDES À USAGE D\'HABITATION', 12, true, margin, 20, true);
  
  addText('Modalités d\'application : Le régime de droit commun en matière de baux d\'habitation est défini', 9, false, margin, 12);
  addText('principalement par la loi n° 89-462 du 6 juillet 1989 tendant à améliorer les rapports locatifs et', 9, false, margin, 12);
  addText('portant modification de la loi n° 86-1290 du 23 décembre 1986. L\'ensemble de ces dispositions', 9, false, margin, 12);
  addText('étant d\'ordre public, elles s\'imposent aux parties qui, en principe, ne peuvent pas y renoncer.', 9, false, margin, 25);
  
  // ========== I. DÉSIGNATION DES PARTIES ==========
  addText('I. DÉSIGNATION DES PARTIES', 12, true, margin, 20, true);
  addText('Le présent contrat est conclu entre les soussignés :', 10, false, margin, 20);
  
  addText('Qualité du bailleur :', 10, false, margin, 15);
  const checkboxY1 = currentY;
  addCheckBox('bailleur_physique', 0);
  addTextOnLine('Personne physique', margin + 20);
  addCheckBox('bailleur_morale', 160);
  addTextOnLine('Personne morale', margin + 180);
  skipLine(20);
  
  addText('Nom et prénom du bailleur :', 10, false, margin, 15);
  addTextField('bailleur_nom', contentWidth);
  
  addText('Dénomination (si personne morale) :', 10, false, margin, 15);
  addTextField('bailleur_denomination', contentWidth);
  
  addText('Société civile constituée exclusivement entre parents et alliés jusqu\'au quatrième degré inclus :', 10, false, margin, 15);
  const checkboxY2 = currentY;
  addCheckBox('societe_familiale_oui', 0);
  addTextOnLine('Oui', margin + 20);
  addCheckBox('societe_familiale_non', 60);
  addTextOnLine('Non', margin + 80);
  skipLine(20);
  
  addText('Adresse :', 10, false, margin, 15);
  addTextField('bailleur_adresse', contentWidth);
  
  addText('Adresse email (facultatif) :', 10, false, margin, 15);
  addTextField('bailleur_email', contentWidth);
  
  skipLine(10);
  addText('désigné(s) ci-après « le bailleur » ;', 10, false, margin, 25);
  
  addText('Le cas échéant, représenté par un mandataire :', 10, false, margin, 15);
  const checkboxY3 = currentY;
  addCheckBox('mandataire_oui', 0);
  addTextOnLine('Oui', margin + 20);
  addCheckBox('mandataire_non', 60);
  addTextOnLine('Non', margin + 80);
  skipLine(20);
  
  addText('Nom et prénom du mandataire :', 10, false, margin, 15);
  addTextField('mandataire_nom', contentWidth);
  
  addText('Dénomination (si personne morale) :', 10, false, margin, 15);
  addTextField('mandataire_denomination', contentWidth);
  
  addText('Adresse :', 10, false, margin, 15);
  addTextField('mandataire_adresse', contentWidth);
  
  addText('Activité exercée :', 10, false, margin, 15);
  addTextField('mandataire_activite', contentWidth);
  
  addText('N° et lieu de délivrance de la carte professionnelle :', 10, false, margin, 15);
  addTextField('mandataire_carte', contentWidth);
  
  skipLine(20);
  addText('Le cas échéant, nom et adresse du garant :', 10, false, margin, 15);
  addTextField('garant_info', contentWidth);
  
  skipLine(20);
  addText('Nom et prénom du ou des locataires, adresse email (facultatif) :', 10, false, margin, 15);
  addTextField('locataire_nom_1', contentWidth, fieldHeight, '', 0, true);
  skipLine(5);
  addTextField('locataire_nom_2', contentWidth);
  
  skipLine(10);
  addText('désigné(s) ci-après « le locataire » ;', 10, false, margin, 30);
  
  // ========== II. OBJET DU CONTRAT ==========
  addText('II. OBJET DU CONTRAT', 12, true, margin, 20, true);
  addText('Le présent contrat a pour objet la location d\'un logement ainsi déterminé :', 10, false, margin, 20);
  
  addText('A. Consistance du logement', 11, true, margin, 15);
  
  addText('Adresse du logement [exemples : adresse / bâtiment / étage / porte etc.] :', 10, false, margin, 15);
  addTextField('logement_adresse', contentWidth);
  
  addText('Identifiant fiscal du logement :', 10, false, margin, 15);
  addTextField('logement_identifiant_fiscal', contentWidth);
  
  addText('Type d\'habitat, Immeuble :', 10, false, margin, 15);
  skipLine(15);
  const checkboxY4 = currentY;
  addCheckBox('immeuble_collectif', 0);
  addTextOnLine('Collectif', margin + 20);
  addCheckBox('immeuble_individuel', 80);
  addTextOnLine('Individuel', margin + 100);
  addCheckBox('mono_propriete', 180);
  addTextOnLine('Mono propriété', margin + 200);
  addCheckBox('copropriete', 300);
  addTextOnLine('Copropriété', margin + 320);
  skipLine(20);
  
  addText('Période de construction :', 10, false, margin, 15);
  const checkboxY5 = currentY;
  addCheckBox('construction_avant_1949', 0);
  addTextOnLine('Avant 1949', margin + 20);
  addCheckBox('construction_1949_1974', 120);
  addTextOnLine('1949-1974', margin + 140);
  addCheckBox('construction_1975_1989', 220);
  addTextOnLine('1975-1989', margin + 240);
  addCheckBox('construction_1989_2005', 320);
  addTextOnLine('1989-2005', margin + 340);
  addCheckBox('construction_depuis_2005', 420);
  addTextOnLine('Depuis 2005', margin + 440);
  skipLine(20);
  
  addText('Surface habitable :', 10, false, margin, 15);
  const surfaceY = currentY;
  addTextField('surface_habitable', 80, fieldHeight, '', 0, false);
  addTextOnLine('m²', margin + 90);
  addTextOnLine('- Nombre de pièces principales :', margin + 130);
  addTextField('nombre_pieces', 80, fieldHeight, '', margin + 380, true);
  
  addText('Autres parties du logement :', 10, false, margin, 15);
  const checkboxY6 = currentY;
  addCheckBox('grenier', 0);
  addTextOnLine('Grenier', margin + 20);
  addCheckBox('comble', 100);
  addTextOnLine('Comble', margin + 120);
  addCheckBox('terrasse', 180);
  addTextOnLine('Terrasse', margin + 200);
  addCheckBox('balcon', 260);
  addTextOnLine('Balcon', margin + 280);
  addCheckBox('loggia', 340);
  addTextOnLine('Loggia', margin + 360);
  addCheckBox('jardin', 420);
  addTextOnLine('Jardin', margin + 440);
  skipLine(20);
  
  addText('Autres :', 10, false, margin, 15);
  addTextField('autres_parties', contentWidth);
  
  addText('Éléments d\'équipements du logement (cuisine équipée, installations sanitaires, etc.) :', 10, false, margin, 15);
  addTextField('equipements_logement', contentWidth, 30);
  
  addText('Modalité de production de chauffage :', 10, false, margin, 15);
  const checkboxY7 = currentY;
  addCheckBox('chauffage_individuel', 0);
  addTextOnLine('Individuel', margin + 20);
  addCheckBox('chauffage_collectif', 120);
  addTextOnLine('Collectif', margin + 140);
  skipLine(20);
  addText('(Si collectif, préciser les modalités de répartition) :', 9, false, margin, 15);
  addTextField('chauffage_modalites', contentWidth);
  
  addText('Modalité de production d\'eau chaude sanitaire :', 10, false, margin, 15);
  const checkboxY8 = currentY;
  addCheckBox('eau_chaude_individuel', 0);
  addTextOnLine('Individuel', margin + 20);
  addCheckBox('eau_chaude_collectif', 120);
  addTextOnLine('Collectif', margin + 140);
  skipLine(20);
  addText('(Si collectif, préciser les modalités de répartition) :', 9, false, margin, 15);
  addTextField('eau_chaude_modalites', contentWidth);
  
  skipLine(20);
  addText('B. Destination des locaux :', 11, true, margin, 15);
  const checkboxY9 = currentY;
  addCheckBox('usage_habitation', 0);
  addTextOnLine('Usage d\'habitation', margin + 20);
  addCheckBox('usage_mixte', 180);
  addTextOnLine('Usage mixte professionnel et d\'habitation', margin + 200);
  skipLine(20);
  
  addText('C. Désignation des locaux et équipements accessoires de l\'immeuble à usage privatif du locataire :', 10, false, margin, 15);
  addText('Cave n° :', 10, false, margin, 15);
  const caveY = currentY;
  addTextField('cave_numero', 60, fieldHeight, '', 70, false);
  addTextOnLine('Parking n° :', margin + 150);
  addTextField('parking_numero', 60, fieldHeight, '', 240, false);
  addTextOnLine('Garage n° :', margin + 320);
  addTextField('garage_numero', 60, fieldHeight, '', 400, true);
  
  skipLine(20);
  addText('Autres :', 10, false, margin, 15);
  addTextField('autres_locaux_privatifs', contentWidth);
  
  skipLine(20);
  addText('D. Le cas échéant, Énumération des locaux, parties, équipements et accessoires de l\'immeuble à usage commun :', 10, false, margin, 15);
  const checkboxY10 = currentY;
  addCheckBox('garage_velo', 0);
  addTextOnLine('Garage à vélo', margin + 20);
  addCheckBox('ascenseur', 120);
  addTextOnLine('Ascenseur', margin + 140);
  addCheckBox('espaces_verts', 220);
  addTextOnLine('Espaces verts', margin + 240);
  addCheckBox('aires_jeux', 320);
  addTextOnLine('Aires et équipements de jeux', margin + 340);
  skipLine(20);
  const checkboxY11 = currentY;
  addCheckBox('laverie', 0);
  addTextOnLine('Laverie', margin + 20);
  addCheckBox('local_poubelle', 100);
  addTextOnLine('Local poubelle', margin + 120);
  addCheckBox('gardiennage', 220);
  addTextOnLine('Gardiennage', margin + 240);
  skipLine(20);
  addText('Autres :', 10, false, margin, 15);
  addTextField('autres_locaux_communs', contentWidth);
  
  skipLine(20);
  addText('E. Équipement d\'accès aux technologies de l\'information et de la communication', 10, false, margin, 15);
  addText('(modalités de réception de la télévision, modalités de raccordement internet, etc.) :', 9, false, margin, 15);
  addTextField('equipements_tic', contentWidth, 30);
  
  skipLine(20);
  addText('Rappel : un logement décent doit respecter les critères minimaux de performance suivants :', 9, false, margin, 12);
  addText('a) En France métropolitaine :', 9, true, margin, 12);
  addText('I) À compter du 1er janvier 2025, le niveau de performance minimal correspond à la classe F du DPE ;', 9, false, margin, 12);
  addText('II) À compter du 1er janvier 2028, le niveau de performance minimal correspond à la classe E du DPE ;', 9, false, margin, 12);
  addText('III) À compter du 1er janvier 2034, le niveau de performance minimal correspond à la classe D du DPE.', 9, false, margin, 12);
  addText('b) En Guadeloupe, en Martinique, en Guyane, à La Réunion et à Mayotte :', 9, true, margin, 12);
  addText('I) À compter du 1er janvier 2028, le niveau de performance minimal correspond à la classe F du DPE ;', 9, false, margin, 12);
  addText('II) À compter du 1er janvier 2031, le niveau de performance minimal correspond à la classe E du DPE.', 9, false, margin, 15);
  addText('Niveau de performance du logement [classe du diagnostic de performance énergétique] :', 10, false, margin, 15);
  addTextField('dpe_classe', 100);
  
  skipLine(30);
  
  // ========== III. DATE DE PRISE D'EFFET ET DURÉE ==========
  addText('III. DATE DE PRISE D\'EFFET ET DURÉE DU CONTRAT', 12, true, margin, 20, true);
  addText('La durée du contrat et sa date de prise d\'effet sont ainsi définies :', 10, false, margin, 20);
  
  addText('A. Date de prise d\'effet du contrat :', 10, false, margin, 15);
  addText('Jour :', 10, false, margin, 15);
  const dateY = currentY;
  addTextField('date_effet_jour', 40, fieldHeight, '', 0, false);
  addTextOnLine('/', margin + 50);
  addText('Mois :', 10, false, margin + 60, 0);
  addTextField('date_effet_mois', 40, fieldHeight, '', 110, false);
  addTextOnLine('/', margin + 160);
  addText('Année :', 10, false, margin + 170, 0);
  addTextField('date_effet_annee', 60, fieldHeight, '', 230, true);
  
  skipLine(25);
  
  addText('B. Durée du contrat :', 10, false, margin, 15);
  const checkboxY12 = currentY;
  addCheckBox('duree_3_ans', 0);
  addTextOnLine('3 ans', margin + 20);
  addCheckBox('duree_6_ans', 80);
  addTextOnLine('6 ans [minimum 6 ans si le bailleur est une personne morale]', margin + 100);
  skipLine(20);
  addCheckBox('duree_reduite', 0);
  addTextOnLine('Durée réduite :', margin + 20);
  addTextField('duree_reduite_valeur', 200, fieldHeight, '', 130, false);
  addText('(durée minimale d\'un an lorsqu\'un événement précis le justifie)', 9, false, margin + 340, 0);
  skipLine(25);
  
  addText('C. Le cas échéant, événement et raison justifiant la durée réduite du contrat de location :', 10, false, margin, 15);
  addTextField('duree_reduite_raison', contentWidth, 30);
  
  skipLine(15);
  addText('En l\'absence de proposition de renouvellement du contrat, celui-ci est, à son terme, reconduit tacitement', 9, false, margin, 12);
  addText('pour 3 ou 6 ans et dans les mêmes conditions. Le locataire peut mettre fin au bail à tout moment, après avoir', 9, false, margin, 12);
  addText('donné congé. Le bailleur, quant à lui, peut mettre fin au bail à son échéance et après avoir donné congé, soit', 9, false, margin, 12);
  addText('pour reprendre le logement en vue de l\'occuper lui-même ou une personne de sa famille, soit pour le vendre,', 9, false, margin, 12);
  addText('soit pour un motif sérieux et légitime.', 9, false, margin, 30);
  
  // ========== IV. CONDITIONS FINANCIÈRES ==========
  addText('IV. CONDITIONS FINANCIÈRES', 12, true, margin, 20, true);
  addText('Les parties conviennent des conditions financières suivantes :', 10, false, margin, 20);
  
  addText('A. Loyer', 11, true, margin, 15);
  addText('1° Fixation du loyer initial :', 10, false, margin, 15);
  
  addText('a) Montant du loyer mensuel :', 10, false, margin, 15);
  const loyerY = currentY;
  addTextField('loyer_mensuel', 150, fieldHeight, '', 0, false);
  addTextOnLine('€', margin + 160);
  skipLine(20);
  
  addText('b) Le cas échéant, modalités particulières de fixation initiale du loyer applicables dans les zones tendues :', 10, false, margin, 15);
  addText('Le loyer du logement objet du présent contrat est soumis au décret fixant annuellement le montant maximum', 9, false, margin, 12);
  addText('d\'évolution des loyers à la relocation :', 9, false, margin, 15);
  const checkboxY13 = currentY;
  addCheckBox('loyer_soumis_decret_oui', 0);
  addTextOnLine('Oui', margin + 20);
  addCheckBox('loyer_soumis_decret_non', 80);
  addTextOnLine('Non', margin + 100);
  skipLine(20);
  
  addText('Le loyer du logement objet du présent contrat est soumis au loyer de référence majoré fixé par arrêté', 9, false, margin, 12);
  addText('préfectoral :', 9, false, margin, 15);
  const checkboxY14 = currentY;
  addCheckBox('loyer_reference_oui', 0);
  addTextOnLine('Oui', margin + 20);
  addCheckBox('loyer_reference_non', 80);
  addTextOnLine('Non', margin + 100);
  skipLine(20);
  
  addText('Montant du loyer de référence :', 10, false, margin, 15);
  const refY = currentY;
  addTextField('loyer_reference_montant', 100, fieldHeight, '', 200, false);
  addTextOnLine('€/m²', margin + 310);
  skipLine(20);
  addText('Montant du loyer de référence majoré :', 10, false, margin, 15);
  const refMajY = currentY;
  addTextField('loyer_reference_majore', 100, fieldHeight, '', 250, false);
  addTextOnLine('€/m²', margin + 360);
  skipLine(20);
  
  addText('Le cas échéant, Complément de loyer [si un complément de loyer est prévu, indiquer le montant du loyer', 9, false, margin, 12);
  addText('de base, nécessairement égal au loyer de référence majoré, le montant du complément de loyer et les', 9, false, margin, 12);
  addText('caractéristiques du logement justifiant le complément de loyer] :', 9, false, margin, 15);
  addTextField('complement_loyer', contentWidth, 30);
  
  skipLine(20);
  addText('c) Le cas échéant, informations relatives au loyer du dernier locataire [montant du dernier loyer acquitté', 9, false, margin, 12);
  addText('par le précédent locataire, date de versement et date de la dernière révision du loyer] :', 9, false, margin, 15);
  addTextField('loyer_dernier_locataire', contentWidth, 30);
  
  skipLine(20);
  addText('2° Le cas échéant, Modalités de révision :', 10, false, margin, 15);
  addText('Date de révision :', 10, false, margin, 15);
  const revisionY = currentY;
  addTextField('revision_jour', 40, fieldHeight, '', 0, false);
  addTextOnLine('/', margin + 50);
  addTextField('revision_mois', 40, fieldHeight, '', 60, false);
  addTextOnLine('/', margin + 110);
  addTextField('revision_annee', 60, fieldHeight, '', 120, true);
  skipLine(20);
  addText('Date ou trimestre de référence de l\'IRL :', 10, false, margin, 15);
  addTextField('irl_reference', contentWidth);
  
  skipLine(25);
  
  addText('B. Charges récupérables', 11, true, margin, 15, true);
  addText('1. Modalité de règlement des charges récupérables :', 10, false, margin, 15);
  const checkboxY15 = currentY;
  addCheckBox('charges_provisions', 0);
  addTextOnLine('Provisions sur charges avec régularisation annuelle', margin + 20);
  skipLine(20);
  addCheckBox('charges_paiement_periodique', 0);
  addTextOnLine('Paiement périodique des charges sans provision', margin + 20);
  skipLine(20);
  addCheckBox('charges_forfait', 0);
  addTextOnLine('[En cas de colocation seulement] Forfait de charges', margin + 20);
  skipLine(25);
  
  addText('2. Le cas échéant, Montant des provisions sur charges ou, en cas de colocation, du forfait de charge :', 10, false, margin, 15);
  addTextField('montant_charges', contentWidth);
  
  skipLine(20);
  addText('3. Le cas échéant, En cas de colocation et si les parties en conviennent, modalités de révision du forfait de', 10, false, margin, 12);
  addText('charges :', 10, false, margin, 15);
  addTextField('revision_forfait_charges', contentWidth, 30);
  
  skipLine(25);
  
  addText('C. Le cas échéant, contribution pour le partage des économies de charges :', 10, false, margin, 15);
  addText('1. Montant et durée de la participation du locataire restant à courir au jour de la signature du contrat :', 10, false, margin, 15);
  addTextField('contribution_economies', contentWidth, 30);
  
  skipLine(20);
  addText('2. Éléments propres à justifier les travaux réalisés donnant lieu à cette contribution :', 10, false, margin, 15);
  addTextField('justification_travaux', contentWidth, 30);
  
  skipLine(25);
  
  addText('D. Le cas échéant, En cas de colocation souscription par le bailleur d\'une assurance pour le compte des', 10, false, margin, 12);
  addText('colocataires :', 10, false, margin, 15);
  const checkboxY16 = currentY;
  addCheckBox('assurance_colocataires_oui', 0);
  addTextOnLine('Oui', margin + 20);
  addCheckBox('assurance_colocataires_non', 80);
  addTextOnLine('Non', margin + 100);
  skipLine(20);
  
  addText('1. Montant total annuel récupérable au titre de l\'assurance pour compte des colocataires :', 10, false, margin, 15);
  addTextField('assurance_montant_annuel', contentWidth);
  
  skipLine(20);
  addText('2. Montant récupérable par douzième :', 10, false, margin, 15);
  addTextField('assurance_montant_mensuel', contentWidth);
  
  skipLine(25);
  
  addText('E. Modalités de paiement', 11, true, margin, 15);
  addText('Périodicité du paiement :', 10, false, margin, 15);
  addTextField('periodicite_paiement', 150);
  skipLine(20);
  addText('Paiement :', 10, false, margin, 15);
  const checkboxY17 = currentY;
  addCheckBox('paiement_echoir', 0);
  addTextOnLine('À échoir', margin + 20);
  addCheckBox('paiement_terme_echu', 120);
  addTextOnLine('À terme échu', margin + 140);
  skipLine(20);
  addText('Date ou période de paiement :', 10, false, margin, 15);
  addTextField('date_paiement', contentWidth);
  skipLine(20);
  addText('Lieu de paiement :', 10, false, margin, 15);
  addTextField('lieu_paiement', contentWidth);
  
  skipLine(20);
  addText('Montant total dû à la première échéance de paiement pour une période complète de location :', 10, false, margin, 15);
  addText('Loyer (hors charges) :', 10, false, margin, 15);
  addTextField('premiere_echeance_loyer', contentWidth);
  skipLine(20);
  addText('Charges récupérables :', 10, false, margin, 15);
  addTextField('premiere_echeance_charges', contentWidth);
  skipLine(20);
  addText('Contribution pour le partage des économies de charges :', 10, false, margin, 15);
  addTextField('premiere_echeance_contribution', contentWidth);
  skipLine(20);
  addText('En cas de colocation, à l\'assurance récupérable pour le compte des colocataires :', 10, false, margin, 15);
  addTextField('premiere_echeance_assurance', contentWidth);
  
  skipLine(30);
  
  // ========== V. TRAVAUX ==========
  addText('V. TRAVAUX', 12, true, margin, 20, true);
  
  addText('A. Le cas échéant, Montant et nature des travaux d\'amélioration ou de mise en conformité avec les', 10, false, margin, 12);
  addText('caractéristiques de décence effectués depuis la fin du dernier contrat de location ou depuis le dernier', 10, false, margin, 12);
  addText('renouvellement :', 10, false, margin, 15);
  addTextField('travaux_amelioration', contentWidth, 40);
  
  skipLine(20);
  addText('B. Majoration du loyer en cours de bail consécutive à des travaux d\'amélioration entrepris par le bailleur', 10, false, margin, 12);
  addText('[nature des travaux, modalités d\'exécution, délai de réalisation ainsi que montant de la majoration du loyer] :', 10, false, margin, 15);
  addTextField('majoration_travaux', contentWidth, 40);
  
  skipLine(20);
  addText('C. Le cas échéant, Diminution de loyer en cours de bail consécutive à des travaux entrepris par le locataire', 10, false, margin, 12);
  addText('[durée de cette diminution et, en cas de départ anticipé du locataire, modalités de son dédommagement sur', 10, false, margin, 12);
  addText('justification des dépenses effectuées] :', 10, false, margin, 15);
  addTextField('diminution_travaux', contentWidth, 40);
  
  skipLine(30);
  
  // ========== VI. GARANTIES ==========
  addText('VI. GARANTIES', 12, true, margin, 20, true);
  addText('Le cas échéant, Montant du dépôt de garantie de l\'exécution des obligations du locataire / Garantie autonome', 10, false, margin, 12);
  addText('[inférieur ou égal à un mois de loyers hors charges] :', 10, false, margin, 15);
  addTextField('depot_garantie', contentWidth);
  
  skipLine(30);
  
  // ========== VII. CLAUSE DE SOLIDARITÉ ==========
  addText('VII. CLAUSE DE SOLIDARITÉ', 12, true, margin, 20, true);
  addText('Modalités particulières des obligations en cas de pluralité de locataires : en cas de colocation, c\'est-à-dire de la', 9, false, margin, 12);
  addText('location d\'un même logement par plusieurs locataires, constituant leur résidence principale et formalisée par la', 9, false, margin, 12);
  addText('conclusion d\'un contrat unique ou de plusieurs contrats entre les locataires et le bailleur, les locataires sont tenus', 9, false, margin, 12);
  addText('conjointement, solidairement et indivisiblement à l\'égard du bailleur au paiement des loyers, charges et accessoires', 9, false, margin, 12);
  addText('dus en application du présent bail. La solidarité d\'un des colocataires et celle de la personne qui s\'est portée', 9, false, margin, 12);
  addText('caution pour lui prennent fin à la date d\'effet du congé régulièrement délivré et lorsqu\'un nouveau colocataire figure', 9, false, margin, 12);
  addText('au bail. À défaut, la solidarité du colocataire sortant s\'éteint au plus tard à l\'expiration d\'un délai de six mois', 9, false, margin, 12);
  addText('après la date d\'effet du congé.', 9, false, margin, 30);
  
  // ========== VIII. CLAUSE RÉSOLUTOIRE ==========
  addText('VIII. CLAUSE RÉSOLUTOIRE', 12, true, margin, 20, true);
  addText('Modalités de résiliation de plein droit du contrat : Le bail sera résilié de plein droit en cas d\'inexécution des', 9, false, margin, 12);
  addText('obligations du locataire, soit en cas de défaut de paiement des loyers et des charges locatives au terme convenu, de', 9, false, margin, 12);
  addText('non-versement du dépôt de garantie, de défaut d\'assurance du locataire contre les risques locatifs, de troubles de', 9, false, margin, 12);
  addText('voisinage constatés par une décision de justice passée en force de chose jugée rendue au profit d\'un tiers. Le', 9, false, margin, 12);
  addText('bailleur devra assigner le locataire devant le tribunal pour faire constater l\'acquisition de la clause résolutoire et', 9, false, margin, 12);
  addText('la résiliation de plein droit du bail. Lorsque le bailleur souhaite mettre en œuvre la clause résolutoire pour défaut', 9, false, margin, 12);
  addText('de paiement des loyers et des charges ou pour non-versement du dépôt de garantie, il doit préalablement faire', 9, false, margin, 12);
  addText('signifier au locataire, par acte de commissaire de justice, un commandement de payer, qui doit mentionner certaines', 9, false, margin, 12);
  addText('informations et notamment la faculté pour le locataire de saisir le fonds de solidarité pour le logement. De plus,', 9, false, margin, 12);
  addText('pour les bailleurs personnes physiques ou les sociétés immobilières familiales, le commandement de payer doit être', 9, false, margin, 12);
  addText('signalé par le commissaire de justice à la commission de coordination des actions de prévention des expulsions', 9, false, margin, 12);
  addText('locatives dès lors que l\'un des seuils relatifs au montant et à l\'ancienneté de la dette, fixé par arrêté préfectoral,', 9, false, margin, 12);
  addText('est atteint. Le locataire peut, à compter de la réception du commandement, régler sa dette, saisir le juge d\'instance', 9, false, margin, 12);
  addText('pour demander des délais de paiement, voire demander ponctuellement une aide financière à un fonds de solidarité', 9, false, margin, 12);
  addText('pour le logement. Si le locataire ne s\'est pas acquitté des sommes dues dans les six semaines suivant la', 9, false, margin, 12);
  addText('signification, le bailleur peut alors assigner le locataire en justice pour faire constater la résiliation de plein droit', 9, false, margin, 12);
  addText('du bail. En cas de défaut d\'assurance, le bailleur ne peut assigner en justice le locataire pour faire constater', 9, false, margin, 12);
  addText('l\'acquisition de la clause résolutoire qu\'après un délai d\'un mois après un commandement demeuré infructueux.', 9, false, margin, 30);
  
  // ========== IX. HONORAIRES ==========
  addText('IX. LE CAS ÉCHÉANT, HONORAIRES DE LOCATION', 12, true, margin, 20, true);
  addText('A. Dispositions applicables', 11, true, margin, 15);
  addText('Il est rappelé les dispositions du I de l\'article 5 (I) de la loi du 6 juillet 1989, alinéas 1 à 3 : « La rémunération des', 9, false, margin, 12);
  addText('personnes mandatées pour se livrer ou prêter leur concours à l\'entremise ou à la négociation d\'une mise en location', 9, false, margin, 12);
  addText('d\'un logement, tel que défini aux articles 2 et 25-3, est à la charge exclusive du bailleur, à l\'exception des', 9, false, margin, 12);
  addText('honoraires liés aux prestations mentionnées aux deuxième et troisième alinéas du présent I.', 9, false, margin, 12);
  addText('Les honoraires des personnes mandatées pour effectuer la visite du preneur, constituer son dossier et rédiger un', 9, false, margin, 12);
  addText('bail sont partagés entre le bailleur et le preneur. Le montant toutes taxes comprises imputé au preneur pour ces', 9, false, margin, 12);
  addText('prestations ne peut excéder celui imputé au bailleur et demeure inférieur ou égal à un plafond par mètre carré de', 9, false, margin, 12);
  addText('surface habitable de la chose louée fixé par voie réglementaire et révisable chaque année, dans des conditions', 9, false, margin, 12);
  addText('définies par décret. Ces honoraires sont dus à la signature du bail.', 9, false, margin, 12);
  addText('Les honoraires des personnes mandatées pour réaliser un état des lieux sont partagés entre le bailleur et le', 9, false, margin, 12);
  addText('preneur. Le montant toutes taxes comprises imputé au locataire pour cette prestation ne peut excéder celui imputé', 9, false, margin, 12);
  addText('au bailleur et demeure inférieur ou égal à un plafond par mètre carré de surface habitable de la chose louée fixé', 9, false, margin, 12);
  addText('par voie réglementaire et révisable chaque année, dans des conditions définies par décret. Ces honoraires sont dus', 9, false, margin, 12);
  addText('à compter de la réalisation de la prestation. »', 9, false, margin, 20);
  
  addText('Plafonds applicables :', 10, false, margin, 15);
  addText('Montant du plafond des honoraires imputables aux locataires en matière de prestation de visite du preneur, de', 10, false, margin, 12);
  addText('constitution de son dossier et de rédaction de bail :', 10, false, margin, 15);
  const plafondY1 = currentY;
  addTextField('plafond_honoraires_bail', 100, fieldHeight, '', 0, false);
  addTextOnLine('€/m² de surface habitable', margin + 110);
  skipLine(20);
  addText('Montant du plafond des honoraires imputables aux locataires en matière d\'établissement de l\'état des lieux', 10, false, margin, 12);
  addText('d\'entrée :', 10, false, margin, 15);
  const plafondY2 = currentY;
  addTextField('plafond_honoraires_edl', 100, fieldHeight, '', 0, false);
  addTextOnLine('€/m² de surface habitable', margin + 110);
  
  skipLine(25);
  addText('B. Détail et répartition des honoraires', 11, true, margin, 15);
  addText('1. Honoraires à la charge du bailleur :', 10, false, margin, 15);
  addText('Prestations de visite du preneur, de constitution de son dossier et de rédaction de bail [détail des prestations', 9, false, margin, 12);
  addText('effectivement réalisées et montant des honoraires toutes taxes comprises dus à la signature du bail] :', 9, false, margin, 15);
  addTextField('honoraires_bailleur_bail', contentWidth, 30);
  
  skipLine(20);
  addText('Prestation de réalisation de l\'état des lieux d\'entrée [montant des honoraires TTC] :', 10, false, margin, 15);
  addTextField('honoraires_bailleur_edl', contentWidth);
  
  skipLine(20);
  addText('Autres prestations [détail des prestations et conditions de rémunération] :', 10, false, margin, 15);
  addTextField('honoraires_bailleur_autres', contentWidth, 30);
  
  skipLine(25);
  addText('2. Honoraires à la charge du locataire :', 10, false, margin, 15);
  addText('Prestations de visite du preneur, de constitution de son dossier et de rédaction de bail [détail des prestations', 9, false, margin, 12);
  addText('effectivement réalisées et montant des honoraires toutes taxes comprises dus à la signature du bail] :', 9, false, margin, 15);
  addTextField('honoraires_locataire_bail', contentWidth, 30);
  
  skipLine(20);
  addText('Prestation de réalisation de l\'état des lieux d\'entrée [montant des honoraires TTC] :', 10, false, margin, 15);
  addTextField('honoraires_locataire_edl', contentWidth);
  
  skipLine(30);
  
  // ========== X. AUTRES CONDITIONS ==========
  addText('X. AUTRES CONDITIONS PARTICULIÈRES', 12, true, margin, 20, true);
  addText('[À définir par les parties]', 10, false, margin, 15);
  addTextField('conditions_particulieres', contentWidth, 60);
  
  skipLine(30);
  
  // ========== XI. ANNEXES ==========
  addText('XI. ANNEXES', 12, true, margin, 20, true);
  addText('Sont annexées et jointes au contrat de location les pièces suivantes :', 10, false, margin, 20);
  
  addText('A. Le cas échéant, un extrait du règlement concernant la destination de l\'immeuble, la jouissance et l\'usage', 9, false, margin, 12);
  addText('des parties privatives et communes, et précisant la quote-part afférente au lot loué dans chacune des catégories', 9, false, margin, 12);
  addText('de charges', 9, false, margin, 15);
  
  addText('B. Un dossier de diagnostic technique comprenant :', 10, false, margin, 15);
  addText('• un diagnostic de performance énergétique ;', 9, false, margin, 12);
  addText('• un constat de risque d\'exposition au plomb pour les immeubles construits avant le 1er janvier 1949 ;', 9, false, margin, 12);
  addText('• une copie d\'un état mentionnant l\'absence ou la présence de matériaux ou de produits de la construction', 9, false, margin, 12);
  addText('contenant de l\'amiante ;', 9, false, margin, 12);
  addText('• un état de l\'installation intérieure d\'électricité et de gaz, dont l\'objet est d\'évaluer les risques pouvant', 9, false, margin, 12);
  addText('porter atteinte à la sécurité des personnes ;', 9, false, margin, 12);
  addText('• le cas échéant, un état des risques naturels et technologiques pour les zones couvertes par un plan de', 9, false, margin, 12);
  addText('prévention des risques technologiques ou par un plan de prévention des risques naturels prévisibles, prescrit ou', 9, false, margin, 12);
  addText('approuvé, ou dans des zones de sismicité.', 9, false, margin, 15);
  
  addText('C. Une notice d\'information relative aux droits et obligations des locataires et des bailleurs', 9, false, margin, 15);
  
  addText('D. Un état des lieux', 9, false, margin, 15);
  
  addText('E. Le cas échéant, Une autorisation préalable de mise en location', 9, false, margin, 15);
  
  addText('F. Le cas échéant, références aux loyers habituellement constatés dans le voisinage pour des logements', 9, false, margin, 12);
  addText('comparables', 9, false, margin, 40);
  
  // ========== SIGNATURES ==========
  addText('Le', 10, false, margin, 15);
  const signatureY = currentY;
  addTextField('signature_jour', 40, fieldHeight, '', 25, false);
  addTextOnLine('/', margin + 70);
  addTextField('signature_mois', 40, fieldHeight, '', 80, false);
  addTextOnLine('/', margin + 130);
  addTextField('signature_annee', 60, fieldHeight, '', 140, false);
  addTextOnLine(', à', margin + 210);
  addTextField('signature_lieu', 200, fieldHeight, '', 240, true);
  
  skipLine(40);
  
  addText('Signature du bailleur', 10, false, margin, 12);
  addText('[ou de son mandataire, le cas échéant]', 9, false, margin, 60);
  
  addText('Signature du locataire', 10, false, margin);
  
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
