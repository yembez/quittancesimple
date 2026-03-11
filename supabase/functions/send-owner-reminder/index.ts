import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { buildEmailHtml } from "../_shared/email-template.ts";

const SITE_URL = "https://www.quittancesimple.fr";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await req.json()) as {
      proprietaireId?: string;
      proprietaireEmail?: string;
      proprietaireName?: string;
      locataireName?: string;
      locataireId?: string;
      mois?: string;
      annee?: string | number;
      montantTotal?: number;
      shortCode?: string;
    };

    const {
      proprietaireId,
      proprietaireEmail,
      proprietaireName,
      locataireName,
      locataireId,
      mois,
      annee,
      montantTotal,
      shortCode,
    } = body;

    const toEmail = (proprietaireEmail ?? "").trim();
    if (!toEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "proprietaireEmail required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = SITE_URL.replace(/\/$/, "");
    const moisEnc = encodeURIComponent(mois ?? "");
    const anneeStr = annee != null ? String(annee) : new Date().getFullYear().toString();

    // Lien "Loyer reçu" -> ouvre QuickConfirm qui déclenche directement l'envoi de la quittance
    const lienLoyerRecu = `${baseUrl}/quick-confirm?action=send&proprietaireId=${encodeURIComponent(
      proprietaireId ?? ""
    )}&locataireId=${encodeURIComponent(locataireId ?? "")}&mois=${moisEnc}&annee=${encodeURIComponent(
      anneeStr
    )}&source=email`;

    // Lien "Relancer" -> ouvre QuickConfirm en mode relance (envoi direct de la relance)
    const lienRelancer = `${baseUrl}/quick-confirm?action=remind&proprietaireId=${encodeURIComponent(
      proprietaireId ?? ""
    )}&locataireId=${encodeURIComponent(locataireId ?? "")}&mois=${moisEnc}&annee=${encodeURIComponent(
      anneeStr
    )}&source=email`;

    const bodyHtml = `
      <p>Bonjour ${proprietaireName ?? "Propriétaire"},</p>
      <p>Rappel pour <strong>${locataireName ?? "votre locataire"}</strong> – ${mois ?? ""} ${anneeStr} (${montantTotal ?? 0} €).</p>
      <p>Avez-vous bien reçu le loyer ?</p>
      <p style="margin-top: 20px;"><strong>Choisissez une action :</strong></p>
      <p style="margin-top: 12px; text-align: center;">
        <a href="${lienLoyerRecu}" style="display: inline-block; padding: 12px 20px; background-color: #4a732f; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 4px;">Oui – Envoyer la quittance</a>
      </p>
      <p style="text-align: center;">
        <a href="${lienRelancer}" style="display: inline-block; padding: 12px 20px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 4px;">Non – Relancer le locataire</a>
      </p>
    `;

    const html = buildEmailHtml({
      title: "Quittance Simple",
      bodyHtml,
      closingHtml: "À bientôt,<br><strong>L'équipe Quittance Simple</strong>",
      unsubscribeUrl: `${baseUrl}/unsubscribe?email=${encodeURIComponent(toEmail)}`,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Quittance Simple <noreply@quittancesimple.fr>",
        to: [toEmail],
        subject: `Rappel : Loyer ${locataireName ?? "locataire"} – ${mois ?? ""} ${anneeStr}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", res.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: errText || "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-owner-reminder error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
