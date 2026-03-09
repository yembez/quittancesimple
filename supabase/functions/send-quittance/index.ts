import { createClient } from 'npm:@supabase/supabase-js@2';
import { encodeBase64 } from 'https://deno.land/std@0.208.0/encoding/base64.ts';
import { jsPDF } from 'npm:jspdf@2.5.1';
import { buildEmailHtml } from '../_shared/email-template.ts';

const SITE_URL = 'https://www.quittancesimple.fr';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const numberToFrench = (num: number): string => {
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

export const generateProfessionalPDF = (data: any) => {
  const doc = new jsPDF();
  const loyer = parseFloat(data.loyer) || 0;
  const charges = parseFloat(data.charges) || 0;
  const total = loyer + charges;
  const currentDate = new Date();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const getPeriodDates = (periode: string) => {
    try {
      if (data.isProrata && data.dateDebut && data.dateFin) {
        const startDate = new Date(data.dateDebut);
        const endDate = new Date(data.dateFin);
        return {
          start: startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          end: endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        };
      }

      const [month, year] = periode.split(' ');
      const monthNames: Record<string, number> = {
        'Janvier': 0, 'Février': 1, 'Mars': 2, 'Avril': 3, 'Mai': 4, 'Juin': 5,
        'Juillet': 6, 'Août': 7, 'Septembre': 8, 'Octobre': 9, 'Novembre': 10, 'Décembre': 11
      };

      const monthIndex = monthNames[month] || 8;
      const yearNum = parseInt(year) || 2025;
      const startDate = new Date(yearNum, monthIndex, 1);
      const endDate = new Date(yearNum, monthIndex + 1, 0);

      return {
        start: startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        end: endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      };
    } catch (dateError) {
      return {
        start: '1er septembre 2025',
        end: '30 septembre 2025'
      };
    }
  };

  const periodDates = getPeriodDates(data.periode || 'Septembre 2025');

  const getVille = (address: string) => {
    if (!address) return 'Paris';
    const parts = address.split(',');
    const lastPart = parts[parts.length - 1].trim();
    const words = lastPart.split(' ').filter(w => w.length > 0);
    const ville = words.reverse().find(w => isNaN(Number(w)));
    return ville || 'Paris';
  };

  const ville = getVille(data.baillorAddress);

  const bgBeige = [245, 245, 240];
  const tealDark = [90, 116, 118];
  const tealLight = [168, 181, 178];
  const goldAccent = [212, 175, 55];
  const darkGray = [44, 44, 44];
  const mediumGray = [102, 102, 102];

  doc.setFillColor(...bgBeige);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(10, 10, 190, 277, 'F');

  let yPos = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...goldAccent);
  doc.text('Qs', 15, yPos);
  doc.setTextColor(123, 160, 160);
  doc.text(' Estate', 25, yPos);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mediumGray);
  doc.text('Quittance N°', 195, yPos - 4, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(currentDate.getTime().toString().slice(-8), 195, yPos, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...mediumGray);
  doc.text('Période', 195, yPos + 6, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(data.periode || 'Septembre 2025', 195, yPos + 10, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...mediumGray);
  doc.text('Montant', 195, yPos + 16, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(`${total.toFixed(2)} €`, 195, yPos + 20, { align: 'right' });

  yPos += 25;
  doc.setDrawColor(229, 229, 229);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, 195, yPos);

  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...darkGray);
  doc.text('QUITTANCE', 15, yPos);
  yPos += 10;
  doc.text('DE LOYER', 15, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mediumGray);
  doc.text(`Document généré le ${formatDate(currentDate)}`, 15, yPos);

  yPos += 5;
  doc.setDrawColor(229, 229, 229);
  doc.line(15, yPos, 195, yPos);

  yPos += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mediumGray);
  doc.text('BAILLEUR', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text(data.baillorName || '[Nom du bailleur]', 55, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mediumGray);
  const baillorAddr = doc.splitTextToSize(data.baillorAddress || '[Adresse]', 140);
  doc.text(baillorAddr, 55, yPos);
  if (data.baillorEmail) {
    yPos += baillorAddr.length * 4;
    doc.text(data.baillorEmail, 55, yPos);
  }

  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mediumGray);
  doc.text('LOCATAIRE', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text(data.locataireName || '[Nom du locataire]', 55, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mediumGray);

  if (data.locataireDomicileAddress && data.locataireDomicileAddress.trim() !== '') {
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse de domicile :', 55, yPos);
    yPos += 3.5;
    doc.setFont('helvetica', 'normal');
    const domicileLines = doc.splitTextToSize(data.locataireDomicileAddress, 140);
    doc.text(domicileLines, 55, yPos);
    yPos += domicileLines.length * 3.5 + 4;
  } else {
    doc.text('Locataire du bien ci-dessous', 55, yPos);
    yPos += 8;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mediumGray);
  doc.text('BIEN LOUÉ', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  const logementAddr = doc.splitTextToSize(data.logementAddress || '[Adresse du logement]', 140);
  doc.text(logementAddr, 55, yPos);
  yPos += logementAddr.length * 4 + 8;

  doc.setFillColor(249, 249, 249);
  doc.setDrawColor(229, 229, 229);
  const declarationHeight = 28;
  doc.roundedRect(15, yPos, 180, declarationHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  const declaration = `Je soussigné(e) ${data.baillorName || '[Nom du bailleur]'}, propriétaire du logement désigné ci-dessus, déclare avoir reçu de ${data.locataireName || '[Nom du locataire]'}, la somme de ${total.toFixed(2)} € (${numberToFrench(total)}) au titre du paiement du loyer et des charges pour la période du ${periodDates.start} au ${periodDates.end} et lui en donne quittance, sous réserve de tous mes droits.`;
  const splitDeclaration = doc.splitTextToSize(declaration, 165);
  doc.text(splitDeclaration, 20, yPos + 7);
  yPos += declarationHeight + 8;

  doc.setDrawColor(...tealLight);
  doc.setLineWidth(1);
  doc.rect(15, yPos, 180, 38);

  doc.setFillColor(...tealDark);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Description', 20, yPos + 5.5);
  doc.text('Montant', 130, yPos + 5.5);
  doc.text('Total', 170, yPos + 5.5);
  yPos += 8;

  doc.setDrawColor(212, 217, 215);
  doc.line(15, yPos, 195, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text('Loyer mensuel', 20, yPos + 5.5);
  doc.text(`${loyer.toFixed(2)} €`, 155, yPos + 5.5, { align: 'right' });
  yPos += 8;

  doc.setFillColor(...tealLight);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.line(15, yPos, 195, yPos);
  doc.text('Provision pour charges', 20, yPos + 5.5);
  doc.text(`${charges.toFixed(2)} €`, 155, yPos + 5.5, { align: 'right' });
  yPos += 8;

  doc.line(15, yPos, 195, yPos);
  doc.text('Régularisations', 20, yPos + 5.5);
  doc.text('0.00 €', 155, yPos + 5.5, { align: 'right' });
  yPos += 8;

  doc.setFillColor(...tealLight);
  doc.rect(15, yPos, 180, 6, 'F');
  doc.line(15, yPos, 195, yPos);
  doc.text('Report du bail', 20, yPos + 4);
  yPos += 6;

  doc.setFillColor(...tealLight);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.text('Total', 20, yPos + 5.5);
  doc.text(`${total.toFixed(2)} €`, 155, yPos + 5.5, { align: 'right' });
  yPos += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mediumGray);
  doc.text(`Fait à : ${ville}`, 120, yPos);
  doc.text(`Le : ${formatDate(currentDate)}`, 120, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text('Signature du bailleur', 120, yPos + 10);

  if (data.isElectronicSignature) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('VALIDÉ ÉLECTRONIQUEMENT', 155, yPos + 16, { align: 'center' });
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont('times', 'italic');
    doc.text(data.baillorName || '', 155, yPos + 38, { align: 'center' });
  }

  yPos += 40;

  doc.setDrawColor(229, 229, 229);
  doc.line(15, yPos, 195, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mediumGray);
  const mentions1 = 'Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du montant du présent terme.';
  const splitMentions1 = doc.splitTextToSize(mentions1, 175);
  doc.text(splitMentions1, 15, yPos);
  yPos += splitMentions1.length * 3.5;
  const mentions2 = 'Elle est à conserver pendant trois ans par le locataire (loi n° 89-462 du 6 juillet 1989 : art. 7-1).';
  const splitMentions2 = doc.splitTextToSize(mentions2, 175);
  doc.text(splitMentions2, 15, yPos);

  if (data.isElectronicSignature) {
    yPos += splitMentions2.length * 3.5 + 3;
    doc.setTextColor(90, 116, 118);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const line1 = `✓ Quittance validée électroniquement par le bailleur via Quittance Simple,`;
    const line2 = `le ${formatDate(currentDate)} à ${formatTime(currentDate)}, conformément à l'article 1367`;
    const line3 = `du Code civil sur la valeur juridique de la signature électronique.`;
    doc.text(line1, 15, yPos);
    doc.text(line2, 15, yPos + 3);
    doc.text(line3, 15, yPos + 6);
  }

  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('🚀 Edge Function - Envoi quittance avec email');

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await req.json();
    console.log('📧 Données reçues - locataireId:', data.locataireId);
    console.log('📧 Données reçues - locataireDomicileAddress:', data.locataireDomicileAddress);

    if (!data.baillorEmail || data.baillorEmail.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email du bailleur manquant'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construire le nom complet du propriétaire avec prénom + nom
    if (!data.baillorName || data.baillorName.trim() === '') {
      if (data.proprietaireName && data.proprietaireName.trim() !== '') {
        data.baillorName = data.proprietaireName;
      } else {
        const nom = data.nomProprietaire || '';
        const prenom = data.prenomProprietaire || '';
        data.baillorName = [prenom, nom].filter(Boolean).join(' ').trim();
      }
    } else if (data.nomProprietaire || data.prenomProprietaire) {
      // Si baillorName existe mais qu'on a nom/prenomProprietaire, reconstruire le nom complet
      const nom = data.nomProprietaire || '';
      const prenom = data.prenomProprietaire || '';
      const nomComplet = [prenom, nom].filter(Boolean).join(' ').trim();
      if (nomComplet) {
        data.baillorName = nomComplet;
      }
    }

    if (!data.baillorName || data.baillorName.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nom du bailleur manquant'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const proprietaireData: any = {
      email: data.baillorEmail,
      adresse: data.baillorAddress,
      nombre_quittances: 1,
      source: 'website',
      lead_statut: 'free_quittance_pdf'
    };

    if (data.baillorName && data.baillorName.trim()) {
      const nameParts = data.baillorName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        proprietaireData.prenom = nameParts[0];
        proprietaireData.nom = nameParts.slice(1).join(' ');
      } else {
        proprietaireData.nom = data.baillorName.trim();
      }
    }

    if (data.nomProprietaire) proprietaireData.nom = data.nomProprietaire;
    if (data.prenomProprietaire) proprietaireData.prenom = data.prenomProprietaire;

    console.log('📝 [PROPRIETAIRE DATA]', { email: proprietaireData.email, nom: proprietaireData.nom, prenom: proprietaireData.prenom, adresse: proprietaireData.adresse });

    await supabase.from('proprietaires').upsert(proprietaireData, { onConflict: 'email' });

    // Snapshot pour pré-remplir l’Espace Bailleur à l’inscription (CTA campagne, etc.)
    const locataireNameRaw = (data.locataireName || '').toString().trim();
    let locatairePrenom = '';
    let locataireNom = '';
    if (locataireNameRaw) {
      const parts = locataireNameRaw.split(/\s+/);
      if (parts.length >= 2) {
        locatairePrenom = parts[0];
        locataireNom = parts.slice(1).join(' ');
      } else {
        locataireNom = locataireNameRaw;
      }
    }
    const snapshotRow = {
      email: (data.baillorEmail || '').toString().trim().toLowerCase(),
      baillor_address: (data.baillorAddress || '').toString().trim() || null,
      baillor_nom: proprietaireData.nom || null,
      baillor_prenom: proprietaireData.prenom || null,
      locataire_nom: locataireNom || null,
      locataire_prenom: locatairePrenom || null,
      locataire_address: (data.logementAddress || data.locataireAddress || '').toString().trim() || null,
      loyer: typeof data.loyer === 'number' ? data.loyer : parseFloat(data.loyer) || null,
      charges: typeof data.charges === 'number' ? data.charges : parseFloat(data.charges) || null,
      applied_at: null,
    };
    await supabase.from('free_quittance_snapshots').upsert(snapshotRow, { onConflict: 'email' });

    // Récupérer nom, email et adresse du logement du locataire depuis la DB si locataireId est présent
    let locataireEmailFromPayload = (data.locataireEmail ?? data.locataire_email ?? '').toString().trim();
    let locataireNameFromDb = '';
    let logementAddressFromDb = '';
    if (data.locataireId || data.locataire_id) {
      const lid = data.locataireId ?? data.locataire_id;
      const { data: locataireRow } = await supabase
        .from('locataires')
        .select('email, nom, prenom, adresse_logement')
        .eq('id', lid)
        .maybeSingle();
      if (locataireRow) {
        // Toujours récupérer le nom complet depuis la DB
        locataireNameFromDb = [locataireRow.prenom, locataireRow.nom].filter(Boolean).join(' ');
        // Récupérer l'email si absent du payload
        if (!locataireEmailFromPayload && locataireRow.email) {
          locataireEmailFromPayload = String(locataireRow.email).trim();
        }
        // Adresse du logement loué pour le PDF (souvent absente du payload SMS/e-mail)
        if (locataireRow.adresse_logement && String(locataireRow.adresse_logement).trim()) {
          logementAddressFromDb = String(locataireRow.adresse_logement).trim();
        }
      }
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuration manquante: RESEND_API_KEY'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Utiliser le nom complet du locataire depuis la DB si disponible, sinon depuis le payload
    const locataireNameFinal = locataireNameFromDb || (data.locataireName ?? data.locataire_name) || '';
    if (locataireNameFinal) {
      data.locataireName = locataireNameFinal;
    }

    // Adresse du logement loué : compléter depuis la DB si absente du payload (flux SMS / e-mail)
    const payloadLogement = (data.logementAddress ?? data.logement_address ?? '').toString().trim();
    if (!payloadLogement && logementAddressFromDb) {
      data.logementAddress = logementAddressFromDb;
    } else if (payloadLogement) {
      data.logementAddress = payloadLogement;
    }
    
    const pdfBuffer = generateProfessionalPDF(data);
    const total = (parseFloat(data.loyer) || 0) + (parseFloat(data.charges) || 0);
    // Accepter camelCase et snake_case (au cas où le corps serait transformé)
    const locataireEmailRaw = locataireEmailFromPayload;
    const recipientEmail = locataireEmailRaw || data.baillorEmail;
    // Template locataire : destinataire = locataire OU flow "clic rappel" (action auto_send)
    const isToTenant = !!locataireEmailRaw || data.action === 'auto_send';
    console.log('📧 [send-quittance] action=', data.action, 'recipient=', recipientEmail?.slice(0, 8) + '…', 'isToTenant=', isToTenant, 'template=', isToTenant ? 'LOCATAIRE' : 'PROPRIETAIRE');

    // Extraire le prénom du propriétaire pour l'email (premier mot du nom complet) ; vide si inconnu
    const fullName = data.baillorName || data.proprietaireName || '';
    const prenom = fullName.split(' ')[0].trim() || '';
    const greeting = prenom ? `Bonjour ${prenom},` : 'Bonjour,';
    // Utiliser le nom complet du locataire pour l'email
    const locataireName = data.locataireName || 'Locataire';
    const loyer = parseFloat(data.loyer) || 0;
    const charges = parseFloat(data.charges) || 0;

    // Template email destiné au LOCATAIRE (modèle design unifié — QS Espace Bailleur)
    const dashboardUrl = 'https://quittancesimple.fr/dashboard';
    const htmlEmailTenant = buildEmailHtml({
      title: 'QS- Espace Bailleur',
      bodyHtml: `
        <p>Bonjour ${locataireName},</p>
        <p>Veuillez trouver ci-joint votre quittance de loyer pour la période : <strong>${data.periode}</strong>.</p>
        <ul style="padding-left: 20px;">
          <li>Loyer mensuel : ${loyer.toFixed(2)} €</li>
          <li>Charges mensuelles : ${charges.toFixed(2)} €</li>
          <li>Total réglé : ${total.toFixed(2)} €</li>
        </ul>
        <p>Conservez ce document pendant au moins trois ans (obligation légale).</p>
      `,
      ctaText: 'Accéder à l\'espace bailleur',
      ctaUrl: dashboardUrl,
      closingHtml: `Cordialement,<br><strong>${fullName || 'Votre bailleur'}</strong>`,
      unsubscribeUrl: `${SITE_URL}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`,
    });

    // Template email destiné au PROPRIÉTAIRE (quittance gratuite) — contenu adapté au contexte
    const emailForCta = (data.baillorEmail ?? '').toString().trim();
    const ctaUrlPack = emailForCta
      ? `${SITE_URL}/#loginEmail=${encodeURIComponent(emailForCta)}&mode=signup`
      : `${SITE_URL}/`;

    const htmlEmail = buildEmailHtml({
      title: 'Quittance Simple',
      bodyHtml: `
        <p>${greeting}</p>
        <p>Votre quittance de loyer pour ${data.periode} est disponible en pièce jointe.</p>
        <p>C’est fait, mais le mois prochain il faudra recommencer… :(</p>
        <p>Ça vous dirait de pouvoir utiliser l'envoi automatique gratuitement ?</p>
        <p><strong>Bonne nouvelle :</strong> Votre Espace Bailleur est déjà prêt. On a pré-rempli vos informations et celles de votre locataire pour vous faire gagner du temps.</p>
        <p>Vous n'avez qu'à programmer une date pour tester l'envoi automatique pour le mois prochain. C'est hyper simple.</p>
        <p style="margin-top: 16px;">Et testez gratuitement tous nos autres outils.</p>
        <p style="margin-top: 8px;">Fini la paperasse, place à la sérénité.</p>
      `,
      ctaText: "Activer l'envoi automatique gratuit",
      ctaUrl: ctaUrlPack,
      closingHtml: '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 4px;"><tr><td style="padding-right: 12px; vertical-align: middle;"><img src="https://www.quittancesimple.fr/images/vincent-photo.png" alt="Vincent, Quittance Simple" style="width: 76px; height: 76px; border-radius: 999px; display: block; object-fit: cover; object-position: 50% 28%;"></td><td style="font-size: 14px; line-height: 1.5; color: #111827; vertical-align: middle;">À bientôt,<br><strong>Vincent</strong><br><span style="color:#4b5563;">Co-fondateur de Quittance Simple</span><br><span style="color:#4b5563;">Bailleur comme vous</span></td></tr></table>',
      unsubscribeUrl: emailForCta ? `${SITE_URL}/unsubscribe?email=${encodeURIComponent(emailForCta)}` : undefined,
    });

    const emailData = {
      from: 'Quittance Simple <noreply@quittancesimple.fr>',
      to: [recipientEmail],
      subject: isToTenant ? `Quittance de loyer – ${data.periode}` : "Votre quittance est prête (et une surprise à l'intérieur)",
      html: isToTenant ? htmlEmailTenant : htmlEmail,
      attachments: [{
        filename: `quittance-${data.periode.replace(/\s+/g, '-')}.pdf`,
        content: encodeBase64(pdfBuffer),
        type: 'application/pdf'
      }]
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erreur Resend:', errorData);
      return new Response(JSON.stringify({
        success: false,
        error: `Erreur envoi email: ${response.status}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();

    // Copie au bailleur : envoyer une copie de la quittance PDF au bailleur quand on envoie au locataire
    const bailleurEmail = (data.baillorEmail ?? '').toString().trim();
    if (isToTenant && bailleurEmail && bailleurEmail !== recipientEmail) {
      const htmlEmailBailleurCopy = buildEmailHtml({
        title: 'QS- Espace Bailleur',
        bodyHtml: `
          <p>${greeting}</p>
          <p>Ceci est une copie de la quittance de loyer envoyée à <strong>${locataireName}</strong> pour la période <strong>${data.periode}</strong>.</p>
          <ul style="padding-left: 20px;">
            <li>Loyer : ${loyer.toFixed(2)} €</li>
            <li>Charges : ${charges.toFixed(2)} €</li>
            <li>Total : ${total.toFixed(2)} €</li>
          </ul>
          <p>La quittance en pièce jointe est identique à celle reçue par votre locataire.</p>
        `,
        ctaText: 'Accéder à mon espace',
        ctaUrl: dashboardUrl,
        closingHtml: `Cordialement,<br><strong>L'équipe Quittance Simple</strong>`,
        unsubscribeUrl: bailleurEmail ? `${SITE_URL}/unsubscribe?email=${encodeURIComponent(bailleurEmail)}` : undefined,
      });
      const copyToBailleur = {
        from: 'Quittance Simple <noreply@quittancesimple.fr>',
        to: [bailleurEmail],
        subject: `Copie – Quittance envoyée à ${locataireName} – ${data.periode}`,
        html: htmlEmailBailleurCopy,
        attachments: [{
          filename: `quittance-${data.periode.replace(/\s+/g, '-')}.pdf`,
          content: encodeBase64(pdfBuffer),
          type: 'application/pdf'
        }]
      };
      try {
        const copyResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(copyToBailleur)
        });
        if (copyResponse.ok) {
          console.log('📧 Copie quittance envoyée au bailleur:', bailleurEmail.slice(0, 8) + '…');
        } else {
          console.warn('⚠️ Échec envoi copie au bailleur:', await copyResponse.text());
        }
      } catch (copyErr) {
        console.warn('⚠️ Erreur envoi copie au bailleur:', copyErr);
      }
    }

    if (data.locataireId) {
      console.log('📝 [BEFORE STATUS UPDATE] ID:', data.locataireId);
      try {
        const { data: locataireData, error: locataireError } = await supabase
          .from('locataires')
          .select('proprietaire_id')
          .eq('id', data.locataireId)
          .maybeSingle();

        if (!locataireError && locataireData) {
          const currentDate = new Date();
          let year = currentDate.getFullYear();
          let month = currentDate.getMonth();

          if (data.periode) {
            const periodeMatch = data.periode.match(/(\w+)\s+(\d{4})/);
            if (periodeMatch) {
              const monthNames: Record<string, number> = {
                'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
              };
              const monthName = periodeMatch[1].toLowerCase();
              if (monthNames[monthName] !== undefined) {
                month = monthNames[monthName];
                year = parseInt(periodeMatch[2]);
              }
            }
          }

          const periodeDebut = new Date(year, month, 1).toISOString().split('T')[0];
          const periodeFin = new Date(year, month + 1, 0).toISOString().split('T')[0];

          // Vérifier si la quittance existe déjà
          const { data: existingQuittance } = await supabase
            .from('quittances')
            .select('date_generation')
            .eq('proprietaire_id', locataireData.proprietaire_id)
            .eq('locataire_id', data.locataireId)
            .eq('periode_debut', periodeDebut)
            .eq('periode_fin', periodeFin)
            .maybeSingle();

          const now = new Date().toISOString();
          const updateData: any = {
            proprietaire_id: locataireData.proprietaire_id,
            locataire_id: data.locataireId,
            periode_debut: periodeDebut,
            periode_fin: periodeFin,
            loyer: parseFloat(data.loyer) || 0,
            charges: parseFloat(data.charges) || 0,
            date_envoi: now,
            statut: 'envoyee',
            source: 'website'
          };

          // Préserver date_generation si la quittance existe déjà
          if (existingQuittance?.date_generation) {
            updateData.date_generation = existingQuittance.date_generation;
          } else {
            updateData.date_generation = now;
          }

          const { error: quittanceError } = await supabase
            .from('quittances')
            .upsert(updateData, {
              onConflict: 'proprietaire_id,locataire_id,periode_debut,periode_fin',
              ignoreDuplicates: false
            });

          if (quittanceError) {
            console.error('⚠️ Erreur création quittance:', quittanceError);
          } else {
            console.log('✅ Quittance enregistrée dans l\'historique');
          }
        }

        const { data: updateData, error: updateError } = await supabase
          .from('locataires')
          .update({
            statut: 'paye',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.locataireId)
          .select();

        if (updateError) {
          console.error('❌ [STATUS UPDATE FAILED]', {
            error: updateError,
            code: updateError.code,
            message: updateError.message,
            locataireId: data.locataireId
          });
        } else if (updateData && updateData.length > 0) {
          console.log('✅ [STATUS UPDATE SUCCESS]', {
            statut: updateData[0].statut,
            locataireId: data.locataireId,
            rowsAffected: updateData.length
          });
        } else {
          console.error('⚠️ [STATUS UPDATE NO ROWS]', {
            locataireId: data.locataireId,
            rowsAffected: updateData?.length || 0
          });
        }
      } catch (err: any) {
        console.error('❌ [STATUS UPDATE EXCEPTION]', {
          message: err.message,
          locataireId: data.locataireId
        });
      }
    } else {
      console.log('⚠️ [NO LOCATAIRE ID PROVIDED]');
    }

    return new Response(JSON.stringify({
      success: true,
      message: `✅ Email envoyé avec succès !`,
      emailId: result.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erreur générale:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erreur lors de l\'envoi',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
