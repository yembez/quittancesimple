import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Mail, CheckCircle, CreditCard, Calendar, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';

interface Proprietaire {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  abonnement_actif: boolean;
  plan_actuel: string;
  date_inscription: string;
  date_prochaine_facture?: string;
  montant_mensuel?: number;
}

interface Facture {
  id: string;
  proprietaire_id: string;
  numero_facture: string;
  date_emission: string;
  date_echeance: string;
  montant: number;
  statut: 'payee' | 'en_attente' | 'annulee';
  plan: string;
  periode_debut: string;
  periode_fin: string;
  pdf_url?: string;
}

const Billing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { proprietaire: contextProprietaire } = useEspaceBailleur();
  const proprietaire = contextProprietaire as Proprietaire | null;
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFactures, setSelectedFactures] = useState<Set<string>>(new Set());
  const [emailComptable, setEmailComptable] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [previewFacture, setPreviewFacture] = useState<Facture | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const pollingStarted = useRef(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (!proprietaire?.id) return;

    const loadData = async (proprietaireId: string) => {
      try {
        setLoading(true);

        const { data: facturesData, error: facturesError } = await supabase
          .from('factures')
          .select('*')
          .eq('proprietaire_id', proprietaireId)
          .order('date_emission', { ascending: false });

        if (!facturesError && facturesData) {
          setFactures(facturesData);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    if (success === 'true' && sessionId && !pollingStarted.current) {
      pollingStarted.current = true;
      setShowSuccessMessage(true);
      setIsRefreshing(true);

      loadData(proprietaire.id);

      let attempts = 0;
      const maxAttempts = 15;

      const pollForUpdates = setInterval(async () => {
        attempts++;
        console.log(`Polling for updates, attempt ${attempts}/${maxAttempts}`);
        await loadData(proprietaire.id);

        if (attempts >= maxAttempts) {
          clearInterval(pollForUpdates);
          setIsRefreshing(false);
          setShowSuccessMessage(false);
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollForUpdates);
        setIsRefreshing(false);
        setShowSuccessMessage(false);
      }, 30000);

      return () => clearInterval(pollForUpdates);
    } else {
      loadData(proprietaire.id);
    }
  }, [searchParams, proprietaire?.id]);

  const toggleFactureSelection = (factureId: string) => {
    const newSelection = new Set(selectedFactures);
    if (newSelection.has(factureId)) {
      newSelection.delete(factureId);
    } else {
      newSelection.add(factureId);
    }
    setSelectedFactures(newSelection);
  };

  const selectAllFactures = () => {
    if (selectedFactures.size === factures.length) {
      setSelectedFactures(new Set());
    } else {
      setSelectedFactures(new Set(factures.map(f => f.id)));
    }
  };

  const handleDownloadFacture = (facture: Facture) => {
    setPreviewFacture(facture);
  };

  const handleDownloadMultiple = () => {
    if (selectedFactures.size === 0) {
      alert('Veuillez sélectionner au moins une facture');
      return;
    }
    // TODO: Télécharger toutes les factures sélectionnées
    alert(`Téléchargement de ${selectedFactures.size} facture(s)`);
  };

  const handleSendToComptable = async () => {
    if (selectedFactures.size === 0) {
      alert('Veuillez sélectionner au moins une facture');
      return;
    }
    setShowEmailModal(true);
  };

  const generateFacturePDF = async (facture: Facture): Promise<string> => {
    const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');

    const styles = StyleSheet.create({
      page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
      title: { fontSize: 24, textAlign: 'center', marginBottom: 10, fontWeight: 'bold', color: '#1e3a8a' },
      subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 30, color: '#6b7280' },
      section: { marginBottom: 20 },
      sectionTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 6, color: '#1e40af' },
      text: { fontSize: 9, marginBottom: 3, color: '#374151' },
      tableHeader: { backgroundColor: '#f3f4f6', padding: 8, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
      tableRow: { padding: 8, flexDirection: 'row', justifyContent: 'space-between' },
      divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 10 },
      totalRow: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 12 },
      statusBox: { marginTop: 15, padding: 8, borderRadius: 6, width: 100, alignItems: 'center' },
      statusText: { fontSize: 9, fontWeight: 'bold', color: '#ffffff' },
      footer: { marginTop: 40, fontSize: 8, textAlign: 'center', color: '#9ca3af' },
    });

    const statusText = facture.statut === 'payee' ? 'PAYÉE' : facture.statut === 'en_attente' ? 'EN ATTENTE' : 'ANNULÉE';
    const statusColor = facture.statut === 'payee' ? '#10b981' : facture.statut === 'en_attente' ? '#f59e0b' : '#ef4444';

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>FACTURE</Text>
          <Text style={styles.subtitle}>N° {facture.numero_facture}</Text>

          <View style={styles.section}>
            <Text style={styles.text}>Quittance Simple</Text>
            <Text style={styles.text}>contact@quittancesimple.fr</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facturé à :</Text>
            <Text style={styles.text}>{proprietaire.prenom} {proprietaire.nom}</Text>
            <Text style={styles.text}>{proprietaire.email}</Text>
            <Text style={styles.text}>{proprietaire.adresse || ''}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>Date d'émission : {new Date(facture.date_emission).toLocaleDateString('fr-FR')}</Text>
            <Text style={styles.text}>Date d'échéance : {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}</Text>
            <Text style={styles.text}>Période : {new Date(facture.periode_debut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</Text>
          </View>

          <View style={styles.tableHeader}>
            <Text style={{ fontWeight: 'bold' }}>Description</Text>
            <Text style={{ fontWeight: 'bold' }}>Montant</Text>
          </View>

          <View style={styles.tableRow}>
            <Text>Abonnement {facture.plan}</Text>
            <Text>{facture.montant.toFixed(2)}€</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text>Total TTC :</Text>
            <Text>{facture.montant.toFixed(2)}€</Text>
          </View>

          <View style={[styles.statusBox, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>

          <View style={styles.footer}>
            <Text>Merci pour votre confiance.</Text>
            <Text>Pour toute question, contactez-nous à contact@quittancesimple.fr</Text>
          </View>
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleConfirmSendEmail = async () => {
    if (!emailComptable || !emailComptable.includes('@')) {
      alert('Veuillez entrer une adresse email valide');
      return;
    }

    setIsSendingEmail(true);

    try {
      const selectedFacturesArray = factures.filter(f => selectedFactures.has(f.id));

      const pdfAttachments = await Promise.all(
        selectedFacturesArray.map(async (facture) => {
          const pdfBase64 = await generateFacturePDF(facture);
          return {
            filename: `Facture-${facture.numero_facture}.pdf`,
            content: pdfBase64,
          };
        })
      );

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoices-email`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: emailComptable,
          proprietaire: {
            prenom: proprietaire.prenom,
            nom: proprietaire.nom,
            email: proprietaire.email,
          },
          factures: selectedFacturesArray,
          pdfAttachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${selectedFactures.size} facture(s) envoyée(s) à ${emailComptable} avec PDF joints`);
        setShowEmailModal(false);
        setEmailComptable('');
        setSelectedFactures(new Set());
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur envoi email:', error);
      alert('❌ Erreur lors de l\'envoi des factures');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!proprietaire) return null;

  return (
    <main className="flex-1 bg-gray-50 px-4 sm:px-6 py-4 sm:px-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 mb-1">
                Paiement réussi !
              </h3>
              <p className="text-sm text-green-700">
                Votre abonnement a été activé avec succès. Nous mettons à jour vos informations et générons votre facture...
              </p>
              {isRefreshing && (
                <div className="flex items-center space-x-2 mt-2">
                  <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
                  <span className="text-xs text-green-600">Actualisation en cours</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info abonnement détaillé */}
        {proprietaire.abonnement_actif ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-8">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Plan actuel</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {proprietaire.plan_actuel || 'Aucun'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nombre de locataires</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {proprietaire.nombre_locataires || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Statut</p>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Actif</span>
                  </div>
                </div>
                {proprietaire.montant_mensuel && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total mensuel</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {proprietaire.montant_mensuel.toFixed(2)}€/mois
                    </p>
                  </div>
                )}
                {proprietaire.date_prochaine_facture && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Prochaine facture</p>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(proprietaire.date_prochaine_facture).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate('/manage-subscription')}
                className="bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Gérer mon abonnement
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-4">
              <CreditCard className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun abonnement actif
                </h3>
                <p className="text-gray-700 mb-4">
                  Vous n'avez pas encore souscrit à un abonnement. Retournez dans le dashboard et choisissez une formule pour commencer à gérer vos quittances automatiquement.
                </p>
           
              </div>
            </div>
          </div>
        )}

        {/* Info sélection */}
        {selectedFactures.size === 0 && factures.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700">
              💡 Cochez les cases pour sélectionner plusieurs factures et les télécharger ou envoyer par email en une fois
            </p>
          </div>
        )}

        {/* Liste des factures */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Historique des factures</h2>
            {factures.length > 0 && (
              <div className="flex items-center space-x-3">
                {selectedFactures.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedFactures.size} sélectionnée(s)
                  </span>
                )}
                <div className="relative group">
                  <button
                    onClick={selectedFactures.size > 0 ? handleDownloadMultiple : undefined}
                    disabled={selectedFactures.size === 0}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                      selectedFactures.size > 0
                        ? 'bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger</span>
                  </button>
                  {selectedFactures.size === 0 && (
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded py-2 px-3 z-50 pointer-events-none">
                      Cochez les cases pour télécharger des factures
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                    </div>
                  )}
                </div>
                <div className="relative group">
                  <button
                    onClick={selectedFactures.size > 0 ? handleSendToComptable : undefined}
                    disabled={selectedFactures.size === 0}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                      selectedFactures.size > 0
                        ? 'bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Envoyer par email</span>
                  </button>
                  {selectedFactures.size === 0 && (
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded py-2 px-3 z-50 pointer-events-none">
                      Cochez les cases pour envoyer des factures par email
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {factures.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Numéro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedFactures.size === factures.length && factures.length > 0}
                        onChange={selectAllFactures}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {factures.map((facture) => (
                    <tr key={facture.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {facture.numero_facture}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(facture.periode_debut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {facture.montant.toFixed(2)}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          facture.statut === 'payee'
                            ? 'bg-gray-100 text-gray-700'
                            : facture.statut === 'en_attente'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {facture.statut === 'payee' ? 'Payée' : facture.statut === 'en_attente' ? 'En attente' : 'Annulée'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDownloadFacture(facture)}
                          className="text-blue-600 hover:text-blue-700 transition-colors flex items-center space-x-1"
                        >
                          <span className="text-sm font-medium">Voir</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedFactures.has(facture.id)}
                          onChange={() => toggleFactureSelection(facture.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucune facture disponible</p>
              {!proprietaire.abonnement_actif && (
                <p className="text-sm text-gray-500">
                  Vos factures apparaîtront ici après la souscription à un abonnement
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal envoi email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Envoyer les factures par email
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedFactures.size} facture(s) sélectionnée(s)
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email du destinataire (ex: votre comptable)
              </label>
              <input
                type="email"
                value={emailComptable}
                onChange={(e) => setEmailComptable(e.target.value)}
                placeholder="comptable@exemple.fr"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailComptable('');
                }}
                disabled={isSendingEmail}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSendEmail}
                disabled={isSendingEmail}
                className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#1a2f4d] disabled:bg-gray-400 text-white rounded-md text-sm font-semibold transition-colors flex items-center space-x-2 disabled:cursor-not-allowed"
              >
                {isSendingEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Envoyer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview facture */}
      {previewFacture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Facture {previewFacture.numero_facture}
              </h3>
              <button
                onClick={() => setPreviewFacture(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div id="facture-preview" className="p-8">
              {/* En-tête facture */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">FACTURE</h1>
                  <p className="text-sm text-gray-600">N° {previewFacture.numero_facture}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Date d'émission</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(previewFacture.date_emission).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Informations */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Émetteur</h3>
                  <div className="text-sm text-gray-900">
                    <p className="font-semibold">Quittance Simple</p>
                    <p>Service de gestion locative</p>
                    <p>contact@quittancesimple.fr</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Client</h3>
                  <div className="text-sm text-gray-900">
                    <p className="font-semibold">{proprietaire.prenom} {proprietaire.nom}</p>
                    <p>{proprietaire.email}</p>
                    <p>{proprietaire.adresse}</p>
                  </div>
                </div>
              </div>

              {/* Détails facture */}
              <div className="border-t border-b border-gray-200 py-4 mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-center">Période</th>
                      <th className="pb-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-sm text-gray-900">
                      <td className="py-3">
                        <p className="font-medium">Abonnement {previewFacture.plan}</p>
                        <p className="text-xs text-gray-500">Service de gestion automatisée</p>
                      </td>
                      <td className="py-3 text-center">
                        {new Date(previewFacture.periode_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - {new Date(previewFacture.periode_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {previewFacture.montant.toFixed(2)}€
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Sous-total HT</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(previewFacture.montant / 1.20).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">TVA (20%)</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(previewFacture.montant - previewFacture.montant / 1.20).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-900">
                    <span className="text-base font-semibold text-gray-900">Total TTC</span>
                    <span className="text-xl font-bold text-gray-900">
                      {previewFacture.montant.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>

              {/* Mentions légales */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-xs text-gray-500 mb-2">
                  <strong>Conditions de paiement :</strong> Paiement à réception
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  <strong>Date d'échéance :</strong> {new Date(previewFacture.date_echeance).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-xs text-gray-500">
                  En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée,
                  ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40€.
                </p>
              </div>

              {/* Statut */}
              <div className="mt-6 text-center">
                <span className={`inline-block px-4 py-2 rounded-md text-sm font-semibold ${
                  previewFacture.statut === 'payee'
                    ? 'bg-gray-100 text-gray-700'
                    : previewFacture.statut === 'en_attente'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {previewFacture.statut === 'payee' ? '✓ PAYÉE' : previewFacture.statut === 'en_attente' ? 'EN ATTENTE DE PAIEMENT' : 'ANNULÉE'}
                </span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setPreviewFacture(null)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  // Télécharger le PDF
                  alert('Téléchargement de la facture en PDF...');
                }}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Billing;
