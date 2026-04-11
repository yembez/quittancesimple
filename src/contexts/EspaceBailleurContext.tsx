import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { consumeSilentLogoutFlag } from '../lib/authSignOut';

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
  plan_actuel?: string;
  lead_statut?: string;
  features_enabled?: Record<string, boolean> | null;
  created_at?: string;
  stripe_subscription_id?: string | null;
  user_id?: string;
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

function isEspaceBailleurPath(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname === '/overview' ||
    pathname === '/documents' ||
    pathname === '/historique' ||
    pathname === '/revision-irl' ||
    pathname === '/billing' ||
    pathname === '/manage-subscription' ||
    pathname === '/essai-termine' ||
    pathname === '/bail' ||
    pathname === '/bail-meuble' ||
    pathname === '/etat-des-lieux' ||
    pathname === '/annonce-generator'
  );
}

export function EspaceBailleurProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState('dashboard');

  const loadProprietaire = useCallback(async (isRefetch = false) => {
    /** Si invité : on redirige vers l’accueil — ne pas exécuter `setLoading(false)` sinon le layout affiche le Outlet /dashboard un instant avant la navigation. */
    let redirectingGuest = false;
    try {
      if (!isRefetch) setLoading(true);
      setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      // Pas de session (user null ou toute erreur auth) → redirection vers accueil + modal connexion
      const noSession = !user || !!authError;
      if (noSession) {
        redirectingGuest = true;
        setProprietaire(null);
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
        // Si on quitte /dashboard?openRelance=xxx, garder openRelance pour après connexion et préremplir l'email de connexion
        try {
          if (typeof window !== 'undefined' && window.location.pathname === '/dashboard' && window.location.search) {
            const params = new URLSearchParams(window.location.search);
            const openRelance = params.get('openRelance');
            const loginHint = params.get('loginHint');
            if (openRelance) {
              sessionStorage.setItem('openRelanceLocataireId', openRelance);
            }
            if (loginHint && !prefilledEmail) {
              prefilledEmail = loginHint.trim();
            }
          }
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } catch (_) {
          // ignore
        }
        // Navigation complète : évite tout flash du dashboard (layout singleton / course avec l’état React).
        const qs = new URLSearchParams();
        qs.set('openLogin', '1');
        if (prefilledEmail) qs.set('loginEmail', prefilledEmail);
        if (typeof window !== 'undefined') {
          window.location.replace(`${window.location.origin}/?${qs.toString()}`);
        }
        return;
      }
      if (authError) throw authError;
      // Source de vérité = la ligne liée au compte Auth (RLS : user_id = auth.uid()).
      // Ne pas charger par e-mail seul : doublons d’e-mail (lead vs compte) donnaient une date_fin_essai
      // incohérente avec ce que voit l’utilisateur → fausse redirection « essai terminé ».
      const { data, error: propError } = await supabase
        .from('proprietaires')
        .select(
          'id, email, nom, prenom, adresse, telephone, abonnement_actif, date_fin_essai, plan_type, plan_actuel, lead_statut, features_enabled, created_at, stripe_subscription_id, user_id',
        )
        .eq('user_id', user.id)
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
      if (!redirectingGuest) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadProprietaire();
  }, [loadProprietaire]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setProprietaire(null);
        setError(null);
        setLoading(false);
        if (typeof window === 'undefined') return;
        if (consumeSilentLogoutFlag()) return;
        if (isEspaceBailleurPath(window.location.pathname)) {
          const qs = new URLSearchParams();
          qs.set('openLogin', '1');
          window.location.replace(`${window.location.origin}/?${qs.toString()}`);
        }
        return;
      }
      if (event === 'SIGNED_IN' && session) {
        loadProprietaire(true);
      }
    });
    return () => subscription.unsubscribe();
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
