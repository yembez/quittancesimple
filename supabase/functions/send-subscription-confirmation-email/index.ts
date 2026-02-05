import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function corsResponse(body: any, status = 200) {
  if (status === 204) {
    return new Response(null, { status, headers: corsHeaders });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    console.log('=== Send Subscription Confirmation Email ===');

    if (req.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { email, magicLink, planName } = await req.json();

    if (!email || !magicLink) {
      console.error('❌ Missing required fields');
      return corsResponse({ error: 'Email and magicLink are required' }, 400);
    }

    console.log('📧 Sending confirmation email to:', email);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return corsResponse({ error: 'Email service not configured' }, 500);
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre accès à Quittance Simple</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #7CAA89 0%, #6a9d7f 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Paiement confirmé
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>

              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Votre paiement a bien été confirmé. Bienvenue dans <strong>${planName || 'Quittance Simple'}</strong> !
              </p>

              <p style="margin: 0 0 30px; color: #333; font-size: 16px; line-height: 1.6;">
                Cliquez sur le bouton ci-dessous pour accéder à votre tableau de bord :
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${magicLink}" style="display: inline-block; background-color: #7CAA89; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Accéder à mon tableau de bord
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #7CAA89; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #333; font-size: 14px; font-weight: 600;">
                      Lien sécurisé personnel
                    </p>
                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                      Ce lien est sécurisé et valable pour une durée limitée. Ne le partagez avec personne.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="margin: 10px 0 0; color: #7CAA89; font-size: 13px; word-break: break-all;">
                ${magicLink}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                Vous recevez cet email car vous venez de souscrire à Quittance Simple.
              </p>
              <p style="margin: 0 0 20px; color: #666; font-size: 14px;">
                Des questions ? Contactez-nous à <a href="mailto:contact@quittancesimple.fr" style="color: #7CAA89; text-decoration: none;">contact@quittancesimple.fr</a>
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} Quittance Simple. Tous droits réservés.
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

    const textContent = `
Votre accès à Quittance Simple

Bonjour,

Votre paiement a bien été confirmé. Bienvenue dans ${planName || 'Quittance Simple'} !

Cliquez sur ce lien pour accéder à votre tableau de bord :
${magicLink}

Ce lien est sécurisé et valable pour une durée limitée. Ne le partagez avec personne.

Des questions ? Contactez-nous à contact@quittancesimple.fr

© ${new Date().getFullYear()} Quittance Simple. Tous droits réservés.
    `.trim();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Quittance Simple <noreply@quittancesimple.fr>',
        to: [email],
        subject: 'Votre accès à Quittance Simple',
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error:', errorText);
      return corsResponse({ error: 'Failed to send email' }, 500);
    }

    const data = await response.json();
    console.log('✅ Email sent successfully:', data.id);

    return corsResponse({
      success: true,
      emailId: data.id,
    });

  } catch (error: any) {
    console.error('❌ Send email error:', error);
    return corsResponse({ error: error.message }, 500);
  }
});
