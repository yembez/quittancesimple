import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

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
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  // Header moderne et épuré
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 35,
    paddingBottom: 18,
    borderBottom: '2px solid #2C3E50',
  },
  logo: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  headerInfo: {
    alignItems: 'flex-end',
  },
  headerLabel: {
    fontSize: 8,
    color: '#7F8C8D',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerValue: {
    fontSize: 10,
    color: '#2C3E50',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  // Titre
  titleSection: {
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#2C3E50',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 9,
    color: '#7F8C8D',
    marginTop: 4,
  },
  // Section parties (Bailleur, Locataire, Bien)
  partiesSection: {
    marginBottom: 25,
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 2,
  },
  partyRow: {
    marginBottom: 14,
  },
  partyLabel: {
    fontSize: 8,
    color: '#7F8C8D',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  partyValue: {
    fontSize: 10,
    color: '#2C2C2C',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 9,
    color: '#5D6D7E',
    marginTop: 2,
    lineHeight: 1.4,
  },
  // Déclaration
  declaration: {
    marginBottom: 25,
    padding: 16,
    backgroundColor: '#EBF5FB',
    borderLeft: '3px solid #3498DB',
    borderRadius: 2,
  },
  declarationText: {
    fontSize: 9.5,
    lineHeight: 1.6,
    color: '#2C2C2C',
  },
  // Tableau
  table: {
    marginBottom: 25,
    border: '1px solid #D5D8DC',
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2C3E50',
    padding: 10,
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1px solid #E5E7E9',
  },
  tableRowAlt: {
    backgroundColor: '#F8F9FA',
  },
  tableCell: {
    fontSize: 9.5,
    color: '#2C2C2C',
  },
  tableCellLabel: {
    width: '50%',
  },
  tableCellAmount: {
    width: '25%',
    textAlign: 'right',
  },
  tableCellTotal: {
    width: '25%',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#34495E',
    padding: 12,
  },
  totalLabel: {
    width: '50%',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  totalValue: {
    width: '25%',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  // Signature
  signatureSection: {
    marginTop: 30,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBox: {
    width: 200,
  },
  signatureInfo: {
    fontSize: 9,
    color: '#5D6D7E',
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 12,
  },
  signatureLine: {
    width: '100%',
    height: 50,
    borderBottom: '1px solid #BDC3C7',
  },
  electronicSignature: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#E8F8F5',
    borderRadius: 2,
    border: '1px solid #1ABC9C',
  },
  signatureName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  electronicBadge: {
    fontSize: 9,
    color: '#16A085',
    fontFamily: 'Helvetica-Bold',
  },
  // Footer - FIX DU BUG D'AFFICHAGE
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTop: '1px solid #D5D8DC',
  },
  footerText: {
    fontSize: 7.5,
    color: '#7F8C8D',
    lineHeight: 1.4,
    marginBottom: 5,
  },
  footerElectronic: {
    fontSize: 7.5,
    color: '#16A085',
    marginTop: 6,
    lineHeight: 1.4,
  },
});

const QuittanceDocument: React.FC<{ data: QuittanceData }> = ({ data }) => {
  // Construction des données
  const proprietaire = data.baillorName || `${data.prenomProprietaire || ''} ${data.nomProprietaire || ''}`.trim();
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>QUITTANCE SIMPLE</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.headerLabel}>N° Quittance</Text>
            <Text style={styles.headerValue}>{currentDate.getTime().toString().slice(-8)}</Text>
            <Text style={styles.headerLabel}>Période</Text>
            <Text style={styles.headerValue}>{periode || '[Période]'}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>QUITTANCE DE LOYER</Text>
          <Text style={styles.subtitle}>Document généré le {formatDate(currentDate)}</Text>
        </View>

        {/* Parties */}
        <View style={styles.partiesSection}>
          <View style={styles.partyRow}>
            <Text style={styles.partyLabel}>Bailleur</Text>
            <Text style={styles.partyValue}>{proprietaire || '[Nom propriétaire]'}</Text>
            {adresseProprietaire && <Text style={styles.partyDetail}>{adresseProprietaire}</Text>}
            {emailProprietaire && <Text style={styles.partyDetail}>{emailProprietaire}</Text>}
          </View>

          <View style={styles.partyRow}>
            <Text style={styles.partyLabel}>Locataire</Text>
            <Text style={styles.partyValue}>{locataire || '[Nom locataire]'}</Text>
            {data.locataireDomicileAddress && data.locataireDomicileAddress.trim() !== '' ? (
              <View>
                <Text style={[styles.partyDetail, { fontFamily: 'Helvetica-Bold', marginTop: 4 }]}>
                  Adresse de domicile :
                </Text>
                <Text style={styles.partyDetail}>{data.locataireDomicileAddress}</Text>
              </View>
            ) : (
              <Text style={styles.partyDetail}>Locataire du bien ci-dessous</Text>
            )}
          </View>

          <View style={styles.partyRow}>
            <Text style={styles.partyLabel}>Bien loué</Text>
            <Text style={styles.partyValue}>{adresseLogement || '[Adresse logement]'}</Text>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text style={styles.declarationText}>
            Je soussigné(e) <Text style={{ fontFamily: 'Helvetica-Bold' }}>{proprietaire || '[Propriétaire]'}</Text>, propriétaire du logement désigné ci-dessus,
            déclare avoir reçu de <Text style={{ fontFamily: 'Helvetica-Bold' }}>{locataire || '[Locataire]'}</Text>, la somme de{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{total.toFixed(2)} €</Text>{' '}
            ({numberToFrench(total)}) au titre du paiement du loyer et des charges pour la période du{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{periodDates.start}</Text> au <Text style={{ fontFamily: 'Helvetica-Bold' }}>{periodDates.end}</Text>{' '}
            et lui en donne quittance, sous réserve de tous mes droits.
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Montant</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}></Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableCellLabel]}>Loyer mensuel</Text>
            <Text style={[styles.tableCell, styles.tableCellAmount]}>{loyerNum.toFixed(2)} €</Text>
            <Text style={[styles.tableCell, styles.tableCellTotal]}></Text>
          </View>

          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCell, styles.tableCellLabel]}>Provision pour charges</Text>
            <Text style={[styles.tableCell, styles.tableCellAmount]}>{chargesNum.toFixed(2)} €</Text>
            <Text style={[styles.tableCell, styles.tableCellTotal]}></Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableCellLabel]}>Régularisations</Text>
            <Text style={[styles.tableCell, styles.tableCellAmount]}>0.00 €</Text>
            <Text style={[styles.tableCell, styles.tableCellTotal]}></Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total payé</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
            <Text style={{ width: '25%' }}></Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureInfo}>Fait à {ville}</Text>
            <Text style={styles.signatureInfo}>Le {formatDate(currentDate)}</Text>
            <Text style={styles.signatureLabel}>Signature du bailleur</Text>

            {data.isElectronicSignature ? (
              <View style={styles.electronicSignature}>
                <Text style={styles.signatureName}>{proprietaire || '[Propriétaire]'}</Text>
                <Text style={styles.electronicBadge}>✓ Signé électroniquement</Text>
              </View>
            ) : (
              <View style={styles.signatureLine} />
            )}
          </View>
        </View>

        {/* Footer - BUG CORRIGÉ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du montant du présent terme.
          </Text>
          <Text style={styles.footerText}>
            Elle est à conserver pendant trois ans par le locataire (loi n° 89-462 du 6 juillet 1989 : art. 7-1).
          </Text>
          {data.isElectronicSignature && (
            <Text style={styles.footerElectronic}>
              ✓ Quittance validée électroniquement par le bailleur le {formatDate(currentDate)} à {formatTime(currentDate)}, conformément à l'article 1367 du Code civil.
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export async function generateQuittancePDF(data: QuittanceData): Promise<Blob> {
  console.log('📄 Génération PDF moderne - Données:', {
    locataireName: data.locataireName,
    locataireDomicileAddress: data.locataireDomicileAddress,
    logementAddress: data.logementAddress
  });
  const doc = <QuittanceDocument data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}
