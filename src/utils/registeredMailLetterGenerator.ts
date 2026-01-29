export interface RevisionLetterContent {
  baillorName: string;
  baillorAddress: string;
  locataireName: string;
  locataireAddress: string;
  logementAddress: string;
  ancienLoyer: number;
  nouveauLoyer: number;
  irlAncien: number;
  irlNouveau: number;
  trimestre: number;
  anneeAncienne: number;
  anneeNouvelle: number;
  dateEffet: Date;
  dateBail?: string;
}

export function generateRevisionLetterHTML(data: RevisionLetterContent): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const trimestreOrdinal: { [key: number]: string } = {
    1: '1er',
    2: '2ème',
    3: '3ème',
    4: '4ème',
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      max-width: 21cm;
      margin: 0 auto;
      padding: 2.5cm 2cm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3cm;
    }
    .sender {
      width: 45%;
      line-height: 1.4;
    }
    .recipient {
      width: 45%;
      text-align: right;
      line-height: 1.4;
    }
    .date {
      text-align: right;
      margin-bottom: 1.5cm;
    }
    .subject {
      font-weight: normal;
      margin: 1cm 0 1.5cm 0;
    }
    .content {
      text-align: justify;
      line-height: 1.6;
    }
    .content p {
      margin: 0.8cm 0;
    }
    .signature {
      margin-top: 2cm;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="sender">
      ${data.baillorName.split('\n').join('<br>')}<br>
      ${data.baillorAddress.replace(/,/g, '<br>')}
    </div>
    <div class="recipient">
      ${data.locataireName.split('\n').join('<br>')}<br>
      ${data.locataireAddress.replace(/,/g, '<br>')}<br>
      <br>
      Le ${dateStr}
    </div>
  </div>

  <div class="subject">
    <strong>Objet : Révision annuelle du loyer</strong>
  </div>

  <div class="content">
    <p>
      Conformément à l'article 17-1 de la loi du 6 juillet 1989, je vous informe que le contrat de bail
      ${data.dateBail ? `signé le ${data.dateBail}` : 'signé'} prévoit la révision annuelle du loyer charges non comprises, à la date
      anniversaire du bail ou à la date prévue dans le contrat de bail. La révision du loyer est calculée
      en fonction de la variation de l'Indice de Référence des Loyers (IRL). L'indice de référence des
      loyers est publié chaque trimestre par l'INSEE.
    </p>

    <p>
      Le montant du loyer révisé est calculé selon la formule suivante : Loyer précédent hors charges X
      Nouvel IRL / IRL précédent.
    </p>

    <p>
      L'IRL précédent est celui du ${trimestreOrdinal[data.trimestre]} trimestre ${data.anneeAncienne}, il s'élevait à ${data.irlAncien.toFixed(2)}. Le nouvel IRL est celui du
      ${trimestreOrdinal[data.trimestre]} trimestre ${data.anneeNouvelle} il s'élève à ${data.irlNouveau.toFixed(2)}.
    </p>

    <p>
      Le nouveau loyer hors charges s'établit à ${data.nouveauLoyer.toFixed(2)} € et prend effet dès à présent. Je vous remercie
      de bien vouloir l'appliquer lors du règlement de vos prochains loyers.
    </p>

    <p>
      Je vous prie d'agréer l'expression de mes salutations distinguées.
    </p>
  </div>
</body>
</html>
  `.trim();
}
