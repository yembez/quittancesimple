import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, FileText, User, LogOut, CreditCard, FileCheck, Settings, Check, ArrowLeft, ChevronDown } from 'lucide-react';
import LoginModal from './LoginModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Accueil' },
    { path: '/automation', label: 'Automatisation Simple' },
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

  const handleLogout = () => {
    localStorage.removeItem('proprietaireEmail');
    setUserEmail(null);
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/free-dashboard' || location.pathname === '/manage-subscription';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-5 lg:px-10 xl:px-10">
        <div className="flex items-center h-14 max-[480px]:h-[56px]">
          {isDashboard ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-1.5 text-gray-600 hover:text-[#7CAA89] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="w-7 h-7 bg-[#7CAA89] rounded-xl flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                </div>
                <span className="text-base font-bold text-[#2b2b2b]">
                  Quittance Simple
                </span>
              </Link>
            </div>
          ) : (
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-7 h-7 bg-[#7CAA89] rounded-xl flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 text-white stroke-[3]" />
              </div>
              <span className="text-base font-bold text-[#2b2b2b]">
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
                      ? 'text-[#7CAA89]'
                      : 'text-gray-700 hover:text-[#7CAA89]'
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
                      className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50"
                    >
                      {toolsMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsToolsMenuOpen(false)}
                          className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                            isActive(item.path)
                              ? 'bg-[#7CAA89]/10 text-[#7CAA89]'
                              : 'text-gray-700 hover:bg-gray-50'
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
                      ? 'text-[#7CAA89]'
                      : 'text-gray-700 hover:text-[#7CAA89]'
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
                  className="flex items-center space-x-1.5 px-2 py-1 hover:bg-gray-50 rounded-full transition-all"
                >
                  <div className="w-7 h-7 bg-[#ed7862] rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-[#2b2b2b] max-w-[120px] truncate">
                    {userEmail?.split('@')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50"
                    >
                      <div className="px-2.5 py-1.5 border-b border-gray-100">
                        <p className="text-[9px] text-gray-500">Connecté en tant que</p>
                        <p className="text-xs font-semibold text-[#2b2b2b] truncate">{userEmail}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate(`/dashboard?email=${encodeURIComponent(userEmail)}`);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-6 h-6 bg-[#ed7862]/10 rounded-lg flex items-center justify-center">
                            <FileCheck className="w-3.5 h-3.5 text-[#ed7862]" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#2b2b2b]">Tableau de bord</p>
                            <p className="text-[10px] text-gray-500">Mes locataires</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            navigate(`/billing?email=${encodeURIComponent(userEmail)}`);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-6 h-6 bg-[#7CAA89]/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-[#7CAA89]" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#2b2b2b]">Facturation</p>
                            <p className="text-[10px] text-gray-500">Mes factures</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            navigate(`/manage-subscription?email=${encodeURIComponent(userEmail)}`);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-6 h-6 bg-[#FFD76F]/10 rounded-lg flex items-center justify-center">
                            <Settings className="w-3.5 h-3.5 text-[#FFD76F]" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#2b2b2b]">Abonnement</p>
                            <p className="text-[10px] text-gray-500">Gérer mon plan</p>
                          </div>
                        </button>
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 hover:bg-red-50 transition-colors text-left group"
                        >
                          <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-3.5 h-3.5 text-red-600" />
                          </div>
                          <p className="text-xs font-medium text-red-600">Se déconnecter</p>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-sm font-bold text-white bg-[#ed7862] hover:bg-[#e56651] transition-all px-5 py-1.5 rounded-full shadow-sm"
              >
                Connexion
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-1 rounded-lg hover:bg-orange-50 transition-colors ml-auto"
          >
            {isMenuOpen ? (
              <X className="w-4 h-4 text-gray-600" />
            ) : (
              <Menu className="w-4 h-4 text-gray-600" />
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
            className="lg:hidden bg-white/95 backdrop-blur-lg border-t border-gray-100"
          >
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-semibold transition-colors py-2 ${
                  isActive('/')
                    ? 'text-[#7CAA89]'
                    : 'text-gray-700 hover:text-[#7CAA89]'
                }`}
              >
                Accueil
              </Link>

              <Link
                to="/automation"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-semibold transition-colors py-2 ${
                  isActive('/automation')
                    ? 'text-[#7CAA89]'
                    : 'text-gray-700 hover:text-[#7CAA89]'
                }`}
              >
                Automatisation
              </Link>

              <div className="py-1">
                <button
                  onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                  className={`flex items-center justify-between w-full text-sm font-semibold transition-colors py-2 ${
                    isToolsActive()
                      ? 'text-[#7CAA89]'
                      : 'text-gray-700 hover:text-[#7CAA89]'
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
                              ? 'text-[#7CAA89]'
                              : 'text-gray-600 hover:text-[#7CAA89]'
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
                    ? 'text-[#7CAA89]'
                    : 'text-gray-600 hover:text-[#7CAA89]'
                }`}
              >
                Tarifs
              </Link>

              <Link
                to="/about"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-medium transition-colors py-2 ${
                  isActive('/about')
                    ? 'text-[#7CAA89]'
                    : 'text-gray-600 hover:text-[#7CAA89]'
                }`}
              >
                À propos
              </Link>

              <div className="pt-3 border-t border-gray-200 mt-3">
                {userEmail ? (
                  <>
                    <Link
                      to={`/dashboard?email=${encodeURIComponent(userEmail)}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="block bg-[#ed7862] hover:bg-[#e56651] text-white px-4 py-2.5 rounded-xl text-sm font-semibold text-center shadow-sm"
                    >
                      Mon tableau de bord
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-gray-600 hover:text-red-600 px-4 py-2 text-sm font-medium text-center mt-2"
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
                    className="block w-full bg-[#ed7862] hover:bg-[#e56651] text-white px-4 py-2.5 rounded-xl text-sm font-semibold text-center shadow-sm"
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
        onClose={() => setIsLoginModalOpen(false)}
        mode={loginMode}
        onModeChange={setLoginMode}
      />
    </header>
  );
};

export default Header;