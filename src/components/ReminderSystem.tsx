import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bell, Mail, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ReminderData {
  proprietaire_id: string;
  locataire_id: string;
  proprietaire_email: string;
  proprietaire_telephone?: string;
  locataire_nom: string;
  loyer: number;
  charges: number;
  adresse_logement: string;
  date_rappel: number;
}

const ReminderSystem = () => {
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Vérifier les rappels à envoyer
  const checkReminders = async () => {
    setLoading(true);
    
    try {
      const today = new Date();
      const currentDay = today.getDate();
      
      // Récupérer les locataires qui ont un rappel aujourd'hui
      const { data: locataires, error } = await supabase
        .from('locataires')
        .select(`
          id,
          proprietaire_id,
          nom,
          prenom,
          adresse_logement,
          loyer_mensuel,
          charges_mensuelles,
          date_rappel,
          statut,
          proprietaires!inner(
            id,
            email,
            nom,
            telephone,
            abonnement_actif
          )
        `)
        .eq('actif', true)
        .eq('date_rappel', currentDay)
        .eq('proprietaires.abonnement_actif', true);

      if (error) {
        console.error('Erreur récupération locataires:', error);
        return;
      }

      // Traiter chaque rappel
      for (const locataire of locataires || []) {
        await sendReminder({
          proprietaire_id: locataire.proprietaire_id,
          locataire_id: locataire.id,
          proprietaire_email: locataire.proprietaires.email,
          proprietaire_telephone: locataire.proprietaires.telephone,
          locataire_nom: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
          loyer: locataire.loyer_mensuel,
          charges: locataire.charges_mensuelles,
          adresse_logement: locataire.adresse_logement,
          date_rappel: locataire.date_rappel
        });
      }

      setLastCheck(new Date());
      
    } catch (error) {
      console.error('Erreur vérification rappels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un rappel (SMS + Email)
  const sendReminder = async (data: ReminderData) => {
    try {
      // Générer un token unique pour l'accès au dashboard
      const token = generateSecureToken();
      const dashboardUrl = `${window.location.origin}/dashboard?token=${token}&email=${encodeURIComponent(data.proprietaire_email)}`;
      
      // Message de rappel
      const message = `💡 Quittance Simple : rappel d'envoi de quittance pour ${data.locataire_nom}, Loyer : ${data.loyer}€, Charges : ${data.charges}€, ${data.adresse_logement}. Cliquez ici pour valider : ${dashboardUrl}`;

      // 1. Envoyer l'email
      await sendReminderEmail(data, dashboardUrl, message);
      
      // 2. Envoyer le SMS (si numéro disponible)
      if (data.proprietaire_telephone) {
        await sendReminderSMS(data, message);
      }

      // 3. Enregistrer la notification en base
      await supabase
        .from('notifications')
        .insert({
          proprietaire_id: data.proprietaire_id,
          locataire_id: data.locataire_id,
          type: 'rappel_quittance',
          titre: 'Rappel d\'envoi de quittance',
          message: message,
          envoye_email: true,
          envoye_sms: !!data.proprietaire_telephone,
          date_envoi_email: new Date().toISOString(),
          date_envoi_sms: data.proprietaire_telephone ? new Date().toISOString() : null,
          statut: 'envoye'
        });

      console.log(`✅ Rappel envoyé pour ${data.locataire_nom}`);
      
    } catch (error) {
      console.error('Erreur envoi rappel:', error);
    }
  };

  // Envoyer l'email de rappel
  const sendReminderEmail = async (data: ReminderData, dashboardUrl: string, message: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.proprietaire_email,
          locataire_nom: data.locataire_nom,
          loyer: data.loyer,
          charges: data.charges,
          adresse_logement: data.adresse_logement,
          dashboard_url: dashboardUrl,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur email: ${response.status}`);
      }

      console.log(`📧 Email de rappel envoyé à ${data.proprietaire_email}`);
      
    } catch (error) {
      console.error('Erreur envoi email rappel:', error);
    }
  };

  // Envoyer le SMS de rappel
  const sendReminderSMS = async (data: ReminderData, message: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.proprietaire_telephone,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur SMS: ${response.status}`);
      }

      console.log(`📱 SMS de rappel envoyé à ${data.proprietaire_telephone}`);
      
    } catch (error) {
      console.error('Erreur envoi SMS rappel:', error);
    }
  };

  // Générer un token sécurisé
  const generateSecureToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Vérifier les rappels toutes les heures
  useEffect(() => {
    // Vérification initiale
    checkReminders();
    
    // Vérification toutes les heures
    const interval = setInterval(checkReminders, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Système de rappels</h3>
            <p className="text-sm text-gray-600">Automatisation des notifications</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {loading ? (
            <div className="flex items-center space-x-2 text-[#FFD76F]">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">Vérification...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Actif</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Rappels Email</h4>
          </div>
          <p className="text-sm text-blue-800">
            Envoi automatique d'emails de rappel aux propriétaires avec lien direct vers le dashboard.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-3">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Rappels SMS</h4>
          </div>
          <p className="text-sm text-gray-800">
            Notifications SMS instantanées pour une réactivité maximale (si numéro renseigné).
          </p>
        </div>
      </div>

      {lastCheck && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Dernière vérification : {lastCheck.toLocaleString('fr-FR')}</span>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <button
          onClick={checkReminders}
          disabled={loading}
          className="w-full bg-[#FFD76F] hover:bg-[#d4a03f] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              <span>Vérification en cours...</span>
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              <span>Vérifier les rappels maintenant</span>
            </>
          )}
        </button>

        <button
          onClick={async () => {
            const email = prompt('Email du propriétaire:');
            const nom = prompt('Nom du propriétaire:');
            const telephone = prompt('Téléphone du propriétaire (format +33612345678):');
            const locataire = prompt('Nom du locataire:');

            if (!email || !nom || !locataire) return;

            // Validation format téléphone si fourni
            if (telephone && !telephone.match(/^\+33[67]\d{8}$/)) {
              alert('❌ Format téléphone invalide. Utilisez le format +33612345678');
              return;
            }

            try {
              const moisActuel = new Date().toLocaleDateString('fr-FR', { month: 'long' });
              const anneeActuelle = new Date().getFullYear();
              let emailSuccess = false;
              let smsSuccess = false;

              // 1. Envoyer l'email
              const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-owner-reminder`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  proprietaireId: proprietaireId,
                  proprietaireEmail: email,
                  proprietaireName: nom,
                  locataireId: locataireId,
                  locataireName: locataire,
                  mois: moisActuel.charAt(0).toUpperCase() + moisActuel.slice(1),
                  annee: anneeActuelle,
                  montantTotal: '850.00'
                })
              });

              const emailResult = await emailResponse.json();
              emailSuccess = emailResult.success;

              // 2. Envoyer le SMS si téléphone fourni
              if (telephone) {
                const smsResponse = await fetch(`${supabaseUrl}/functions/v1/send-owner-reminder-sms`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    telephone: telephone,
                    proprietaireName: nom,
                    locataireName: locataire,
                    mois: moisActuel.charAt(0).toUpperCase() + moisActuel.slice(1),
                    montantTotal: '850.00'
                  })
                });

                const smsResult = await smsResponse.json();
                smsSuccess = smsResult.success;
              }

              // Afficher le résultat
              let message = '';
              if (emailSuccess) message += '✅ Email envoyé\n';
              else message += '❌ Échec email\n';

              if (telephone) {
                if (smsSuccess) message += '✅ SMS envoyé';
                else message += '❌ Échec SMS (vérifiez la config Twilio)';
              }

              alert(message || '❌ Erreur lors de l\'envoi');
            } catch (error) {
              console.error(error);
              alert('❌ Erreur lors de l\'envoi');
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <Mail className="w-4 h-4" />
          <MessageSquare className="w-4 h-4" />
          <span>🧪 Tester Email + SMS</span>
        </button>
      </div>
    </div>
  );
};

export default ReminderSystem;