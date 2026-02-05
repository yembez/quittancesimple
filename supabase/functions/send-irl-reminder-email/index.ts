import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IRLReminder {
  id: string;
  proprietaire_id: string;
  reminder_date: string;
  status: string;
  irl_calculation_data: any;
}

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom: string;
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];

    const { data: reminders, error: remindersError } = await supabase
      .from('irl_reminders')
      .select('*')
      .eq('reminder_date', today)
      .eq('status', 'scheduled');

    if (remindersError) {
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders to send today' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const results = [];

    for (const reminder of reminders as IRLReminder[]) {
      try {
        const { data: proprietaire, error: propError } = await supabase
          .from('proprietaires')
          .select('email, nom, prenom')
          .eq('id', reminder.proprietaire_id)
          .single();

        if (propError || !proprietaire) {
          console.error(`Proprietaire not found for reminder ${reminder.id}`);
          continue;
        }

        const prop = proprietaire as Proprietaire;

        const dashboardUrl = `${supabaseUrl.replace('supabase.co', 'vercel.app')}/revision-irl`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #7CAA89 0%, #6a9479 100%); padding: 40px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Rappel : Révision de loyer IRL
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Bonjour${prop.prenom ? ` ${prop.prenom}` : ''},
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Comme vous l'avez demandé, c'est le bon moment pour calculer votre révision de loyer (IRL).
              </p>

              <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Rendez-vous sur votre espace abonné pour effectuer le calcul et générer votre lettre de révision.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #7CAA89; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                      Accéder au calculateur IRL
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #1E40AF; font-size: 14px; line-height: 1.6;">
                  <strong>À savoir :</strong> La révision du loyer doit être notifiée au locataire pour être valable. Notre outil vous permet de générer automatiquement la lettre conforme.
                </p>
              </div>

              <p style="margin: 30px 0 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                À bientôt,<br>
                <strong style="color: #7CAA89;">L'équipe Quittance Simple</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 12px;">
                Vous recevez cet e-mail car vous avez programmé un rappel IRL sur Quittance Simple.
              </p>
              <p style="margin: 0; color: #6B7280; font-size: 12px;">
                © 2026 Quittance Simple - Tous droits réservés
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Quittance Simple <noreply@quittance-simple.com>',
            to: [prop.email],
            subject: 'Rappel : votre révision de loyer (IRL)',
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email to ${prop.email}:`, errorText);
          results.push({
            reminder_id: reminder.id,
            email: prop.email,
            success: false,
            error: errorText,
          });
          continue;
        }

        await supabase
          .from('irl_reminders')
          .update({ status: 'sent' })
          .eq('id', reminder.id);

        results.push({
          reminder_id: reminder.id,
          email: prop.email,
          success: true,
        });

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        results.push({
          reminder_id: reminder.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} reminders`,
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
