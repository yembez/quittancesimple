import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Home, FileText, Download, Crown, Edit2, Info, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import QuittancePreview from '../components/QuittancePreview';
import EditProprietaireModal from '../components/EditProprietaireModal';
import EditLocataireModal from '../components/EditLocataireModal';
import LocatairesTable from '../components/LocatairesTable';

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  adresse: string;
  telephone?: string;
  plan_type: string;
  max_locataires: number;
  max_quittances: number;
}

interface Locataire {
  id: string;
  proprietaire_id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse_logement: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  actif: boolean;
}

interface Quittance {
  id: string;
  proprietaire_id: string;
  locataire_id: string;
  periode_debut: string;
  periode_fin: string;
  loyer: number;
  charges: number;
  total: number;
  date_generation: string;
}

const FreeDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('tableau-de-bord');
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewQuittance, setPreviewQuittance] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditProprietaire, setShowEditProprietaire] = useState(false);
  const [editingLocataire, setEditingLocataire] = useState<Locataire | null>(null);

  useEffect(() => {
    const email = searchParams.get('email') || localStorage.getItem('proprietaireEmail');

    if (!email) {
      navigate('/');
      return;
    }

    loadDashboardData(email);
  }, [searchParams, navigate]);

  const loadDashboardData = async (email: string) => {
    try {
      setLoading(true);

      const { data: propData, error: propError } = await supabase
        .from('proprietaires')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (propError || !propData) {
        console.error('Erreur propriétaire:', propError);
        navigate('/');
        return;
      }

      if (propData.plan_type !== 'free') {
        navigate('/dashboard');
        return;
      }

      setProprietaire(propData);

      const { data: locatairesData } = await supabase
        .from('locataires')
        .select('*')
        .eq('proprietaire_id', propData.id)
        .eq('actif', true);

      if (locatairesData) {
        setLocataires(locatairesData);
      }

      const { data: quittancesData } = await supabase
        .from('quittances')
        .select('*')
        .eq('proprietaire_id', propData.id)
        .order('date_generation', { ascending: false })
        .limit(3);

      if (quittancesData) {
        setQuittances(quittancesData);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuittance = async (locataire: Locataire) => {
    if (!proprietaire) return;

    const currentDate = new Date();
    console.log('📅 handleGenerateQuittance - Date actuelle:', currentDate);
    console.log('📅 Mois actuel (index):', currentDate.getMonth());
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    console.log('📅 Période générée pour la preview:', `${month} ${year}`);

    const quittanceData = {
      baillorName: `${proprietaire.nom} ${proprietaire.prenom || ''}`.trim(),
      baillorAddress: proprietaire.adresse || '',
      baillorEmail: proprietaire.email,
      locataireName: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
      logementAddress: locataire.adresse_logement,
      loyer: locataire.loyer_mensuel.toFixed(2),
      charges: locataire.charges_mensuelles.toFixed(2),
      periode: `${month} ${year}`,
      isElectronicSignature: true,
      locataireId: locataire.id,
    };

    setPreviewQuittance(quittanceData);
    setShowPreviewModal(true);
  };

  const handleDeleteLocataire = async (locataire: Locataire) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${locataire.nom} ${locataire.prenom || ''} ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('locataires')
        .update({ actif: false })
        .eq('id', locataire.id);

      if (error) throw error;

      alert('✅ Locataire supprimé avec succès');
      if (proprietaire) {
        loadDashboardData(proprietaire.email);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleSaveQuittance = async (locataireId: string) => {
    if (!proprietaire) return;

    try {
      const locataire = locataires.find(l => l.id === locataireId);
      if (!locataire) return;

      const currentDate = new Date();
      console.log('📅 Génération quittance - Date actuelle:', currentDate);
      console.log('📅 Mois actuel (index):', currentDate.getMonth());
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      console.log('📅 Période générée:', firstDayOfMonth, 'à', lastDayOfMonth);

      const { error: saveError } = await supabase
        .from('quittances')
        .insert({
          proprietaire_id: proprietaire.id,
          locataire_id: locataireId,
          periode_debut: firstDayOfMonth.toISOString().split('T')[0],
          periode_fin: lastDayOfMonth.toISOString().split('T')[0],
          loyer: locataire.loyer_mensuel,
          charges: locataire.charges_mensuelles,
          signature_electronique: true,
          statut: 'generee',
          source: 'dashboard_gratuit',
          date_generation: new Date().toISOString()
        });

      if (saveError) {
        console.error('Erreur sauvegarde quittance:', saveError);
      } else {
        console.log('✅ Quittance enregistrée dans la base de données');
        const email = searchParams.get('email') || localStorage.getItem('proprietaireEmail');
        if (email) {
          loadDashboardData(email);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const formatPeriode = (dateStr: string) => {
    const date = new Date(dateStr);
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleDownloadQuittance = async (quittance: Quittance) => {
    if (!proprietaire) return;

    const locataire = locataires.find(l => l.id === quittance.locataire_id);
    if (!locataire) return;

    const quittanceData = {
      baillorName: `${proprietaire.nom} ${proprietaire.prenom || ''}`.trim(),
      baillorAddress: proprietaire.adresse || '',
      baillorEmail: proprietaire.email,
      locataireName: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
      logementAddress: locataire.adresse_logement,
      loyer: quittance.loyer.toFixed(2),
      charges: quittance.charges.toFixed(2),
      periode: formatPeriode(quittance.periode_debut),
      isElectronicSignature: true,
    };

    setPreviewQuittance(quittanceData);
    setShowPreviewModal(true);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7CAA89] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!proprietaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-base">Accès non autorisé</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#7CAA89] text-white px-6 py-3 rounded-lg font-semibold text-base"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-1 sticky top-24">
              <button
                onClick={() => setActiveTab('tableau-de-bord')}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-base ${
                  activeTab === 'tableau-de-bord'
                    ? 'bg-[#7CAA89]/10 text-[#7CAA89] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Tableau de bord</span>
              </button>
              <button
                onClick={() => setActiveTab('historique')}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-base ${
                  activeTab === 'historique'
                    ? 'bg-[#7CAA89]/10 text-[#7CAA89] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Historique</span>
              </button>
              <Link
                to="/pricing"
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-[#ed7862] hover:bg-[#ed7862]/10 font-semibold transition-colors text-base"
              >
                <Crown className="w-5 h-5" />
                <span>Passer à l'automatique</span>
              </Link>
            </nav>
          </div>

          <div className="lg:col-span-4">
            {activeTab === 'tableau-de-bord' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#2b2b2b]">Mes informations</h2>
                    <button
                      onClick={() => setShowEditProprietaire(true)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-[#7CAA89] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm">Modifier</span>
                    </button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-base">
                    <div>
                      <p className="text-sm text-gray-500">Nom complet</p>
                      <p className="font-semibold text-gray-900">{proprietaire.nom} {proprietaire.prenom}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{proprietaire.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Adresse</p>
                      <p className="text-gray-900">{proprietaire.adresse || 'Non renseignée'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[#2b2b2b]">Mes locataires</h2>
                      <p className="text-sm text-gray-500 mt-1">Plan gratuit : 1 locataire maximum</p>
                    </div>
                    <div className="relative group">
                      <button
                        disabled
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                      >
                        <UserPlus className="w-5 h-5" />
                        <span>Ajouter locataire</span>
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <p className="leading-relaxed">
                          Pour profiter de l'ajout de plusieurs locataires et de l'envoi automatique, essayez <span className="font-semibold">Quittance Automatique</span> pour <span className="font-semibold">1€/mois</span> et <span className="font-semibold">0,70€ par locataire supplémentaire</span>
                        </p>
                        <div className="absolute -top-2 right-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                      </div>
                    </div>
                  </div>

                  {locataires.length > 0 ? (
                    <LocatairesTable
                      locataires={locataires}
                      planType="free"
                      onEditLocataire={(loc) => setEditingLocataire(loc)}
                      onSendQuittance={() => {}}
                      onSendReminder={() => {}}
                      onDeleteLocataire={handleDeleteLocataire}
                      onDownloadQuittance={(loc) => handleGenerateQuittance(loc)}
                    />
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-gray-600 mb-4 text-base">Aucun locataire enregistré</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Générez une quittance gratuite depuis la page d'accueil pour enregistrer votre premier locataire.
                      </p>
                      <Link
                        to="/"
                        className="inline-block bg-[#7CAA89] hover:bg-[#6b9378] text-white px-6 py-3 rounded-lg font-semibold transition-colors text-base"
                      >
                        Générer une quittance
                      </Link>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-[#ed7862]/10 to-[#ed7862]/5 border-t border-[#ed7862]/20 p-6">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-[#ed7862] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#2b2b2b] mb-2 text-base">
                          Automatisez vos quittances dès 1 €/mois !
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Envoi automatique, relances locataires, historique complet et jusqu'à 10 locataires.
                        </p>
                        <Link
                          to="/pricing"
                          className="inline-flex items-center space-x-2 bg-[#ed7862] hover:bg-[#e56651] text-white px-6 py-2 rounded-lg font-semibold transition-colors text-base"
                        >
                          <span>Découvrir les plans payants</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'historique' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-[#2b2b2b]">Historique des quittances</h2>
                  <span className="text-base text-gray-500">
                    {quittances.length}/3 quittances
                  </span>
                </div>

                {quittances.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {quittances.map((quittance) => (
                      <div key={quittance.id} className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-[#2b2b2b] text-base">{formatPeriode(quittance.periode_debut)}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(quittance.date_generation).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="font-semibold text-[#2b2b2b] text-base">
                              {quittance.total.toFixed(2)}€
                            </span>
                            <button
                              onClick={() => handleDownloadQuittance(quittance)}
                              className="text-[#7CAA89] hover:text-[#6b9378] flex items-center space-x-1 transition-colors text-base"
                            >
                              <Download className="w-4 h-4" />
                              <span>Télécharger</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2 text-base">Aucune quittance générée</p>
                    <p className="text-sm text-gray-500">
                      Les quittances que vous générerez apparaîtront ici.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditProprietaire && proprietaire && (
        <EditProprietaireModal
          proprietaire={proprietaire}
          onClose={() => setShowEditProprietaire(false)}
          onSave={(updated) => {
            setProprietaire(updated);
            setShowEditProprietaire(false);
          }}
        />
      )}

      {editingLocataire && (
        <EditLocataireModal
          locataire={editingLocataire}
          onClose={() => setEditingLocataire(null)}
          onSave={(updated) => {
            setLocataires(locataires.map(l => l.id === updated.id ? updated : l));
            setEditingLocataire(null);
          }}
        />
      )}


      {showPreviewModal && previewQuittance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-[#2b2b2b]">Prévisualisation de la quittance</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewQuittance(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <QuittancePreview data={previewQuittance} />
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-6 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    try {
                      const { generateQuittancePDF } = await import('../utils/pdfGenerator');
                      const pdfBlob = await generateQuittancePDF(previewQuittance);

                      const url = URL.createObjectURL(pdfBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Quittance_${previewQuittance.periode.replace(/\s/g, '_')}_${previewQuittance.locataireName.replace(/\s/g, '_')}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);

                      if (previewQuittance.locataireId) {
                        await handleSaveQuittance(previewQuittance.locataireId);
                      }
                      setShowPreviewModal(false);
                      setPreviewQuittance(null);
                    } catch (error) {
                      console.error('Erreur téléchargement:', error);
                      alert('Erreur lors du téléchargement de la quittance');
                    }
                  }}
                  className="flex-1 bg-[#7CAA89] hover:bg-[#6b9378] text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors text-base"
                >
                  <Download className="w-5 h-5" />
                  <span>Télécharger en PDF</span>
                </button>

                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewQuittance(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors text-base"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeDashboard;
