import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RevisionLetterEmailRequest {
  email: string;
  nouveauLoyer: number;
  ancienLoyer: number;
  gainMensuel: number;
  gainAnnuel: number;
  pdfBase64: string;
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
      email,
      nouveauLoyer,
      ancienLoyer,
      gainMensuel,
      gainAnnuel,
      pdfBase64
    }: RevisionLetterEmailRequest = await req.json();

    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre lettre de révision de loyer</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7CAA89 0%, #5a8a6f 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Votre lettre de révision</h1>
              <p style="margin: 10px 0 0 0; color: #e8f4ee; font-size: 16px;">Conforme à l'indice IRL</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #2c2c2c; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>
              <p style="margin: 0 0 25px 0; color: #2c2c2c; font-size: 16px; line-height: 1.6;">
                Votre lettre de révision de loyer est prête ! Elle est <strong>juridiquement conforme</strong> et peut être envoyée directement à votre locataire.
              </p>

              <!-- Summary Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px 0; color: #7CAA89; font-size: 18px; font-weight: 600;">Résumé de votre révision</h2>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Loyer actuel :</td>
                        <td style="padding: 8px 0; color: #2c2c2c; font-size: 14px; text-align: right; font-weight: 600;">${ancienLoyer.toFixed(2)} €</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Nouveau loyer :</td>
                        <td style="padding: 8px 0; color: #7CAA89; font-size: 16px; text-align: right; font-weight: 700;">${nouveauLoyer.toFixed(2)} €</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 12px 0 4px 0; border-top: 1px solid #e5e7eb;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #666666; font-size: 14px;">Gain mensuel :</td>
                        <td style="padding: 4px 0; color: #16a34a; font-size: 14px; text-align: right; font-weight: 600;">+${gainMensuel.toFixed(2)} €</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #666666; font-size: 14px;">Gain annuel :</td>
                        <td style="padding: 4px 0; color: #16a34a; font-size: 16px; text-align: right; font-weight: 700;">+${gainAnnuel.toFixed(2)} €</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0; color: #2c2c2c; font-size: 16px; line-height: 1.6;">
                La lettre en pièce jointe contient tous les calculs détaillés et références légales nécessaires.
              </p>

              <!-- Divider -->
              <div style="border-top: 2px solid #e5e7eb; margin: 35px 0;"></div>

              <!-- CTA Section -->
              <h2 style="margin: 0 0 20px 0; color: #2c2c2c; font-size: 20px; font-weight: 600; text-align: center;">
                Simplifiez la gestion de vos quittances
              </h2>
              <p style="margin: 0 0 25px 0; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
                Après la révision de votre loyer, automatisez vos quittances et gagnez du temps chaque mois
              </p>

              <!-- Two columns for offers -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 0 10px 0 0; width: 50%; vertical-align: top;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <div style="font-size: 32px; margin-bottom: 10px;">📄</div>
                          <h3 style="margin: 0 0 8px 0; color: #2c2c2c; font-size: 16px; font-weight: 600;">Quittance Simple</h3>
                          <p style="margin: 0 0 12px 0; color: #7CAA89; font-size: 20px; font-weight: 700;">Gratuit</p>
                          <p style="margin: 0 0 15px 0; color: #666666; font-size: 13px; line-height: 1.5;">
                            Générez vos quittances manuellement en quelques clics
                          </p>
                          <a href="https://quittancesimple.fr/generator" style="display: inline-block; padding: 10px 20px; background-color: #7CAA89; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            Essayer gratuitement
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding: 0 0 0 10px; width: 50%; vertical-align: top;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #7CAA89 0%, #5a8a6f 100%); border-radius: 8px; box-shadow: 0 4px 6px rgba(124,170,137,0.3);">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <div style="font-size: 32px; margin-bottom: 10px;">🔄</div>
                          <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 16px; font-weight: 600;">Quittance Automatique</h3>
                          <p style="margin: 0 0 12px 0; color: #e8f4ee; font-size: 20px; font-weight: 700;">0,82€/mois</p>
                          <p style="margin: 0 0 15px 0; color: #e8f4ee; font-size: 13px; line-height: 1.5;">
                            Automatisez l'envoi par email et SMS
                          </p>
                          <a href="https://quittancesimple.fr/pricing" style="display: inline-block; padding: 10px 20px; background-color: #ffffff; color: #7CAA89; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            Découvrir →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Benefits -->
              <div style="margin: 30px 0 0 0; padding: 20px; background-color: #eff6f3; border-left: 4px solid #7CAA89; border-radius: 4px;">
                <p style="margin: 0; color: #2c2c2c; font-size: 14px; line-height: 1.6;">
                  <strong>✓</strong> Conforme aux obligations légales<br>
                  <strong>✓</strong> Envoi automatique à vos locataires<br>
                  <strong>✓</strong> Historique complet accessible 24/7<br>
                  <strong>✓</strong> Support dédié en français
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 5px 0; color: #2c2c2c; font-size: 14px; font-weight: 600;">
                Quittance Simple
              </p>
              <p style="margin: 0; color: #666666; font-size: 12px;">
                La solution de gestion locative des bailleurs modernes
              </p>
              <p style="margin: 15px 0 0 0; color: #999999; font-size: 11px;">
                Vous recevez cet email car vous avez utilisé notre calculateur de révision de loyer
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailText = `Bonjour,

Votre lettre de révision de loyer est prête ! Elle est juridiquement conforme et peut être envoyée directement à votre locataire.

Résumé de votre révision :
- Loyer actuel : ${ancienLoyer.toFixed(2)} €
- Nouveau loyer : ${nouveauLoyer.toFixed(2)} €
- Gain mensuel : +${gainMensuel.toFixed(2)} €
- Gain annuel : +${gainAnnuel.toFixed(2)} €

La lettre en pièce jointe contient tous les calculs détaillés et références légales nécessaires.

---

Simplifiez la gestion de vos quittances

📄 Quittance Simple (Gratuit)
Générez vos quittances manuellement en quelques clics
→ https://quittancesimple.fr/generator

🔄 Quittance Automatique (0,82€/mois)
Automatisez l'envoi par email et SMS
→ https://quittancesimple.fr/pricing

✓ Conforme aux obligations légales
✓ Envoi automatique à vos locataires
✓ Historique complet accessible 24/7
✓ Support dédié en français

À bientôt,
L'équipe Quittance Simple`;

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
        to: [email],
        subject: 'Votre lettre de révision de loyer (IRL)',
        html: emailHtml,
        text: emailText,
        attachments: [
          {
            filename: `lettre-revision-loyer-${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBase64,
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
    console.error('Error sending revision letter email:', error);
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
