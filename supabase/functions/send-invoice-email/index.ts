import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { Resend } from 'npm:resend@4.0.0';

const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const resend = new Resend(resendApiKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      email,
      nom,
      prenom,
      numeroFacture,
      montant,
      dateEmission,
      periodeDebut,
      periodeFin,
      stripePdfUrl,
    } = await req.json();

    const dateEmissionFormatted = new Date(dateEmission).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const periodeFormatted = new Date(periodeDebut).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre facture Quittance Simple</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #2D3436 0%, #1a1f20 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Quittance Simple</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Votre facture</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">
                Bonjour ${prenom} ${nom},
              </p>

              <p style="margin: 0 0 30px 0; font-size: 15px; color: #555555; line-height: 1.6;">
                Nous vous confirmons le paiement de votre abonnement Quittance Simple pour la période de ${periodeFormatted}.
              </p>

              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #666666; font-size: 14px;">Facture N°</span>
                    </td>
                    <td align="right" style="padding: 8px 0;">
                      <strong style="color: #2D3436; font-size: 14px;">${numeroFacture}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #666666; font-size: 14px;">Date d'émission</span>
                    </td>
                    <td align="right" style="padding: 8px 0;">
                      <strong style="color: #2D3436; font-size: 14px;">${dateEmissionFormatted}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #666666; font-size: 14px;">Période</span>
                    </td>
                    <td align="right" style="padding: 8px 0;">
                      <strong style="color: #2D3436; font-size: 14px;">${periodeFormatted}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 16px 0 8px 0; border-top: 2px solid #dee2e6;">
                      <table width="100%">
                        <tr>
                          <td>
                            <span style="color: #2D3436; font-size: 16px; font-weight: 600;">Total TTC</span>
                          </td>
                          <td align="right">
                            <strong style="color: #2D3436; font-size: 20px;">${montant.toFixed(2)}€</strong>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              ${stripePdfUrl ? `
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${stripePdfUrl}" style="display: inline-block; background-color: #2D3436; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  📄 Télécharger la facture PDF
                </a>
              </div>
              ` : ''}

              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; line-height: 1.6;">
                Vous pouvez également retrouver cette facture dans votre espace client à tout moment.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://quittancesimple.fr/billing?email=${encodeURIComponent(email)}" style="display: inline-block; background-color: #f8f9fa; color: #2D3436; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; border: 1px solid #dee2e6;">
                  Accéder à mon espace
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                Merci de votre confiance !
              </p>
              <p style="margin: 0; font-size: 13px; color: #999999;">
                Pour toute question, contactez-nous à <a href="mailto:contact@quittancesimple.fr" style="color: #2D3436; text-decoration: none;">contact@quittancesimple.fr</a>
              </p>
            </td>
          </tr>
        </table>

        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.5;">
                Quittance Simple - Gestion locative simplifiée<br>
                © ${new Date().getFullYear()} Tous droits réservés
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

    const { data, error } = await resend.emails.send({
      from: 'Quittance Simple <noreply@quittancesimple.fr>',
      to: [email],
      subject: `Facture ${numeroFacture} - ${montant.toFixed(2)}€`,
      html: emailHtml,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Email de facture envoyé avec succès:', data);
    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
