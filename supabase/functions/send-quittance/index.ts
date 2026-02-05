import { createClient } from 'npm:@supabase/supabase-js@2';
import { encodeBase64 } from 'https://deno.land/std@0.208.0/encoding/base64.ts';
import { jsPDF } from 'npm:jspdf@2.5.1';

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

    if (!data.baillorName || data.baillorName.trim() === '') {
      if (data.proprietaireName && data.proprietaireName.trim() !== '') {
        data.baillorName = data.proprietaireName;
      } else {
        const nom = data.nomProprietaire || '';
        const prenom = data.prenomProprietaire || '';
        data.baillorName = `${prenom} ${nom}`.trim();
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

    const pdfBuffer = generateProfessionalPDF(data);
    const total = (parseFloat(data.loyer) || 0) + (parseFloat(data.charges) || 0);
    const recipientEmail = data.locataireEmail || data.baillorEmail;

    const fullName = data.baillorName || data.proprietaireName || '';
    const prenom = fullName.split(' ')[0].trim() || 'Propriétaire';

    const htmlEmail = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #7ba893 0%, #8fb89f 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      border-radius: 12px 12px 0 0;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 600;
      line-height: 1.3;
    }
    .header-subtitle {
      font-size: 16px;
      opacity: 0.95;
      margin: 0;
      font-weight: 400;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 25px;
    }
    .intro {
      font-size: 16px;
      color: #333;
      margin-bottom: 40px;
      line-height: 1.6;
    }
    .main-question {
      font-size: 28px;
      font-weight: 700;
      color: #d77a61;
      margin: 40px 0 15px 0;
      line-height: 1.3;
    }
    .sub-question {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 30px;
    }
    .illustration {
      text-align: center;
      margin: 30px 0;
    }
    .illustration img {
      max-width: 100%;
      height: auto;
    }
    .features-intro {
      font-size: 16px;
      color: #333;
      margin: 30px 0 20px 0;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    .feature-item {
      display: flex;
      align-items: start;
      margin-bottom: 15px;
      font-size: 16px;
      line-height: 1.5;
    }
    .check-icon {
      color: #d77a61;
      margin-right: 12px;
      font-size: 20px;
      font-weight: bold;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    .cta-button {
      display: inline-block;
      background: #d77a61;
      color: white !important;
      text-decoration: none !important;
      padding: 18px 40px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 4px 15px rgba(215, 122, 97, 0.3);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      background: #c56b52;
      box-shadow: 0 6px 20px rgba(215, 122, 97, 0.4);
    }
    .cta-note {
      font-size: 14px;
      color: #666;
      margin-top: 20px;
    }
    .footer {
      background-color: #fafafa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }
    .footer-brand {
      font-size: 18px;
      font-weight: 700;
      color: #d77a61;
      margin-bottom: 10px;
    }
    .footer-copyright {
      font-size: 13px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Votre quittance est prête</h1>
      <p class="header-subtitle">(et les prochaines pourraient l'être aussi sans rien faire...)</p>
    </div>

    <div class="content">
      <div class="greeting">Bonjour ${prenom},</div>

      <div class="intro">
        Votre quittance PDF <strong>${data.periode}</strong> est jointe à cet e-mail.
      </div>

      <div class="main-question">Ça vous dirait de ne plus jamais y penser ?</div>
      <div class="sub-question">Et si on s'en occupait pour vous ?</div>

      <div class="illustration">
        <img src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/homme_transat_mug-removebg-preview.png" alt="Détendez-vous" style="max-width: 500px; width: 100%;" />
      </div>

      <div class="features-intro">
        Avec le <strong>Mode Tranquilité</strong> :
      </div>

      <ul class="feature-list">
        <li class="feature-item">
          <span class="check-icon">✓</span>
          <span>Quittance <strong>envoyée automatiquement + archivage</strong></span>
        </li>
        <li class="feature-item">
          <span class="check-icon">✓</span>
          <span>Relance envoyée en cas de <strong>retard de loyer</strong></span>
        </li>
        <li class="feature-item">
          <span class="check-icon">✓</span>
          <span><strong>Calcul IRL</strong> et génération du courrier automatique</span>
        </li>
        <li class="feature-item">
          <span class="check-icon">✓</span>
          <span><strong>Bilan annuel automatique</strong> pour déclaration</span>
        </li>
        <li class="feature-item">
          <span class="check-icon">✓</span>
          <span>Offre de lancement <strong>0,82€/mois</strong> (9,90€/an) 1 - 2 locataires</span>
        </li>
      </ul>

      <div class="cta-section">
        <a href="https://quittancesimple.fr/automation" class="cta-button">
          Ne plus jamais y penser →
        </a>
        <p class="cta-note">
          Bien sûr, le générateur gratuit reste accessible à tout moment.
        </p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">Quittance Simple</div>
      <div class="footer-copyright">© 2026 Quittance Simple — Tous droits réservés</div>
    </div>
  </div>
</body>
</html>
    `;

    const emailData = {
      from: 'Quittance Simple <noreply@quittancesimple.fr>',
      to: [recipientEmail],
      subject: `Votre quittance de loyer - ${data.periode}`,
      html: htmlEmail,
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

          const { error: quittanceError } = await supabase
            .from('quittances')
            .upsert({
              proprietaire_id: locataireData.proprietaire_id,
              locataire_id: data.locataireId,
              periode_debut: periodeDebut,
              periode_fin: periodeFin,
              loyer: parseFloat(data.loyer) || 0,
              charges: parseFloat(data.charges) || 0,
              date_generation: new Date().toISOString(),
              statut: 'envoye',
              source: 'website'
            }, {
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
