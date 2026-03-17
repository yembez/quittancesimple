import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  analyzeLeads,
  exportSegmentToCSV,
  type AnalyzeLeadsResult,
  type LeadSegment,
  type ProprietaireRow,
} from '../utils/emailAnalyzer';

const SEGMENT_LABELS: Record<string, string> = {
  hot: '🔥 HOT',
  warm: '⚡ WARM',
  cold: '❄️ COLD',
  inactive: '💤 INACTIVE',
  invalid: '❌ Invalid',
};

const TABLE_LIMIT = 50;
const PRIX_MENSUEL = 9.9;

const ADMIN_ANALYTICS_STORAGE_KEY = 'admin_analytics_auth';
const ADMIN_LOGIN = 'yem';
const ADMIN_PASSWORD = 'Lucie2007!';

function htmlToPlainText(html: string): string {
  if (!html) return '';
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>\s*<p>/gi, '\n\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<li>/gi, '- ');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/<[^>]+>/g, '');
  return text.trim();
}

function plainTextToHtml(text: string): string {
  if (!text) return '';
  const normalized = text.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return '';
  return paragraphs
    .map((p) => {
      const withLineBreaks = p.replace(/\n/g, '<br>');
      return `<p style="margin: 0 0 1.15em 0; line-height: 1.75;">${withLineBreaks}</p>`;
    })
    .join('');
}

function getStoredAuth(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(ADMIN_ANALYTICS_STORAGE_KEY) === '1';
}

const AdminAnalytics: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(getStoredAuth);
  const [loginValue, setLoginValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [loginError, setLoginError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<AnalyzeLeadsResult | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [triggerCampaign, setTriggerCampaign] = useState<'j2' | 'j5' | 'j8' | null>(null);
  const [triggerLimit, setTriggerLimit] = useState<number>(50);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerError, setTriggerError] = useState<string>('');
  const [triggerResult, setTriggerResult] = useState<{ sent?: number; message?: string } | null>(null);

  const [editCampaign, setEditCampaign] = useState<'j2' | 'j5' | 'j8' | null>(null);
  const [editForm, setEditForm] = useState({ subject: '', bodyHtml: '', ctaText: '', ctaUrl: '', closingHtml: '' });
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string>('');
  const [editSuccess, setEditSuccess] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [testSendLoading, setTestSendLoading] = useState(false);
  const [testSendResult, setTestSendResult] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editViewBody, setEditViewBody] = useState<'source' | 'preview'>('preview');
  const [editViewSignature, setEditViewSignature] = useState<'source' | 'preview'>('preview');
  const [editBodyText, setEditBodyText] = useState('');
  const [ctaClicks, setCtaClicks] = useState<{ j2: number; j5: number; j8: number; total: number } | null>(null);
  const [openStats, setOpenStats] = useState<{ j2: number; j5: number; j8: number; total: number } | null>(null);

  type TrialEmailLog = {
    reminder_type: string;
    sent_at: string | null;
  };

  type TrialLeadReportRow = {
    id: string;
    email: string;
    nom: string | null;
    prenom: string | null;
    date_inscription: string | null;
    date_fin_essai: string | null;
    days_remaining: number | null;
    nombre_quittances: number;
    lead_statut: string | null;
    password_set: boolean;
    welcome_email_sent_at: string | null;
    campaign_j2_sent_at: string | null;
    campaign_j5_sent_at: string | null;
    campaign_j8_sent_at: string | null;
    origine: 'quittance_gratuite' | 'vierge';
    trial_emails: TrialEmailLog[];
  };

  const [trialLeads, setTrialLeads] = useState<TrialLeadReportRow[] | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState('');
  const [trialStats, setTrialStats] = useState<{ count: number; active: number; expired: number } | null>(null);
  const [freeAccountLeads, setFreeAccountLeads] = useState<TrialLeadReportRow[] | null>(null);
  const [freeStats, setFreeStats] = useState<{ count: number; active: number; expired: number } | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const login = (loginValue || '').trim();
    const password = passwordValue || '';
    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_ANALYTICS_STORAGE_KEY, '1');
      setAuthenticated(true);
    } else {
      setLoginError('Identifiants incorrects.');
    }
  };

  const fetchAndAnalyze = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('proprietaires')
        .select('id, email, nom, prenom, created_at, nombre_quittances, device_type, campaign_j2_sent_at, campaign_j5_sent_at, campaign_j8_sent_at')
        .order('created_at', { ascending: false });

      if (err) {
        setError(err.message);
        setResult(null);
        return;
      }

      const rows = (data || []) as ProprietaireRow[];
      const analysis = analyzeLeads(rows);
      setResult(analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCtaStats = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.functions.invoke('get-campaign-cta-stats', {
        body: { adminPassword: ADMIN_PASSWORD },
      });
      if (err) {
        setCtaClicks(null);
        return;
      }
      const d = data as { j2?: number; j5?: number; j8?: number; total?: number } | null;
      if (d && typeof d.j2 === 'number' && typeof d.j5 === 'number' && typeof d.j8 === 'number') {
        setCtaClicks({
          j2: d.j2,
          j5: d.j5,
          j8: d.j8,
          total: typeof d.total === 'number' ? d.total : d.j2 + d.j5 + d.j8,
        });
      } else {
        setCtaClicks(null);
      }
    } catch {
      setCtaClicks(null);
    }
  }, []);

  const fetchOpenStats = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.functions.invoke('get-campaign-open-stats', {
        body: { adminPassword: ADMIN_PASSWORD },
      });
      if (err) {
        setOpenStats(null);
        return;
      }
      const d = data as { j2?: number; j5?: number; j8?: number; total?: number } | null;
      if (d && typeof d.j2 === 'number' && typeof d.j5 === 'number' && typeof d.j8 === 'number') {
        setOpenStats({
          j2: d.j2,
          j5: d.j5,
          j8: d.j8,
          total: typeof d.total === 'number' ? d.total : d.j2 + d.j5 + d.j8,
        });
      } else {
        setOpenStats(null);
      }
    } catch {
      setOpenStats(null);
    }
  }, []);

  const fetchTrialLeads = useCallback(async () => {
    setTrialLoading(true);
    setTrialError('');
    try {
      const { data, error } = await supabase.functions.invoke('get-trial-leads-report', {
        body: { adminPassword: ADMIN_PASSWORD },
      });
      if (error) {
        setTrialError(error.message || 'Erreur chargement leads essai');
        setTrialLeads(null);
        setTrialStats(null);
        return;
      }
      if (!data || (data as any).error) {
        setTrialError((data as any)?.error || 'Erreur chargement leads essai');
        setTrialLeads(null);
        setTrialStats(null);
        return;
      }
      const payload = data as {
        trialLeads?: TrialLeadReportRow[];
        trialStats?: { count?: number; active?: number; expired?: number };
        freeLeads?: TrialLeadReportRow[];
        freeStats?: { count?: number; active?: number; expired?: number };
      } | null;
      const trialRows = payload?.trialLeads ?? [];
      const trialS = payload?.trialStats;
      const freeRows = payload?.freeLeads ?? [];
      const freeS = payload?.freeStats;

      setTrialLeads(trialRows);
      if (trialS && typeof trialS.count === 'number') {
        setTrialStats({
          count: trialS.count ?? trialRows.length,
          active: trialS.active ?? 0,
          expired: trialS.expired ?? 0,
        });
      } else {
        setTrialStats(null);
      }

      setFreeAccountLeads(freeRows);
      if (freeS && typeof freeS.count === 'number') {
        setFreeStats({
          count: freeS.count ?? freeRows.length,
          active: freeS.active ?? 0,
          expired: freeS.expired ?? 0,
        });
      } else {
        setFreeStats(null);
      }
    } catch (e) {
      setTrialError(e instanceof Error ? e.message : String(e));
      setTrialLeads(null);
      setTrialStats(null);
      setFreeAccountLeads(null);
      setFreeStats(null);
    } finally {
      setTrialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchAndAnalyze();
      fetchCtaStats();
      fetchOpenStats();
      fetchTrialLeads();
    }
  }, [authenticated, fetchAndAnalyze, fetchCtaStats, fetchOpenStats, fetchTrialLeads]);

  const handleExportAllValid = () => {
    if (!result) return;
    exportSegmentToCSV(result.validLeads, 'tous_valides');
  };

  const handleExportHot = () => {
    if (!result) return;
    exportSegmentToCSV(result.segments.hot, 'hot');
  };

  const freeLeadsWithQuittances = result
    ? result.validLeads.filter((l) => l.nombre_quittances >= 1)
    : [];
  const sentJ2Leads = freeLeadsWithQuittances.filter((l) => !!l.campaign_j2_sent_at);
  const sentJ5Leads = freeLeadsWithQuittances.filter((l) => !!l.campaign_j5_sent_at);
  const sentJ8Leads = freeLeadsWithQuittances.filter((l) => !!l.campaign_j8_sent_at);
  const pendingJ2 = freeLeadsWithQuittances.filter((l) => !l.campaign_j2_sent_at).length;
  const sentJ2 = sentJ2Leads.length;
  const pendingJ5 = freeLeadsWithQuittances.filter((l) => !l.campaign_j5_sent_at).length;
  const sentJ5 = sentJ5Leads.length;
  const pendingJ8 = freeLeadsWithQuittances.filter((l) => !l.campaign_j8_sent_at).length;
  const sentJ8 = sentJ8Leads.length;

  const exportSentCampaignCSV = (leads: LeadSegment[], campaignLabel: string, dateField: 'campaign_j2_sent_at' | 'campaign_j5_sent_at' | 'campaign_j8_sent_at') => {
    const date = new Date().toISOString().slice(0, 10);
    const header = 'email;nom;prenom;date_envoi\n';
    const lines = leads.map((l) => {
      const sentAt = l[dateField] ? new Date(l[dateField]!).toLocaleString('fr-FR') : '';
      return `"${(l.email || '').replace(/"/g, '""')}";"${(l.nom || '').replace(/"/g, '""')}";"${(l.prenom || '').replace(/"/g, '""')}";"${sentAt}"`;
    });
    const csv = '\uFEFF' + header + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campagne_${campaignLabel}_destinataires_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openTriggerModal = (campaign: 'j2' | 'j5' | 'j8') => {
    setTriggerCampaign(campaign);
    setTriggerError('');
    setTriggerResult(null);
    setShowTriggerModal(true);
  };

  const openEditModal = (campaign: 'j2' | 'j5' | 'j8') => {
    setEditCampaign(campaign);
    setEditForm({ subject: '', bodyHtml: '', ctaText: '', ctaUrl: '', closingHtml: '' });
    setEditPassword('');
    setEditError('');
    setEditSuccess('');
    setTestEmail('');
    setTestSendResult('');
    setEditViewBody('preview');
    setEditViewSignature('preview');
    setEditBodyText('');
    setShowEditModal(true);
  };

  const previewClosingHtml = editForm.closingHtml || '';

  const loadCampaignContent = async () => {
    if (!editCampaign) return;
    if (!editPassword.trim()) {
      setEditError('Saisissez votre mot de passe admin pour charger le contenu.');
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      const { data, error } = await supabase.functions.invoke('get-campaign-content', {
        body: { adminPassword: editPassword.trim() },
      });
      if (error) {
        setEditError(error.message || 'Erreur chargement');
        return;
      }
      if (data?.error) {
        setEditError(data.error);
        return;
      }
      const key = editCampaign as 'j2' | 'j5' | 'j8';
      const c = data?.[key];
      if (c) {
        setEditForm({
          subject: c.subject ?? '',
          bodyHtml: c.bodyHtml ?? '',
          ctaText: c.ctaText ?? '',
          ctaUrl: c.ctaUrl ?? '',
          closingHtml: c.closingHtml ?? '',
        });
        setEditBodyText(htmlToPlainText(c.bodyHtml ?? ''));
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCampaign || !editPassword.trim()) {
      setEditError('Mot de passe admin requis pour enregistrer.');
      return;
    }
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const { data, error } = await supabase.functions.invoke('update-campaign-content', {
        body: {
          adminPassword: editPassword.trim(),
          campaign: editCampaign,
          subject: editForm.subject,
          bodyHtml: editForm.bodyHtml,
          ctaText: editForm.ctaText,
          ctaUrl: editForm.ctaUrl,
          closingHtml: editForm.closingHtml,
        },
      });
      if (error) {
        setEditError(error.message || 'Erreur');
        return;
      }
      if (data?.error) {
        setEditError(data.error);
        return;
      }
      setEditSuccess('Contenu enregistré.');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPassword.trim()) {
      setEditError('Mot de passe admin requis.');
      return;
    }
    const email = testEmail.trim();
    if (!email || !email.includes('@')) {
      setTestSendResult('Indiquez une adresse e-mail valide.');
      return;
    }
    setTestSendLoading(true);
    setEditError('');
    setTestSendResult('');
    try {
      const { data, error } = await supabase.functions.invoke('send-campaign-test', {
        body: {
          adminPassword: editPassword.trim(),
          testEmail: email,
          payload: {
            subject: editForm.subject,
            bodyHtml: editForm.bodyHtml,
            ctaText: editForm.ctaText,
            ctaUrl: editForm.ctaUrl,
            closingHtml: editForm.closingHtml,
          },
        },
      });
      if (error) {
        setTestSendResult(error.message || 'Erreur');
        return;
      }
      if (data?.error) {
        setTestSendResult(data.error);
        return;
      }
      setTestSendResult(data?.message ?? 'E-mail de test envoyé.');
    } catch (err) {
      setTestSendResult(err instanceof Error ? err.message : String(err));
    } finally {
      setTestSendLoading(false);
    }
  };

  const handleTriggerCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerCampaign) return;
    setTriggerLoading(true);
    setTriggerError('');
    setTriggerResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-trigger-campaign', {
        body: { campaign: triggerCampaign, limit: triggerLimit },
      });
      if (error) {
        setTriggerError(error.message || 'Erreur inconnue');
        return;
      }
      if (data?.error) {
        const msg = [data.error, (data as { hint?: string }).hint].filter(Boolean).join(' ');
        setTriggerError(msg);
        return;
      }
      setTriggerResult({ sent: data?.sent, message: data?.message });
      fetchAndAnalyze();
    } catch (err) {
      setTriggerError(err instanceof Error ? err.message : String(err));
    } finally {
      setTriggerLoading(false);
    }
  };

  const filteredTableLeads = (): LeadSegment[] => {
    if (!result) return [];
    if (segmentFilter === 'all') return result.validLeads.slice(0, TABLE_LIMIT);
    const seg = result.segments[segmentFilter as keyof typeof result.segments];
    return (seg || []).slice(0, TABLE_LIMIT);
  };

  const tableLeads = filteredTableLeads();
  const totalInFilter =
    segmentFilter === 'all'
      ? result?.validLeads.length ?? 0
      : (result?.segments[segmentFilter as keyof typeof result.segments]?.length ?? 0);

  const conservativeMRR =
    result &&
    (result.segments.hot.length * 0.2 +
      result.segments.warm.length * 0.15 +
      result.segments.cold.length * 0.1) *
      PRIX_MENSUEL;
  const realisticMRR =
    result &&
    (result.segments.hot.length * 0.22 +
      result.segments.warm.length * 0.18 +
      result.segments.cold.length * 0.12) *
      PRIX_MENSUEL;
  const optimisticMRR =
    result &&
    (result.segments.hot.length * 0.25 +
      result.segments.warm.length * 0.2 +
      result.segments.cold.length * 0.15) *
      PRIX_MENSUEL;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-md border border-[#e5e7eb] p-6">
          <h1 className="text-xl font-semibold text-[#111827] mb-1">Admin Analytics</h1>
          <p className="text-sm text-[#6b7280] mb-4">Connexion réservée à l&apos;administrateur.</p>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-login" className="block text-sm font-medium text-[#374151] mb-1">
                Identifiant
              </label>
              <input
                id="admin-login"
                type="text"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
                placeholder="Identifiant"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-[#374151] mb-1">
                Mot de passe
              </label>
              <input
                id="admin-password"
                type="password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
                placeholder="Mot de passe"
                autoComplete="current-password"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#2563eb] text-white font-medium hover:bg-[#1d4ed8] transition-colors"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center px-4 py-8 md:py-10">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#111827]">
              📊 Analytics Emails & Leads
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">Analyse en temps réel</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchAndAnalyze(); fetchCtaStats(); }}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-60 transition-colors"
            >
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(ADMIN_ANALYTICS_STORAGE_KEY);
                setAuthenticated(false);
              }}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-[#6b7280] text-white hover:bg-[#4b5563] transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && !result ? (
          <p className="text-[#6b7280]">Chargement…</p>
        ) : result ? (
          <>
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-4">
                <p className="text-sm text-[#6b7280]">Total Leads</p>
                <p className="text-2xl font-bold text-[#111827] mt-1">{result.stats.total}</p>
              </div>
              <div className="bg-green-50 rounded-xl shadow-sm border border-green-100 p-4">
                <p className="text-sm text-green-800">✅ Emails Valides</p>
                <p className="text-2xl font-bold text-green-800 mt-1">{result.stats.valid}</p>
              </div>
              <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-4">
                <p className="text-sm text-red-800">❌ Emails Invalides</p>
                <p className="text-2xl font-bold text-red-800 mt-1">{result.stats.invalid}</p>
              </div>
              <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-4">
                <p className="text-sm text-blue-800">📄 Avec Quittances</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{result.stats.withQuittances}</p>
              </div>
            </div>

            {/* 4 Segments Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* HOT */}
              <div className="rounded-xl shadow-md overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 text-white p-5">
                <p className="text-lg font-semibold opacity-90">🔥 HOT</p>
                <p className="text-3xl font-bold mt-1">{result.segments.hot.length}</p>
                <p className="text-sm opacity-90 mt-2">Ont créé quittance + &lt; 30j</p>
                <p className="text-xs opacity-80 mt-1">Conversion : 20-25%</p>
                <button
                  onClick={() => exportSegmentToCSV(result.segments.hot, 'hot')}
                  className="mt-3 w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
                >
                  Export CSV
                </button>
              </div>
              {/* WARM */}
              <div className="rounded-xl shadow-md overflow-hidden bg-gradient-to-br from-yellow-500 to-orange-400 text-white p-5">
                <p className="text-lg font-semibold opacity-90">⚡ WARM</p>
                <p className="text-3xl font-bold mt-1">{result.segments.warm.length}</p>
                <p className="text-sm opacity-90 mt-2">Ont créé quittance + 30-90j</p>
                <p className="text-xs opacity-80 mt-1">Conversion : 15-20%</p>
                <button
                  onClick={() => exportSegmentToCSV(result.segments.warm, 'warm')}
                  className="mt-3 w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
                >
                  Export CSV
                </button>
              </div>
              {/* COLD */}
              <div className="rounded-xl shadow-md overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 text-white p-5">
                <p className="text-lg font-semibold opacity-90">❄️ COLD</p>
                <p className="text-3xl font-bold mt-1">{result.segments.cold.length}</p>
                <p className="text-sm opacity-90 mt-2">Ont créé quittance + &gt; 90j</p>
                <p className="text-xs opacity-80 mt-1">Conversion : 10-15%</p>
                <button
                  onClick={() => exportSegmentToCSV(result.segments.cold, 'cold')}
                  className="mt-3 w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
                >
                  Export CSV
                </button>
              </div>
              {/* INACTIVE */}
              <div className="rounded-xl shadow-md overflow-hidden bg-gradient-to-br from-gray-400 to-gray-600 text-white p-5">
                <p className="text-lg font-semibold opacity-90">💤 INACTIVE</p>
                <p className="text-3xl font-bold mt-1">{result.segments.inactive.length}</p>
                <p className="text-sm opacity-90 mt-2">N&apos;ont jamais créé quittance</p>
                <p className="text-xs opacity-80 mt-1">Campagne activation séparée</p>
                <button
                  onClick={() => exportSegmentToCSV(result.segments.inactive, 'inactive')}
                  className="mt-3 w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Projections Revenus */}
            <div className="rounded-xl shadow-md overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6">
              <h2 className="text-lg font-semibold mb-4">Projections Revenus (MRR)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/15 rounded-lg p-4">
                  <p className="text-sm opacity-90">Conservateur (15%)</p>
                  <p className="text-2xl font-bold mt-1">
                    {conservativeMRR != null ? `${conservativeMRR.toFixed(2)} €` : '—'}
                  </p>
                </div>
                <div className="bg-white/15 rounded-lg p-4">
                  <p className="text-sm opacity-90">Réaliste (18%)</p>
                  <p className="text-2xl font-bold mt-1">
                    {realisticMRR != null ? `${realisticMRR.toFixed(2)} €` : '—'}
                  </p>
                </div>
                <div className="bg-white/15 rounded-lg p-4">
                  <p className="text-sm opacity-90">Optimiste (22%)</p>
                  <p className="text-2xl font-bold mt-1">
                    {optimisticMRR != null ? `${optimisticMRR.toFixed(2)} €` : '—'}
                  </p>
                </div>
              </div>
              <p className="text-xs opacity-80 mt-3">
                Formule : (hot×taux + warm×taux + cold×taux) × 9,90 €/mois
              </p>
            </div>

            {/* Campagnes email */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
              <div className="p-4 border-b border-[#e5e7eb]">
                <h2 className="text-lg font-semibold text-[#111827]">Campagnes email (Free Leads)</h2>
                <p className="text-sm text-[#6b7280] mt-1">
                  Premier email = J+2. Déclenchez l&apos;envoi depuis ici (limite 100/envoi, relancer pour la suite).
                </p>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-[#e5e7eb] rounded-lg p-4 bg-orange-50/50">
                  <p className="font-semibold text-[#111827]">J+2 — Premier email</p>
                  <p className="text-sm text-[#6b7280] mt-1">« Votre Espace Bailleur est prêt »</p>
                  <p className="text-sm mt-2">
                    <span className="text-green-700 font-medium">{pendingJ2} en attente</span>
                    {sentJ2 > 0 && <span className="text-[#6b7280]"> · {sentJ2} déjà envoyé(s)</span>}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal('j2')}
                      className="flex-1 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#374151] text-sm font-medium hover:bg-[#f9fafb] transition-colors"
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => openTriggerModal('j2')}
                      disabled={pendingJ2 === 0}
                      className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Envoyer J+2
                    </button>
                  </div>
                </div>
                <div className="border border-[#e5e7eb] rounded-lg p-4 bg-amber-50/50">
                  <p className="font-semibold text-[#111827]">J+5</p>
                  <p className="text-sm text-[#6b7280] mt-1">Contenu à personnaliser</p>
                  <p className="text-sm mt-2">
                    <span className="text-[#6b7280]">{pendingJ5} en attente</span>
                    {sentJ5 > 0 && <span> · {sentJ5} envoyé(s)</span>}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal('j5')}
                      className="flex-1 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#374151] text-sm font-medium hover:bg-[#f9fafb] transition-colors"
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => openTriggerModal('j5')}
                      className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                    >
                      Envoyer J+5
                    </button>
                  </div>
                </div>
                <div className="border border-[#e5e7eb] rounded-lg p-4 bg-sky-50/50">
                  <p className="font-semibold text-[#111827]">J+8</p>
                  <p className="text-sm text-[#6b7280] mt-1">Contenu à personnaliser</p>
                  <p className="text-sm mt-2">
                    <span className="text-[#6b7280]">{pendingJ8} en attente</span>
                    {sentJ8 > 0 && <span> · {sentJ8} envoyé(s)</span>}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal('j8')}
                      className="flex-1 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#374151] text-sm font-medium hover:bg-[#f9fafb] transition-colors"
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => openTriggerModal('j8')}
                      className="flex-1 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors"
                    >
                      Envoyer J+8
                    </button>
                  </div>
                </div>
              </div>
              {/* Clics sur le CTA */}
              {ctaClicks && (
                <div className="p-4 border-t border-[#e5e7eb] bg-[#f0f9ff]/50">
                  <h3 className="text-sm font-semibold text-[#111827] mb-1">Clics sur le CTA des e-mails</h3>
                  <p className="text-xs text-[#6b7280] mb-2">
                    Nombre de clics sur le bouton principal (ex. « Découvrir mon espace ») par campagne.
                  </p>
                  <p className="text-sm text-[#374151]">
                    J+2 : <strong>{ctaClicks.j2}</strong> · J+5 : <strong>{ctaClicks.j5}</strong> · J+8 : <strong>{ctaClicks.j8}</strong>
                    {ctaClicks.total > 0 && (
                      <span className="text-[#6b7280] ml-2">(total : {ctaClicks.total})</span>
                    )}
                  </p>
                </div>
              )}
              {/* Ouvertures des e-mails */}
              {openStats && (
                <div className="p-4 border-t border-[#e5e7eb] bg-[#ecfdf3]">
                  <h3 className="text-sm font-semibold text-[#111827] mb-1">Ouvertures des e-mails</h3>
                  <p className="text-xs text-[#6b7280] mb-2">
                    Nombre d&apos;événements <code className="bg-[#e5e7eb] px-1 rounded text-[10px]">email.opened</code> remontés par campagne depuis Resend.
                  </p>
                  <p className="text-sm text-[#374151]">
                    J+2 : <strong>{openStats.j2}</strong> · J+5 : <strong>{openStats.j5}</strong> · J+8 : <strong>{openStats.j8}</strong>
                    {openStats.total > 0 && (
                      <span className="text-[#6b7280] ml-2">(total : {openStats.total})</span>
                    )}
                  </p>
                </div>
              )}
              {/* Destinataires ayant reçu chaque campagne */}
              <div className="p-4 border-t border-[#e5e7eb]">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Destinataires ayant reçu les e-mails</h3>
                <p className="text-xs text-[#6b7280] mb-3">
                  Liste des adresses à qui chaque campagne a déjà été envoyée (avec date d&apos;envoi). Les envois passés sont enregistrés en base après chaque campagne. Cliquez sur <strong>Rafraîchir</strong> en haut de page pour voir les derniers envois.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                    <div className="bg-orange-50 px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#111827]">J+2</span>
                      <span className="text-xs text-[#6b7280]">{sentJ2} adresse(s)</span>
                      <button
                        type="button"
                        onClick={() => exportSentCampaignCSV(sentJ2Leads, 'j2', 'campaign_j2_sent_at')}
                        disabled={sentJ2 === 0}
                        className="text-xs font-medium text-[#2563eb] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Export CSV
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {sentJ2 === 0 ? (
                        <p className="p-2 text-xs text-[#6b7280]">Aucun envoi pour l&apos;instant.</p>
                      ) : (
                        <table className="min-w-full text-xs">
                          <thead className="bg-[#f9fafb] sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left font-medium text-[#6b7280]">E-mail</th>
                              <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Date envoi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sentJ2Leads.slice(0, 50).map((l) => (
                              <tr key={String(l.id)} className="border-t border-[#f3f4f6]">
                                <td className="px-2 py-1 text-[#111827] truncate max-w-[140px]" title={l.email}>{l.email}</td>
                                <td className="px-2 py-1 text-[#6b7280] whitespace-nowrap">
                                  {l.campaign_j2_sent_at ? new Date(l.campaign_j2_sent_at).toLocaleDateString('fr-FR') : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    {sentJ2 > 50 && (
                      <p className="p-2 text-xs text-[#6b7280] border-t border-[#e5e7eb]">
                        … et {sentJ2 - 50} autre(s). Voir tout via Export CSV.
                      </p>
                    )}
                  </div>
                  <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                    <div className="bg-amber-50 px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#111827]">J+5</span>
                      <span className="text-xs text-[#6b7280]">{sentJ5} adresse(s)</span>
                      <button
                        type="button"
                        onClick={() => exportSentCampaignCSV(sentJ5Leads, 'j5', 'campaign_j5_sent_at')}
                        disabled={sentJ5 === 0}
                        className="text-xs font-medium text-[#2563eb] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Export CSV
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {sentJ5 === 0 ? (
                        <p className="p-2 text-xs text-[#6b7280]">Aucun envoi pour l&apos;instant.</p>
                      ) : (
                        <table className="min-w-full text-xs">
                          <thead className="bg-[#f9fafb] sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left font-medium text-[#6b7280]">E-mail</th>
                              <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Date envoi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sentJ5Leads.slice(0, 50).map((l) => (
                              <tr key={String(l.id)} className="border-t border-[#f3f4f6]">
                                <td className="px-2 py-1 text-[#111827] truncate max-w-[140px]" title={l.email}>{l.email}</td>
                                <td className="px-2 py-1 text-[#6b7280] whitespace-nowrap">
                                  {l.campaign_j5_sent_at ? new Date(l.campaign_j5_sent_at).toLocaleDateString('fr-FR') : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    {sentJ5 > 50 && (
                      <p className="p-2 text-xs text-[#6b7280] border-t border-[#e5e7eb]">
                        … et {sentJ5 - 50} autre(s). Voir tout via Export CSV.
                      </p>
                    )}
                  </div>
                  <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                    <div className="bg-sky-50 px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#111827]">J+8</span>
                      <span className="text-xs text-[#6b7280]">{sentJ8} adresse(s)</span>
                      <button
                        type="button"
                        onClick={() => exportSentCampaignCSV(sentJ8Leads, 'j8', 'campaign_j8_sent_at')}
                        disabled={sentJ8 === 0}
                        className="text-xs font-medium text-[#2563eb] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Export CSV
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {sentJ8 === 0 ? (
                        <p className="p-2 text-xs text-[#6b7280]">Aucun envoi pour l&apos;instant.</p>
                      ) : (
                        <table className="min-w-full text-xs">
                          <thead className="bg-[#f9fafb] sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left font-medium text-[#6b7280]">E-mail</th>
                              <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Date envoi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sentJ8Leads.slice(0, 50).map((l) => (
                              <tr key={String(l.id)} className="border-t border-[#f3f4f6]">
                                <td className="px-2 py-1 text-[#111827] truncate max-w-[140px]" title={l.email}>{l.email}</td>
                                <td className="px-2 py-1 text-[#6b7280] whitespace-nowrap">
                                  {l.campaign_j8_sent_at ? new Date(l.campaign_j8_sent_at).toLocaleDateString('fr-FR') : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    {sentJ8 > 50 && (
                      <p className="p-2 text-xs text-[#6b7280] border-t border-[#e5e7eb]">
                        … et {sentJ8 - 50} autre(s). Voir tout via Export CSV.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Leads Essai Pack Automatique */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
              <div className="p-4 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Leads essai Pack Automatique</h2>
                  <p className="text-sm text-[#6b7280] mt-1">
                    Leads avec <code className="bg-gray-100 px-1 rounded text-xs">lead_statut = 'QA_1st_interested'</code> (espace créé + essai activé).
                  </p>
                  {trialStats && (
                    <p className="text-xs text-[#4b5563] mt-1">
                      Total : <strong>{trialStats.count}</strong> · Essai en cours : <strong>{trialStats.active}</strong> · Essai expiré : <strong>{trialStats.expired}</strong>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchTrialLeads}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors self-start sm:self-auto"
                >
                  Rafraîchir
                </button>
              </div>
              <div className="p-4">
                {trialError && (
                  <p className="text-sm text-red-600 mb-3">Erreur chargement leads essai : {trialError}</p>
                )}
                {trialLoading && !trialLeads && (
                  <p className="text-sm text-[#6b7280]">Chargement des leads en essai…</p>
                )}
                {trialLeads && trialLeads.length === 0 && !trialLoading && !trialError && (
                  <p className="text-sm text-[#6b7280]">
                    Aucun lead en essai (QA_1st_interested) pour le moment.
                  </p>
                )}
                {trialLeads && trialLeads.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#6b7280]">
                      {trialLeads.length} lead(s) en essai actif ou récent. Colonnes clés :
                      <span className="ml-1 font-medium text-[#374151]">
                        jours restants, welcome, campagnes J+2/J+5/J+8, relances d&apos;essai, origine, quittances.
                      </span>
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border-t border-b border-[#e5e7eb]">
                        <thead className="bg-[#f9fafb]">
                          <tr>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Email</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Nom</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Créé le</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Jours restants</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Origine</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Quittances</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Welcome</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">J+2 / J+5 / J+8</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Relances essai</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Mot de passe défini</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trialLeads.slice(0, 80).map((lead) => {
                            const days =
                              lead.days_remaining === null
                                ? '—'
                                : lead.days_remaining >= 0
                                ? `${lead.days_remaining}j`
                                : `${lead.days_remaining}j (expiré)`;
                            const origineLabel =
                              lead.origine === 'quittance_gratuite' ? 'Quittance gratuite' : 'Vierge';
                            const formatDateTime = (d: string | null) =>
                              d ? new Date(d).toLocaleString('fr-FR') : '—';
                            const trialEmailsLabel =
                              lead.trial_emails && lead.trial_emails.length > 0
                                ? lead.trial_emails
                                    .map((t) => {
                                      const label = t.reminder_type.replace('day_', 'J+');
                                      return `${label} (${t.sent_at ? new Date(t.sent_at).toLocaleDateString('fr-FR') : '?'})`;
                                    })
                                    .join(', ')
                                : '—';
                            return (
                              <tr key={lead.id} className="border-t border-[#f3f4f6]">
                                <td className="px-2 py-1 text-[#111827] truncate max-w-[180px]" title={lead.email}>
                                  {lead.email}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {lead.prenom || lead.nom
                                    ? `${lead.prenom ? `${lead.prenom} ` : ''}${lead.nom || ''}`.trim()
                                    : '—'}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {lead.date_inscription
                                    ? new Date(lead.date_inscription).toLocaleDateString('fr-FR')
                                    : '—'}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">{days}</td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">{origineLabel}</td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {lead.nombre_quittances > 0 ? `${lead.nombre_quittances} quittance(s)` : 'Aucune'}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {formatDateTime(lead.welcome_email_sent_at)}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  J+2&nbsp;: {formatDateTime(lead.campaign_j2_sent_at)}
                                  <br />
                                  J+5&nbsp;: {formatDateTime(lead.campaign_j5_sent_at)}
                                  <br />
                                  J+8&nbsp;: {formatDateTime(lead.campaign_j8_sent_at)}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563]">{trialEmailsLabel}</td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {lead.password_set ? 'Oui' : 'Non / inconnu'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {trialLeads.length > 80 && (
                      <p className="text-xs text-[#6b7280]">
                        … et {trialLeads.length - 80} autre(s) lead(s). Pour une analyse plus poussée,
                        utilise une requête SQL dédiée.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Leads compte gratuit (free_account) */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
              <div className="p-4 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Leads compte gratuit (Free Account)</h2>
                  <p className="text-sm text-[#6b7280] mt-1">
                    Leads avec <code className="bg-gray-100 px-1 rounded text-xs">lead_statut = 'free_account'</code> (compte gratuit créé sans essai Pack Automatique).
                  </p>
                  {freeStats && (
                    <p className="text-xs text-[#4b5563] mt-1">
                      Total : <strong>{freeStats.count}</strong> · Avec date d&apos;essai (active ou expirée) :{' '}
                      <strong>{(freeAccountLeads || []).filter((l) => l.date_fin_essai !== null).length}</strong>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchTrialLeads}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors self-start sm:self-auto"
                >
                  Rafraîchir
                </button>
              </div>
              <div className="p-4">
                {freeAccountLeads && freeAccountLeads.length === 0 && !trialLoading && !trialError && (
                  <p className="text-sm text-[#6b7280]">
                    Aucun lead « compte gratuit » (free_account) pour le moment (hors adresses de test exclues).
                  </p>
                )}
                {freeAccountLeads && freeAccountLeads.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#6b7280]">
                      {freeAccountLeads.length} lead(s) free_account. Colonnes identiques aux leads d&apos;essai pour comparer les comportements.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border-t border-b border-[#e5e7eb]">
                        <thead className="bg-[#f9fafb]">
                          <tr>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Email</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Nom</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Créé le</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Jours restants</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Origine</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Quittances</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Welcome</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">J+2 / J+5 / J+8</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Relances essai</th>
                            <th className="px-2 py-1 text-left font-medium text-[#6b7280]">Mot de passe défini</th>
                          </tr>
                        </thead>
                        <tbody>
                          {freeAccountLeads.slice(0, 80).map((lead) => {
                            const days =
                              lead.days_remaining === null
                                ? '—'
                                : lead.days_remaining >= 0
                                ? `${lead.days_remaining}j`
                                : `${lead.days_remaining}j (expiré)`;
                            const origineLabel =
                              lead.origine === 'quittance_gratuite' ? 'Quittance gratuite' : 'Vierge';
                            const formatDateTime = (d: string | null) =>
                              d ? new Date(d).toLocaleString('fr-FR') : '—';
                            const trialEmailsLabel =
                              lead.trial_emails && lead.trial_emails.length > 0
                                ? lead.trial_emails
                                    .map((t) => {
                                      const label = t.reminder_type.replace('day_', 'J+');
                                      return `${label} (${t.sent_at ? new Date(t.sent_at).toLocaleDateString('fr-FR') : '?'})`;
                                    })
                                    .join(', ')
                                : '—';
                            return (
                              <tr key={lead.id} className="border-t border-[#f3f4f6]">
                                <td className="px-2 py-1 text-[#111827] truncate max-w-[180px]" title={lead.email}>
                                  {lead.email}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {lead.prenom || lead.nom
                                    ? `${lead.prenom ? `${lead.prenom} ` : ''}${lead.nom || ''}`.trim()
                                    : '—'}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {lead.date_inscription
                                    ? new Date(lead.date_inscription).toLocaleDateString('fr-FR')
                                    : '—'}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">{days}</td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">{origineLabel}</td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {lead.nombre_quittances > 0 ? `${lead.nombre_quittances} quittance(s)` : 'Aucune'}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {formatDateTime(lead.welcome_email_sent_at)}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  J+2&nbsp;: {formatDateTime(lead.campaign_j2_sent_at)}
                                  <br />
                                  J+5&nbsp;: {formatDateTime(lead.campaign_j5_sent_at)}
                                  <br />
                                  J+8&nbsp;: {formatDateTime(lead.campaign_j8_sent_at)}
                                </td>
                                <td className="px-2 py-1 text-[#4b5563]">{trialEmailsLabel}</td>
                                <td className="px-2 py-1 text-[#4b5563] whitespace-nowrap">
                                  {lead.password_set ? 'Oui' : 'Non / inconnu'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {freeAccountLeads.length > 80 && (
                      <p className="text-xs text-[#6b7280]">
                        … et {freeAccountLeads.length - 80} autre(s) lead(s). Pour une analyse plus poussée,
                        utilise une requête SQL dédiée.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Rapides */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportAllValid}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#111827] text-white hover:bg-[#374151] transition-colors"
              >
                Export Tous Valides
              </button>
              <button
                onClick={handleExportHot}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                Export HOT
              </button>
            </div>

            {/* Table Liste Détaillée */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
              <div className="p-4 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-lg font-semibold text-[#111827]">Liste détaillée</h2>
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] bg-white"
                >
                  <option value="all">Tous les segments</option>
                  <option value="hot">🔥 HOT</option>
                  <option value="warm">⚡ WARM</option>
                  <option value="cold">❄️ COLD</option>
                  <option value="inactive">💤 INACTIVE</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#f9fafb]">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-[#6b7280]">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-[#6b7280]">Nom</th>
                      <th className="px-3 py-2 text-left font-medium text-[#6b7280]">Nb Quittances</th>
                      <th className="px-3 py-2 text-left font-medium text-[#6b7280]">Segment</th>
                      <th className="px-3 py-2 text-left font-medium text-[#6b7280]">Jours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLeads.map((lead) => (
                      <tr key={String(lead.id)} className="border-t border-[#f3f4f6]">
                        <td className="px-3 py-2 font-medium text-[#111827]">{lead.email}</td>
                        <td className="px-3 py-2 text-[#4b5563]">
                          {lead.prenom} {lead.nom}
                        </td>
                        <td className="px-3 py-2 text-[#4b5563]">{lead.nombre_quittances}</td>
                        <td className="px-3 py-2 text-[#4b5563]">
                          {SEGMENT_LABELS[lead.segment] ?? lead.segment}
                        </td>
                        <td className="px-3 py-2 text-[#4b5563]">{lead.days_since_signup}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="p-3 text-xs text-[#9ca3af] border-t border-[#e5e7eb]">
                Affichage des 50 premiers. Total dans ce filtre : {totalInFilter}. Exportez en CSV
                pour tout voir.
              </p>
            </div>

            {/* Modal édition campagne */}
            {showEditModal && editCampaign && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" role="dialog" aria-modal="true">
                <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-[#111827]">
                      Éditer campagne J+{editCampaign === 'j2' ? '2' : editCampaign === 'j5' ? '5' : '8'}
                    </h3>
                    <p className="text-sm text-[#6b7280] mt-1">
                      Saisissez votre mot de passe admin pour charger, enregistrer ou envoyer un test.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="flex-1 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
                        placeholder="Mot de passe admin"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={loadCampaignContent}
                        disabled={editLoading}
                        className="px-4 py-2 rounded-lg bg-[#e5e7eb] text-[#374151] text-sm font-medium hover:bg-[#d1d5db] disabled:opacity-60"
                      >
                        {editLoading ? 'Chargement…' : 'Charger le contenu'}
                      </button>
                    </div>
                    <form onSubmit={handleSaveCampaign} className="mt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#374151] mb-1">Sujet</label>
                        <input
                          type="text"
                          value={editForm.subject}
                          onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                          className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
                          placeholder="Sujet de l'e-mail"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#374151] mb-1">Corps de l&apos;e-mail</label>
                        <p className="text-xs text-[#6b7280] mb-2">Choisir l&apos;affichage et le mode d&apos;édition :</p>
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setEditViewBody('preview')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${editViewBody === 'preview' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb]'}`}
                          >
                            Aperçu (texte)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditViewBody('source')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${editViewBody === 'source' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb]'}`}
                          >
                            Code HTML
                          </button>
                        </div>
                        {editViewBody === 'preview' ? (
                          <textarea
                            value={editBodyText}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditBodyText(value);
                              setEditForm((f) => ({
                                ...f,
                                bodyHtml: plainTextToHtml(value),
                              }));
                            }}
                            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm min-h-[140px]"
                            placeholder={'Bonjour {{ prenom }},\n\nTexte de votre campagne...\n\nParagraphe suivant.'}
                            rows={8}
                          />
                        ) : (
                          <textarea
                            value={editForm.bodyHtml}
                            onChange={(e) => setEditForm((f) => ({ ...f, bodyHtml: e.target.value }))}
                            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-mono min-h-[120px]"
                            placeholder="<p>Bonjour {{ prenom }},</p>..."
                            rows={6}
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#374151] mb-1">Texte du bouton CTA</label>
                          <input
                            type="text"
                            value={editForm.ctaText}
                            onChange={(e) => setEditForm((f) => ({ ...f, ctaText: e.target.value }))}
                            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
                            placeholder="Découvrir mon espace"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#374151] mb-1">URL du bouton</label>
                          <input
                            type="text"
                            value={editForm.ctaUrl}
                            onChange={(e) => setEditForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
                            placeholder="https://... ({{ email }} pour l'email)"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#374151] mb-1">Signature / fin</label>
                        <p className="text-xs text-[#6b7280] mb-2">Choisir l&apos;affichage :</p>
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setEditViewSignature('preview')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${editViewSignature === 'preview' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb]'}`}
                          >
                            Aperçu (texte)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditViewSignature('source')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${editViewSignature === 'source' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb]'}`}
                          >
                            Code HTML
                          </button>
                        </div>
                        {editViewSignature === 'preview' ? (
                          <div
                            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4 min-h-[80px] text-[#111827] text-sm leading-relaxed max-w-none"
                            style={{ wordBreak: 'break-word' }}
                            dangerouslySetInnerHTML={{ __html: previewClosingHtml }}
                          />
                        ) : (
                          <textarea
                            value={editForm.closingHtml}
                            onChange={(e) => setEditForm((f) => ({ ...f, closingHtml: e.target.value }))}
                            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-mono min-h-[80px]"
                            placeholder="<table>... signature ...</table>"
                            rows={3}
                          />
                        )}
                      </div>
                      {editError && <p className="text-sm text-red-600">{editError}</p>}
                      {editSuccess && <p className="text-sm text-green-700">{editSuccess}</p>}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => { setShowEditModal(false); setEditCampaign(null); }}
                          className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={editLoading}
                          className="px-4 py-2 rounded-lg bg-[#2563eb] text-white font-medium hover:bg-[#1d4ed8] disabled:opacity-60"
                        >
                          {editLoading ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                      </div>
                    </form>
                    <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
                      <p className="text-sm font-medium text-[#374151] mb-2">Envoyer un e-mail de test</p>
                      <p className="text-xs text-[#6b7280] mb-2">
                        Utilise le contenu actuel du formulaire (pas besoin d&apos;enregistrer avant).
                      </p>
                      <form onSubmit={handleSendTest} className="flex flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
                            placeholder="adresse@exemple.fr"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={testSendLoading}
                          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
                        >
                          {testSendLoading ? 'Envoi…' : 'Envoyer le test'}
                        </button>
                      </form>
                      {testSendResult && (
                        <p className={`mt-2 text-sm ${testSendResult.startsWith('E-mail') ? 'text-green-700' : 'text-red-600'}`}>
                          {testSendResult}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal déclenchement campagne */}
            {showTriggerModal && triggerCampaign && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
                <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold text-[#111827]">
                    Envoyer la campagne J+{triggerCampaign === 'j2' ? '2' : triggerCampaign === 'j5' ? '5' : '8'}
                  </h3>
                  <p className="text-sm text-[#6b7280] mt-1">
                    Choisissez la taille du lot puis lancez l&apos;envoi.
                  </p>
                  <form onSubmit={handleTriggerCampaign} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="trigger-limit" className="block text-sm font-medium text-[#374151] mb-1">
                        Nombre d&apos;e-mails par envoi (tranche)
                      </label>
                      <select
                        id="trigger-limit"
                        value={triggerLimit}
                        onChange={(e) => setTriggerLimit(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] bg-white"
                      >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <p className="text-xs text-[#6b7280] mt-1">
                        Resend : max 100/jour. Espacement auto entre chaque e-mail (limite 2 req/s).
                      </p>
                    </div>
                    {triggerError && (
                      <p className="text-sm text-red-600">{triggerError}</p>
                    )}
                    {triggerResult && (
                      <p className="text-sm text-green-700">
                        {triggerResult.sent != null && `${triggerResult.sent} e-mail(s) envoyé(s). `}
                        {triggerResult.message}
                      </p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowTriggerModal(false); setTriggerCampaign(null); setTriggerResult(null); }}
                        className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={triggerLoading}
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-60"
                      >
                        {triggerLoading ? 'Envoi en cours…' : 'Envoyer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdminAnalytics;
