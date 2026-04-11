import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, FileText, User, LogOut, CreditCard, FileCheck, Settings, Check, ArrowLeft, ChevronDown } from 'lucide-react';
import LoginModal from './LoginModal';
import PackActivationFlow from './PackActivationFlow';
import { signOutFromApp } from '../lib/authSignOut';
import { supabase } from '../lib/supabase';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [loginPrefilledEmail, setLoginPrefilledEmail] = useState<string | null>(null);
  const [isPackActivationFlowOpen, setIsPackActivationFlowOpen] = useState(false);
  const [packActivationPrefillEmail, setPackActivationPrefillEmail] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Accueil' },
    { path: '/automation', label: 'Pack Automatique' },
    { path: '/pricing', label: 'Tarifs' },
    { path: '/about', label: 'À propos' },
  ];

  const toolsMenuItems = [
    { path: '/generator', label: 'Générateur de quittance (gratuit)' },
    { path: '/calcul-revision-loyer', label: 'Calcul de révision de loyer (IRL)' },
    { path: '/prorata', label: 'Calculateur de prorata de loyer' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isToolsActive = () => toolsMenuItems.some(item => item.path === location.pathname);

  useEffect(() => {
    const email = localStorage.getItem('proprietaireEmail');
    setUserEmail(email);
  }, [location]);

  useEffect(() => {
    const state = location.state as { openLogin?: boolean; prefilledEmail?: string; signupMode?: boolean } | null;
    if (state?.openLogin) {
      const email = (state.prefilledEmail || '').trim();
      if (state.signupMode && email) {
        setPackActivationPrefillEmail(email);
        setIsPackActivationFlowOpen(true);
      } else {
        if (email) setLoginPrefilledEmail(email);
        setLoginMode(state.signupMode ? 'signup' : 'login');
        setIsLoginModalOpen(true);
      }
      navigate(location.pathname || '/', { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Liens e-mail : /?openLogin=1&loginEmail=…&returnUrl=/dashboard — invité = modale ; déjà connecté = redirection directe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openLogin') !== '1') return;

    const returnUrlRaw = (params.get('returnUrl') || '').trim();
    const safeReturn =
      returnUrlRaw.startsWith('/') && !returnUrlRaw.startsWith('//') ? returnUrlRaw : '';

    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session?.user && safeReturn) {
        const postRelance = params.get('postLoginOpenRelance');
        params.delete('openLogin');
        params.delete('loginEmail');
        params.delete('returnUrl');
        params.delete('postLoginOpenRelance');
        params.delete('signupMode');
        if (postRelance) {
          try {
            sessionStorage.setItem('openRelanceLocataireId', postRelance);
          } catch {
            /* ignore */
          }
        }
        const rest = params.toString();
        const joiner = safeReturn.includes('?') ? '&' : '?';
        const target = rest ? `${safeReturn}${joiner}${rest}` : safeReturn;
        navigate(target, { replace: true });
        return;
      }

      const email = (params.get('loginEmail') || '').trim();
      const signupMode = params.get('signupMode') === '1';
      if (signupMode && email) {
        setPackActivationPrefillEmail(email);
        setIsPackActivationFlowOpen(true);
      } else {
        if (email) setLoginPrefilledEmail(email);
        setLoginMode(signupMode ? 'signup' : 'login');
        setIsLoginModalOpen(true);
      }
      params.delete('openLogin');
      params.delete('loginEmail');
      params.delete('returnUrl');
      params.delete('signupMode');
      params.delete('postLoginOpenRelance');
      const rest = params.toString();
      navigate({ pathname: '/', search: rest ? `?${rest}` : '' }, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [location.search, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOutFromApp();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('proprietaireEmail');
    setUserEmail(null);
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/free-dashboard' || location.pathname === '/manage-subscription';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#f6f5f9] backdrop-blur-lg border-b border-[#e8e7ef]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-5 lg:px-10 xl:px-10">
        <div className="flex items-center h-14 max-[480px]:h-[56px]">
          {isDashboard ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-1.5 text-[#5e6478] hover:text-[#f4663b] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="w-7 h-7 bg-[#f4663b] rounded-xl flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                </div>
                <span className="text-base font-bold text-[#151b2c]">
                  Quittance Simple
                </span>
              </Link>
            </div>
          ) : (
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-7 h-7 bg-[#f4663b] rounded-xl flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 text-white stroke-[3]" />
              </div>
              <span className="text-base font-bold text-[#151b2c]">
                Quittance Simple
              </span>
            </Link>
          )}

          {!isDashboard && (
            <nav className="hidden lg:flex items-center space-x-8 ml-20">
              <div className="relative" ref={toolsMenuRef}>
                <button
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  className={`flex items-center space-x-1 text-[14px] font-semibold transition-colors ${
                    isToolsActive()
                      ? 'text-[#f4663b]'
                      : 'text-[#151b2c] hover:text-[#f4663b]'
                  }`}
                >
                  <span>Outils gratuits</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isToolsMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#e8e7ef] py-1 z-50"
                    >
                      {toolsMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsToolsMenuOpen(false)}
                          className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                            isActive(item.path)
                              ? 'bg-[#f4663b]/10 text-[#f4663b]'
                              : 'text-[#151b2c] hover:bg-[#f6f5f9]'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navItems.slice(1).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-[14px] font-semibold transition-colors ${
                    isActive(item.path)
                      ? 'text-[#f4663b]'
                      : 'text-[#151b2c] hover:text-[#f4663b]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="hidden lg:flex items-center space-x-2 ml-auto">
            {userEmail ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 hover:bg-[#f7f5fa] rounded-xl transition-all border border-transparent hover:border-[#e8e7ef]"
                >
                  <div className="w-7 h-7 bg-[#E65F3F] rounded-lg flex items-center justify-center shadow-sm">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-[#212a3e] max-w-[120px] truncate">
                    {userEmail?.split('@')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.12)] border border-[#e8e7ef] py-2 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2.5 border-b border-[#e8e7ef] bg-[#f7f5fa]">
                        <p className="text-[10px] text-[#5e6478] uppercase tracking-wide font-semibold">Connecté en tant que</p>
                        <p className="text-xs font-semibold text-[#212a3e] truncate mt-0.5">{userEmail}</p>
                      </div>

                      <div className="py-1.5">
                        <button
                          onClick={() => {
                            navigate(`/dashboard?email=${encodeURIComponent(userEmail)}`);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#f7f5fa] transition-colors text-left group"
                        >
                          <div className="w-7 h-7 bg-[#E65F3F]/10 rounded-lg flex items-center justify-center group-hover:bg-[#E65F3F]/20 transition-colors">
                            <FileCheck className="w-4 h-4 text-[#E65F3F]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-[#212a3e]">Tableau de bord</p>
                            <p className="text-[10px] text-[#5e6478] mt-0.5">Mes locataires</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            navigate(`/billing?email=${encodeURIComponent(userEmail)}`);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#f7f5fa] transition-colors text-left group"
                        >
                          <div className="w-7 h-7 bg-[#212a3e]/10 rounded-lg flex items-center justify-center group-hover:bg-[#212a3e]/20 transition-colors">
                            <FileText className="w-4 h-4 text-[#212a3e]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-[#212a3e]">Facturation</p>
                            <p className="text-[10px] text-[#5e6478] mt-0.5">Mes factures</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            navigate(`/manage-subscription?email=${encodeURIComponent(userEmail)}`);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#f7f5fa] transition-colors text-left group"
                        >
                          <div className="w-7 h-7 bg-[#212a3e]/10 rounded-lg flex items-center justify-center group-hover:bg-[#212a3e]/20 transition-colors">
                            <Settings className="w-4 h-4 text-[#212a3e]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-[#212a3e]">Abonnement</p>
                            <p className="text-[10px] text-[#5e6478] mt-0.5">Gérer mon plan</p>
                          </div>
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
                          <p className="text-xs font-semibold text-red-600">Se déconnecter</p>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-sm font-bold text-white bg-[#45556e] hover:bg-[#3a4a5f] transition-all px-5 py-2 rounded-xl shadow-sm"
              >
                Connexion
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/60 transition-colors ml-auto"
          >
            {isMenuOpen ? (
              <X className="w-4 h-4 text-[#151b2c]" />
            ) : (
              <Menu className="w-4 h-4 text-[#151b2c]" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#faf9fc] backdrop-blur-lg border-t border-[#e8e7ef]"
          >
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-semibold transition-colors py-2 ${
                  isActive('/')
                    ? 'text-[#f4663b]'
                    : 'text-[#151b2c] hover:text-[#f4663b]'
                }`}
              >
                Accueil
              </Link>

              <Link
                to="/automation"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-semibold transition-colors py-2 ${
                  isActive('/automation')
                    ? 'text-[#f4663b]'
                    : 'text-[#151b2c] hover:text-[#f4663b]'
                }`}
              >
                Pack Automatique
              </Link>

              <div className="py-1">
                <button
                  onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                  className={`flex items-center justify-between w-full text-sm font-semibold transition-colors py-2 ${
                    isToolsActive()
                      ? 'text-[#f4663b]'
                      : 'text-[#151b2c] hover:text-[#f4663b]'
                  }`}
                >
                  <span>Outils gratuits</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMobileToolsOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMobileToolsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 mt-1 space-y-1"
                    >
                      {toolsMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileToolsOpen(false);
                          }}
                          className={`block text-sm font-medium transition-colors py-2 ${
                            isActive(item.path)
                              ? 'text-[#f4663b]'
                              : 'text-[#5e6478] hover:text-[#f4663b]'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to="/pricing"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-medium transition-colors py-2 ${
                  isActive('/pricing')
                    ? 'text-[#f4663b]'
                    : 'text-[#5e6478] hover:text-[#f4663b]'
                }`}
              >
                Tarifs
              </Link>

              <Link
                to="/about"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-medium transition-colors py-2 ${
                  isActive('/about')
                    ? 'text-[#f4663b]'
                    : 'text-[#5e6478] hover:text-[#f4663b]'
                }`}
              >
                À propos
              </Link>

              <div className="pt-3 border-t border-[#e8e7ef] mt-3">
                {userEmail ? (
                  <>
                    <Link
                      to={`/dashboard?email=${encodeURIComponent(userEmail)}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="block bg-[#f4663b] hover:bg-[#e25830] text-white px-4 py-2.5 rounded-xl text-sm font-semibold text-center shadow-sm"
                    >
                      Mon tableau de bord
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-[#5e6478] hover:text-red-600 px-4 py-2 text-sm font-medium text-center mt-2"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="block w-full bg-[#45556e] hover:bg-[#3a4a5f] text-white px-4 py-2.5 rounded-xl text-sm font-semibold text-center shadow-sm"
                  >
                    Connexion
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => { setIsLoginModalOpen(false); setLoginPrefilledEmail(null); }}
        mode={loginMode}
        onModeChange={setLoginMode}
        initialEmail={loginPrefilledEmail ?? undefined}
      />

      <PackActivationFlow
        isOpen={isPackActivationFlowOpen}
        onClose={() => { setIsPackActivationFlowOpen(false); setPackActivationPrefillEmail(null); }}
        prefillEmail={packActivationPrefillEmail ?? undefined}
      />
    </header>
  );
};

export default Header;
