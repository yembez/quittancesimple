import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReminderRequest {
  locataireEmail: string;
  locataireName: string;
  baillorName: string;
  loyer: number;
  charges: number;
  adresseLogement: string;
  customMessage?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      locataireEmail,
      locataireName,
      baillorName,
      loyer,
      charges,
      adresseLogement,
      customMessage
    }: ReminderRequest = await req.json();

    const total = loyer + charges;

    let emailBody: string;

    if (customMessage) {
      emailBody = customMessage;
    } else {
      emailBody = `Bonjour ${locataireName},

J'espère que vous allez bien. Je me permets de vous envoyer ce message pour vous rappeler que le loyer du mois en cours n'a pas encore été réglé pour le logement situé au :

${adresseLogement}

Pour rappel, voici le détail des montants dus :

Loyer mensuel : ${loyer.toFixed(2)} €
Charges mensuelles : ${charges.toFixed(2)} €
Total à régler : ${total.toFixed(2)} €

Pourriez-vous s'il vous plaît procéder au règlement dans les meilleurs délais ? Si vous avez déjà effectué le paiement, merci de ne pas tenir compte de ce message.

Je reste à votre disposition pour toute question.

Cordialement,
${baillorName}`;
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Quittance Simple <noreply@quittancesimple.fr>',
        to: [locataireEmail],
        subject: 'Rappel de paiement du loyer',
        text: emailBody,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.id,
        customMessageUsed: !!customMessage
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
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