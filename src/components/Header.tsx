import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, FileText, User, LogOut, CreditCard, FileCheck, Settings, Check, ArrowLeft } from 'lucide-react';
import LoginModal from './LoginModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Accueil' },
    { path: '/generator', label: 'Générateur' },
    { path: '/automation', label: 'Automatisation' },
    { path: '/pricing', label: 'Tarifs' },
    { path: '/prorata', label: 'Calculateur Prorata' },
    { path: '/about', label: 'À propos' },
  ];

  const isActive = (path: string) => location.pathname === path;

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

  const handleLogout = () => {
    localStorage.removeItem('proprietaireEmail');
    setUserEmail(null);
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/free-dashboard' || location.pathname === '/manage-subscription';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {isDashboard ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-[#7CAA89] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-[#7CAA89] rounded-xl flex items-center justify-center shadow-sm">
                  <Check className="w-6 h-6 text-white stroke-[3]" />
                </div>
                <span className="text-xl font-bold text-[#2b2b2b]">
                  Quittance Simple
                </span>
              </Link>
            </div>
          ) : (
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-[#7CAA89] rounded-xl flex items-center justify-center shadow-sm">
                <Check className="w-6 h-6 text-white stroke-[3]" />
              </div>
              <span className="text-xl font-bold text-[#2b2b2b]">
                Quittance Simple
              </span>
            </Link>
          )}

          {!isDashboard && (
            <nav className="hidden lg:flex items-center space-x-8 mx-auto">
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-lg font-semibold transition-colors ${
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

          <div className="hidden lg:flex items-center space-x-4">
            {userEmail ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded-full transition-all"
                >
                  <div className="w-10 h-10 bg-[#ed7862] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#2b2b2b] max-w-[150px] truncate">
                    {userEmail?.split('@')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Connecté en tant que</p>
                        <p className="text-sm font-semibold text-[#2b2b2b] truncate">{userEmail}</p>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate(`/dashboard?email=${encodeURIComponent(userEmail)}`);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-9 h-9 bg-[#ed7862]/10 rounded-lg flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-[#ed7862]" />
                          </div>
                          <div>
                            <p className="text-base font-medium text-[#2b2b2b]">Tableau de bord</p>
                            <p className="text-sm text-gray-500">Mes locataires</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            navigate(`/manage-subscription?email=${encodeURIComponent(userEmail)}`);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-9 h-9 bg-[#FFD76F]/10 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-[#FFD76F]" />
                          </div>
                          <div>
                            <p className="text-base font-medium text-[#2b2b2b]">Gérer mon abonnement</p>
                            <p className="text-sm text-gray-500">Factures & abonnement</p>
                          </div>
                        </button>
                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left group"
                        >
                          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-5 h-5 text-red-600" />
                          </div>
                          <p className="text-base font-medium text-red-600">Se déconnecter</p>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-lg font-bold text-white bg-[#ed7862] hover:bg-[#e56651] transition-all px-8 py-3 rounded-full shadow-sm"
              >
                Connexion
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-orange-50 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
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
            <div className="px-6 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block text-sm font-medium transition-colors py-2 ${
                    isActive(item.path)
                      ? 'text-[#7CAA89]'
                      : 'text-gray-600 hover:text-[#7CAA89]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {userEmail ? (
                <>
                  <Link
                    to={`/dashboard?email=${encodeURIComponent(userEmail)}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="block bg-[#ed7862] hover:bg-[#e56651] text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center mt-4"
                  >
                    Mon tableau de bord
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center"
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
                  className="block w-full bg-[#ed7862] hover:bg-[#e56651] text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center mt-4"
                >
                  Connexion
                </button>
              )}
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