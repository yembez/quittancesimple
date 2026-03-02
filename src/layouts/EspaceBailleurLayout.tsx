import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar';
import { EspaceBailleurProvider, useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import { AlertCircle } from 'lucide-react';

function EspaceBailleurContent() {
  const { proprietaire, loading, error, refetchProprietaire, activeDashboardTab, setActiveDashboardTab } = useEspaceBailleur();

  // Chargement initial uniquement : garder la sidebar avec le dernier proprietaire connu pendant un refetch
  const isInitialLoad = loading && !proprietaire;
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar proprietaire={null} />
        <div className="flex-1 flex items-center justify-center lg:pl-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !proprietaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar proprietaire={null} />
        <div className="flex-1 flex items-center justify-center lg:pl-64">
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
      <DashboardSidebar
        proprietaire={proprietaire}
        onDashboardTabChange={setActiveDashboardTab}
        activeDashboardTab={activeDashboardTab}
      />
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
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
