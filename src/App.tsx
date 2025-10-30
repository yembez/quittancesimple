import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
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
import PaymentCheckout from './pages/PaymentCheckout';
import Billing from './pages/Billing';
import BankSync from './pages/BankSync';
import PaymentRules from './pages/PaymentRules';
import TenantDetectionSetup from './pages/TenantDetectionSetup';
import HowItWorks from './pages/HowItWorks';
import Legal from './pages/Legal';
import QuittancePDFGratuit from './pages/QuittancePDFGratuit';
import QuittanceLoyerMeuble from './pages/QuittanceLoyerMeuble';
import ModeleQuittanceLoyer from './pages/ModeleQuittanceLoyer';
import AutomatisationEnvoi from './pages/AutomatisationEnvoi';
import QuittanceGratuiteEnLigne from './pages/QuittanceGratuiteEnLigne';
import OwnerConfirmation from './pages/OwnerConfirmation';
import QuickConfirm from './pages/QuickConfirm';
import SMSConfirm from './pages/SMSConfirm';
import ShortLinkRedirect from './pages/ShortLinkRedirect';

// Component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const location = useLocation();
  const noLayoutPages = ['/billing', '/owner-confirmation', '/quick-confirm', '/sms-confirm', '/confirmation'];
  const shouldShowLayout = !noLayoutPages.includes(location.pathname) && !location.pathname.startsWith('/c/');

  return (
    <div className="min-h-screen bg-white">
      {shouldShowLayout && <Header />}
      <main>
        <Routes>
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
          <Route path="/obligations-legales" element={<Legal />} />
          <Route path="/mentions-obligatoires-quittance" element={<Legal />} />
          <Route path="/quittance-loyer-pdf-gratuit" element={<QuittancePDFGratuit />} />
          <Route path="/modele-quittance-pdf" element={<QuittancePDFGratuit />} />
          <Route path="/quittance-loyer-meuble" element={<QuittanceLoyerMeuble />} />
          <Route path="/location-meublee-quittance" element={<QuittanceLoyerMeuble />} />
          <Route path="/modele-quittance-loyer-gratuit" element={<ModeleQuittanceLoyer />} />
          <Route path="/modele-quittance-loyer" element={<ModeleQuittanceLoyer />} />
          <Route path="/template-quittance-gratuit" element={<ModeleQuittanceLoyer />} />
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/payment-checkout" element={<PaymentCheckout />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/bank-sync" element={<BankSync />} />
          <Route path="/payment-rules" element={<PaymentRules />} />
          <Route path="/tenant-detection-setup" element={<TenantDetectionSetup />} />
          <Route path="/owner-confirmation" element={<OwnerConfirmation />} />
          <Route path="/quick-confirm" element={<QuickConfirm />} />
          <Route path="/sms-confirm" element={<SMSConfirm />} />
          <Route path="/c/:code" element={<ShortLinkRedirect />} />
        </Routes>
      </main>
      {shouldShowLayout && <Footer />}
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