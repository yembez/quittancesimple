import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Settings,
  ArrowRight,
  Edit2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import EditProprietaireModal from '../components/EditProprietaireModal';
import EditLocataireModal from '../components/EditLocataireModal';

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  adresse?: string;
  telephone?: string;
  plan_type?: string;
}

interface Locataire {
  id: string;
  proprietaire_id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse_logement: string;
  detail_adresse?: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  statut?: 'en_attente' | 'paye';
  actif: boolean;
}

interface Quittance {
  id: string;
  locataire_id: string;
  periode?: string;
  periode_debut?: string;
  periode_fin?: string;
  loyer: number;
  charges: number;
  total: number;
  date_generation: string;
  date_envoi?: string;
  statut?: 'generee' | 'envoyee' | 'archivee';
}

interface IRLReminder {
  id: string;
  proprietaire_id: string;
  reminder_date: string;
  status: string;
  irl_calculation_data?: any;
}

interface ChargesRevision {
  id: string;
  proprietaire_id: string;
  reminder_date: string;
  status: string;
}

const Overview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { proprietaire: contextProprietaire, refetchProprietaire } = useEspaceBailleur();
  const proprietaire = contextProprietaire as Proprietaire | null;
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [relances, setRelances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [irlReminder, setIRLReminder] = useState<IRLReminder | null>(null);
  const [chargesRevision, setChargesRevision] = useState<ChargesRevision | null>(null);
  const [bilanAnnuel, setBilanAnnuel] = useState({ loyers: 0, charges: 0, total: 0 });

  // Formulaire rappel révision des charges
  const [showChargesForm, setShowChargesForm] = useState(false);
  const [chargesReminderDate, setChargesReminderDate] = useState('');
  const [chargesSaving, setChargesSaving] = useState(false);
  const [chargesError, setChargesError] = useState('');

  // Formulaire rappel révision IRL
  const [showIRLForm, setShowIRLForm] = useState(false);
  const [irlReminderDate, setIRLReminderDate] = useState('');
  const [irlSaving, setIRLSaving] = useState(false);
  const [irlError, setIRLError] = useState('');

  // Modales édition (mêmes que Dashboard – sauvegarde en BDD, répercutée partout)
  const [showEditProprietaire, setShowEditProprietaire] = useState(false);
  const [editingLocataire, setEditingLocataire] = useState<Locataire | null>(null);

  useEffect(() => {
    if (proprietaire?.id) {
      loadDashboardData(proprietaire.id);
    }
  }, [proprietaire?.id]);

  const isProprietaireInfoComplete = (prop: Proprietaire | null): boolean => {
    if (!prop) return false;
    return !!(
      prop.nom &&
      prop.prenom &&
      prop.adresse &&
      prop.email &&
      prop.telephone
    );
  };

  const getMissingFieldsMessage = (prop: Proprietaire | null): string => {
    if (!prop) return "Veuillez compléter vos informations";
    const missingFields: string[] = [];
    if (!prop.nom || !prop.prenom) missingFields.push("le nom complet");
    if (!prop.adresse) missingFields.push("l'adresse complète");
    if (!prop.email) missingFields.push("l'email");
    if (!prop.telephone) missingFields.push("le numéro de téléphone");
    if (missingFields.length === 0) return "";
    if (missingFields.length === 1) {
      return `Il manque ${missingFields[0]} pour pouvoir automatiser les envois de quittances`;
    }
    const lastField = missingFields.pop();
    return `Il manque ${missingFields.join(", ")} et ${lastField} pour pouvoir automatiser les envois de quittances`;
  };

  const loadDashboardData = async (proprietaireId: string) => {
    try {
      setLoading(true);

      // Charger les locataires
      const { data: locatairesData } = await supabase
        .from('locataires')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .eq('actif', true);

      if (locatairesData) {
        setLocataires(locatairesData);
      }

      // Charger les quittances récentes (dernière par locataire)
      const { data: quittancesData } = await supabase
        .from('quittances')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .order('date_generation', { ascending: false });

      if (quittancesData) {
        // Grouper par locataire et prendre la dernière quittance envoyée, sinon la plus récente
        const latestByLocataire = new Map<string, Quittance>();
        quittancesData.forEach(q => {
          const existing = latestByLocataire.get(q.locataire_id);
          const qIsSent = q.statut === 'envoyee' || !!q.date_envoi;
          const existingIsSent = existing ? (existing.statut === 'envoyee' || !!existing.date_envoi) : false;
          
          // Prioriser les quittances envoyées
          if (!existing) {
            latestByLocataire.set(q.locataire_id, q);
          } else if (qIsSent && !existingIsSent) {
            // La nouvelle est envoyée, l'existante ne l'est pas -> prendre la nouvelle
            latestByLocataire.set(q.locataire_id, q);
          } else if (!qIsSent && existingIsSent) {
            // L'existante est envoyée, la nouvelle ne l'est pas -> garder l'existante
            // Ne rien faire
          } else {
            // Les deux ont le même statut d'envoi, prendre la plus récente
            const qDate = q.date_envoi ? new Date(q.date_envoi) : new Date(q.date_generation);
            const existingDate = existing.date_envoi ? new Date(existing.date_envoi) : new Date(existing.date_generation);
            if (qDate > existingDate) {
              latestByLocataire.set(q.locataire_id, q);
            }
          }
        });
        setQuittances(Array.from(latestByLocataire.values()));
      }

      // Charger les relances récentes (dernière par locataire)
      const { data: relancesData } = await supabase
        .from('relances')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .order('date_envoi', { ascending: false });

      if (relancesData) {
        // Grouper par locataire et prendre la dernière relance
        const latestByLocataire = new Map<string, any>();
        relancesData.forEach(r => {
          const existing = latestByLocataire.get(r.locataire_id);
          if (!existing || new Date(r.date_envoi) > new Date(existing.date_envoi)) {
            latestByLocataire.set(r.locataire_id, r);
          }
        });
        setRelances(Array.from(latestByLocataire.values()));
      }

      // Charger le rappel IRL
      const { data: irlData } = await supabase
        .from('irl_reminders')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .eq('status', 'scheduled')
        .order('reminder_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (irlData) {
        setIRLReminder(irlData);
      }

      // Charger le rappel révision charges (table à créer si nécessaire)
      try {
        const { data: chargesData } = await supabase
          .from('charges_revision_reminders')
          .select('*')
          .eq('proprietaire_id', proprietaireId)
          .eq('status', 'scheduled')
          .order('reminder_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (chargesData) {
          setChargesRevision(chargesData);
        }
      } catch (error) {
        // Table n'existe pas encore, on ignore l'erreur
        console.log('Table charges_revision_reminders non disponible');
      }

      // Calculer le bilan annuel
      await calculateBilanAnnuel(proprietaireId);

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setLoading(false);
    }
  };

  const calculateBilanAnnuel = async (proprietaireId: string) => {
    try {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

      const { data: quittancesData } = await supabase
        .from('quittances')
        .select('loyer, charges')
        .eq('proprietaire_id', proprietaireId)
        .gte('date_generation', startOfYear)
        .lte('date_generation', endOfYear);

      if (quittancesData) {
        const totalLoyers = quittancesData.reduce((sum, q) => sum + (q.loyer || 0), 0);
        const totalCharges = quittancesData.reduce((sum, q) => sum + (q.charges || 0), 0);
        setBilanAnnuel({
          loyers: totalLoyers,
          charges: totalCharges,
          total: totalLoyers + totalCharges
        });
      }
    } catch (error) {
      console.error('Erreur calcul bilan:', error);
    }
  };

  const getCombinedStatus = (locataire: Locataire, quittance?: Quittance, relance?: any): { 
    label: string; 
    color: string; 
    icon: any;
  } => {
    const isQuittanceSent = quittance ? (quittance.statut === 'envoyee' || !!quittance.date_envoi) : false;
    const hasReminder = !!relance && relance.date_envoi;
    
    // 1. Si quittance envoyée → "payé - Quittance envoyée" (une quittance est une preuve de paiement)
    if (isQuittanceSent) {
      return { 
        label: 'Payé - Quittance envoyée', 
        color: 'text-[#1e3a5f] bg-[#1e3a5f]/10', 
        icon: CheckCircle
      };
    }
    
    // 2. Si rappel envoyé récemment (moins de 7 jours) → "non payé - Relance envoyée"
    if (hasReminder) {
      const reminderDate = new Date(relance.date_envoi);
      const daysSinceReminder = Math.floor((new Date().getTime() - reminderDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceReminder <= 7) {
        return { 
          label: 'Non payé - Relance envoyée', 
          color: 'text-[#f4663b] bg-[#f4663b]/10', 
          icon: Clock
        };
      }
    }
    
    // 3. Par défaut → "non payé - Quittance à envoyer"
    return { 
      label: 'Non payé - Quittance à envoyer', 
      color: 'text-[#5e6478] bg-[#e8e7ef]', 
      icon: Clock
    };
  };

  const calculateDaysUntil = (dateString: string): number => {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTodayISO = () => new Date().toISOString().split('T')[0];

  const handleSaveChargesReminder = async () => {
    if (!proprietaire) return;
    if (!chargesReminderDate.trim()) {
      setChargesError('Veuillez choisir une date de rappel.');
      return;
    }
    const selected = new Date(chargesReminderDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    if (selected < today) {
      setChargesError('La date de rappel doit être dans le futur.');
      return;
    }
    setChargesError('');
    setChargesSaving(true);
    try {
      if (chargesRevision) {
        const { data, error } = await supabase
          .from('charges_revision_reminders')
          .update({ reminder_date: chargesReminderDate, updated_at: new Date().toISOString() })
          .eq('id', chargesRevision.id)
          .select()
          .single();
        if (error) throw error;
        setChargesRevision(data);
      } else {
        const { data, error } = await supabase
          .from('charges_revision_reminders')
          .insert({
            proprietaire_id: proprietaire.id,
            reminder_date: chargesReminderDate,
            status: 'scheduled'
          })
          .select()
          .single();
        if (error) throw error;
        setChargesRevision(data);
      }
      setShowChargesForm(false);
      setChargesReminderDate('');
    } catch (err: any) {
      console.error('Erreur enregistrement rappel charges:', err);
      setChargesError(err?.message || 'Erreur lors de l\'enregistrement. Réessayez.');
    } finally {
      setChargesSaving(false);
    }
  };

  const handleOpenChargesFormToEdit = () => {
    if (chargesRevision) {
      setChargesReminderDate(chargesRevision.reminder_date);
      setShowChargesForm(true);
      setChargesError('');
    }
  };

  const handleDeleteChargesReminder = async () => {
    if (!chargesRevision || !window.confirm('Supprimer ce rappel de révision des charges ?')) return;
    setChargesSaving(true);
    try {
      const { error } = await supabase
        .from('charges_revision_reminders')
        .update({ status: 'cancelled' })
        .eq('id', chargesRevision.id);
      if (error) throw error;
      setChargesRevision(null);
    } catch (err: any) {
      console.error('Erreur suppression rappel:', err);
      alert('Erreur lors de la suppression.');
    } finally {
      setChargesSaving(false);
    }
  };

  // Fonctions pour le formulaire IRL
  const handleSaveIRLReminder = async () => {
    if (!proprietaire) return;
    if (!irlReminderDate.trim()) {
      setIRLError('Veuillez choisir une date de rappel.');
      return;
    }
    const selected = new Date(irlReminderDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    if (selected < today) {
      setIRLError('La date de rappel doit être dans le futur.');
      return;
    }
    setIRLError('');
    setIRLSaving(true);
    try {
      if (irlReminder) {
        const { data, error } = await supabase
          .from('irl_reminders')
          .update({ reminder_date: irlReminderDate, updated_at: new Date().toISOString() })
          .eq('id', irlReminder.id)
          .select()
          .single();
        if (error) throw error;
        setIRLReminder(data);
      } else {
        const { data, error } = await supabase
          .from('irl_reminders')
          .insert({
            proprietaire_id: proprietaire.id,
            reminder_date: irlReminderDate,
            status: 'scheduled'
          })
          .select()
          .single();
        if (error) throw error;
        setIRLReminder(data);
      }
      setShowIRLForm(false);
      setIRLReminderDate('');
      // Recharger les données pour mettre à jour l'affichage
      if (proprietaire) {
        const { data: irlData } = await supabase
          .from('irl_reminders')
          .select('*')
          .eq('proprietaire_id', proprietaire.id)
          .eq('status', 'scheduled')
          .order('reminder_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (irlData) {
          setIRLReminder(irlData);
        }
      }
    } catch (err: any) {
      console.error('Erreur enregistrement rappel IRL:', err);
      setIRLError(err?.message || 'Erreur lors de l\'enregistrement. Réessayez.');
    } finally {
      setIRLSaving(false);
    }
  };

  const handleOpenIRLFormToEdit = () => {
    if (irlReminder) {
      setIRLReminderDate(irlReminder.reminder_date);
      setShowIRLForm(true);
      setIRLError('');
    }
  };

  const handleDeleteIRLReminder = async () => {
    if (!irlReminder || !window.confirm('Supprimer ce rappel de révision IRL ?')) return;
    setIRLSaving(true);
    try {
      const { error } = await supabase
        .from('irl_reminders')
        .update({ status: 'cancelled' })
        .eq('id', irlReminder.id);
      if (error) throw error;
      setIRLReminder(null);
    } catch (err: any) {
      console.error('Erreur suppression rappel IRL:', err);
      alert('Erreur lors de la suppression.');
    } finally {
      setIRLSaving(false);
    }
  };

  if (!proprietaire) return null;

  if (loading) {
    return (
      <main className="flex-1 px-4 sm:px-6 py-4 overflow-auto flex flex-col min-h-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1e3a5f] border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-[#5e6478]">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className="flex-1 min-h-0 overflow-auto bg-[#fafafa]">
      <div className="max-w-[67rem] mx-auto px-4 sm:px-5 py-5 sm:py-6">
            {/* Section Profil + Résumé en ligne */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
              {/* Carte Propriétaire — sobre, bordure légère */}
              {proprietaire && (
                <div className="lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 border-b border-[#1e3a5f]/50 bg-[#1e3a5f]/10 flex items-center justify-between gap-2">
                    <h2 className="text-[13px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Propriétaire</h2>
                    {!isProprietaireInfoComplete(proprietaire) ? (
                      <button onClick={() => setShowEditProprietaire(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white text-xs font-medium transition-colors">
                        <Edit2 className="w-3 h-3" /> Compléter
                      </button>
                    ) : (
                      <button onClick={() => setShowEditProprietaire(true)} className="flex items-center gap-1.5 text-[13px] text-[#64748b] hover:text-[#0f172a] transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Modifier
                      </button>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 space-y-2 text-[14px]">
                    <p className="font-medium text-[#0f172a]">{proprietaire.nom} {proprietaire.prenom || ''}</p>
                    <p className="text-[#64748b] truncate">{proprietaire.email}</p>
                    {proprietaire.adresse && <p className="text-[#64748b] line-clamp-2">{proprietaire.adresse}</p>}
                    {proprietaire.telephone && <p className="text-[#64748b]">{proprietaire.telephone}</p>}
                  </div>
                </div>
              )}

              {/* Bilan annuel — KPI mis en avant, style Stripe */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b border-[#1e3a5f]/50 bg-[#1e3a5f]/10 flex items-center justify-between gap-2">
                  <h2 className="text-[13px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Bilan annuel</h2>
                  <button onClick={() => navigate('/dashboard?tab=bilan-annuel')} className="text-[13px] text-[#0f172a] hover:text-[#475569] font-medium inline-flex items-center gap-1 transition-colors">
                    Détail <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-4 sm:p-5 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <div>
                    <p className="text-[12px] text-[#64748b]">Loyers</p>
                    <p className="text-lg font-semibold text-[#0f172a]">{bilanAnnuel.loyers.toFixed(0)} €</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#64748b]">Charges</p>
                    <p className="text-lg font-semibold text-[#0f172a]">{bilanAnnuel.charges.toFixed(0)} €</p>
                  </div>
                  <div className="border-l border-[#e2e8f0] pl-5">
                    <p className="text-[12px] text-[#64748b]">Total</p>
                    <p className="text-xl font-bold text-[#0f172a]">{bilanAnnuel.total.toFixed(0)} €</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section Locataires + Statut quittances — une seule carte large */}
            <section className="mb-5">
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b border-[#1e3a5f]/50 bg-[#1e3a5f]/10 flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Locataires & Quittances</h2>
                  <button onClick={() => navigate('/dashboard')} className="text-[13px] text-[#0f172a] hover:text-[#475569] font-medium inline-flex items-center gap-1 transition-colors">
                    Tableau de bord <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {locataires.length === 0 ? (
                  <div className="px-4 sm:px-5 py-8 text-center">
                    <p className="text-[14px] text-[#64748b]">Aucun locataire enregistré</p>
                    <button onClick={() => navigate('/dashboard')} className="mt-2 text-[13px] font-medium text-[#0f172a] hover:underline">Ajouter un locataire</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px] sm:text-[14px]">
                      <thead>
                        <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                          <th className="text-left py-2.5 px-4 font-medium text-[#64748b]">Nom</th>
                          <th className="text-left py-2.5 px-4 font-medium text-[#64748b] hidden sm:table-cell">Email</th>
                          <th className="text-left py-2.5 px-4 font-medium text-[#64748b]">Loyer</th>
                          <th className="text-left py-2.5 px-4 font-medium text-[#64748b]">Statut</th>
                          <th className="w-10 py-2.5 px-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {locataires.map(locataire => {
                          const quittance = quittances.find(q => q.locataire_id === locataire.id);
                          const relance = relances.find(r => r.locataire_id === locataire.id);
                          const status = getCombinedStatus(locataire, quittance, relance);
                          const StatusIcon = status.icon;
                          return (
                            <tr key={locataire.id} className="hover:bg-[#f8fafc] transition-colors">
                              <td className="py-2.5 px-4">
                                <button onClick={(e) => { e.stopPropagation(); setEditingLocataire(locataire); }} className="text-left font-medium text-[#0f172a] hover:underline block">
                                  {locataire.nom} {locataire.prenom || ''}
                                </button>
                                <p className="text-[12px] text-[#64748b] sm:hidden mt-0.5 truncate max-w-[180px]">{locataire.email || '—'}</p>
                              </td>
                              <td className="py-2.5 px-4 text-[#64748b] hidden sm:table-cell truncate max-w-[160px]">{locataire.email || '—'}</td>
                              <td className="py-2.5 px-4 text-[#64748b]">{locataire.loyer_mensuel.toFixed(0)} + {locataire.charges_mensuelles.toFixed(0)} €</td>
                              <td className="py-2.5 px-4">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] sm:text-[12px] font-medium ${status.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <button onClick={(e) => { e.stopPropagation(); setEditingLocataire(locataire); }} className="p-1 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors" aria-label="Modifier">
                                  <Edit2 className="w-3.5 h-3.5" />
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
            </section>

            {/* Section Rappels — IRL + Charges, cartes côte à côte épurées */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
              {/* Révision IRL */}
              {(irlReminder && !showIRLForm) ? (
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 border-b border-[#1e3a5f]/50 bg-[#1e3a5f]/10 flex items-center justify-between gap-2">
                    <h2 className="text-[13px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Révision IRL</h2>
                    <button onClick={() => navigate('/revision-irl')} className="p-1 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]" title="Configurer"><Settings className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="p-4 sm:p-5">
                  <p className="text-[13px] text-[#64748b] mb-3">Rappel prévu le <span className="font-medium text-[#0f172a]">{formatDate(irlReminder.reminder_date)}</span></p>
                  <div className="bg-[#f8fafc] rounded-lg py-3 px-3 mb-3 text-center">
                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-0.5">Jours restants</p>
                    <p className={`text-xl font-semibold tabular-nums ${calculateDaysUntil(irlReminder.reminder_date) <= 7 ? 'text-[#dc2626]' : calculateDaysUntil(irlReminder.reminder_date) <= 30 ? 'text-[#ea580c]' : 'text-[#0f172a]'}`}>
                      {calculateDaysUntil(irlReminder.reminder_date)}
                    </p>
                  </div>
                  <button onClick={handleOpenIRLFormToEdit} className="inline-flex px-5 py-2 rounded-lg text-[13px] font-medium bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white transition-colors">Gérer le rappel</button>
                  </div>
                </div>
              ) : showIRLForm ? (
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 border-b border-[#1e3a5f]/50 bg-[#1e3a5f]/10 flex items-center gap-2">
                    <h2 className="text-[13px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Révision IRL</h2>
                  </div>
                  <div className="p-4 sm:p-5">
                  <p className="text-[13px] text-[#64748b] mb-3">Rappel pour la révision des loyers (indice IRL).</p>
                  <label htmlFor="irl-reminder-date" className="block text-[12px] font-medium text-[#0f172a] mb-1">Date du rappel</label>
                  <input id="irl-reminder-date" type="date" min={getTodayISO()} value={irlReminderDate} onChange={(e) => setIRLReminderDate(e.target.value)} className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-[13px] focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]" />
                  {irlError && <p className="mt-1.5 text-[12px] text-[#dc2626]">{irlError}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSaveIRLReminder} disabled={irlSaving} className="inline-flex px-5 py-2 rounded-lg text-[13px] font-medium bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white disabled:opacity-50 transition-colors">Enregistrer</button>
                    <button onClick={() => { setShowIRLForm(false); setIRLReminderDate(''); setIRLError(''); }} disabled={irlSaving} className="px-3 py-2 rounded-lg text-[13px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">Annuler</button>
                  </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 border-b border-[#1e3a5f]/50 bg-[#1e3a5f]/10 flex items-center gap-2">
                    <h2 className="text-[13px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Révision IRL</h2>
                  </div>
                  <div className="p-4 sm:p-5">
                  <p className="text-[13px] text-[#64748b] mb-3">Rappel pour la révision des loyers (indice IRL).</p>
                  <label htmlFor="irl-reminder-date-new" className="block text-[12px] font-medium text-[#0f172a] mb-1">Date du rappel</label>
                  <input id="irl-reminder-date-new" type="date" min={getTodayISO()} value={irlReminderDate} onChange={(e) => setIRLReminderDate(e.target.value)} className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-[13px] focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]" />
                  {irlError && <p className="mt-1.5 text-[12px] text-[#dc2626]">{irlError}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSaveIRLReminder} disabled={irlSaving} className="inline-flex px-5 py-2 rounded-lg text-[13px] font-medium bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white disabled:opacity-50 transition-colors">Enregistrer</button>
                    <button onClick={() => { setIRLReminderDate(''); setIRLError(''); }} disabled={irlSaving} className="px-3 py-2 rounded-lg text-[13px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">Annuler</button>
                  </div>
                  </div>
                </div>
              )}

              {/* Révision des charges */}
              {(chargesRevision && !showChargesForm) ? (
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 border-b border-[#1e3a5f]/50 bg-[#1e3a5f]/10 flex items-center gap-2">
                    <h2 className="text-[13px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Révision des charges</h2>
                  </div>
                  <div className="p-4 sm:p-5">
                  <p className="text-[13px] text-[#64748b] mb-3">Rappel prévu le <span className="font-medium text-[#0f172a]">{formatDate(chargesRevision.reminder_date)}</span></p>
                  <div className="bg-[#f8fafc] rounded-lg py-3 px-3 mb-3 text-center">
                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-0.5">Jours restants</p>
                    <p className={`text-xl font-semibold tabular-nums ${calculateDaysUntil(chargesRevision.reminder_date) <= 7 ? 'text-[#dc2626]' : calculateDaysUntil(chargesRevision.reminder_date) <= 30 ? 'text-[#ea580c]' : 'text-[#0f172a]'}`}>
                      {calculateDaysUntil(chargesRevision.reminder_date)}
                    </p>
                  </div>
                  <button onClick={handleOpenChargesFormToEdit} className="inline-flex px-5 py-2 rounded-lg text-[13px] font-medium bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white transition-colors">Gérer le rappel</button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 border-b border-[#1e3a5f]/50 bg-[#1e3a5f]/10 flex items-center gap-2">
                    <h2 className="text-[13px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Révision des charges</h2>
                  </div>
                  <div className="p-4 sm:p-5">
                  <p className="text-[13px] text-[#64748b] mb-3">Rappel pour la régularisation annuelle des charges.</p>
                  <label htmlFor="charges-reminder-date" className="block text-[12px] font-medium text-[#0f172a] mb-1">Date du rappel</label>
                  <input id="charges-reminder-date" type="date" min={getTodayISO()} value={chargesReminderDate} onChange={(e) => setChargesReminderDate(e.target.value)} className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-[13px] focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]" />
                  {chargesError && <p className="mt-1.5 text-[12px] text-[#dc2626]">{chargesError}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSaveChargesReminder} disabled={chargesSaving} className="inline-flex px-5 py-2 rounded-lg text-[13px] font-medium bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white disabled:opacity-50 transition-colors">Enregistrer</button>
                    <button onClick={() => { setShowChargesForm(false); setChargesReminderDate(''); setChargesError(''); }} disabled={chargesSaving} className="px-3 py-2 rounded-lg text-[13px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">Annuler</button>
                  </div>
                  </div>
                </div>
              )}
            </section>
      </div>
    </main>

      {/* Modales d'édition (sauvegarde en BDD, répercutée sur quittances et documents) */}
      {showEditProprietaire && proprietaire && (
        <EditProprietaireModal
          proprietaire={{ ...proprietaire, adresse: proprietaire.adresse || '' }}
          onClose={() => setShowEditProprietaire(false)}
          onSave={async () => {
            await refetchProprietaire();
            setShowEditProprietaire(false);
            alert('✅ Informations mises à jour');
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
            alert('✅ Locataire mis à jour');
          }}
        />
      )}
    </>
  );
};

export default Overview;
