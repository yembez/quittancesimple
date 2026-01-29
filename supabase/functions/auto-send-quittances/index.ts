import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateShortCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getMonthName(month: number): string {
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
  ];
  return months[month];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🤖 CRON job auto-send-quittances started');

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const parisDay = parisTime.getDate();
    const parisHour = parisTime.getHours();
    const parisMinute = parisTime.getMinutes();

    console.log(`⏰ Paris time: Day ${parisDay}, ${parisHour}:${parisMinute}`);

    const { data: locataires, error: locatairesError } = await supabase
      .from('locataires')
      .select(`
        id,
        nom,
        prenom,
        loyer_mensuel,
        charges_mensuelles,
        date_rappel,
        heure_rappel,
        minute_rappel,
        proprietaire_id,
        proprietaires (
          id,
          nom,
          prenom,
          telephone,
          email
        )
      `)
      .eq('date_rappel', parisDay)
      .eq('heure_rappel', parisHour)
      .eq('minute_rappel', parisMinute);

    if (locatairesError) {
      console.error('Error fetching locataires:', locatairesError);
      throw locatairesError;
    }

    console.log(`📋 Found ${locataires?.length || 0} locataires to check`);

    if (!locataires || locataires.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No reminders to send at this time',
          checked_at: now.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const results = [];

    for (const locataire of locataires) {
      try {
        console.log(`✅ Processing ${locataire.prenom} ${locataire.nom}`);

        const proprietaire = locataire.proprietaires;

        if (!proprietaire || !proprietaire.telephone) {
          console.error(`❌ No proprietaire or telephone for locataire ${locataire.id}`);
          results.push({
            locataire_id: locataire.id,
            success: false,
            error: 'No proprietaire or telephone'
          });
          continue;
        }

        const month = parisTime.getMonth();
        const year = parisTime.getFullYear();
        const monthName = getMonthName(month);
        const shortCode = generateShortCode(6);

        const { error: shortLinkError } = await supabase
          .from('short_links')
          .insert({
            id: shortCode,
            proprietaire_id: locataire.proprietaire_id,
            locataire_id: locataire.id,
            mois: monthName,
            annee: year,
            action: 'send',
            source: 'sms',
            expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (shortLinkError) {
          console.error('Error creating short link:', shortLinkError);
          results.push({
            locataire_id: locataire.id,
            success: false,
            error: 'Failed to create short link'
          });
          continue;
        }

        console.log(`🔗 Short link created: ${shortCode}`);

        const montantTotal = (locataire.loyer_mensuel || 0) + (locataire.charges_mensuelles || 0);

        const smsResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-owner-reminder-sms-v2`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              telephone: proprietaire.telephone,
              proprietaireName: `${proprietaire.prenom} ${proprietaire.nom}`,
              locataireName: `${locataire.prenom} ${locataire.nom}`,
              shortCode: shortCode,
              montantTotal: montantTotal
            }),
          }
        );

        const smsResult = await smsResponse.json();

        let emailResult = { success: false, error: 'No email configured' };
        if (proprietaire.email) {
          try {
            const emailPayload = {
              proprietaireId: proprietaire.id,
              proprietaireEmail: proprietaire.email,
              proprietaireName: `${proprietaire.prenom || ''} ${proprietaire.nom || ''}`.trim(),
              locataireName: `${locataire.prenom || ''} ${locataire.nom || ''}`.trim(),
              locataireId: locataire.id,
              mois: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
              annee: year,
              montantTotal: montantTotal
            };

            console.log(`📧 Sending email to ${proprietaire.email} with payload:`, emailPayload);

            const emailResponse = await fetch(
              `${supabaseUrl}/functions/v1/send-owner-reminder`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify(emailPayload),
              }
            );
            emailResult = await emailResponse.json();
            if (emailResult.success) {
              console.log(`✅ Email sent successfully to ${proprietaire.email}`);
            } else {
              console.error(`⚠️ Email failed:`, emailResult.error);
            }
          } catch (emailError) {
            console.error(`⚠️ Email error:`, emailError);
            emailResult = { success: false, error: emailError.message };
          }
        } else {
          console.log(`⚠️ No email configured for proprietaire ${proprietaire.id}`);
        }

        if (smsResult.success) {
          console.log(`✅ SMS sent successfully to ${proprietaire.telephone}`);
          results.push({
            locataire_id: locataire.id,
            success: true,
            shortCode: shortCode,
            sms_provider: smsResult.data?.provider,
            email_sent: emailResult.success
          });
        } else {
          console.error(`❌ Failed to send SMS:`, smsResult.error);
          results.push({
            locataire_id: locataire.id,
            success: false,
            error: smsResult.error,
            email_sent: emailResult.success
          });
        }

      } catch (error) {
        console.error(`❌ Error processing locataire ${locataire.id}:`, error);
        results.push({
          locataire_id: locataire.id,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`✅ CRON job completed. Processed ${results.length} locataires`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results,
        executed_at: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ CRON job error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});