import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateShortCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
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

    // Get current date and time in Paris timezone
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    console.log(`⏰ Current time: ${currentDate} ${currentHour}:${currentMinute}`);

    // Find locataires whose reminder is scheduled for now (within 5 minutes)
    const { data: locataires, error: locatairesError } = await supabase
      .from('locataires')
      .select(`
        id,
        nom,
        prenom,
        montant_loyer,
        montant_charges,
        date_rappel,
        heure_rappel,
        minute_rappel,
        proprietaire_id,
        proprietaires (
          id,
          nom,
          prenom,
          telephone
        )
      `)
      .eq('date_rappel', currentDate)
      .gte('heure_rappel', currentHour - 1)
      .lte('heure_rappel', currentHour + 1);

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
        // Check if the time matches (within 5 minutes tolerance)
        const timeDiff = Math.abs(
          (locataire.heure_rappel * 60 + locataire.minute_rappel) -
          (currentHour * 60 + currentMinute)
        );

        if (timeDiff > 5) {
          console.log(`⏭️ Skipping ${locataire.prenom} ${locataire.nom} - time difference: ${timeDiff} minutes`);
          continue;
        }

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

        // Generate short code
        const shortCode = generateShortCode(6);

        // Get current month and year
        const month = now.getMonth();
        const year = now.getFullYear();
        const monthName = getMonthName(month);

        // Create short link in database
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

        // Calculate total amount
        const montantTotal = (locataire.montant_loyer || 0) + (locataire.montant_charges || 0);

        // Call send-owner-reminder-sms-v2
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

        if (smsResult.success) {
          console.log(`✅ SMS sent successfully to ${proprietaire.telephone}`);
          results.push({
            locataire_id: locataire.id,
            success: true,
            shortCode: shortCode,
            provider: smsResult.data?.provider
          });
        } else {
          console.error(`❌ Failed to send SMS:`, smsResult.error);
          results.push({
            locataire_id: locataire.id,
            success: false,
            error: smsResult.error
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
