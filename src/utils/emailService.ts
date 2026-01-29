import { generateQuittancePDF } from './pdfGenerator';
import { supabase } from '../lib/supabase';

interface QuittanceData {
  baillorName: string;
  baillorAddress: string;
  baillorEmail: string;
  locataireName: string;
  logementAddress: string;
  locataireDomicileAddress?: string;
  loyer: string;
  charges: string;
  periode: string;
  isProrata?: boolean;
  dateDebut?: string;
  dateFin?: string;
  typeCalcul?: string;
  isElectronicSignature?: boolean;
}

interface EmailResult {
  success: boolean;
  message: string;
}

export async function sendQuittanceByEmail(quittanceData: QuittanceData): Promise<EmailResult> {
  try {
    // Nettoyer les données pour éviter les problèmes JSON
    const locataireDomicileAddressTrimmed = String(quittanceData.locataireDomicileAddress || '').trim();

    const cleanData = {
      baillorName: String(quittanceData.baillorName || '').trim(),
      baillorAddress: String(quittanceData.baillorAddress || '').trim(),
      baillorEmail: String(quittanceData.baillorEmail || '').trim(),
      locataireName: String(quittanceData.locataireName || '').trim(),
      logementAddress: String(quittanceData.logementAddress || '').trim(),
      ...(locataireDomicileAddressTrimmed && { locataireDomicileAddress: locataireDomicileAddressTrimmed }),
      loyer: String(quittanceData.loyer || '0'),
      charges: String(quittanceData.charges || '0'),
      periode: String(quittanceData.periode || ''),
      isProrata: Boolean(quittanceData.isProrata),
      dateDebut: quittanceData.dateDebut || '',
      dateFin: quittanceData.dateFin || '',
      typeCalcul: quittanceData.typeCalcul || '',
      isElectronicSignature: Boolean(quittanceData.isElectronicSignature)
    };

    const response = await supabase.functions.invoke('send-quittance', {
      body: cleanData,
    });

    if (response.error) {
      console.error('Erreur lors de l\'envoi:', response.error);
      return {
        success: false,
        message: response.error.message || 'Une erreur est survenue lors de l\'envoi.'
      };
    }

    const data = response.data;
    return {
      success: data?.success || true,
      message: data?.message || 'La quittance a été envoyée par email avec succès !'
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return {
      success: false,
      message: 'Une erreur est survenue lors de l\'envoi. Le PDF a été téléchargé.'
    };
  }
}
