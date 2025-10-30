import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Users, FileText, Settings, Bell, CheckCircle, XCircle, Send, Plus, Calendar, Euro, Mail, Phone, MapPin, Clock, Download, Eye, AlertCircle, Trash2, CreditCard, CreditCard as Edit, X, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import QuittancePreview from '../components/QuittancePreview';
import AddLocataireForm from '../components/AddLocataireForm';
import { processIBANInput } from '../utils/ibanUtils';

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  adresse: string;
  telephone?: string;
  abonnement_actif: boolean;
  plan_actuel?: string;
  date_inscription?: string;
}

interface Locataire {
  id: string;
  proprietaire_id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse_logement: string;
  detail_adresse?: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  caution_initiale?: number;
  date_rappel: number; // Jour du mois (1-31)
  heure_rappel?: number; // Heure (0-23)
  minute_rappel?: number; // Minute (0-59)
  periodicite: string; // 'mensuel', 'trimestriel'
  statut: 'en_attente' | 'paye' | 'non_paye';
  derniere_quittance?: string;
  actif: boolean;
  iban_hash?: string;
  iban_last_digits?: string;
  iban_display?: string;
  iban_verified?: boolean;
}

interface Quittance {
  id: string;
  proprietaire_id: string;
  locataire_id: string;
  periode: string;
  loyer: number;
  charges: number;
  total: number;
  statut: 'generee' | 'envoyee' | 'archivee';
  date_generation: string;
  date_envoi?: string;
  pdf_url?: string;
}

interface PaymentRule {
  id: string;
  locataire_id: string;
  bank_connection_id: string;
  expected_amount: number;
  sender_iban?: string;
  send_mode: 'auto' | 'manual_validation';
}

interface BankConnection {
  id: string;
  user_id: string;
  status: string;
  institution_name?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('locataires');
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [paymentRules, setPaymentRules] = useState<Record<string, PaymentRule>>({});
  const [bankConnection, setBankConnection] = useState<BankConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddLocataire, setShowAddLocataire] = useState(false);
  const [editingLocataire, setEditingLocataire] = useState<Locataire | null>(null);
  const [previewQuittance, setPreviewQuittance] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  // Formulaire nouveau locataire
  const [newLocataire, setNewLocataire] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse_logement: '',
    detail_adresse: '',
    loyer_mensuel: '',
    charges_mensuelles: '',
    caution_initiale: '',
    date_rappel: '1',
    heure_rappel: '9',
    minute_rappel: '0',
    periodicite: 'mensuel'
  });


  // Vérification de l'authentification et récupération des données
  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email') || localStorage.getItem('proprietaireEmail');

    if (!token && !email) {
      // Rediriger vers la page d'authentification
      navigate('/automation');
      return;
    }

    if (email) {
      localStorage.setItem('proprietaireEmail', email);
    }

    loadDashboardData(email || '');
  }, [searchParams, navigate]);

  // Détection des actions depuis l'email (OUI/NON)
  useEffect(() => {
    const action = searchParams.get('action');
    const locataireId = searchParams.get('locataireId');
    const mois = searchParams.get('mois');
    const annee = searchParams.get('annee');

    if (action && locataireId && mois && annee && locataires.length > 0) {
      const locataire = locataires.find(l => l.id === locataireId);
      if (locataire) {
        if (action === 'send') {
          // Action OUI : Envoyer la quittance
          handleSendQuittanceFromEmail(locataire, mois, annee);
        } else if (action === 'remind') {
          // Action NON : Relancer le locataire
          handleSendReminderFromEmail(locataire, mois, annee);
        }
      }
    }
  }, [searchParams, locataires]);

  const loadDashboardData = async (email: string) => {
    try {
      setLoading(true);

      // 1. Récupérer les données du propriétaire
      const { data: propData, error: propError } = await supabase
        .from('proprietaires')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (propError) {
        console.error('Erreur récupération propriétaire:', propError);
        return;
      }

      if (!propData) {
        console.error('Aucun propriétaire trouvé pour cet email');
        navigate('/pricing');
        return;
      }

      setProprietaire(propData);

      // 2. Récupérer les locataires
      const { data: locatairesData, error: locatairesError } = await supabase
        .from('locataires')
        .select('*')
        .eq('proprietaire_id', propData.id)
        .eq('actif', true);

      if (!locatairesError && locatairesData) {
        setLocataires(locatairesData);
      }

      // 3. Récupérer les quittances récentes
      const { data: quittancesData, error: quittancesError } = await supabase
        .from('quittances')
        .select('*')
        .eq('proprietaire_id', propData.id)
        .order('date_generation', { ascending: false })
        .limit(10);

      if (!quittancesError && quittancesData) {
        setQuittances(quittancesData);
      }

      // Si aucune quittance en base, créer des données de simulation pour la démo
      if (!quittancesData || quittancesData.length === 0) {
        // Créer des quittances de simulation
        const today = new Date();
        const simulatedQuittances = locatairesData?.slice(0, 3).map((locataire, index) => {
          const date = new Date(today);
          date.setMonth(date.getMonth() - index);
          const periode = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

          return {
            id: `sim-${index}`,
            proprietaire_id: propData.id,
            locataire_id: locataire.id,
            periode: periode,
            loyer: locataire.loyer_mensuel,
            charges: locataire.charges_mensuelles,
            total: locataire.loyer_mensuel + locataire.charges_mensuelles,
            statut: index === 0 ? 'envoyee' : 'envoyee',
            date_generation: date.toISOString(),
            date_envoi: date.toISOString()
          };
        }) || [];

        if (simulatedQuittances.length > 0) {
          setQuittances(simulatedQuittances);
        }
      }

      // 4. Charger la connexion bancaire (pour plan Automatique+)
      if (propData.plan_actuel === 'Quittance Automatique+' || propData.plan_actuel === 'premium') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: connData } = await supabase
            .from('bank_connections')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .maybeSingle();

          if (connData) {
            setBankConnection(connData);

            // 5. Charger les règles de paiement pour chaque locataire
            const { data: rulesData } = await supabase
              .from('rent_payment_rules')
              .select('*')
              .eq('bank_connection_id', connData.id)
              .eq('user_id', session.user.id);

            if (rulesData) {
              const rulesMap: Record<string, PaymentRule> = {};
              rulesData.forEach((rule: any) => {
                if (rule.locataire_id) {
                  rulesMap[rule.locataire_id] = rule;
                }
              });
              setPaymentRules(rulesMap);
            }
          }
        }
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocataire = async () => {
    if (!proprietaire) return;

    try {
      // Validation des champs requis
      if (!newLocataire.nom || !newLocataire.adresse_logement || !newLocataire.loyer_mensuel) {
        alert('Veuillez remplir tous les champs obligatoires (Nom, Adresse, Loyer)');
        return;
      }

      console.log('Ajout locataire avec heure:', newLocataire.heure_rappel, 'minute:', newLocataire.minute_rappel);

      const { data, error } = await supabase
        .from('locataires')
        .insert({
          proprietaire_id: proprietaire.id,
          nom: newLocataire.nom,
          prenom: newLocataire.prenom,
          email: newLocataire.email,
          telephone: newLocataire.telephone,
          adresse_logement: newLocataire.adresse_logement,
          detail_adresse: newLocataire.detail_adresse || null,
          loyer_mensuel: parseFloat(newLocataire.loyer_mensuel),
          charges_mensuelles: parseFloat(newLocataire.charges_mensuelles) || 0,
          caution_initiale: newLocataire.caution_initiale ? parseFloat(newLocataire.caution_initiale) : 0,
          date_rappel: parseInt(newLocataire.date_rappel),
          heure_rappel: parseInt(newLocataire.heure_rappel),
          minute_rappel: parseInt(newLocataire.minute_rappel),
          periodicite: newLocataire.periodicite,
          statut: 'en_attente',
          actif: true
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur ajout locataire:', error);
        alert('Erreur lors de l\'ajout du locataire');
        return;
      }

      console.log('Locataire ajouté avec succès:', data);
      setLocataires([...locataires, data]);
      setShowAddLocataire(false);
      setNewLocataire({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse_logement: '',
        detail_adresse: '',
        loyer_mensuel: '',
        charges_mensuelles: '',
        caution_initiale: '',
        date_rappel: '1',
        heure_rappel: '9',
        minute_rappel: '0',
        periodicite: 'mensuel'
      });

      alert('Locataire ajouté avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout du locataire');
    }
  };

  const handleGenerateQuittance = (locataire: Locataire) => {
    if (!proprietaire) return;

    const currentDate = new Date();
    const periode = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const quittanceData = {
      baillorName: `${proprietaire.nom} ${proprietaire.prenom || ''}`.trim(),
      baillorAddress: proprietaire.adresse,
      baillorEmail: proprietaire.email,
      locataireName: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
      logementAddress: locataire.adresse_logement,
      loyer: locataire.loyer_mensuel.toString(),
      charges: locataire.charges_mensuelles.toString(),
      periode: periode,
      isElectronicSignature: true,
      locataireData: locataire
    };

    setPreviewQuittance(quittanceData);
  };

  const handleSendQuittance = async () => {
    if (!previewQuittance || !proprietaire || isSending) return;

    const locataire = previewQuittance.locataireData;
    if (!locataire.email) {
      alert('❌ Email du locataire manquant. Veuillez ajouter une adresse email.');
      return;
    }

    setIsSending(true);

    try {
      // Envoyer directement au locataire via la fonction Edge
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-quittance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...previewQuittance,
          locataireEmail: locataire.email  // Email du locataire
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Enregistrer en base
        const currentDate = new Date();
        const periode = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        const { error } = await supabase
          .from('quittances')
          .insert({
            proprietaire_id: proprietaire.id,
            locataire_id: locataire.id,
            periode: periode,
            loyer: parseFloat(previewQuittance.loyer),
            charges: parseFloat(previewQuittance.charges),
            total: parseFloat(previewQuittance.loyer) + parseFloat(previewQuittance.charges),
            statut: 'envoyee',
            date_generation: new Date().toISOString(),
            date_envoi: new Date().toISOString()
          });

        // Mettre à jour le statut du locataire
        await supabase
          .from('locataires')
          .update({
            statut: 'paye',
            derniere_quittance: new Date().toISOString()
          })
          .eq('id', locataire.id);

        // Recharger les données
        await loadDashboardData(proprietaire.email);

        // Fermer la prévisualisation
        setPreviewQuittance(null);

        console.log('Affichage du popup de succès');

        // Attendre un peu pour que la modal se ferme
        setTimeout(() => {
          // Message de succès popup modal
          const popup = document.createElement('div');
          popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4';
          popup.style.zIndex = '9999';
          popup.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" id="success-popup" style="transform: scale(0); transition: transform 0.3s ease-out">
              <div class="text-center">
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">
                  Quittance PDF envoyée avec succès à votre locataire !
                </h3>
                <p class="text-gray-600 mb-6">
                  L'email a été envoyé à <strong>${locataire.email}</strong>
                </p>
                <button
                  onclick="this.closest('.fixed').remove()"
                  class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
                >
                  Parfait !
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(popup);
          console.log('Popup ajouté au DOM');

          // Animation d'entrée
          setTimeout(() => {
            const popupContent = document.getElementById('success-popup');
            if (popupContent) {
              popupContent.style.transform = 'scale(1)';
              console.log('Animation du popup démarrée');
            }
          }, 50);

          // Fermeture automatique après 5 secondes
          setTimeout(() => {
            if (popup.parentNode) {
              const popupContent = document.getElementById('success-popup');
              if (popupContent) {
                popupContent.style.transform = 'scale(0)';
              }
              setTimeout(() => popup.remove(), 300);
            }
          }, 5000);
        }, 300);
      } else {
        alert('❌ Erreur lors de l\'envoi de la quittance: ' + (result.message || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur envoi quittance:', error);
      alert('❌ Erreur lors de l\'envoi de la quittance');
    } finally {
      setIsSending(false);
    }
  };

  const handleTestReminders = async () => {
    if (!proprietaire) return;

    const confirmed = confirm('⚠️ TEST : Cela va vous envoyer les rappels SMS et email pour chaque locataire (comme si c\'était la date anniversaire). Continuer ?');
    if (!confirmed) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let successCount = 0;
      let errorCount = 0;

      const currentDate = new Date();
      const moisCapitalized = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
      const mois = moisCapitalized.charAt(0).toUpperCase() + moisCapitalized.slice(1);
      const annee = currentDate.getFullYear();
      const periode = `${mois} ${annee}`;

      for (const locataire of locataires) {
        const montantTotal = locataire.loyer_mensuel + locataire.charges_mensuelles;
        const proprietaireName = `${proprietaire.prenom || ''} ${proprietaire.nom}`.trim();
        const locataireName = `${locataire.prenom || ''} ${locataire.nom}`.trim();

        // Envoyer email au propriétaire avec boutons OUI/NON
        try {
          console.log(`📧 Envoi email de rappel au propriétaire: ${proprietaire.email}`);
          const emailPayload = {
            proprietaireId: proprietaire.id,
            proprietaireEmail: proprietaire.email,
            proprietaireName: proprietaireName,
            locataireName: locataireName,
            locataireId: locataire.id,
            mois: periode,
            annee: annee,
            montantTotal: montantTotal
          };
          console.log('Payload email:', emailPayload);

          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-owner-reminder`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload)
          });

          const emailResult = await emailResponse.json();
          console.log('Résultat email:', emailResult);

          if (emailResponse.ok && emailResult.success) {
            successCount++;
            console.log(`✅ Email de rappel envoyé pour ${locataire.nom} - ID: ${emailResult.data?.id}`);
          } else {
            errorCount++;
            console.error(`❌ Erreur email pour ${locataire.nom}:`, emailResult);
          }
        } catch (error) {
          console.error(`Erreur email pour ${locataire.nom}:`, error);
          errorCount++;
        }

        // Envoyer SMS au propriétaire si téléphone configuré
        if (proprietaire.telephone) {
          try {
            console.log(`📱 Création lien court pour SMS...`);

            // Générer un code court aléatoire (6 caractères)
            const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Créer le lien court dans la base
            const { error: linkError } = await supabase
              .from('short_links')
              .insert({
                id: shortCode,
                proprietaire_id: proprietaire.id,
                locataire_id: locataire.id,
                mois: periode,
                annee: new Date().getFullYear(),
                action: 'send',
                source: 'sms'
              });

            if (linkError) {
              console.error('Erreur création lien court:', linkError);
              throw linkError;
            }

            console.log(`✅ Lien court créé: ${shortCode}`);
            console.log(`📱 Envoi SMS à: ${proprietaire.telephone}`);

            const smsResponse = await fetch(`${supabaseUrl}/functions/v1/send-owner-reminder-sms`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                telephone: proprietaire.telephone,
                proprietaireName: proprietaireName,
                locataireName: locataireName,
                shortCode: shortCode,
                montantTotal: montantTotal
              })
            });

            const smsResult = await smsResponse.json();
            console.log('📥 Résultat SMS complet:', smsResult);
            console.log('📊 Status HTTP:', smsResponse.status);

            if (smsResponse.ok && smsResult.success) {
              successCount++;
              console.log(`✅ SMS de rappel envoyé avec succès pour ${locataire.nom}`);
              console.log(`📱 Détails:`, smsResult.data);
            } else if (smsResult.skipped) {
              console.log(`⚠️ SMS non envoyé pour ${locataire.nom} - Service SMS non configuré`);
            } else {
              errorCount++;
              console.error(`❌ Erreur SMS pour ${locataire.nom}:`, smsResult.error);

              // Message d'aide selon l'erreur
              if (smsResult.error?.includes('not yet activated')) {
                console.error('🔧 Votre compte Brevo n\'a pas l\'envoi SMS activé. Contactez contact@sendinblue.com pour activer les SMS.');
              } else if (smsResult.error?.includes('Key not found') || smsResult.error?.includes('unauthorized')) {
                console.error('🔧 Clé API Brevo invalide. Vérifiez BREVO_API_KEY dans Supabase.');
              } else {
                console.error('🔧 Vérifiez la configuration SMS dans Supabase (BREVO_API_KEY ou TWILIO_*)');
              }
            }
          } catch (error) {
            console.error(`❌ Erreur SMS pour ${locataire.nom}:`, error);
          }
        } else {
          console.log(`⚠️ Pas de téléphone configuré pour le propriétaire - SMS non envoyé`);
        }
      }

      alert(`🎯 Test terminé !\n\n✅ ${successCount} rappel(s) envoyé(s) à votre adresse\n❌ ${errorCount} erreur(s)\n\nVérifiez votre email${proprietaire.telephone ? ' et SMS' : ''} !`);
    } catch (error) {
      console.error('Erreur test rappels:', error);
      alert('❌ Erreur lors du test des rappels');
    }
  };

  const handleRelanceLocataire = async (locataire: Locataire) => {
    if (!proprietaire || !locataire.email) {
      alert('Email du locataire manquant. Veuillez ajouter une adresse email.');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locataireEmail: locataire.email,
          locataireName: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
          baillorName: `${proprietaire.nom} ${proprietaire.prenom || ''}`.trim(),
          loyer: locataire.loyer_mensuel,
          charges: locataire.charges_mensuelles,
          adresseLogement: locataire.adresse_logement
        })
      });

      if (response.ok) {
        alert(`✅ Relance envoyée avec succès à ${locataire.nom} !`);
      } else {
        alert('❌ Erreur lors de l\'envoi de la relance');
      }
    } catch (error) {
      console.error('Erreur relance:', error);
      alert('❌ Erreur lors de l\'envoi de la relance');
    }
  };

  const handleSendQuittanceFromEmail = async (locataire: Locataire, mois: string, annee: string) => {
    if (!proprietaire) return;

    const currentDate = new Date();
    const periode = `${mois} ${annee}`;

    const quittanceData = {
      proprietaireNom: `${proprietaire.nom} ${proprietaire.prenom || ''}`.trim(),
      proprietaireAdresse: proprietaire.adresse,
      locataireNom: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
      locataireAdresse: locataire.adresse_logement,
      locataireDetailAdresse: locataire.detail_adresse || '',
      periode: periode,
      loyer: locataire.loyer_mensuel.toString(),
      charges: locataire.charges_mensuelles.toString(),
      caution: locataire.caution_initiale?.toString() || '0',
      locataireData: locataire
    };

    setPreviewQuittance(quittanceData);

    setTimeout(async () => {
      if (!locataire.email) {
        alert('❌ Email du locataire manquant.');
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/send-quittance`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...quittanceData,
            locataireEmail: locataire.email
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          await supabase.from('quittances').insert({
            proprietaire_id: proprietaire.id,
            locataire_id: locataire.id,
            periode: periode,
            loyer: locataire.loyer_mensuel,
            charges: locataire.charges_mensuelles,
            total: locataire.loyer_mensuel + locataire.charges_mensuelles,
            statut: 'envoyee',
            date_generation: new Date().toISOString(),
            date_envoi: new Date().toISOString()
          });

          await supabase.from('locataires').update({
            statut: 'paye',
            derniere_quittance: new Date().toISOString()
          }).eq('id', locataire.id);

          alert(`✅ Quittance envoyée avec succès à ${locataire.nom} !`);
          navigate('/dashboard');
        } else {
          alert('❌ Erreur lors de l\'envoi de la quittance');
        }
      } catch (error) {
        console.error('Erreur envoi quittance:', error);
        alert('❌ Erreur lors de l\'envoi de la quittance');
      }
    }, 100);
  };

  const handleSendReminderFromEmail = async (locataire: Locataire, mois: string, annee: string) => {
    if (!proprietaire || !locataire.email) {
      alert('Email du locataire manquant.');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locataireEmail: locataire.email,
          locataireName: `${locataire.nom} ${locataire.prenom || ''}`.trim(),
          baillorName: `${proprietaire.nom} ${proprietaire.prenom || ''}`.trim(),
          loyer: locataire.loyer_mensuel,
          charges: locataire.charges_mensuelles,
          adresseLogement: locataire.adresse_logement
        })
      });

      if (response.ok) {
        alert(`✅ Relance envoyée avec succès à ${locataire.nom} pour ${mois} ${annee} !`);
        navigate('/dashboard');
      } else {
        alert('❌ Erreur lors de l\'envoi de la relance');
      }
    } catch (error) {
      console.error('Erreur relance:', error);
      alert('❌ Erreur lors de l\'envoi de la relance');
    }
  };

  const handleEditLocataire = async () => {
    if (!editingLocataire || !proprietaire) return;

    try {
      console.log('Modification locataire avec heure:', newLocataire.heure_rappel, 'minute:', newLocataire.minute_rappel);

      const { error } = await supabase
        .from('locataires')
        .update({
          nom: newLocataire.nom,
          prenom: newLocataire.prenom,
          email: newLocataire.email,
          telephone: newLocataire.telephone,
          adresse_logement: newLocataire.adresse_logement,
          detail_adresse: newLocataire.detail_adresse || null,
          loyer_mensuel: parseFloat(newLocataire.loyer_mensuel),
          charges_mensuelles: parseFloat(newLocataire.charges_mensuelles),
          caution_initiale: newLocataire.caution_initiale ? parseFloat(newLocataire.caution_initiale) : 0,
          date_rappel: parseInt(newLocataire.date_rappel),
          heure_rappel: parseInt(newLocataire.heure_rappel),
          minute_rappel: parseInt(newLocataire.minute_rappel),
          periodicite: newLocataire.periodicite
        })
        .eq('id', editingLocataire.id);

      if (error) {
        console.error('Erreur modification locataire:', error);
        alert('Erreur lors de la modification du locataire');
        return;
      }

      console.log('Locataire modifié avec succès');
      await loadDashboardData(proprietaire.email);
      setEditingLocataire(null);
      setNewLocataire({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse_logement: '',
        detail_adresse: '',
        loyer_mensuel: '',
        charges_mensuelles: '',
        caution_initiale: '',
        date_rappel: '1',
        heure_rappel: '9',
        minute_rappel: '0',
        periodicite: 'mensuel'
      });

      alert('Locataire modifié avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la modification du locataire');
    }
  };

  const handleDeleteLocataire = async (locataire: Locataire) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${locataire.nom} ${locataire.prenom || ''} ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('locataires')
        .delete()
        .eq('id', locataire.id);

      if (error) {
        console.error('Erreur suppression locataire:', error);
        alert('Erreur lors de la suppression du locataire');
        return;
      }

      if (proprietaire) {
        await loadDashboardData(proprietaire.email);
      }
      alert('Locataire supprimé avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du locataire');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!proprietaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-4">Vous devez être connecté pour accéder au tableau de bord.</p>
          <button
            onClick={() => navigate('/automation')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Tableau de bord
                  {proprietaire.plan_actuel && (
                    <span className="ml-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {proprietaire.plan_actuel === 'Quittance Automatique+' || proprietaire.plan_actuel === 'premium'
                        ? 'Plan Automatique+'
                        : proprietaire.plan_actuel}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-600">Bonjour {proprietaire.nom} {proprietaire.prenom}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${proprietaire.abonnement_actif ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium text-gray-600">
                {proprietaire.abonnement_actif ? 'Abonnement actif' : 'Abonnement inactif'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab('locataires')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === 'locataires'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Locataires</span>
                    <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                      {locataires.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('quittances')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === 'quittances'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Historique</span>
                  </button>
                </li>
                {(proprietaire?.plan_actuel === 'Quittance Automatique+' || proprietaire?.plan_actuel === 'premium') && (
                  <li>
                    <button
                      onClick={() => navigate('/bank-sync')}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Synchro bancaire</span>
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === 'settings'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Paramètres</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">

            {activeTab === 'locataires' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Mes locataires</h2>
                    <p className="text-sm text-gray-500">{locataires.length} locataire{locataires.length > 1 ? 's' : ''} actif{locataires.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {locataires.length > 0 && (
                      <>
                        <button
                          onClick={handleTestReminders}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                          title="Simuler l'envoi des rappels SMS et email"
                        >
                          <Bell className="w-4 h-4" />
                          <span>Test Rappels</span>
                        </button>
                        <button
                          onClick={() => {
                            const firstLocataire = locataires[0];
                            const testUrl = `/owner-confirmation?proprietaireId=${proprietaire.id}&locataireId=${firstLocataire.id}&mois=${new Date().toLocaleDateString('fr-FR', { month: 'long' })}`;
                            window.open(testUrl, '_blank');
                          }}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                          title="Tester le modal de confirmation"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Test Modal</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (proprietaire?.plan_actuel === 'Quittance Automatique+') {
                          navigate('/automation-plus-setup');
                        } else {
                          setShowAddLocataire(true);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>

                {locataires.length === 0 ? (
                  <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun locataire</h3>
                    <p className="text-gray-600 mb-6">
                      {proprietaire?.plan_actuel === 'Quittance Automatique+'
                        ? 'Ajoutez vos locataires pour activer la détection automatique des paiements et l\'envoi des quittances.'
                        : 'Ajoutez votre premier locataire pour commencer à générer et envoyer des quittances automatiquement.'}
                    </p>
                    <button
                      onClick={() => {
                        if (proprietaire?.plan_actuel === 'Quittance Automatique+') {
                          navigate('/automation-plus-setup');
                        } else {
                          setShowAddLocataire(true);
                        }
                      }}
                      className="bg-gradient-to-r from-[#79ae91] to-[#6a9d7f] hover:from-[#6a9d7f] hover:to-[#769272] text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Ajouter un locataire</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {locataires.map((locataire) => (
                    <div key={locataire.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3
                              className="text-base font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => {
                                setEditingLocataire(locataire);
                                setNewLocataire({
                                  nom: locataire.nom,
                                  prenom: locataire.prenom || '',
                                  email: locataire.email || '',
                                  telephone: locataire.telephone || '',
                                  adresse_logement: locataire.adresse_logement,
                                  detail_adresse: locataire.detail_adresse || '',
                                  loyer_mensuel: locataire.loyer_mensuel.toString(),
                                  charges_mensuelles: locataire.charges_mensuelles.toString(),
                                  caution_initiale: locataire.caution_initiale ? locataire.caution_initiale.toString() : '',
                                  date_rappel: locataire.date_rappel.toString(),
                                  heure_rappel: locataire.heure_rappel.toString(),
                                  minute_rappel: locataire.minute_rappel.toString(),
                                  periodicite: locataire.periodicite
                                });
                              }}
                            >
                              {locataire.nom} {locataire.prenom}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              locataire.statut === 'paye' ? 'bg-green-100 text-green-700' :
                              locataire.statut === 'non_paye' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {locataire.statut === 'paye' ? 'Payé' :
                               locataire.statut === 'non_paye' ? 'Non payé' : 'En attente'}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                            <div className="flex items-center space-x-1.5">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {locataire.adresse_logement}
                                {locataire.detail_adresse && <span className="text-blue-600 font-medium"> - {locataire.detail_adresse}</span>}
                              </span>
                            </div>
                            {locataire.email && (
                              <div className="flex items-center space-x-1.5">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{locataire.email}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1.5">
                              <Euro className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{locataire.loyer_mensuel}€ + {locataire.charges_mensuelles}€ charges</span>
                            </div>
                            {paymentRules[locataire.id] && (
                              <div className="flex items-center space-x-1.5">
                                <Bell className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
                                <span className="font-medium">
                                  Période de vérification: du {paymentRules[locataire.id].verification_day_start || 1} au {paymentRules[locataire.id].verification_day_end || 10}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* 1. Configurer banque - Uniquement pour Plan Automatique+ */}
                        {(proprietaire?.plan_actuel === 'Quittance Automatique+' || proprietaire?.plan_actuel === 'premium') && (
                          <button
                            onClick={() => {
                              if (paymentRules[locataire.id]) {
                                navigate(`/payment-rules?connection_id=${bankConnection?.id}&locataire_id=${locataire.id}`);
                              } else if (bankConnection) {
                                navigate(`/payment-rules?connection_id=${bankConnection.id}&locataire_id=${locataire.id}`);
                              } else {
                                localStorage.setItem('proprietaireEmail', proprietaire.email);
                                navigate('/tenant-detection-setup');
                              }
                            }}
                            className={`${
                              paymentRules[locataire.id]
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                : 'border-2 border-orange-500 hover:bg-orange-50 text-orange-700'
                            } px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5`}
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>
                              {paymentRules[locataire.id] ? '✓ Config bancaire' : bankConnection ? 'Config bancaire' : 'Configurer la synchronisation bancaire'}
                            </span>
                          </button>
                        )}

                        {/* 2. Modifier */}
                        <button
                          onClick={() => {
                            setEditingLocataire(locataire);
                            setNewLocataire({
                              nom: locataire.nom,
                              prenom: locataire.prenom || '',
                              email: locataire.email || '',
                              telephone: locataire.telephone || '',
                              adresse_logement: locataire.adresse_logement,
                              detail_adresse: locataire.detail_adresse || '',
                              loyer_mensuel: locataire.loyer_mensuel.toString(),
                              charges_mensuelles: locataire.charges_mensuelles.toString(),
                              caution_initiale: locataire.caution_initiale ? locataire.caution_initiale.toString() : '',
                              date_rappel: locataire.date_rappel.toString(),
                              heure_rappel: locataire.heure_rappel.toString(),
                              minute_rappel: locataire.minute_rappel.toString(),
                              periodicite: locataire.periodicite
                            });
                          }}
                          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Modifier</span>
                        </button>

                        {/* 3. Générer quittance */}
                        <button
                          onClick={() => handleGenerateQuittance(locataire)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Générer quittance</span>
                        </button>

                        {/* 4. Relancer */}
                        <button
                          onClick={() => handleRelanceLocataire(locataire)}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>Relancer</span>
                        </button>

                        {/* 5. Supprimer */}
                        <button
                          onClick={() => handleDeleteLocataire(locataire)}
                          className="border border-red-300 hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}

                {/* Message pour configurer la détection automatique - Plan Automatique+ uniquement */}
              </div>
            )}

            {activeTab === 'quittances' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Historique des quittances</h2>
                
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Locataire
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Période
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quittances.map((quittance) => {
                          const locataire = locataires.find(l => l.id === quittance.locataire_id);
                          return (
                            <tr key={quittance.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {locataire ? `${locataire.nom} ${locataire.prenom || ''}` : 'Locataire supprimé'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {quittance.periode}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {quittance.total.toFixed(2)}€
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  quittance.statut === 'envoyee' ? 'bg-green-100 text-green-800' :
                                  quittance.statut === 'generee' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {quittance.statut === 'envoyee' ? 'Envoyée' :
                                   quittance.statut === 'generee' ? 'Générée' : 'Archivée'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(quittance.date_generation).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                                    <Eye className="w-4 h-4" />
                                    <span>Voir</span>
                                  </button>
                                  <button className="text-green-600 hover:text-green-900 flex items-center space-x-1">
                                    <Download className="w-4 h-4" />
                                    <span>Télécharger</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres</h2>
                
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informations du propriétaire</h3>
                    <button
                      onClick={async () => {
                        const originalEmail = localStorage.getItem('proprietaireEmail');
                        const { error } = await supabase
                          .from('proprietaires')
                          .update({
                            nom: proprietaire.nom,
                            prenom: proprietaire.prenom,
                            email: proprietaire.email,
                            telephone: proprietaire.telephone,
                            adresse: proprietaire.adresse
                          })
                          .eq('email', originalEmail);

                        if (error) {
                          console.error('Erreur:', error);
                          alert('Erreur lors de la mise à jour: ' + error.message);
                        } else {
                          localStorage.setItem('proprietaireEmail', proprietaire.email);
                          alert('Informations mises à jour avec succès !');
                        }
                      }}
                      className="bg-[#79ae91] hover:bg-[#6a9d7f] text-white px-4 py-2 rounded-lg font-semibold text-sm"
                    >
                      💾 Enregistrer
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        value={proprietaire.nom}
                        onChange={(e) => setProprietaire({ ...proprietaire, nom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        value={proprietaire.prenom || ''}
                        onChange={(e) => setProprietaire({ ...proprietaire, prenom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={proprietaire.email}
                        onChange={(e) => setProprietaire({ ...proprietaire, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone (format +33612345678)</label>
                      <input
                        type="tel"
                        value={proprietaire.telephone || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Ne garder que les chiffres et le +
                          const cleaned = value.replace(/[^0-9+]/g, '');
                          setProprietaire({ ...proprietaire, telephone: cleaned });
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value && !value.match(/^\+33[67]\d{8}$/)) {
                            alert('⚠️ Format invalide. Utilisez +33612345678 (mobile français)');
                          }
                        }}
                        placeholder="+33612345678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                      <input
                        type="text"
                        value={proprietaire.adresse}
                        onChange={(e) => setProprietaire({ ...proprietaire, adresse: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Abonnement</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <p className="text-sm text-gray-600">Statut de l'abonnement</p>
                        <p className={`font-semibold text-lg ${proprietaire.abonnement_actif ? 'text-green-600' : 'text-red-600'}`}>
                          {proprietaire.abonnement_actif ? '✅ Actif' : '❌ Inactif'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/billing?email=${proprietaire.email}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        Gérer l'abonnement
                      </button>
                    </div>
                    {proprietaire.plan_actuel && (
                      <div className="pb-4 border-b space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Plan actuel</p>
                            <p className="font-semibold text-lg text-blue-600">
                              {proprietaire.plan_actuel}
                            </p>
                          </div>
                          {(proprietaire.plan_actuel === 'Quittance Automatique+' || proprietaire.plan_actuel === 'premium') && (
                            <button
                              onClick={() => navigate('/bank-sync')}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 text-sm"
                            >
                              <Settings className="w-4 h-4" />
                              <span>Synchro bancaire</span>
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate('/pricing')}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                          >
                            Changer de plan
                          </button>
                          {proprietaire.plan_actuel === 'Quittance Automatique' && (
                            <button
                              onClick={() => navigate('/automation-plus-setup')}
                              className="flex-1 bg-gradient-to-r from-[#79ae91] to-[#6a9d7f] hover:from-[#6a9d7f] hover:to-[#769272] text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                              Passer à Automatique+
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {proprietaire.date_inscription && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Inscrit depuis le</p>
                          <p className="font-medium text-gray-900">
                            {new Date(proprietaire.date_inscription).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Ajouter/Modifier Locataire - PLAN AUTOMATIQUE UNIQUEMENT */}
      {(showAddLocataire || editingLocataire) && proprietaire &&
       proprietaire.plan_actuel !== 'Quittance Automatique+' &&
       proprietaire.plan_actuel !== 'premium' && (
        <AddLocataireForm
          planType="auto"
          formData={newLocataire}
          onChange={(field, value) => {
            setNewLocataire({ ...newLocataire, [field]: value });
          }}
          onSubmit={editingLocataire ? handleEditLocataire : handleAddLocataire}
          onCancel={() => {
            setShowAddLocataire(false);
            setEditingLocataire(null);
            setNewLocataire({
              nom: '',
              prenom: '',
              email: '',
              telephone: '',
              adresse_logement: '',
              detail_adresse: '',
              loyer_mensuel: '',
              charges_mensuelles: '',
              caution_initiale: '',
              date_rappel: '1',
              heure_rappel: '9',
              minute_rappel: '0',
              periodicite: 'mensuel'
            });
          }}
          isLoading={false}
          isEditing={!!editingLocataire}
        />
      )}

      {/* Formulaire ORIGINAL pour Plan Automatique+ */}
      {(showAddLocataire || editingLocataire) && proprietaire &&
       (proprietaire.plan_actuel === 'Quittance Automatique+' || proprietaire.plan_actuel === 'premium') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={newLocataire.nom}
                    onChange={(e) => setNewLocataire({...newLocataire, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={newLocataire.prenom}
                    onChange={(e) => setNewLocataire({...newLocataire, prenom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newLocataire.email}
                    onChange={(e) => setNewLocataire({...newLocataire, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={newLocataire.telephone}
                    onChange={(e) => setNewLocataire({...newLocataire, telephone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse du logement *</label>
                  <input
                    type="text"
                    value={newLocataire.adresse_logement}
                    onChange={(e) => setNewLocataire({...newLocataire, adresse_logement: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 15 rue de la Paix, 75001 Paris"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Détail</label>
                  <input
                    type="text"
                    value={newLocataire.detail_adresse || ''}
                    onChange={(e) => setNewLocataire({...newLocataire, detail_adresse: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Appt 2, Chambre 1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loyer mensuel (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLocataire.loyer_mensuel}
                    onChange={(e) => setNewLocataire({...newLocataire, loyer_mensuel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Charges mensuelles (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLocataire.charges_mensuelles}
                    onChange={(e) => setNewLocataire({...newLocataire, charges_mensuelles: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de la caution initiale (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newLocataire.caution_initiale}
                  onChange={(e) => setNewLocataire({...newLocataire, caution_initiale: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 950.00"
                />
              </div>

              {/* Afficher la section de rappels automatiques SAUF pour Plan+ (gérée par la config bancaire) */}
              {proprietaire?.plan_actuel !== 'Quittance Automatique+' && proprietaire?.plan_actuel !== 'premium' && proprietaire?.plan_actuel !== 'Quittance Connectée+' && (
                <>
                  <div className="mt-6 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-600" />
                      Configuration des rappels automatiques
                    </h3>
                    <p className="text-sm text-gray-600">
                      Définissez quand envoyer automatiquement les quittances chaque mois
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de rappel (jour du mois)</label>
                      <select
                        value={newLocataire.date_rappel}
                        onChange={(e) => setNewLocataire({...newLocataire, date_rappel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Périodicité</label>
                      <select
                        value={newLocataire.periodicite}
                        onChange={(e) => setNewLocataire({...newLocataire, periodicite: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="mensuel">Mensuel</option>
                        <option value="trimestriel">Trimestriel</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Heure d'envoi</label>
                      <select
                        value={newLocataire.heure_rappel}
                        onChange={(e) => setNewLocataire({...newLocataire, heure_rappel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({length: 24}, (_, i) => i).map(hour => (
                          <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}h</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minute d'envoi</label>
                      <select
                        value={newLocataire.minute_rappel}
                        onChange={(e) => setNewLocataire({...newLocataire, minute_rappel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({length: 60}, (_, i) => i).map(minute => (
                          <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col space-y-4 pt-6">
                {/* Bouton Modifier Infos Bancaire pour Plan+ en mode édition */}
                {editingLocataire && (proprietaire?.plan_actuel === 'Quittance Automatique+' || proprietaire?.plan_actuel === 'premium') && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CreditCard className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">Configuration bancaire</h4>
                        <p className="text-xs text-blue-800 mb-3">
                          Configurez les paramètres de détection automatique des paiements pour ce locataire
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (editingLocataire) {
                              localStorage.setItem('proprietaireEmail', proprietaire.email);
                              localStorage.setItem('selectedLocataireId', editingLocataire.id);
                              navigate('/tenant-detection-setup');
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Modifier Infos Bancaire</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={editingLocataire ? handleEditLocataire : handleAddLocataire}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {editingLocataire ? 'Enregistrer les modifications' : 'Ajouter le locataire'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddLocataire(false);
                      setEditingLocataire(null);
                      setNewLocataire({
                        nom: '',
                        prenom: '',
                        email: '',
                        telephone: '',
                        adresse_logement: '',
                        detail_adresse: '',
                        loyer_mensuel: '',
                        charges_mensuelles: '',
                        caution_initiale: '',
                        date_rappel: '1',
                        periodicite: 'mensuel'
                      });
                    }}
                    className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de prévisualisation de la quittance */}
      {previewQuittance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Prévisualisation de la quittance</h2>
              <button
                onClick={() => setPreviewQuittance(null)}
                disabled={isSending}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <QuittancePreview
                formData={previewQuittance}
                isElectronicSignatureChecked={true}
                onClose={() => setPreviewQuittance(null)}
              />
            </div>

            {/* Bouton fixe en bas à droite */}
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent p-6 flex justify-between items-center border-t border-gray-200">
              <button
                onClick={() => setPreviewQuittance(null)}
                disabled={isSending}
                className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Fermer
              </button>
              <button
                onClick={handleSendQuittance}
                disabled={isSending}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-base font-semibold transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Envoyer la quittance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;