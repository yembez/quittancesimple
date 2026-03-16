import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
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
/** Photo de signature servie par le site (affichage fiable dans tous les clients mail) */
const VINCENT_SIGNATURE_IMAGE_URL = `${SITE_URL}/images/vincent-signature.png`;

function buildWelcomeBodyHtml(): string {
  return `
    <p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bonjour [Prénom],</p>

    <p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bienvenue dans votre QS – Espace Bailleur.</p>

    <p style="margin: 0 0 1.15em 0; line-height: 1.75;">En créant votre compte, vous faites désormais partie des bailleurs privés qui agissent pour gérer leurs locations plus simplement et surtout éviter les pertes de temps inutiles.</p>

    <p style="margin: 0 0 0.9em 0; line-height: 1.75;">Voici ce que vous pouvez déjà faire :</p>

    <ul style="margin: 0.2em 0 1.25em 1.2em; padding-left: 1em; line-height: 1.75;">
      <li style="margin-bottom: 0.7em;"><strong>Automatiser vos quittances</strong> — un clic de validation et elles s'envoient toutes seules</li>
      <li style="margin-bottom: 0.7em;"><strong>Créer et signer vos baux en ligne</strong> (vide ou meublé) avec votre locataire</li>
      <li style="margin-bottom: 0.7em;"><strong>Générer vos annonces et calculer vos révisions IRL</strong> automatiquement</li>
      <li style="margin-bottom: 0.1em;"><strong>Garder tout sous contrôle</strong> — bilan annuel et stockage sécurisé de vos documents</li>
    </ul>

    <p style="margin: 0 0 1.15em 0; line-height: 1.75;">Prenez quelques minutes pour découvrir l'outil.</p>

    <p style="margin: 0 0 1.15em 0; line-height: 1.75;">Nous sommes bailleurs nous aussi, et nous avons simplement voulu créer un outil clair, pratique et efficace pour nous faciliter la vie.</p>

    <p style="margin: 0; line-height: 1.75;">Bonne découverte,</p>
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

    let bodyHtml = buildWelcomeBodyHtml();
    const prenomValue = (prenom ?? "").trim() || "";
    bodyHtml = bodyHtml
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenomValue)
      .replace(/\[\s*Prénom\s*\]/gi, prenomValue);
    if (!prenomValue) {
      bodyHtml = bodyHtml.replace(/\bBonjour\s+,/gi, "Bonjour,");
    }
    // Pré-remplissage de l'e-mail dans la modale de connexion si l'utilisateur n'est pas connecté
    // On utilise le hash pour éviter de mettre l'email en query string (moins exposé côté logs).
    // Lien vers l'accueil avec hash pour ouvrir le modal de connexion (évite de passer par /dashboard sans session)
    const ctaUrl = `${SITE_URL}/#loginEmail=${encodeURIComponent(email.trim())}`;
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email.trim())}`;
    const html = buildEmailHtml({
      title: "QS- Espace Bailleur",
      bodyHtml,
      ctaText: "Explorer mon Espace Bailleur",
      ctaUrl,
      unsubscribeUrl,
      closingHtml: `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 0; padding-right: 10px; vertical-align: middle;">
              <img
                src="${VINCENT_SIGNATURE_IMAGE_URL}"
                width="40"
                height="40"
                alt="Marc"
                style="display: block; width: 40px; height: 40px; border-radius: 9999px; object-fit: cover; object-position: center top;"
              />
            </td>
            <td style="padding: 0; vertical-align: middle;">
              À très vite dans votre Espace Bailleur,<br><strong>Marc de Quittance Simple</strong>
            </td>
          </tr>
        </table>
      `.trim(),
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Marc – Quittance Simple <contact@quittancesimple.fr>",
        reply_to: "Marc – Quittance Simple <contact@quittancesimple.fr>",
        to: [email.trim()],
        subject: "Bienvenue sur votre Espace Bailleur — Quittance Simple",
        html,
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);
      const emailTrim = email.trim();
      // Mise à jour par id après recherche insensible à la casse (évite 0 rows si casse différente)
      const { data: row } = await supabase
        .from("proprietaires")
        .select("id")
        .ilike("email", emailTrim)
        .limit(1)
        .maybeSingle();
      if (row?.id) {
        await supabase
          .from("proprietaires")
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq("id", row.id);
      }
    }

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
