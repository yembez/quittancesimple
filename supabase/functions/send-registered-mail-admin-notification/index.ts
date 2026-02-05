import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestData {
  requestId: string;
  baillorName: string;
  baillorAddress: string;
  baillorEmail: string;
  locataireName: string;
  locataireAddress: string;
  logementAddress: string;
  ancienLoyer: number;
  nouveauLoyer: number;
  irlAncien: number;
  irlNouveau: number;
  trimestre: number;
  anneeAncienne: number;
  anneeNouvelle: number;
  dateBail?: string;
  sendMode: string;
  pdfUrl: string;
  paymentIntent: string;
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
    const ADMIN_EMAIL = "2speek@gmail.com";

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const data: RequestData = await req.json();

    const sendModeLabel = data.sendMode === "electronique"
      ? "Recommandé électronique (6.90€)"
      : "Recommandé postal (12.90€)";

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
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #22c55e;
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 20px;
              border: 1px solid #e5e7eb;
            }
            .section {
              background-color: white;
              padding: 15px;
              margin: 15px 0;
              border-radius: 8px;
              border-left: 4px solid #22c55e;
            }
            .section h3 {
              margin-top: 0;
              color: #22c55e;
            }
            .info-row {
              margin: 8px 0;
            }
            .label {
              font-weight: bold;
              color: #4b5563;
            }
            .value {
              color: #1f2937;
            }
            .highlight {
              background-color: #fef3c7;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              border-left: 4px solid #f59e0b;
            }
            .button {
              display: inline-block;
              background-color: #22c55e;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nouvelle demande d'envoi recommandé</h1>
              <p>Une demande d'envoi recommandé a été payée et doit être traitée</p>
            </div>

            <div class="content">
              <div class="highlight">
                <p><strong>⚠️ Action requise :</strong> Préparer et envoyer le courrier recommandé</p>
                <p><strong>ID de la demande :</strong> ${data.requestId}</p>
                <p><strong>Mode d'envoi :</strong> ${sendModeLabel}</p>
                <p><strong>Paiement Stripe :</strong> ${data.paymentIntent}</p>
              </div>

              <div class="section">
                <h3>📤 Expéditeur (Bailleur)</h3>
                <div class="info-row">
                  <span class="label">Nom :</span>
                  <span class="value">${data.baillorName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Adresse :</span>
                  <span class="value">${data.baillorAddress}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email :</span>
                  <span class="value">${data.baillorEmail}</span>
                </div>
              </div>

              <div class="section">
                <h3>📥 Destinataire (Locataire)</h3>
                <div class="info-row">
                  <span class="label">Nom :</span>
                  <span class="value">${data.locataireName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Adresse :</span>
                  <span class="value">${data.locataireAddress}</span>
                </div>
              </div>

              <div class="section">
                <h3>🏠 Informations du logement</h3>
                <div class="info-row">
                  <span class="label">Adresse du logement :</span>
                  <span class="value">${data.logementAddress}</span>
                </div>
                ${data.dateBail ? `
                <div class="info-row">
                  <span class="label">Date du bail :</span>
                  <span class="value">${data.dateBail}</span>
                </div>
                ` : ''}
              </div>

              <div class="section">
                <h3>💰 Révision du loyer</h3>
                <div class="info-row">
                  <span class="label">Ancien loyer :</span>
                  <span class="value">${data.ancienLoyer.toFixed(2)} €</span>
                </div>
                <div class="info-row">
                  <span class="label">Nouveau loyer :</span>
                  <span class="value">${data.nouveauLoyer.toFixed(2)} €</span>
                </div>
                <div class="info-row">
                  <span class="label">IRL ancien (T${data.trimestre} ${data.anneeAncienne}) :</span>
                  <span class="value">${data.irlAncien.toFixed(2)}</span>
                </div>
                <div class="info-row">
                  <span class="label">IRL nouveau (T${data.trimestre} ${data.anneeNouvelle}) :</span>
                  <span class="value">${data.irlNouveau.toFixed(2)}</span>
                </div>
              </div>

              <div class="section">
                <h3>📄 Document à envoyer</h3>
                <p>Le PDF de la lettre de révision est disponible ci-joint.</p>
                <a href="${data.pdfUrl}" class="button">📥 Télécharger le PDF</a>
              </div>

              <div class="section">
                <h3>✅ Prochaines étapes</h3>
                <ol>
                  <li>Télécharger le PDF ci-joint</li>
                  <li>Envoyer le courrier en ${data.sendMode === 'electronique' ? 'recommandé électronique' : 'recommandé postal'}</li>
                  <li>Noter le numéro de suivi</li>
                  <li>Mettre à jour le statut dans la base de données</li>
                  <li>L'utilisateur sera notifié automatiquement</li>
                </ol>
              </div>
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
        to: [ADMIN_EMAIL],
        subject: `🔔 Nouvelle demande d'envoi recommandé - ${data.sendMode}`,
        html: emailHtml,
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("Error sending admin notification:", responseData);
      throw new Error(`Failed to send admin notification: ${JSON.stringify(responseData)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin notification sent successfully",
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
    console.error("Error in send-registered-mail-admin-notification:", error);
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
