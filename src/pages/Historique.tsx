import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, CheckCircle, Clock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';

interface Quittance {
  id: string;
  proprietaire_id: string;
  locataire_id: string;
  periode_debut: string;
  periode_fin: string;
  loyer: number;
  charges: number;
  total: number;
  statut: string;
  date_generation: string;
  date_envoi?: string;
  pdf_url?: string;
}

interface Locataire {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  adresse_logement: string;
  detail_adresse?: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  statut?: 'en_attente' | 'paye';
}

export default function Historique() {
  const navigate = useNavigate();
  const { proprietaire } = useEspaceBailleur();
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const formatPeriode = (debut: string, fin: string) => {
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);
    const month = dateDebut.toLocaleDateString('fr-FR', { month: 'long' });
    const year = dateDebut.getFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  };

  useEffect(() => {
    if (proprietaire?.id) loadData();
  }, [proprietaire?.id]);

  const loadData = async () => {
    if (!proprietaire) return;
    try {
      const { data: quittancesData } = await supabase
        .from('quittances')
        .select('*')
        .eq('proprietaire_id', proprietaire.id)
        .order('date_generation', { ascending: false });

      setQuittances(quittancesData || []);

      const { data: locatairesData } = await supabase
        .from('locataires')
        .select('*')
        .eq('proprietaire_id', proprietaire.id);

      setLocataires(locatairesData || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQuittance = async (quittance: Quittance) => {
    try {
      setDownloading(quittance.id);
      const locataire = locataires.find(l => l.id === quittance.locataire_id);

      if (!locataire || !proprietaire) return;

      const { generateQuittancePDF } = await import('../utils/pdfGenerator');

      const periode = formatPeriode(quittance.periode_debut, quittance.periode_fin);

      const previewData = {
        nomProprietaire: proprietaire.nom,
        prenomProprietaire: proprietaire.prenom,
        adresseProprietaire: proprietaire.adresse,
        baillorName: `${proprietaire.prenom} ${proprietaire.nom}`,
        baillorAddress: proprietaire.adresse,
        baillorEmail: proprietaire.email,
        nomLocataire: locataire.nom,
        prenomLocataire: locataire.prenom,
        adresseLogement: locataire.adresse_logement,
        locataireName: `${locataire.prenom} ${locataire.nom}`,
        logementAddress: locataire.adresse_logement,
        locataireDomicileAddress: locataire.detail_adresse || locataire.adresse_logement,
        moisLoyer: new Date(quittance.date_generation).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        periode: periode,
        montantLoyer: quittance.loyer,
        montantCharges: quittance.charges,
        loyer: quittance.loyer.toString(),
        charges: quittance.charges.toString(),
        isProrata: false,
        typeCalcul: 'normal'
      };

      const pdfBlob = await generateQuittancePDF(previewData);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quittance_${periode.replace(/\s/g, '_')}_${locataire.nom}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    } finally {
      setDownloading(null);
    }
  };

  if (!proprietaire) return null;
  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 py-4 overflow-auto flex flex-col min-h-0 flex items-center justify-center">
        <p className="text-[13px] text-[#5e6478]">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-6 py-4 overflow-auto flex flex-col min-h-0">
          <div className="max-w-6xl mx-auto w-full flex flex-col gap-3 min-h-0">
            {quittances.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e8e7ef] p-6 text-center shrink-0">
                <FileText className="w-12 h-12 text-[#e8e7ef] mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-[#151b2c] mb-1">Aucune quittance générée</p>
                <p className="text-[12px] text-[#5e6478]">Les quittances que vous générerez apparaîtront ici.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#e8e7ef] overflow-hidden shrink-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] sm:text-[13px]">
                    <thead>
                      <tr className="border-b border-[#e8e7ef] bg-[#f5f5f7]/50">
                        <th className="text-left py-2 px-3 font-semibold text-[#151b2c] text-[11px] sm:text-[12px]">Locataire</th>
                        <th className="text-left py-2 px-3 font-semibold text-[#151b2c] text-[11px] sm:text-[12px]">Période</th>
                        <th className="text-left py-2 px-3 font-semibold text-[#151b2c] text-[11px] sm:text-[12px]">Date génération</th>
                        <th className="text-center py-2 px-3 font-semibold text-[#151b2c] text-[11px] sm:text-[12px]">Envoi</th>
                        <th className="text-center py-2 px-3 font-semibold text-[#151b2c] text-[11px] sm:text-[12px]">Paiement</th>
                        <th className="text-right py-2 px-3 font-semibold text-[#151b2c] text-[11px] sm:text-[12px]">Montant</th>
                        <th className="text-center py-2 px-3 font-semibold text-[#151b2c] text-[11px] sm:text-[12px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quittances.map((q) => {
                        const locataire = locataires.find(l => l.id === q.locataire_id);
                        const periode = formatPeriode(q.periode_debut, q.periode_fin);
                        const isSent = q.statut === 'envoyee' || !!q.date_envoi;
                        const isPaid = locataire?.statut === 'paye';
                        return (
                          <tr key={q.id} className="border-b border-[#e8e7ef]/80 hover:bg-[#f5f5f7] transition-colors">
                            <td className="py-2 px-3">
                              <p className="font-medium text-[#151b2c]">
                                {locataire?.prenom} {locataire?.nom}
                              </p>
                            </td>
                            <td className="py-2 px-3 text-[#5e6478]">{periode}</td>
                            <td className="py-2 px-3 text-[#5e6478]">
                              {new Date(q.date_generation).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isSent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[#1e3a5f] bg-[#1e3a5f]/10">
                                  <Mail className="w-3 h-3" />
                                  Envoyée
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[#5e6478] bg-[#e8e7ef]">
                                  <Clock className="w-3 h-3" />
                                  Non envoyée
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[#1e3a5f] bg-[#1e3a5f]/10">
                                  <CheckCircle className="w-3 h-3" />
                                  Payé
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[#5e6478] bg-[#e8e7ef]">
                                  <Clock className="w-3 h-3" />
                                  En attente
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <p className="font-semibold text-[#1e3a5f]">{q.total.toFixed(2)} €</p>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => downloadQuittance(q)}
                                disabled={downloading === q.id}
                                className="inline-flex items-center gap-1.5 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Download className="w-3.5 h-3.5" />
                                {downloading === q.id ? '...' : 'Télécharger'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
    </main>
  );
}
