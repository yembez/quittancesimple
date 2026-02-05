import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface RevisionLetterData {
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
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#f5f5f0',
    padding: 30,
  },
  content: {
    backgroundColor: '#ffffff',
    padding: 40,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  expediteur: {
    width: '45%',
  },
  destinataire: {
    width: '45%',
    marginTop: 20,
  },
  attentionLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  expediteurTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7CAA89',
    marginBottom: 8,
  },
  section: {
    marginBottom: 15,
  },
  text: {
    fontSize: 10,
    color: '#2c2c2c',
    marginBottom: 4,
  },
  textGray: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 3,
  },
  textBold: {
    fontSize: 10,
    color: '#2c2c2c',
    marginBottom: 3,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 9,
    color: '#666666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5a7476',
    marginBottom: 10,
    marginTop: 10,
  },
  calculation: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginVertical: 15,
  },
  calcTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#5a7476',
    marginBottom: 8,
  },
  calcText: {
    fontSize: 10,
    color: '#2c2c2c',
    marginBottom: 5,
  },
  highlight: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5a7476',
    marginTop: 5,
  },
  footer: {
    fontSize: 8,
    color: '#999999',
    marginTop: 20,
  },
});

const RevisionLetterDocument: React.FC<{ data: RevisionLetterData }> = ({ data }) => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateEffetStr = data.dateEffet.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          {/* En-tête avec expéditeur et destinataire */}
          <View style={styles.headerRow}>
            {/* Expéditeur (Propriétaire) - Gauche */}
            <View style={styles.expediteur}>
              <Text style={styles.expediteurTitle}>Expéditeur</Text>
              <Text style={styles.textBold}>{data.baillorName}</Text>
              {data.baillorAddress.split(',').map((line, idx) => (
                <Text key={idx} style={styles.textGray}>{line.trim()}</Text>
              ))}
              <Text style={styles.dateText}>Fait le {dateStr}</Text>
            </View>

            {/* Destinataire (Locataire) - Droite */}
            <View style={styles.destinataire}>
              <Text style={styles.attentionLabel}>À l'attention de :</Text>
              <Text style={styles.textBold}>{data.locataireName}</Text>
              {data.locataireAddress.split(',').map((line, idx) => (
                <Text key={idx} style={styles.text}>{line.trim()}</Text>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.title}>Objet : Révision annuelle du loyer</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>Madame, Monsieur,</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>
              Conformément à la clause de révision prévue au bail signé pour le logement situé {data.logementAddress},
              je vous informe par la présente de la révision annuelle du loyer.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>
              Le loyer actuel de {data.ancienLoyer.toFixed(2)} € (hors charges) sera révisé à compter du premier mois de paiement suivant la notification de la présente, sans prorata.
            </Text>
          </View>

          <View style={styles.calculation}>
            <Text style={styles.calcTitle}>Calcul de la révision</Text>
            <Text style={styles.calcText}>
              Nouveau loyer = {data.ancienLoyer.toFixed(2)} € × ({data.irlNouveau} / {data.irlAncien})
            </Text>
            <Text style={styles.calcText}>
              IRL T{data.trimestre} {data.anneeAncienne} : {data.irlAncien} | IRL T{data.trimestre} {data.anneeNouvelle} : {data.irlNouveau}
            </Text>
            <Text style={styles.highlight}>
              Nouveau loyer : {data.nouveauLoyer.toFixed(2)} € (hors charges)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>
              Ce nouveau montant de loyer sera applicable à compter du premier mois de paiement suivant la notification de la présente, sans prorata, et devra être acquitté selon les modalités de paiement habituelles.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>
              Cette révision est calculée conformément aux dispositions légales en vigueur (article 17-c de la loi
              n° 89-462 du 6 juillet 1989) sur la base de l'indice de référence des loyers (IRL) publié par l'INSEE.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>
              Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>{data.baillorName}</Text>
          </View>

          <View style={styles.footer}>
            <Text>Courrier généré par Quittance Simple - Document juridiquement conforme</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export const generateRevisionLetterPDF = async (data: RevisionLetterData): Promise<Blob> => {
  const doc = <RevisionLetterDocument data={data} />;

  const blob = await pdf(doc).toBlob();
  return blob;
};
