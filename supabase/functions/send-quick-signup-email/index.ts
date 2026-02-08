import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  email: string;
  password: string;
  plan: string;
  billingCycle: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Resend API key not configured");
    }

    const resend = new Resend(resendApiKey);

    const body: RequestBody = await req.json();
    const { email, password, plan, billingCycle } = body;

    const planName = plan === 'auto' ? 'Pack Automatique' : 'Quittance Connectée+';
    const cycleLabel = billingCycle === 'monthly' ? 'mensuel' : 'annuel';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ed7862 0%, #e56651 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">
                🎉 Bienvenue chez Quittance Simple !
              </h1>
              <p style="color: #ffffff; font-size: 16px; margin: 0; opacity: 0.95;">
                Votre compte est activé
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #1a1f20; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour,
              </p>

              <p style="color: #1a1f20; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Merci d'avoir souscrit au <strong>${planName}</strong> (abonnement ${cycleLabel}). Votre compte a été créé automatiquement et votre premier paiement a bien été enregistré.
              </p>

              <div style="background-color: #fefdf9; border: 2px solid #ed7862; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h2 style="color: #1a1f20; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                  🔑 Vos identifiants de connexion
                </h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #545454; font-size: 14px;">Email :</strong>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="color: #1a1f20; font-size: 14px; font-family: monospace;">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #545454; font-size: 14px;">Mot de passe :</strong>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="color: #ed7862; font-size: 16px; font-family: monospace; font-weight: bold;">${password}</span>
                    </td>
                  </tr>
                </table>
                <p style="color: #7CAA89; font-size: 13px; margin: 15px 0 0 0;">
                  💡 Vous pourrez modifier ce mot de passe depuis votre tableau de bord
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://quittance-simple.fr/dashboard" style="display: inline-block; background-color: #ed7862; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(237, 120, 98, 0.3);">
                  Accéder à mon tableau de bord
                </a>
              </div>

              <div style="background-color: #f0f9ff; border-left: 4px solid #7CAA89; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <h3 style="color: #1a1f20; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                  📋 Prochaines étapes
                </h3>
                <ol style="color: #545454; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Connectez-vous à votre tableau de bord</li>
                  <li>Ajoutez vos locataires et propriétés</li>
                  <li>Configurez vos rappels automatiques</li>
                  <li>Générez votre première quittance en 1 clic</li>
                </ol>
              </div>

              <p style="color: #545454; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@quittance-simple.fr" style="color: #ed7862; text-decoration: none;">contact@quittance-simple.fr</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fefdf9; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Quittance Simple - Automatisation des quittances de loyer<br>
                <a href="https://quittance-simple.fr" style="color: #ed7862; text-decoration: none;">quittance-simple.fr</a>
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

    const result = await resend.emails.send({
      from: "Quittance Simple <noreply@quittance-simple.fr>",
      to: email,
      subject: "🎉 Bienvenue ! Vos identifiants de connexion",
      html: htmlContent,
    });

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Send quick signup email error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Une erreur est survenue',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
