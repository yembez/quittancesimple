import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WelcomeEmailRequest {
  email: string;
  nom: string;
  prenom?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, nom, prenom }: WelcomeEmailRequest = await req.json();

    console.log('📧 Envoi email de bienvenue à:', email);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY n'est pas définie");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configuration email manquante"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fullName = prenom ? `${prenom} ${nom}` : nom;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Quittance Simple</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

      <div style="background: linear-gradient(135deg, #7CAA89 0%, #6b9378 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
          🎉 Bienvenue sur Quittance Simple !
        </h1>
      </div>

      <div style="padding: 40px 30px;">
        <p style="color: #2b2b2b; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Bonjour <strong>${fullName}</strong>,
        </p>

        <p style="color: #545454; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Félicitations ! Votre compte gratuit a été créé avec succès. Vous pouvez maintenant retrouver vos quittances et votre locataire dans votre espace personnel.
        </p>

        <div style="background-color: #7CAA89; background: linear-gradient(135deg, rgba(124, 170, 137, 0.1) 0%, rgba(107, 147, 120, 0.1) 100%); border: 2px solid #7CAA89; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #2b2b2b; font-size: 18px; margin: 0 0 15px 0;">
            ✨ Votre Plan Gratuit inclut :
          </h2>
          <ul style="color: #545454; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>1 locataire enregistré</li>
            <li>3 dernières quittances conservées</li>
            <li>Génération gratuite de quittances PDF conformes</li>
          </ul>
        </div>

        <div style="background-color: #fef3f2; border: 2px solid #ed7862; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #2b2b2b; font-size: 18px; margin: 0 0 15px 0;">
            🚀 Envie d'aller plus loin ?
          </h2>
          <p style="color: #545454; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
            Découvrez la <strong>version automatique</strong> dès 1€/mois :
          </p>
          <ul style="color: #545454; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Historique complet de vos quittances</li>
            <li>Plusieurs locataires</li>
            <li>Envoi automatique chaque mois</li>
            <li>Relances automatiques</li>
          </ul>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="https://quittancesimple.fr/dashboard" style="display: inline-block; background-color: #7CAA89; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; margin-bottom: 10px;">
            Accéder à mon espace
          </a>
          <br>
          <a href="https://quittancesimple.fr/pricing" style="display: inline-block; background-color: #ed7862; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; margin-top: 10px;">
            Découvrir la version automatique
          </a>
        </div>

        <p style="color: #545454; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Si vous avez des questions, n'hésitez pas à nous contacter.
        </p>

        <p style="color: #545454; font-size: 14px; line-height: 1.6; margin: 0;">
          À très bientôt,<br>
          <strong>L'équipe Quittance Simple</strong>
        </p>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          © 2025 Quittance Simple - Tous droits réservés
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
          <a href="https://quittancesimple.fr/legal" style="color: #7CAA89; text-decoration: none;">Mentions légales</a> •
          <a href="https://quittancesimple.fr/privacy" style="color: #7CAA89; text-decoration: none;">Confidentialité</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Quittance Simple <noreply@quittancesimple.fr>",
        to: [email],
        subject: "🎉 Bienvenue sur Quittance Simple !",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Erreur Resend:", errorData);
      throw new Error(`Erreur Resend: ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Email de bienvenue envoyé avec succès à:', email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de bienvenue envoyé avec succès",
        data
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Erreur envoi email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});