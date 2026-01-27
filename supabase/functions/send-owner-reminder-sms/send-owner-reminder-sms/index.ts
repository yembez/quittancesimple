import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { sendSMS } from "../_shared/sms-service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      telephone,
      proprietaireName,
      locataireName,
      locataireId,
      proprietaireId,
      mois,
      montantTotal
    } = await req.json();

    console.log('📱 SMS request received:', { telephone, proprietaireName, locataireName });

    const appUrl = 'https://quittancesimple.vercel.app';
    const annee = new Date().getFullYear();

    const confirmationLink = `${appUrl}/sms-confirm?action=send&proprietaireId=${proprietaireId}&locataireId=${locataireId}&mois=${encodeURIComponent(mois)}&annee=${annee}&source=sms`;

    const message = `🔔 Quittance Simple - Rappel ${mois}\n\nBonjour ${proprietaireName},\n\nLe loyer de ${locataireName} (${montantTotal}€) devrait être reçu.\n\nAvez-vous reçu le paiement ?\n→ ${confirmationLink}`;

    console.log('📤 Sending SMS...');

    const result = await sendSMS({
      to: telephone,
      message: message,
      sender: "QuittanceS"
    });

    if (!result.success) {
      console.error('❌ SMS failed:', result.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          provider: result.provider
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    console.log(`✅ SMS sent successfully via ${result.provider}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          messageId: result.messageId,
          provider: result.provider,
          recipient: telephone
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});