import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  adresse?: string;
  telephone?: string;
  abonnement_actif?: boolean;
  date_fin_essai?: string;
  plan_type?: string;
}

interface EspaceBailleurContextValue {
  proprietaire: Proprietaire | null;
  loading: boolean;
  error: string | null;
  refetchProprietaire: () => Promise<void>;
  activeDashboardTab: string;
  setActiveDashboardTab: (tab: string) => void;
}

const EspaceBailleurContext = createContext<EspaceBailleurContextValue | null>(null);

export function EspaceBailleurProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState('dashboard');

  const loadProprietaire = useCallback(async (isRefetch = false) => {
    try {
      if (!isRefetch) setLoading(true);
      setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        // Utilisateur non connecté : retour à l'accueil avec ouverture du modal de connexion
        // Si on arrive depuis un lien (email) contenant #loginEmail=..., on pré-remplit l'email.
        let prefilledEmail: string | undefined;
        try {
          const hash = typeof window !== 'undefined' ? window.location.hash : '';
          if (hash && hash.toLowerCase().includes('loginemail=')) {
            const params = new URLSearchParams(hash.slice(1));
            const v = (params.get('loginEmail') || '').trim();
            if (v) prefilledEmail = v;
          }
        } catch (_) {
          // ignore
        }

        // Nettoyer le hash pour ne pas le laisser traîner dans l'URL
        try {
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } catch (_) {
          // ignore
        }

        navigate('/', { state: { openLogin: true, prefilledEmail }, replace: true });
        return;
      }
      const { data, error: propError } = await supabase
        .from('proprietaires')
        .select('id, email, nom, prenom, adresse, telephone, abonnement_actif, date_fin_essai, plan_type')
        .eq('email', user.email)
        .maybeSingle();
      if (propError) throw propError;
      if (data) {
        setProprietaire(data);
      } else {
        setError('Profil propriétaire non trouvé');
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Erreur de chargement';
      setError(msg);
      setProprietaire(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProprietaire();
  }, [loadProprietaire]);

  const refetchProprietaire = useCallback(() => loadProprietaire(true), [loadProprietaire]);

  const value: EspaceBailleurContextValue = {
    proprietaire,
    loading,
    error,
    refetchProprietaire,
    activeDashboardTab,
    setActiveDashboardTab,
  };

  return (
    <EspaceBailleurContext.Provider value={value}>
      {children}
    </EspaceBailleurContext.Provider>
  );
}

export function useEspaceBailleur(): EspaceBailleurContextValue {
  const ctx = useContext(EspaceBailleurContext);
  if (!ctx) {
    throw new Error('useEspaceBailleur must be used within EspaceBailleurProvider');
  }
  return ctx;
}

export function useEspaceBailleurOptional(): EspaceBailleurContextValue | null {
  return useContext(EspaceBailleurContext);
}
