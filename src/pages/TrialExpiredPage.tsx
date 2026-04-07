import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import QuickPaymentModal from '../components/QuickPaymentModal';
import {
  FEATURES_DISABLED_AFTER_TRIAL,
  needsTrialReactivationPage,
} from '../utils/trialReactivation';

/**
 * Écran unique après fin d’essai : message + QuickPayment (réactivation).
 * L’automatisation est coupée côté BDD (features_enabled) au chargement.
 */
const TrialExpiredPage: React.FC = () => {
  const navigate = useNavigate();
  const { proprietaire, refetchProprietaire } = useEspaceBailleur();
  const [automationOff, setAutomationOff] = useState(false);
  const automationAppliedRef = useRef(false);

  useEffect(() => {
    if (!proprietaire?.id) return;
    if (!needsTrialReactivationPage(proprietaire)) {
      navigate('/overview', { replace: true });
    }
  }, [proprietaire, navigate]);

  useEffect(() => {
    if (!proprietaire?.id) return;
    if (!needsTrialReactivationPage(proprietaire)) return;
    if (automationAppliedRef.current) return;
    automationAppliedRef.current = true;

    let cancelled = false;
    (async () => {
      const { error } = await supabase
        .from('proprietaires')
        .update({ features_enabled: { ...FEATURES_DISABLED_AFTER_TRIAL } })
        .eq('id', proprietaire.id);
      if (!cancelled) {
        if (!error) setAutomationOff(true);
        refetchProprietaire();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [proprietaire?.id, refetchProprietaire, proprietaire]);

  if (!proprietaire?.email) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-gray-600">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f8] min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#142840] tracking-tight mb-3">
            Votre période d&apos;essai est terminée
          </h1>
          <p className="text-[#5e6478] text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Vos données (locataires, quittances, documents) sont toujours enregistrées. Réactivez votre
            espace en souscrivant au <strong className="text-[#142840]">Pack Automatique</strong> : tout
            redevient opérationnel après paiement (automatisation, relances, etc.).
          </p>
        </div>

        {automationOff && (
          <p className="text-xs text-center text-[#5e6478] mb-4">
            L&apos;envoi automatique et les relances sont désactivés jusqu&apos;à la réactivation.
          </p>
        )}

        <QuickPaymentModal
          isOpen={true}
          onClose={() => navigate('/overview')}
          selectedPlan="auto"
          billingCycle="yearly"
          prefilledEmail={proprietaire.email}
          embedded={true}
          lockTenantTierToActiveCount={true}
          titleOverride="Réactiver votre espace bailleur"
          hideAccountCreatedNote={true}
        />

        <div className="mt-8 flex items-start justify-center gap-2 text-xs text-[#5e6478] max-w-md mx-auto">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#142840]" />
          <span>Paiement sécurisé par Stripe. Sans engagement, résiliation possible à tout moment.</span>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredPage;
