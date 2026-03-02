import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, TrendingUp, Euro, User, Lock, CheckCircle, Folder, FileSignature, ChevronDown, ChevronRight, Eye, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  abonnement_actif?: boolean;
  date_fin_essai?: string;
}

interface DashboardSidebarProps {
  proprietaire: Proprietaire | null;
  activePage?: string;
  onDashboardTabChange?: (tab: string) => void;
  activeDashboardTab?: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ proprietaire, activePage, onDashboardTabChange, activeDashboardTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bailMenuOpen, setBailMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/overview') {
      return location.pathname === '/overview';
    }
    if (path === '/dashboard') {
      // Pour le dashboard, vérifier si on est sur la page dashboard ET sur l'onglet dashboard
      if (location.pathname === '/dashboard' && activeDashboardTab === 'dashboard') {
        return true;
      }
      // Si on est sur bilan-annuel, ne pas marquer dashboard comme actif
      if (location.pathname === '/dashboard' && activeDashboardTab === 'bilan-annuel') {
        return false;
      }
      return location.pathname === '/dashboard' && !activeDashboardTab;
    }
    if (activePage) {
      return activePage === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Vérifier si on est sur une page bail ou état des lieux pour ouvrir le menu automatiquement
  const isBailPage = location.pathname === '/bail' || location.pathname === '/bail-meuble' || location.pathname === '/etat-des-lieux';
  useEffect(() => {
    if (isBailPage) {
      setBailMenuOpen(true);
    }
  }, [isBailPage]);

  return (
    <aside
        data-sidebar="dashboard"
        className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-14 lg:z-30 lg:w-64 lg:h-[calc(100vh-3.5rem)] bg-[#142840] text-white print:hidden"
      >
      {/* Même couleur que les onglets actifs (charte-bleu) */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-[#f4663b] rounded-lg flex items-center justify-center shadow-sm">
            <CheckCircle className="w-5 h-5 text-white stroke-[3]" />
          </div>
          <span className="text-lg font-bold text-white">Espace bailleur</span>
        </div>
        
        {/* Badge essai gratuit */}
        {proprietaire?.abonnement_actif && (() => {
          const getDaysRemaining = () => {
            if (!proprietaire.date_fin_essai) return null;
            const endDate = new Date(proprietaire.date_fin_essai);
            const now = new Date();
            const diffTime = endDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? diffDays : 0;
          };

          const daysRemaining = getDaysRemaining();

          if (daysRemaining !== null && daysRemaining > 0) {
            return (
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#E65F3F]/20 to-[#f97316]/20 border border-[#E65F3F]/40 rounded-lg">
                <div className="w-2 h-2 bg-[#E65F3F] rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-white">
                  Essai gratuit : {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
                </span>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Navigation verticale */}
      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => navigate('/overview')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            isActive('/overview')
              ? 'bg-white/15 text-white border-l-4 border-[#f4663b]'
              : 'text-white/90 hover:bg-white/10'
          }`}
        >
          <Eye className="w-5 h-5" />
          <span>Vue d'ensemble</span>
        </button>
        <button
          onClick={() => {
            if (onDashboardTabChange) {
              onDashboardTabChange('dashboard');
            }
            navigate('/dashboard');
          }}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            isActive('/dashboard')
              ? 'bg-white/15 text-white border-l-4 border-[#f4663b]'
              : 'text-white/90 hover:bg-white/10'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Automatiser quittances</span>
        </button>
        <button
          onClick={() => navigate('/historique')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            isActive('/historique')
              ? 'bg-white/15 text-white border-l-4 border-[#f4663b]'
              : 'text-white/90 hover:bg-white/10'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Historique quittances</span>
        </button>
        <button
          onClick={() => navigate('/revision-irl')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            isActive('/revision-irl')
              ? 'bg-white/15 text-white border-l-4 border-[#f4663b]'
              : 'text-white/90 hover:bg-white/10'
          }`}
        >
          <Euro className="w-5 h-5" />
          <span>Loyers IRL</span>
        </button>
        <button
          onClick={() => navigate('/documents')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            isActive('/documents')
              ? 'bg-white/15 text-white border-l-4 border-[#f4663b]'
              : 'text-white/90 hover:bg-white/10'
          }`}
        >
          <Folder className="w-5 h-5" />
          <span>Mes documents</span>
        </button>
        <button
          onClick={() => navigate('/annonce-generator')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            isActive('/annonce-generator')
              ? 'bg-white/15 text-white border-l-4 border-[#f4663b]'
              : 'text-white/90 hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Générateur d'annonces</span>
        </button>
        {/* Menu Bail / états des lieux avec sous-menus */}
        <div>
          <button
            onClick={() => setBailMenuOpen(!bailMenuOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium ${
              isBailPage
? 'bg-white/15 text-white border-l-4 border-[#f4663b]'
            : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileSignature className="w-5 h-5" />
              <span>Bail / états des lieux</span>
            </div>
            {bailMenuOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {bailMenuOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/20 pl-2">
              <button
                onClick={() => navigate('/bail')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive('/bail')
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="text-xs">•</span>
                <span>Bail ALUR (vide)</span>
              </button>
              <button
                onClick={() => navigate('/bail-meuble')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive('/bail-meuble')
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="text-xs">•</span>
                <span>Bail ALUR (meublé)</span>
              </button>
              <button
                onClick={() => navigate('/etat-des-lieux')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive('/etat-des-lieux')
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="text-xs">•</span>
                <span>État des lieux</span>
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (onDashboardTabChange) {
              onDashboardTabChange('bilan-annuel');
            }
            navigate('/dashboard?tab=bilan-annuel');
          }}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            location.pathname === '/dashboard' && activeDashboardTab === 'bilan-annuel'
              ? 'bg-white/15 text-white border-l-4 border-[#f4663b]'
              : 'text-white/90 hover:bg-white/10'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Bilan annuel déclaration</span>
        </button>
      </nav>

      {/* Section utilisateur en bas */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {proprietaire?.prenom} {proprietaire?.nom}
            </p>
            <p className="text-xs text-white/70 truncate">{proprietaire?.email}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/');
          }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-colors font-medium"
        >
          <Lock className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
