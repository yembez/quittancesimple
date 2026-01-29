import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestData {
  requestId: string;
  baillorName: string;
  baillorEmail: string;
  locataireName: string;
  locataireAddress: string;
  nouveauLoyer: number;
  ancienLoyer: number;
  sendMode: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const data: RequestData = await req.json();

    const sendModeLabel = data.sendMode === "electronique"
      ? "recommandé électronique"
      : "recommandé postal";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #22c55e;
              color: white;
              padding: 30px 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px 20px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .success-box {
              background-color: #d1fae5;
              border-left: 4px solid #22c55e;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box {
              background-color: white;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .info-row {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #4b5563;
            }
            .value {
              color: #1f2937;
            }
            .steps {
              background-color: white;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .steps h3 {
              color: #22c55e;
              margin-top: 0;
            }
            .step {
              padding: 10px 0;
              margin: 10px 0;
            }
            .step-number {
              display: inline-block;
              background-color: #22c55e;
              color: white;
              width: 25px;
              height: 25px;
              border-radius: 50%;
              text-align: center;
              line-height: 25px;
              margin-right: 10px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
            }
            .reference {
              background-color: #fef3c7;
              padding: 10px;
              border-radius: 4px;
              font-family: monospace;
              text-align: center;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Votre demande d'envoi recommandé est confirmée</h1>
            </div>

            <div class="content">
              <div class="success-box">
                <p style="margin: 0;"><strong>✓ Paiement confirmé</strong></p>
                <p style="margin: 5px 0 0 0;">Votre lettre de révision de loyer va être envoyée en ${sendModeLabel}.</p>
              </div>

              <div class="reference">
                <strong>Référence de votre demande :</strong><br>
                ${data.requestId.substring(0, 8).toUpperCase()}
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #22c55e;">📋 Récapitulatif</h3>
                <div class="info-row">
                  <span class="label">Expéditeur :</span>
                  <span class="value">${data.baillorName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Destinataire :</span>
                  <span class="value">${data.locataireName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Adresse :</span>
                  <span class="value">${data.locataireAddress}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ancien loyer :</span>
                  <span class="value">${data.ancienLoyer.toFixed(2)} €</span>
                </div>
                <div class="info-row">
                  <span class="label">Nouveau loyer :</span>
                  <span class="value">${data.nouveauLoyer.toFixed(2)} €</span>
                </div>
                <div class="info-row">
                  <span class="label">Mode d'envoi :</span>
                  <span class="value">${sendModeLabel === 'recommandé électronique' ? '📧 Recommandé électronique' : '📮 Recommandé postal'}</span>
                </div>
              </div>

              <div class="steps">
                <h3>📍 Suivi de votre envoi</h3>
                <div class="step">
                  <span class="step-number">1</span>
                  <strong>Confirmation reçue</strong> - Votre demande est enregistrée
                </div>
                <div class="step">
                  <span class="step-number">2</span>
                  <strong>Traitement en cours</strong> - Votre lettre est en cours de préparation
                </div>
                <div class="step">
                  <span class="step-number">3</span>
                  <strong>Envoi effectué</strong> - Vous recevrez un email avec le numéro de suivi
                </div>
                <div class="step">
                  <span class="step-number">4</span>
                  <strong>Accusé de réception</strong> - Vous serez notifié de la réception
                </div>
              </div>

              <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0;"><strong>ℹ️ Délai de traitement</strong></p>
                <p style="margin: 5px 0 0 0;">
                  ${data.sendMode === 'electronique'
                    ? 'Votre lettre sera envoyée sous 24-48h ouvrées.'
                    : 'Votre lettre sera envoyée sous 2-3 jours ouvrés.'}
                </p>
              </div>
            </div>

            <div style="background-color: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #22c55e;">
              <h3 style="color: #22c55e; margin-top: 0;">💡 Simplifiez votre gestion locative</h3>
              <p style="margin: 10px 0; color: #1f2937;">
                📄 <strong>Quittance Simple (Gratuit)</strong> : Générez vos quittances manuellement en quelques clics<br>
                👉 <a href="https://quittancesimple.fr/generator" style="color: #22c55e; font-weight: bold; text-decoration: none;">https://quittancesimple.fr/generator</a>
              </p>
              <p style="margin: 10px 0; color: #1f2937;">
                🔄 <strong>Quittance Automatique (0,82€/mois)</strong> : Automatisez l'envoi de vos quittances par email et SMS<br>
                👉 <a href="https://quittancesimple.fr/pricing" style="color: #22c55e; font-weight: bold; text-decoration: none;">https://quittancesimple.fr/pricing</a>
              </p>
            </div>

            <div class="footer">
              <p>Vous recevrez un nouvel email dès que votre lettre aura été envoyée avec le numéro de suivi.</p>
              <p style="margin-top: 20px;">
                <strong>HelloBail</strong><br>
                Gestion locative simplifiée<br>
                <a href="https://hellobail.fr" style="color: #22c55e;">hellobail.fr</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "HelloBail <noreply@hellobail.fr>",
        to: [data.baillorEmail],
        subject: "✅ Votre envoi recommandé est confirmé - HelloBail",
        html: emailHtml,
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("Error sending user confirmation:", responseData);
      throw new Error(`Failed to send user confirmation: ${JSON.stringify(responseData)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User confirmation sent successfully",
        emailId: responseData.id,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in send-registered-mail-user-confirmation:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
