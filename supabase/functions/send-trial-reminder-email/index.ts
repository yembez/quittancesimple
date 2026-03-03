import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildEmailHtml } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  date_fin_essai: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Mode preview : envoyer les 5 e-mails de relance à une adresse de test
    let previewEmail: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      previewEmail = body?.preview_email || null;
    } catch {
      // no body or invalid JSON
    }
    if (previewEmail && previewEmail.includes('@')) {
      const mockProprietaire: Proprietaire = {
        id: 'preview',
        email: previewEmail,
        nom: 'Test',
        prenom: 'Prénom',
        date_fin_essai: new Date().toISOString(),
      };
      const baseUrl = supabaseUrl.replace('.supabase.co', '.vercel.app');
      const checkoutUrl = `${baseUrl}/payment-checkout?trial=true&email=${encodeURIComponent(previewEmail)}`;
      const reminderTypes: { type: string; daysRemaining: number }[] = [
        { type: 'day_7', daysRemaining: 23 },
        { type: 'day_15', daysRemaining: 15 },
        { type: 'day_23', daysRemaining: 7 },
        { type: 'day_29', daysRemaining: 1 },
        { type: 'day_30_expired', daysRemaining: 0 },
      ];
      const sent: string[] = [];
      const errors: { type: string; error: string }[] = [];
      for (let i = 0; i < reminderTypes.length; i++) {
        const { type, daysRemaining } = reminderTypes[i];
        try {
          const subject = getEmailSubject(type, daysRemaining);
          const html = generateEmailTemplate(type, mockProprietaire, daysRemaining, checkoutUrl);
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'QS - Espace Bailleur <noreply@quittancesimple.fr>',
              to: [previewEmail],
              subject: `[PREVIEW] ${subject}`,
              html,
            }),
          });
          if (res.ok) {
            sent.push(type);
          } else {
            const errText = await res.text();
            errors.push({ type, error: errText });
          }
          if (i < reminderTypes.length - 1) await new Promise((r) => setTimeout(r, 1500));
        } catch (e) {
          errors.push({ type, error: (e as Error).message });
        }
      }
      return new Response(
        JSON.stringify({ message: 'Preview done', to: previewEmail, sent, errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer tous les propriétaires en période d'essai
    const { data: proprietaires, error: propError } = await supabase
      .from('proprietaires')
      .select('id, email, nom, prenom, date_fin_essai')
      .not('date_fin_essai', 'is', null)
      .eq('abonnement_actif', true)
      .eq('lead_statut', 'QA_1st_interested');

    if (propError) {
      throw propError;
    }

    if (!proprietaires || proprietaires.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No trial users found' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const results = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const proprietaire of proprietaires as Proprietaire[]) {
      try {
        const endDate = new Date(proprietaire.date_fin_essai);
        endDate.setHours(0, 0, 0, 0);
        
        // Calculer les jours restants (arrondi vers le haut pour être sûr de ne pas rater une relance)
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Ignorer si l'essai est déjà expiré (géré par check-trial-expiration)
        if (daysRemaining < 0) {
          continue;
        }

        // Déterminer le type de relance selon les jours restants
        let reminderType: string | null = null;
        if (daysRemaining === 23) {
          reminderType = 'day_7';
        } else if (daysRemaining === 15) {
          reminderType = 'day_15';
        } else if (daysRemaining === 7) {
          reminderType = 'day_23';
        } else if (daysRemaining === 1) {
          reminderType = 'day_29';
        } else if (daysRemaining === 0) {
          reminderType = 'day_30_expired';
        }

        // Si ce n'est pas un jour de relance, passer au suivant
        if (!reminderType) {
          continue;
        }

        // Vérifier si cette relance a déjà été envoyée
        const { data: existingReminder } = await supabase
          .from('trial_reminders')
          .select('id')
          .eq('proprietaire_id', proprietaire.id)
          .eq('reminder_type', reminderType)
          .eq('status', 'sent')
          .maybeSingle();

        if (existingReminder) {
          console.log(`Reminder ${reminderType} already sent for ${proprietaire.email}`);
          continue;
        }

        // Créer ou mettre à jour l'enregistrement de relance
        // Vérifier d'abord si l'enregistrement existe
        const { data: existingRecord } = await supabase
          .from('trial_reminders')
          .select('id')
          .eq('proprietaire_id', proprietaire.id)
          .eq('reminder_type', reminderType)
          .maybeSingle();

        let reminderRecord;
        if (existingRecord) {
          // Mettre à jour l'enregistrement existant
          const { data: updated } = await supabase
            .from('trial_reminders')
            .update({ status: 'scheduled', updated_at: new Date().toISOString() })
            .eq('id', existingRecord.id)
            .select()
            .single();
          reminderRecord = updated;
        } else {
          // Créer un nouvel enregistrement
          const { data: created } = await supabase
            .from('trial_reminders')
            .insert({
              proprietaire_id: proprietaire.id,
              reminder_type: reminderType,
              status: 'scheduled',
            })
            .select()
            .single();
          reminderRecord = created;
        }

        // Générer le lien de checkout
        const checkoutUrl = `${supabaseUrl.replace('.supabase.co', '.vercel.app')}/payment-checkout?trial=true&email=${encodeURIComponent(proprietaire.email)}`;

        // Générer le template d'email selon le type
        const emailHtml = generateEmailTemplate(reminderType, proprietaire, daysRemaining, checkoutUrl);

        const subject = getEmailSubject(reminderType, daysRemaining);

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'QS - Espace Bailleur <noreply@quittancesimple.fr>',
            to: [proprietaire.email],
            subject: subject,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email to ${proprietaire.email}:`, errorText);
          
          // Mettre à jour le statut en failed
          if (reminderRecord) {
            await supabase
              .from('trial_reminders')
              .update({ 
                status: 'failed',
                error_message: errorText,
                updated_at: new Date().toISOString()
              })
              .eq('id', reminderRecord.id);
          }

          results.push({
            proprietaire_id: proprietaire.id,
            email: proprietaire.email,
            reminder_type: reminderType,
            success: false,
            error: errorText,
          });
          continue;
        }

        // Mettre à jour le statut en sent
        if (reminderRecord) {
          await supabase
            .from('trial_reminders')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', reminderRecord.id);
        }

        results.push({
          proprietaire_id: proprietaire.id,
          email: proprietaire.email,
          reminder_type: reminderType,
          success: true,
        });

      } catch (error) {
        console.error(`Error processing proprietaire ${proprietaire.id}:`, error);
        results.push({
          proprietaire_id: proprietaire.id,
          email: proprietaire.email,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} trial reminders`,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function getEmailSubject(reminderType: string, daysRemaining: number): string {
  switch (reminderType) {
    case 'day_7':
      return 'Votre essai gratuit — une semaine déjà';
    case 'day_15':
      return 'Quittance Simple — mi-parcours de votre essai';
    case 'day_23':
      return 'Il vous reste 7 jours d\'essai gratuit';
    case 'day_29':
      return 'Votre essai se termine demain';
    case 'day_30_expired':
      return 'Réactiver votre compte Quittance Simple';
    default:
      return 'Quittance Simple';
  }
}

function generateEmailTemplate(
  reminderType: string,
  proprietaire: Proprietaire,
  daysRemaining: number,
  checkoutUrl: string
): string {
  const prenom = proprietaire.prenom || 'Jean';
  const greeting = `Bonjour ${prenom},`;
  const dashboardUrl = checkoutUrl.replace(/\/payment-checkout[^]*$/, '/dashboard');
  const baseUrl = checkoutUrl.replace(/\/payment-checkout.*$/, '') || 'https://quittance-simple.fr';
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(proprietaire.email)}`;
  const contactUrl = `${baseUrl}/contact`;

  const bodyStyle = 'font-size:16px; color:#111827; line-height:1.6;';

  let bodyHtml = '';
  let ctaText = 'Accéder à mon espace';
  let ctaUrl = dashboardUrl;

  switch (reminderType) {
    case 'day_7':
      bodyHtml = `
${greeting}<br><br>

Il y a une semaine, vous avez activé l'essai du <strong>Pack Automatique</strong>.<br><br>

Depuis, vos quittances peuvent partir automatiquement chaque mois, sans que vous ayez à y penser.<br><br>

Il vous reste <strong>${daysRemaining} jours</strong> pour tester tranquillement :<br><br>

• L'envoi automatique des quittances<br>
• Les rappels en cas de retard<br>
• La révision IRL<br>
• Votre espace de stockage sécurisé<br><br>

Prenez le temps d'essayer une première validation.<br>
En 1 clic, tout part.`;
      break;

    case 'day_15':
      bodyHtml = `
${greeting}<br><br>

Votre essai est à mi-parcours — il vous reste <strong>${daysRemaining} jours</strong>.<br><br>

Si ce n'est pas déjà fait, jetez un œil au coffre-fort, aux modèles de bails et au bilan annuel. Ça peut vraiment faire gagner du temps.<br><br>

Prenez le temps d'explorer. Une question ? Répondez à ce mail.`;
      ctaText = 'Accéder à mon espace';
      ctaUrl = dashboardUrl;
      break;

    case 'day_23':
      bodyHtml = `
${greeting}<br><br>

Il vous reste <strong>7 jours</strong> d'essai.<br><br>

Si vous souhaitez continuer après cette date, vous pourrez activer un abonnement en quelques clics (à partir de 3,25€/mois en annuel, sans engagement). Paiement sécurisé.`;
      ctaText = 'Activer mon abonnement';
      ctaUrl = checkoutUrl;
      break;

    case 'day_29':
      bodyHtml = `
${greeting}<br><br>

Votre essai se termine demain.<br><br>

Vos données restent sauvegardées. Vous pourrez réactiver votre accès quand vous voulez, sans engagement.`;
      ctaText = 'Activer mon abonnement';
      ctaUrl = checkoutUrl;
      break;

    case 'day_30_expired':
      bodyHtml = `
${greeting}<br><br>

Votre période d'essai est terminée.<br><br>

Vos données sont toujours là. Vous pouvez réactiver votre compte à tout moment pour retrouver l'accès au Pack Automatique.`;
      ctaText = 'Réactiver mon compte';
      ctaUrl = checkoutUrl;
      break;
  }

  const closing = `Si vous avez la moindre question, répondez simplement à ce mail. Je vous répondrai personnellement.<br><br>Bonne journée,<br><br><strong>Guilhem</strong><br>Fondateur – Quittance Simple`;

  return buildEmailHtml({
    title: 'QS- Espace Bailleur',
    bodyHtml,
    ctaText,
    ctaUrl,
    closingHtml: closing,
    unsubscribeUrl,
    contactUrl,
  });
}
