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
        .select('id, email, nom, prenom, created_at, nombre_quittances, device_type')
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

  useEffect(() => {
    if (authenticated) fetchAndAnalyze();
  }, [authenticated, fetchAndAnalyze]);

  const handleExportAllValid = () => {
    if (!result) return;
    exportSegmentToCSV(result.validLeads, 'tous_valides');
  };

  const handleExportHot = () => {
    if (!result) return;
    exportSegmentToCSV(result.segments.hot, 'hot');
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
              onClick={fetchAndAnalyze}
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
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdminAnalytics;
