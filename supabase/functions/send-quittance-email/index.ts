import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuittanceEmailRequest {
  locataireEmail: string;
  locataireName: string;
  baillorName: string;
  periode: string;
  loyer: number;
  charges: number;
  total: number;
  pdfUrl: string;
  pdfBase64?: string;
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
      periode,
      loyer,
      charges,
      total,
      pdfUrl,
      pdfBase64
    }: QuittanceEmailRequest = await req.json();

    const emailBody = `Bonjour ${locataireName},

Veuillez trouver ci-joint votre quittance de loyer pour la période : ${periode}

Détails du paiement :
- Loyer mensuel : ${loyer.toFixed(2)} €
- Charges mensuelles : ${charges.toFixed(2)} €
- Total réglé : ${total.toFixed(2)} €

Cordialement,
${baillorName}`;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    let pdfContent = pdfBase64;
    if (!pdfContent) {
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error('Failed to fetch PDF from URL');
      }
      const pdfBuffer = await pdfResponse.arrayBuffer();
      pdfContent = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
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
        subject: `Quittance de loyer - ${periode}`,
        text: emailBody,
        attachments: [
          {
            filename: `quittance-${periode.toLowerCase().replace(/\s+/g, '-')}.pdf`,
            content: pdfContent,
          }
        ]
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
        messageId: data.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending quittance email:', error);
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