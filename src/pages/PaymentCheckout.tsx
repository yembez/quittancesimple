import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import QuickPaymentModal from '../components/QuickPaymentModal';

const PaymentCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [setupData, setSetupData] = useState<any>(null);

  const emailForCheckout = useMemo(() => {
    const qp = searchParams.get('email');
    if (qp) return qp.trim();
    return (
      localStorage.getItem('proprietaireEmail') ||
      localStorage.getItem('captured_email') ||
      setupData?.proprietaire?.email ||
      ''
    );
  }, [searchParams, setupData?.proprietaire?.email]);

  useEffect(() => {
    const trialParam = searchParams.get('trial');
    const reactivateParam = searchParams.get('reactivate');
    const emailParam = searchParams.get('email');

    // Cas post-essai / réactivation: on récupère le bailleur pour avoir l'email, mais le nombre de locataires
    // sera de toute façon recalculé depuis l'espace bailleur dans QuickPaymentModal.
    if ((trialParam === 'true' || reactivateParam === 'true') && emailParam) {
      const loadProprietaireData = async () => {
        try {
          const { data: proprietaire, error } = await supabase
            .from('proprietaires')
            .select('email, nom, prenom, adresse, telephone')
            .ilike('email', emailParam.trim())
            .maybeSingle();

          if (error || !proprietaire) {
            console.error('Erreur chargement propriétaire:', error);
            navigate('/automation-setup');
            return;
          }

          setSetupData({
            proprietaire: {
              nom: (proprietaire as { nom?: string | null }).nom ?? '',
              prenom: (proprietaire as { prenom?: string | null }).prenom ?? '',
              email: proprietaire.email ?? '',
              adresse: (proprietaire as { adresse?: string | null }).adresse ?? '',
              telephone: (proprietaire as { telephone?: string | null }).telephone ?? '',
            },
          });
        } catch (err) {
          console.error('Erreur:', err);
          navigate('/automation-setup');
        }
      };

      loadProprietaireData();
      return;
    }

    // Cas navigation interne (fin de setup) : on garde la compat avec localStorage
    const data = localStorage.getItem('automationSetupData');
    if (!data) {
      // Retour depuis Stripe (annulation) ou lien direct : ?email= suffit pour ouvrir le QuickPayment
      if (emailParam?.trim()) {
        setSetupData({
          proprietaire: { email: emailParam.trim(), nom: '', prenom: '', adresse: '', telephone: '' },
        });
        return;
      }
      if (
        localStorage.getItem('proprietaireEmail') ||
        localStorage.getItem('captured_email')
      ) {
        setSetupData({ proprietaire: { email: emailForCheckout } });
        return;
      }
      navigate('/automation-setup');
      return;
    }

    try {
      const parsed = JSON.parse(data);
      setSetupData(parsed);
    } catch (e) {
      console.error('automationSetupData invalide', e);
      navigate('/automation-setup');
    }
  }, [navigate, searchParams, emailForCheckout]);

  if (!setupData) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#1d1d1f]" />
      </div>
    );
  }

  // Écran post-essai: un seul bloc de paiement, en réutilisant le checkout existant.
  return (
    <div className="min-h-screen bg-[#fafafa] pt-24 pb-16">
      <div className="max-w-xl mx-auto px-5 sm:px-6">
        <QuickPaymentModal
          isOpen={true}
          onClose={() => navigate('/dashboard')}
          selectedPlan="auto"
          billingCycle="yearly"
          prefilledEmail={emailForCheckout || setupData?.proprietaire?.email}
          embedded={true}
          lockTenantTierToActiveCount={true}
          titleOverride="Finaliser votre abonnement"
          hideAccountCreatedNote={true}
        />
      </div>
    </div>
  );
};

export default PaymentCheckout;
