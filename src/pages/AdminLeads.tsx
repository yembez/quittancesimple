import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LeadRow {
  id: number;
  email: string;
  prenom: string | null;
  nom: string | null;
  created_at: string | null;
}

const AdminLeads: React.FC = () => {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0); // tous les leads free_quittance_pdf (ex. 291)
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('proprietaires')
        .select('id, email, prenom, nom, lead_statut, created_at')
        .eq('lead_statut', 'free_quittance_pdf')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      const raw = data || [];
      setTotalCount(raw.length);

      const filtered =
        raw
          .filter((r: any) => {
            const e = (r.email || '').trim().toLowerCase();
            // même filtrage que les campagnes : pas de maildrop, pas de 2speek
            if (!e || !e.includes('@')) return false;
            if (e.endsWith('@maildrop.cc')) return false;
            if (e.startsWith('2speek')) return false;
            return true;
          })
          .map((r: any) => ({
            id: r.id,
            email: r.email,
            prenom: r.prenom ?? null,
            nom: r.nom ?? null,
            created_at: r.created_at ?? null,
          })) as LeadRow[];

      setLeads(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">
              Leads quittance gratuite
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Total : <strong>{totalCount}</strong> leads (free_quittance_pdf). Dont <strong>{leads.length}</strong> adresses valides pour la campagne (hors @maildrop.cc et 2speek).
            </p>
          </div>
          <button
            onClick={fetchLeads}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors"
          >
            Rafraîchir
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            Erreur de chargement : {error}
          </div>
        )}

        {loading && leads.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Chargement des leads…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Aucun lead &quot;quittance gratuite&quot; pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-t border-b border-[#e5e7eb]">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-[#6b7280]">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-[#6b7280]">Prénom</th>
                  <th className="px-3 py-2 text-left font-medium text-[#6b7280]">Nom</th>
                  <th className="px-3 py-2 text-left font-medium text-[#6b7280]">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-[#f3f4f6]">
                    <td className="px-3 py-2 font-medium text-[#111827]">{lead.email}</td>
                    <td className="px-3 py-2 text-[#4b5563]">{lead.prenom || '—'}</td>
                    <td className="px-3 py-2 text-[#4b5563]">{lead.nom || '—'}</td>
                    <td className="px-3 py-2 text-[#4b5563]">
                      {lead.created_at ? new Date(lead.created_at).toLocaleString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-[#9ca3af]">
              Tableau : {leads.length} adresses valides pour envoi (exclut @maildrop.cc et adresses commençant par &quot;2speek&quot;). Les {totalCount - leads.length} autres sont des tests ou domaines exclus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeads;

