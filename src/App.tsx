import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import UserSpaceHeader from './components/UserSpaceHeader';
import Footer from './components/Footer';
import Home from './pages/Home';
import HomeVersion1 from './pages/HomeVersion1';
import HomeVersion2 from './pages/HomeVersion2';
import HomeVersion3 from './pages/HomeVersion3';
import Generator from './pages/Generator';
import Automation from './pages/Automation';
import AutomationSetup from './pages/AutomationSetup';
import AutomationPlusSetup from './pages/AutomationPlusSetup';
import Pricing from './pages/Pricing';
import Blog from './pages/Blog';
import FAQ from './pages/FAQ';
import About from './pages/About';
import ProrataCalculator from './pages/ProrataCalculator';
import Dashboard from './pages/Dashboard';
import FreeDashboard from './pages/FreeDashboard';
import PaymentCheckout from './pages/PaymentCheckout';
import Billing from './pages/Billing';
import BankSync from './pages/BankSync';
import PaymentRules from './pages/PaymentRules';
import TenantDetectionSetup from './pages/TenantDetectionSetup';
import ManageSubscription from './pages/ManageSubscription';
import Historique from './pages/Historique';
import Documents from './pages/Documents';
import EtatDesLieux from './pages/EtatDesLieux';
import HowItWorks from './pages/HowItWorks';
import Legal from './pages/Legal';
import QuittancePDFGratuit from './pages/QuittancePDFGratuit';
import QuittanceLoyerMeuble from './pages/QuittanceLoyerMeuble';
import ModeleQuittanceLoyer from './pages/ModeleQuittanceLoyer';
import ModeleQuittanceWord from './pages/ModeleQuittanceWord';
import ModeleQuittanceExcel from './pages/ModeleQuittanceExcel';
import AutomatisationEnvoi from './pages/AutomatisationEnvoi';
import QuittanceGratuiteEnLigne from './pages/QuittanceGratuiteEnLigne';
import OwnerConfirmation from './pages/OwnerConfirmation';
import QuickConfirm from './pages/QuickConfirm';
import QuickPaymentConfirm from './pages/QuickPaymentConfirm';
import SMSConfirm from './pages/SMSConfirm';
import ShortLinkRedirect from './pages/ShortLinkRedirect';
import PowensCallback from "./pages/powens/callback";
import CalculRevisionLoyer from './pages/CalculRevisionLoyer';
import IRLResultat from './pages/IRLResultat';
import RevisionIRL from './pages/RevisionIRL';
import FreeSignup from './pages/FreeSignup';
import Admin from './pages/Admin';
import QuittanceSuccess from './pages/QuittanceSuccess';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';
import SetPassword from './pages/SetPassword'; // ← NOUVELLE LIGNE
import BailWeb from './pages/BailWeb';
import BailMeubleWeb from './pages/BailMeubleWeb';
import Overview from './pages/Overview';
import AnnonceGenerator from './pages/AnnonceGenerator';
import SignatureSignPage from './pages/SignatureSignPage';
import BailSignatureValidationPage from './pages/BailSignatureValidationPage';
import BailSignatureFlowPage from './pages/BailSignatureFlowPage';
import EspaceBailleurLayout from './layouts/EspaceBailleurLayout';

// Component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const EspaceBailleurLayoutElement = <EspaceBailleurLayout />;

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Rediriger vers la page set-password "lien expiré" si Supabase renvoie une erreur dans le hash (ex: otp_expired)
  const checkAuthErrorHash = React.useCallback(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 10) return false;
    try {
      const params = new URLSearchParams(hash.slice(1));
      const errorCode = params.get('error_code') || '';
      const errorDesc = (params.get('error_description') || '').toLowerCase();
      if (errorCode === 'otp_expired' || errorDesc.includes('expired') || errorDesc.includes('invalid') || errorDesc.includes('has expired')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search || '/');
        navigate('/set-password?type=recovery&expired=1', { replace: true });
        return true;
      }
    } catch (_) { /* ignore */ }
    return false;
  }, [navigate]);

  React.useEffect(() => {
    checkAuthErrorHash();
  }, [checkAuthErrorHash, location.pathname]);

  // CTA mail campagne / essai gratuit : sur l'accueil avec #loginEmail=... → ouvrir le modal INSCRIPTION (création de compte).
  React.useEffect(() => {
    if (location.pathname !== '/') return;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash || !hash.toLowerCase().includes('loginemail=')) return;
    try {
      const params = new URLSearchParams(hash.slice(1));
      const raw = (params.get('loginEmail') || '').trim();
      const isPlaceholder = /^\s*\{\{\s*email\s*\}\}\s*$/i.test(raw) || raw.includes('{{') || raw.includes('}}');
      const email = isPlaceholder ? '' : raw;
      const signupMode = params.get('mode') === 'signup' || !!email;
      if (email || signupMode) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search || '/');
        navigate('/', { replace: true, state: { openLogin: true, prefilledEmail: email || undefined, signupMode: true } });
      }
    } catch (_) { /* ignore */ }
  }, [location.pathname, navigate]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const noLayoutPages = ['/billing', '/owner-confirmation', '/quick-confirm', '/quick-payment-confirm', '/sms-confirm', '/confirmation', '/quittance-success', '/payment-success', '/payment-cancelled', '/set-password', '/bail', '/bail-meuble', '/sign'];
  const noFooterPages = ['/billing', '/owner-confirmation', '/quick-confirm', '/quick-payment-confirm', '/sms-confirm', '/confirmation', '/dashboard', '/overview', '/free-dashboard', '/manage-subscription', '/historique', '/revision-irl', '/quittance-success', '/payment-success', '/payment-cancelled', '/set-password', '/bail', '/bail-meuble', '/documents', '/annonce-generator', '/etat-des-lieux', '/sign', '/dashboard/baux'];
  const formPages = ['/generator', '/generateur-quittance-loyer'];

  const userSpacePages = ['/dashboard', '/overview', '/free-dashboard', '/manage-subscription', '/historique', '/revision-irl', '/billing', '/documents', '/bail', '/bail-meuble', '/annonce-generator', '/etat-des-lieux', '/dashboard/baux'];
  const isUserSpacePage = userSpacePages.some(
    (p) =>
      location.pathname === p ||
      location.pathname.startsWith(`${p}/`) ||
      location.pathname.startsWith(`${p}?`)
  );

  const isSignPage = location.pathname.startsWith('/sign/');
  const shouldShowLayout = !noLayoutPages.includes(location.pathname) && !location.pathname.startsWith('/c/') && !isSignPage;
  const isBailSignatureDashboardPage = location.pathname.startsWith('/dashboard/baux/');
  const shouldShowFooter =
    !noFooterPages.includes(location.pathname) &&
    !isBailSignatureDashboardPage &&
    !location.pathname.startsWith('/c/') &&
    !isSignPage &&
    !(isMobile && formPages.includes(location.pathname));

  const showUserSpaceHeader = isUserSpacePage;
  const showMainHeader = shouldShowLayout && !showUserSpaceHeader;

  React.useEffect(() => {
    if (isUserSpacePage) {
      document.title = 'QS Espace bailleur';
    }
  }, [isUserSpacePage, location.pathname]);

  return (
    <div className="min-h-screen bg-white">
      {showUserSpaceHeader && <UserSpaceHeader />}
      {showMainHeader && <Header />}
      <main className={showUserSpaceHeader || (showMainHeader && (location.pathname !== '/' || isMobile)) ? 'pt-14' : ''}>
        <Routes>
          <Route path="/powens/callback" element={<PowensCallback />} />
          <Route path="/" element={<Home />} />
          <Route path="/version1" element={<HomeVersion1 />} />
          <Route path="/version2" element={<HomeVersion2 />} />
          <Route path="/version3" element={<HomeVersion3 />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/generateur-quittance-loyer" element={<Generator />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/automation-setup" element={<AutomationSetup />} />
          <Route path="/automation-plus-setup" element={<AutomationPlusSetup />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/fonctionnement" element={<HowItWorks />} />
          <Route path="/comment-ca-marche" element={<HowItWorks />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/terms" element={<Legal tab="cgu" />} />
          <Route path="/privacy" element={<Legal tab="privacy" />} />
          <Route path="/obligations-legales" element={<Legal />} />
          <Route path="/mentions-obligatoires-quittance" element={<Legal />} />
          <Route path="/quittance-loyer-pdf-gratuit" element={<QuittancePDFGratuit />} />
          <Route path="/modele-quittance-pdf" element={<QuittancePDFGratuit />} />
          <Route path="/quittance-loyer-meuble" element={<QuittanceLoyerMeuble />} />
          <Route path="/location-meublee-quittance" element={<QuittanceLoyerMeuble />} />
          <Route path="/modele-quittance-loyer-gratuit" element={<ModeleQuittanceLoyer />} />
          <Route path="/modele-quittance-loyer" element={<ModeleQuittanceLoyer />} />
          <Route path="/template-quittance-gratuit" element={<ModeleQuittanceLoyer />} />
          <Route path="/modele-quittance-word" element={<ModeleQuittanceWord />} />
          <Route path="/modele-quittance-excel" element={<ModeleQuittanceExcel />} />
          <Route path="/automatisation-envoi-quittances" element={<AutomatisationEnvoi />} />
          <Route path="/envoyer-quittance-automatiquement" element={<AutomatisationEnvoi />} />
          <Route path="/envoi-automatique-quittance" element={<AutomatisationEnvoi />} />
          <Route path="/quittance-gratuite-en-ligne" element={<QuittanceGratuiteEnLigne />} />
          <Route path="/quittance-en-ligne" element={<QuittanceGratuiteEnLigne />} />
          <Route path="/creer-quittance-en-ligne" element={<QuittanceGratuiteEnLigne />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/prorata" element={<ProrataCalculator />} />
          <Route path="/calcul-revision-loyer" element={<CalculRevisionLoyer />} />
          <Route path="/irl/resultat" element={<IRLResultat />} />
          <Route path="/tableau-de-bord" element={<Navigate to="/overview" replace />} />
          <Route element={EspaceBailleurLayoutElement}>
            <Route path="/revision-irl" element={<RevisionIRL />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/historique" element={<Historique />} />
            <Route path="/bail" element={<BailWeb />} />
            <Route path="/bail-meuble" element={<BailMeubleWeb />} />
            <Route path="/etat-des-lieux" element={<EtatDesLieux />} />
            <Route path="/annonce-generator" element={<AnnonceGenerator />} />
            <Route path="/dashboard/baux/:id/validation" element={<BailSignatureValidationPage />} />
            <Route path="/dashboard/baux/:id/signature" element={<BailSignatureFlowPage />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/manage-subscription" element={<ManageSubscription />} />
          </Route>
          <Route path="/free-dashboard" element={<FreeDashboard />} />
          <Route path="/payment-checkout" element={<PaymentCheckout />} />
          <Route path="/bank-sync" element={<BankSync />} />
          <Route path="/payment-rules" element={<PaymentRules />} />
          <Route path="/tenant-detection-setup" element={<TenantDetectionSetup />} />
          <Route path="/owner-confirmation" element={<OwnerConfirmation />} />
          <Route path="/quick-confirm" element={<QuickConfirm />} />
          <Route path="/quick-payment-confirm" element={<QuickPaymentConfirm />} />
          <Route path="/sms-confirm" element={<SMSConfirm />} />
          <Route path="/c/:code" element={<ShortLinkRedirect />} />
          <Route path="/inscription" element={<FreeSignup />} />
          <Route path="/signup" element={<FreeSignup />} />
          <Route path="/set-password" element={<SetPassword />} /> {/* ← NOUVELLE ROUTE */}
          <Route path="/sign/:token" element={<SignatureSignPage />} />
          <Route path="/quittance-success" element={<QuittanceSuccess />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {shouldShowFooter && <Footer />}
      <Analytics />
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <ScrollToTop />
      <App />
    </Router>
  );
}

export default AppWrapper;
