import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
}

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  adresse: string;
  telephone?: string;
}

export default function Historique() {
  const navigate = useNavigate();
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: proprietaireData } = await supabase
        .from('proprietaires')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (proprietaireData) {
        setProprietaire(proprietaireData);

        const { data: quittancesData } = await supabase
          .from('quittances')
          .select('*')
          .eq('proprietaire_id', proprietaireData.id)
          .order('date_generation', { ascending: false });

        setQuittances(quittancesData || []);

        const { data: locatairesData } = await supabase
          .from('locataires')
          .select('*')
          .eq('proprietaire_id', proprietaireData.id);

        setLocataires(locatairesData || []);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-[#7CAA89] hover:text-[#6a9875] font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au tableau de bord
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-[#2b2b2b] mb-2">Historique des quittances</h1>
          <p className="text-gray-600 mb-6">Consultez et téléchargez toutes vos quittances générées</p>

          {quittances.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2 text-lg font-semibold">Aucune quittance générée</p>
              <p className="text-gray-500">
                Les quittances que vous générerez apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Locataire</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Période</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Date de génération</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">Montant</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quittances.map((q) => {
                    const locataire = locataires.find(l => l.id === q.locataire_id);
                    const periode = formatPeriode(q.periode_debut, q.periode_fin);
                    return (
                      <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-semibold text-gray-900">
                            {locataire?.prenom} {locataire?.nom}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{periode}</td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {new Date(q.date_generation).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="font-bold text-[#7CAA89]">{q.total.toFixed(2)} €</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => downloadQuittance(q)}
                            disabled={downloading === q.id}
                            className="inline-flex items-center gap-2 bg-[#7CAA89] hover:bg-[#6a9875] text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Download className="w-4 h-4" />
                            {downloading === q.id ? 'Téléchargement...' : 'Télécharger'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
