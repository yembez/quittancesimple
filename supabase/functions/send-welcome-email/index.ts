import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { buildEmailHtml } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WelcomeEmailRequest {
  email: string;
  nom?: string;
  prenom?: string;
}

const SITE_URL = "https://www.quittancesimple.fr";
const DASHBOARD_URL = `${SITE_URL}/dashboard`;

const GUILHEM_PHOTO_CID = "guilhem-photo";
// Image mini (64px) encodée en base64, envoyée en pièce jointe inline (CID)
// pour être affichée directement dans la signature.
const GUILHEM_PHOTO_BASE64 =
  "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";

function buildWelcomeBodyHtml(): string {
  return `
    <h2 style="margin: 0 0 0.95em 0; font-size: 1.45em; font-weight: 750; color: #111111; line-height: 1.25;">Bienvenue dans votre Espace Bailleur.</h2>

    <p style="margin: 0 0 1.15em 0; line-height: 1.75;">C'est un plaisir de vous compter parmi nous.</p>

    <p style="margin: 0 0 1.15em 0; line-height: 1.75;">En créant votre Espace Bailleur, vous faites désormais partie des bailleurs privés qui ont décidé de structurer leur gestion, simplement sans y passer leurs soirées. En 2026, la gestion locative ne devrait plus être une corvée, et vous avez maintenant tous les outils pour l’automatiser simplement.</p>

    <p style="margin: 0 0 1.15em 0; line-height: 1.75;"><strong>Votre Pack Automatique est activé.</strong></p>

    <p style="margin: 0 0 0.9em 0; line-height: 1.75;">Voici ce que vous avez entre les mains gratuitement pendant 30 jours :</p>

    <ul style="margin: 0.2em 0 1.25em 1.2em; padding-left: 1em; line-height: 1.75;">
      <li style="margin-bottom: 0.7em;"><strong>L'esprit libre</strong> : Vos quittances et rappels s'envoient tout seuls. Un clic pour valider, et c'est fini.</li>
      <li style="margin-bottom: 0.7em;"><strong>L'aide au remplissage et la sécurité juridique</strong> : Remplissez et signez vos baux (vides ou meublés) directement en ligne avec votre locataire et vos garants.</li>
      <li style="margin-bottom: 0.7em;"><strong>L'intelligence à votre service</strong> : Un générateur d'annonces par IA et le calcul automatique des révisions IRL (norme INSEE). Rappel de révisions de charges.</li>
      <li style="margin-bottom: 0.1em;"><strong>Tout sous contrôle</strong> : Votre bilan annuel est prêt pour votre déclaration fiscale en quelques clics. Un espace de stockage sécurisé pour stocker et retrouver tous vos documents.</li>
    </ul>

    <p style="margin: 0 0 1.15em 0; line-height: 1.75;">Prenez le temps de faire le tour du propriétaire. Vous verrez, l'interface est pensée pour être intuitive.</p>

    <p style="margin: 0 0 1.15em 0; line-height: 1.75;">Nous sommes aussi bailleurs et on voulait du simple et de l’efficace, c’est pour cela qu’on a créé Quittance Simple et le Pack Automatique.</p>

    <p style="margin: 0; line-height: 1.75;">Et on est ravis de vous aider à simplifier votre quotidien !</p>
  `;
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

    if (!email?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📧 Envoi email de bienvenue à:", email);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY n'est pas définie");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configuration email manquante",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const bodyHtml = buildWelcomeBodyHtml();
    // Pré-remplissage de l'e-mail dans la modale de connexion si l'utilisateur n'est pas connecté
    // On utilise le hash pour éviter de mettre l'email en query string (moins exposé côté logs).
    const ctaUrl = `${DASHBOARD_URL}#loginEmail=${encodeURIComponent(email.trim())}`;
    const html = buildEmailHtml({
      title: "QS- Espace Bailleur",
      bodyHtml,
      ctaText: "Explorer mon Espace Bailleur",
      ctaUrl,
      closingHtml: `
        <span style="display: inline-block; vertical-align: middle; margin-right: 10px;">
          <img
            src="cid:${GUILHEM_PHOTO_CID}"
            width="34"
            height="34"
            alt="Guilhem"
            style="display: inline-block; width: 34px; height: 34px; border-radius: 9999px; object-fit: cover; vertical-align: middle;"
          />
        </span>
        <span style="display: inline-block; vertical-align: middle;">
          À très vite dans votre Espace Bailleur,<br><strong>Guilhem de Quittance Simple</strong>
        </span>
      `.trim(),
      footerReason: "Vous recevez cet e-mail car vous avez créé un compte Espace Bailleur sur Quittance Simple. Des questions ? Des suggestions ? Nous serions ravis d'avoir vos retours :",
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "QS - Espace Bailleur <noreply@quittancesimple.fr>",
        to: [email.trim()],
        subject: "Bienvenue sur votre Espace Bailleur — Quittance Simple",
        html,
        attachments: [
          {
            filename: "guilhem.jpg",
            content: GUILHEM_PHOTO_BASE64,
            content_type: "image/jpeg",
            content_id: GUILHEM_PHOTO_CID,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Erreur Resend:", errorData);
      return new Response(
        JSON.stringify({ success: false, error: `Erreur Resend: ${errorData}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("✅ Email de bienvenue envoyé à:", email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de bienvenue envoyé avec succès",
        data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erreur envoi email de bienvenue:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
