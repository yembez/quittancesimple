import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar';
import { EspaceBailleurProvider, useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import { AlertCircle } from 'lucide-react';
import { needsTrialReactivationPage } from '../utils/trialReactivation';

const TRIAL_EXPIRED_ALLOWED_PATH_PREFIXES = [
  '/essai-termine',
  '/payment-checkout',
  '/payment-success',
  '/payment-cancelled',
  '/quick-payment-confirm',
];

function TrialExpiredRedirect() {
  const { proprietaire, loading } = useEspaceBailleur();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !proprietaire) return;
    const path = location.pathname;
    if (TRIAL_EXPIRED_ALLOWED_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
      return;
    }
    if (needsTrialReactivationPage(proprietaire)) {
      navigate('/essai-termine', { replace: true });
    }
  }, [loading, proprietaire, location.pathname, navigate]);

  return null;
}

function EspaceBailleurContent() {
  const location = useLocation();
  const { proprietaire, loading, error, refetchProprietaire, activeDashboardTab, setActiveDashboardTab } = useEspaceBailleur();
  const hideSidebar = location.pathname === '/essai-termine';

  // Chargement ou redirection invité en cours : ne jamais monter le Outlet (dashboard) sans bailleur chargé
  const isInitialLoad = loading && !proprietaire;
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {!hideSidebar && <DashboardSidebar proprietaire={null} />}
        <div className={`flex-1 flex items-center justify-center ${hideSidebar ? '' : 'lg:pl-64'}`}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  // Session absente ou en cours de renvoi vers la connexion : pas de contenu espace bailleur
  if (!loading && !proprietaire && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
          <p className="mt-4 text-gray-600 text-sm">Redirection vers la connexion…</p>
        </div>
      </div>
    );
  }

  if (error && !proprietaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {!hideSidebar && <DashboardSidebar proprietaire={null} />}
        <div className={`flex-1 flex items-center justify-center ${hideSidebar ? '' : 'lg:pl-64'}`}>
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <p className="text-gray-900 mb-2 text-lg font-semibold">Erreur de chargement</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refetchProprietaire}
              className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white rounded-md font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TrialExpiredRedirect />
      {!hideSidebar && (
        <DashboardSidebar
          proprietaire={proprietaire}
          onDashboardTabChange={setActiveDashboardTab}
          activeDashboardTab={activeDashboardTab}
        />
      )}
      <div className={`flex-1 flex flex-col min-h-screen ${hideSidebar ? '' : 'lg:pl-64'}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default function EspaceBailleurLayout() {
  return (
    <EspaceBailleurProvider>
      <EspaceBailleurContent />
    </EspaceBailleurProvider>
  );
}
