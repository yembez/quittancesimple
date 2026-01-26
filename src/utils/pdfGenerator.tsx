import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';

interface QuittanceData {
  nomProprietaire?: string;
  prenomProprietaire?: string;
  adresseProprietaire?: string;
  baillorName?: string;
  baillorAddress?: string;
  baillorEmail?: string;
  nomLocataire?: string;
  prenomLocataire?: string;
  adresseLogement?: string;
  locataireName?: string;
  logementAddress?: string;
  locataireDomicileAddress?: string;
  moisLoyer?: string;
  periode?: string;
  montantLoyer?: string;
  loyer?: string;
  montantCharges?: string;
  charges?: string;
  dateDebut?: string;
  dateFin?: string;
  isProrata?: boolean;
  typeCalcul?: string;
  isElectronicSignature?: boolean;
}

const numberToFrench = (num: number): string => {
  num = Math.round(num * 100) / 100;
  if (num === 0) return 'zéro';

  const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  const convertHundreds = (n: number): string => {
    let result = '';
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      result += (hundreds === 1) ? 'cent' : ones[hundreds] + ' cent';
      if (n % 100 === 0 && hundreds > 1) result += 's';
      n %= 100;
      if (n > 0) result += ' ';
    }
    if (n >= 20) {
      const tensDigit = Math.floor(n / 10);
      const onesDigit = n % 10;
      if (tensDigit === 7 || tensDigit === 9) {
        result += tens[tensDigit - 1] + '-' + teens[onesDigit];
      } else {
        result += tens[tensDigit];
        if (tensDigit === 8 && onesDigit === 0) result += 's';
        if (onesDigit > 0) {
          result += (onesDigit === 1 && [2,3,4,5,6].includes(tensDigit)) ? ' et un' : '-' + ones[onesDigit];
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
      result += (millions === 1) ? 'un million' : convertHundreds(millions) + ' millions';
      n %= 1000000;
      if (n > 0) result += ' ';
    }
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      result += (thousands === 1) ? 'mille' : convertHundreds(thousands) + ' mille';
      n %= 1000;
      if (n > 0) result += ' ';
    }
    if (n > 0) result += convertHundreds(n);
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

  let result = (finalIntegerPart === 0) ? 'zéro euro' : convertThousands(finalIntegerPart) + ((finalIntegerPart === 1) ? ' euro' : ' euros');

  if (finalDecimalPart > 0) {
    result += ' et ' + convertHundreds(finalDecimalPart) + ((finalDecimalPart === 1) ? ' centime' : ' centimes');
  }

  return result;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#f5f5f0',
  },
  container: {
    backgroundColor: '#ffffff',
    padding: 30,
    height: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: '1px solid #e5e5e5',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7ba0a0',
  },
  logoAccent: {
    color: '#d4af37',
  },
  infoSection: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 4,
  },
  titleSection: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '1px solid #e5e5e5',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c2c2c',
    letterSpacing: 1,
    marginBottom: 5,
  },
  subtitleDate: {
    fontSize: 9,
    color: '#666666',
    marginTop: 8,
  },
  tableContainer: {
    marginBottom: 25,
    border: '1px solid #a8b5b2',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#5a7476',
    padding: 8,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableHeaderLarge: {
    width: '40%',
  },
  tableHeaderMedium: {
    width: '30%',
  },
  tableHeaderSmall: {
    width: '30%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #d4d9d7',
  },
  tableRowAlt: {
    backgroundColor: '#a8b5b2',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    color: '#2c2c2c',
  },
  tableCellLabel: {
    width: '40%',
  },
  tableCellValue: {
    width: '30%',
    textAlign: 'right',
  },
  tableCellEmpty: {
    width: '30%',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#a8b5b2',
    padding: 10,
  },
  totalLabel: {
    width: '40%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  totalValue: {
    width: '30%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c2c2c',
    textAlign: 'right',
  },
  declarationSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f9f9f9',
    border: '1px solid #e5e5e5',
  },
  declarationText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: '#2c2c2c',
  },
  partiesSection: {
    marginBottom: 20,
  },
  partiesRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  partyLabel: {
    width: '25%',
    fontSize: 9,
    color: '#666666',
  },
  partyValue: {
    width: '75%',
    fontSize: 9,
    color: '#2c2c2c',
    fontWeight: 'bold',
  },
  signatureSection: {
    marginTop: 20,
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBox: {
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 8,
    color: '#2c2c2c',
  },
  stampBox: {
    width: 120,
    height: 60,
    border: '2px solid #7ba0a0',
    borderRadius: 4,
    backgroundColor: '#f0f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#5a7476',
    textAlign: 'center',
  },
  stampName: {
    fontSize: 10,
    color: '#2b2b2b',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  electronicSignature: {
    fontSize: 9,
    color: '#7CAA89',
    fontWeight: 'bold',
  },
  footerSection: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTop: '1px solid #e5e5e5',
  },
  footerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c2c2c',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLeft: {
    width: '70%',
  },
  footerText: {
    fontSize: 7.5,
    color: '#666666',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  footerElectronic: {
    fontSize: 7.5,
    color: '#5a7476',
    lineHeight: 1.4,
    marginTop: 6,
  },
  footerRight: {
    width: '25%',
    alignItems: 'flex-end',
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    border: '1px solid #cccccc',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontSize: 7,
    color: '#999999',
    textAlign: 'center',
  },
});

const QuittanceDocument: React.FC<{ data: QuittanceData }> = ({ data }) => {
  // Construire le nom complet du propriétaire
  const proprietaire = data.baillorName
    ? data.baillorName
    : `${data.prenomProprietaire || ''} ${data.nomProprietaire || ''}`.trim();
  const adresseProprietaire = data.baillorAddress || data.adresseProprietaire || '';
  const emailProprietaire = data.baillorEmail || '';
  const locataire = data.locataireName || `${data.prenomLocataire || ''} ${data.nomLocataire || ''}`.trim();
  const adresseLogement = data.logementAddress || data.adresseLogement || '';
  const periode = data.periode || data.moisLoyer || '';
  const loyer = data.loyer || data.montantLoyer || '0';
  const charges = data.charges || data.montantCharges || '0';

  const loyerNum = parseFloat(loyer) || 0;
  const chargesNum = parseFloat(charges) || 0;
  const total = loyerNum + chargesNum;

  const currentDate = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getPeriodDates = (periode: string) => {
    if (data.isProrata && data.dateDebut && data.dateFin) {
      const startDate = new Date(data.dateDebut);
      const endDate = new Date(data.dateFin);
      return {
        start: startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        end: endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      };
    }

    if (!periode || periode.trim() === '') {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      };
    }

    const [month, year] = periode.split(' ');
    const monthNames: { [key: string]: number } = {
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
  };

  const periodDates = getPeriodDates(periode);

  const getVille = (address: string | undefined): string => {
    if (!address) return 'Paris';
    const parts = address.split(',');
    const lastPart = parts[parts.length - 1].trim();
    const words = lastPart.split(' ').filter(w => w.length > 0);
    const ville = words.reverse().find(w => isNaN(Number(w)));
    return ville || 'Paris';
  };

  const ville = getVille(adresseProprietaire);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <View style={styles.headerTop}>
            <View style={styles.logoSection}>
              <Text style={styles.logoText}>
                <Text style={styles.logoAccent}>Quittance_S</Text>
              </Text>
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Quittance N°</Text>
              <Text style={styles.infoValue}>{currentDate.getTime().toString().slice(-8)}</Text>
              <Text style={styles.infoLabel}>Période</Text>
              <Text style={styles.infoValue}>{periode || '[Période]'}</Text>
              <Text style={styles.infoLabel}>Montant</Text>
              <Text style={styles.infoValue}>{total.toFixed(2)} €</Text>
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>QUITTANCE</Text>
            <Text style={styles.mainTitle}>DE LOYER</Text>
            <Text style={styles.subtitleDate}>Document généré le {formatDate(currentDate)}</Text>
          </View>

          <View style={styles.partiesSection}>
            <View style={styles.partiesRow}>
              <Text style={styles.partyLabel}>BAILLEUR</Text>
              <View style={{ width: '75%' }}>
                <Text style={styles.partyValue}>{proprietaire || '[Nom propriétaire]'}</Text>
                {adresseProprietaire && <Text style={[styles.infoLabel, { marginTop: 2 }]}>{adresseProprietaire}</Text>}
                {emailProprietaire && <Text style={[styles.infoLabel, { marginTop: 1 }]}>{emailProprietaire}</Text>}
              </View>
            </View>
            <View style={styles.partiesRow}>
              <Text style={styles.partyLabel}>LOCATAIRE</Text>
              <View style={{ width: '75%' }}>
                <Text style={styles.partyValue}>{locataire || '[Nom locataire]'}</Text>
                {data.locataireDomicileAddress && data.locataireDomicileAddress.trim() !== '' ? (
                  <View style={{ marginTop: 4 }}>
                    <Text style={[styles.infoLabel, { fontFamily: 'Helvetica-Bold', color: '#555555' }]}>Adresse de domicile :</Text>
                    <Text style={[styles.infoLabel, { marginTop: 1 }]}>{data.locataireDomicileAddress}</Text>
                  </View>
                ) : (
                  <Text style={[styles.infoLabel, { marginTop: 2 }]}>Locataire du bien ci-dessous</Text>
                )}
              </View>
            </View>
            <View style={styles.partiesRow}>
              <Text style={styles.partyLabel}>BIEN LOUÉ</Text>
              <Text style={styles.partyValue}>{adresseLogement || '[Adresse logement]'}</Text>
            </View>
          </View>

          <View style={styles.declarationSection}>
            <Text style={styles.declarationText}>
              Je soussigné(e) <Text style={{ fontWeight: 'bold' }}>{proprietaire || '[Propriétaire]'}</Text>, propriétaire du logement désigné ci-dessus,
              déclare avoir reçu de <Text style={{ fontWeight: 'bold' }}>{locataire || '[Locataire]'}</Text>, la somme de{' '}
              <Text style={{ fontWeight: 'bold' }}>{total.toFixed(2)} €</Text>{' '}
              ({numberToFrench(total) || 'zéro euro'}) au titre du paiement du loyer et des charges pour la période du{' '}
              <Text style={{ fontWeight: 'bold' }}>{periodDates.start || '[Date début]'}</Text> au <Text style={{ fontWeight: 'bold' }}>{periodDates.end || '[Date fin]'}</Text>{' '}
              et lui en donne quittance, sous réserve de tous mes droits.
            </Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderLarge]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderMedium]}>Montant</Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderSmall]}>Total</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel]}>Loyer mensuel</Text>
              <Text style={[styles.tableCell, styles.tableCellValue]}>{loyerNum.toFixed(2)} €</Text>
              <Text style={[styles.tableCell, styles.tableCellEmpty]}>{' '}</Text>
            </View>

            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.tableCellLabel]}>Provision pour charges</Text>
              <Text style={[styles.tableCell, styles.tableCellValue]}>{chargesNum.toFixed(2)} €</Text>
              <Text style={[styles.tableCell, styles.tableCellEmpty]}>{' '}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel]}>Régularisations</Text>
              <Text style={[styles.tableCell, styles.tableCellValue]}>0.00 €</Text>
              <Text style={[styles.tableCell, styles.tableCellEmpty]}>{' '}</Text>
            </View>

            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.tableCellLabel]}>Report du bail</Text>
              <Text style={[styles.tableCell, styles.tableCellValue]}>{' '}</Text>
              <Text style={[styles.tableCell, styles.tableCellEmpty]}>{' '}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
              <Text style={{ width: '30%' }}>{' '}</Text>
            </View>
          </View>

          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureText}>Fait à : {ville}</Text>
              <Text style={styles.signatureText}>Le : {formatDate(currentDate)}</Text>
              <Text style={styles.signatureLabel}>Signature du bailleur</Text>

              {data.isElectronicSignature ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.stampName}>{proprietaire || '[Propriétaire]'}</Text>
                  <Text style={styles.electronicSignature}>✓ Signature électronique</Text>
                </View>
              ) : (
                <View style={{ width: 120, height: 50, borderBottom: '1px solid #999999' }} />
              )}
            </View>
          </View>

          <View style={styles.footerSection}>
            <View style={styles.footerContent}>
              <View style={styles.footerLeft}>
                <Text style={styles.footerText}>
                  Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du montant du présent terme.
                </Text>
                <Text style={styles.footerText}>
                  Elle est à conserver pendant trois ans par le locataire (loi n° 89-462 du 6 juillet 1989 : art. 7-1).
                </Text>
                {data.isElectronicSignature && (
                  <Text style={styles.footerText}>
                    ✓ Quittance validée électroniquement par le bailleur le {formatDate(currentDate)} à {formatTime(currentDate)}, conformément à l'article 1367 du Code civil sur la valeur juridique de la signature électronique.
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export async function generateQuittancePDF(data: QuittanceData): Promise<Blob> {
  console.log('📄 Données reçues dans generateQuittancePDF:', {
    locataireName: data.locataireName,
    locataireDomicileAddress: data.locataireDomicileAddress,
    logementAddress: data.logementAddress
  });
  const doc = <QuittanceDocument data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}
