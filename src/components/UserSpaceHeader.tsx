import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  LogOut,
  FileText,
  FileCheck,
  Settings,
  ChevronLeft,
  Menu,
  X,
  Home,
  Folder,
  Euro,
  FileSignature,
  TrendingUp,
  CreditCard,
  Package,
} from 'lucide-react';
import { signOutFromApp } from '../lib/authSignOut';

const UserSpaceHeader = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('proprietaireEmail');
    setUserEmail(email);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsBurgerOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    try {
      await signOutFromApp();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('proprietaireEmail');
    setUserEmail(null);
    setIsUserMenuOpen(false);
    setIsBurgerOpen(false);
    navigate('/');
  };

  const emailParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
  const navTo = (path: string, query = '') => {
    navigate(path + query);
    setIsBurgerOpen(false);
  };

  // Titres de page de l'espace bailleur (référence Overview : une ligne, titre + sous-titre)
  const getPageTitle = (): { title: string; subtitle: string } | null => {
    const p = location.pathname;
    if (!userEmail) return null;
    if (p === '/overview') return { title: "Vue d'ensemble", subtitle: "Informations essentielles en un coup d'œil" };
    if (p === '/dashboard') return { title: 'Automatisation des quittances', subtitle: 'Infos locataires et gestion des quittances' };
    if (p === '/historique') return { title: 'Historique des quittances', subtitle: 'Consultez et téléchargez vos quittances générées' };
    if (p === '/revision-irl') return { title: 'Révision de loyer (IRL)', subtitle: 'Calculez votre révision IRL et programmez un rappel' };
    if (p === '/documents') return { title: 'Mes documents', subtitle: 'Gérez vos documents privés en toute sécurité' };
    if (p === '/manage-subscription') return { title: 'Abonnement', subtitle: 'Gérez votre abonnement et vos factures' };
    if (p === '/billing') return { title: 'Facturation', subtitle: 'Gérez votre abonnement et téléchargez vos factures' };
    if (p === '/bail') return { title: 'Bail vide (ALUR)', subtitle: 'Contrat de location vide' };
    if (p === '/bail-meuble') return { title: 'Bail meuble', subtitle: 'Contrat de location meublée' };
    if (p === '/etat-des-lieux') return { title: 'État des lieux', subtitle: 'État des lieux (ALUR)' };
    if (p === '/annonce-generator') return { title: "Générateur d'annonces", subtitle: "Créez votre annonce immobilière" };
    if (p.match(/^\/dashboard\/baux\/[^/]+\/validation$/)) return { title: 'Validation avant signature', subtitle: 'Vérifiez le bail avant envoi' };
    if (p.match(/^\/dashboard\/baux\/[^/]+\/signature$/)) return { title: 'Suivi de signature', subtitle: 'Suivi des signatures du bail' };
    return null;
  };

  const pageTitle = getPageTitle();

  const headerContent = (
    <>
    <header
      className="fixed top-0 left-0 right-0 z-[9998] bg-white border-b border-[#e8e7ef]"
      style={{ position: 'fixed', top: 0, left: 0, right: 0 }}
    >
      {/* Grille : [Logo à gauche] [Zone titre alignée contenu 67rem] [Menu à droite] */}
      <div className="grid grid-cols-[1fr_minmax(0,67rem)_1fr] items-center h-14 max-[480px]:h-[52px] gap-0">
        {/* Colonne gauche : retour + logo Quittance Simple */}
        <div className="flex items-center min-w-0 pl-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors shrink-0 mr-1"
            aria-label="Retour"
          >
            <ChevronLeft className="w-5 h-5 text-[#151b2c]" />
          </button>
          <Link
            to="/"
            className="flex items-center space-x-2 min-w-0 shrink-0"
          >
            <div className="w-7 h-7 bg-[#f4663b] rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className={`text-base font-bold whitespace-nowrap text-[#151b2c] ${userEmail ? 'hidden lg:inline' : 'inline'}`}>
              Quittance Simple
            </span>
          </Link>
        </div>

        {/* Colonne centrale : titre de page (aligné avec le contenu de la page) */}
        <div className="px-4 sm:px-5 min-w-0 hidden lg:block">
          {userEmail && pageTitle && (
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-[#1e3a5f] tracking-tight">{pageTitle.title}</h1>
              <span className="text-sm text-[#5e6478]">{pageTitle.subtitle}</span>
            </div>
          )}
        </div>

        {/* Titre centré mobile */}
        {userEmail && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none lg:hidden">
            <span className="text-base font-bold text-[#f4663b] whitespace-nowrap">
              {pageTitle ? pageTitle.title : 'Espace bailleur'}
            </span>
          </div>
        )}

        {/* Colonne droite : menu */}
        <div className="flex items-center justify-end min-w-0 pr-2 sm:pr-4">
        {/* Mobile : menu burger (pas de menu user horizontal) */}
        <div className="flex items-center lg:hidden">
          {userEmail ? (
            <button
              type="button"
              onClick={() => setIsBurgerOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-6 h-6 text-[#151b2c]" />
            </button>
          ) : (
            <Link
              to="/"
              className="text-sm font-bold text-white bg-[#45556e] hover:bg-[#3a4a5f] transition-all px-4 py-2 rounded-xl"
            >
              Connexion
            </Link>
          )}
        </div>

        {/* Desktop : profil utilisateur (dropdown) */}
        <div className="hidden lg:flex lg:items-center lg:pr-4" ref={userMenuRef}>
          {userEmail ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 hover:bg-[#f7f5fa] rounded-xl transition-all border border-transparent hover:border-[#e8e7ef]"
              >
                <div className="w-8 h-8 bg-[#E65F3F] rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-[#212a3e] max-w-[140px] truncate hidden sm:inline">
                  {userEmail.split('@')[0]}
                </span>
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.12)] border border-[#e8e7ef] py-2 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2.5 border-b border-[#e8e7ef] bg-[#f7f5fa]">
                      <p className="text-[10px] text-[#5e6478] uppercase tracking-wide font-semibold">Connecté en tant que</p>
                      <p className="text-xs font-semibold text-[#212a3e] truncate mt-0.5">{userEmail}</p>
                    </div>
                    <div className="py-1.5">
                      <button
                        onClick={() => { navigate(`/dashboard${emailParam}`); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#f7f5fa] transition-colors text-left group"
                      >
                        <div className="w-7 h-7 bg-[#E65F3F]/10 rounded-lg flex items-center justify-center group-hover:bg-[#E65F3F]/20 transition-colors">
                          <FileCheck className="w-4 h-4 text-[#E65F3F]" />
                        </div>
                        <span className="text-sm font-semibold text-[#212a3e]">Tableau de bord</span>
                      </button>
                      <button
                        onClick={() => { navigate(`/billing${emailParam}`); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#f7f5fa] transition-colors text-left group"
                      >
                        <div className="w-7 h-7 bg-[#212a3e]/10 rounded-lg flex items-center justify-center group-hover:bg-[#212a3e]/20 transition-colors">
                          <FileText className="w-4 h-4 text-[#212a3e]" />
                        </div>
                        <span className="text-sm font-semibold text-[#212a3e]">Facturation</span>
                      </button>
                      <button
                        onClick={() => { navigate(`/manage-subscription${emailParam}`); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#f7f5fa] transition-colors text-left group"
                      >
                        <div className="w-7 h-7 bg-[#212a3e]/10 rounded-lg flex items-center justify-center group-hover:bg-[#212a3e]/20 transition-colors">
                          <Settings className="w-4 h-4 text-[#212a3e]" />
                        </div>
                        <span className="text-sm font-semibold text-[#212a3e]">Abonnement</span>
                      </button>
                    </div>
                    <div className="border-t border-[#e8e7ef] pt-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-red-50 transition-colors text-left group"
                      >
                        <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          <LogOut className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-sm font-semibold text-red-600">Se déconnecter</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/"
              className="text-sm font-bold text-white bg-[#45556e] hover:bg-[#3a4a5f] transition-all px-4 py-2 rounded-xl"
            >
              Connexion
            </Link>
          )}
        </div>
        </div>
      </div>
    </header>

    {/* Menu burger mobile : overlay + panneau latéral */}
    <AnimatePresence>
      {isBurgerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9999] lg:hidden"
            onClick={() => setIsBurgerOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed top-0 left-0 bottom-0 w-[min(320px,85vw)] bg-white border-r border-[#e8e7ef] shadow-xl z-[9999] lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-[#e8e7ef] shrink-0">
              <span className="font-semibold text-[#151b2c]">Menu</span>
              <button
                type="button"
                onClick={() => setIsBurgerOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5 text-[#151b2c]" />
              </button>
            </div>
            {userEmail && (
              <div className="px-4 py-3 border-b border-[#e8e7ef] shrink-0">
                <p className="text-[10px] text-[#5e6478]">Connecté</p>
                <p className="text-sm font-medium text-[#151b2c] truncate">{userEmail}</p>
              </div>
            )}
            <nav className="flex-1 overflow-y-auto py-3">
              <div className="space-y-0.5 px-2">
                <button type="button" onClick={() => navTo('/overview')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <Home className="w-5 h-5 text-[#5e6478]" />
                  <span>Vue d'ensemble</span>
                </button>
                <button type="button" onClick={() => navTo('/dashboard', emailParam)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <FileCheck className="w-5 h-5 text-[#5e6478]" />
                  <span>Automatiser quittances</span>
                </button>
                <button type="button" onClick={() => navTo('/historique')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <FileText className="w-5 h-5 text-[#5e6478]" />
                  <span>Historique quittances</span>
                </button>
                <button type="button" onClick={() => navTo('/revision-irl')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <Euro className="w-5 h-5 text-[#5e6478]" />
                  <span>Loyers IRL</span>
                </button>
                <button type="button" onClick={() => navTo('/documents')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <Folder className="w-5 h-5 text-[#5e6478]" />
                  <span>Mes documents</span>
                </button>
                <button type="button" onClick={() => navTo('/bail')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <FileSignature className="w-5 h-5 text-[#5e6478]" />
                  <span>Bail ALUR (vide)</span>
                </button>
                <button type="button" onClick={() => navTo('/bail-meuble')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <FileSignature className="w-5 h-5 text-[#5e6478]" />
                  <span>Bail ALUR (meublé)</span>
                </button>
                <button type="button" onClick={() => navTo('/etat-des-lieux')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <FileSignature className="w-5 h-5 text-[#5e6478]" />
                  <span>État des lieux</span>
                </button>
                <button type="button" onClick={() => navTo('/dashboard', (userEmail ? emailParam + '&' : '?') + 'tab=bilan-annuel')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <TrendingUp className="w-5 h-5 text-[#5e6478]" />
                  <span>Bilan annuel déclaration</span>
                </button>
                <button type="button" onClick={() => navTo('/billing', emailParam)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <CreditCard className="w-5 h-5 text-[#5e6478]" />
                  <span>Facturation</span>
                </button>
                <button type="button" onClick={() => navTo('/manage-subscription', emailParam)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm font-medium text-[#151b2c]">
                  <Package className="w-5 h-5 text-[#5e6478]" />
                  <span>Abonnement</span>
                </button>
              </div>
            </nav>
            <div className="p-3 border-t border-[#e8e7ef] shrink-0">
              <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left text-sm font-medium text-red-600">
                <LogOut className="w-5 h-5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
    </>
  );

  return createPortal(headerContent, document.body);
};

export default UserSpaceHeader;
