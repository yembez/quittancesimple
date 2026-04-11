import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
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
    const { scheduledId } = (await req.json()) as { scheduledId?: string };
    if (!scheduledId) {
      return new Response(
        JSON.stringify({ success: false, error: "scheduledId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("send-systematic-preavis: RESEND_API_KEY not set in Edge Function secrets");
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: row, error: fetchError } = await supabase
      .from("quittances_systematic")
      .select(`
        id,
        locataire_id,
        proprietaire_id,
        periode,
        action_token_send_manual,
        locataires ( id, nom, prenom, email, adresse_logement, loyer_mensuel, charges_mensuelles ),
        proprietaires ( id, nom, prenom, email, adresse, telephone )
      `)
      .eq("id", scheduledId)
      .single();

    if (fetchError || !row) {
      console.error("send-systematic-preavis fetch error:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Scheduled row not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const loc = row.locataires as Record<string, unknown> | null;
    const prop = row.proprietaires as Record<string, unknown> | null;
    if (!loc || !prop) {
      return new Response(
        JSON.stringify({ success: false, error: "Locataire or proprietaire missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const locataireNom = [loc.prenom, loc.nom].filter(Boolean).join(" ").trim() || String(loc.nom || "votre locataire");
    const periode = String(row.periode);

    const propEmail = String(prop.email || "").trim();
    const cancelUrl = `${SITE_URL}/send-quittance-manual?action=cancel&id=${encodeURIComponent(scheduledId)}`;
    const relanceUrl = `${SITE_URL}/dashboard?openRelance=${encodeURIComponent(row.locataire_id)}${propEmail ? `&loginHint=${encodeURIComponent(propEmail)}` : ""}`;
    const token = row.action_token_send_manual;
    const sendManualUrl = token
      ? `${SITE_URL}/send-quittance-manual?token=${encodeURIComponent(token)}`
      : `${SITE_URL}/dashboard`;

    const ctaBaseStyle =
      "display: inline-block; padding: 8px 16px; border-radius: 8px; border: 1px solid #1e3a5f; color: #1e3a5f !important; background-color: #ffffff; text-decoration: none; font-weight: bold; margin: 4px; min-width: 240px; text-align: center;";

    const bodyHtml = `
      <p>Votre quittance pour la période <strong>${periode}</strong> est prête pour le locataire <strong>${locataireNom}</strong>.</p>
      <p>Elle sera envoyée automatiquement à votre locataire dans 5 jours si vous ne faites rien.</p>
      <p style="margin-top: 20px;">Vous pouvez :</p>
      <p style="margin-top: 12px; text-align: center;">
        <a href="${cancelUrl}" style="${ctaBaseStyle}">Annuler l'envoi</a>
      </p>
      <p style="text-align: center;">
        <a href="${relanceUrl}" style="${ctaBaseStyle}">Relancer le locataire</a>
      </p>
      <p style="text-align: center;">
        <a href="${sendManualUrl}" style="${ctaBaseStyle}">Envoyer la quittance maintenant</a>
      </p>
    `;

    const subject = `Quittance prête pour ${locataireNom} – ${periode}`;
    const html = buildEmailHtml({
      title: "Quittance Simple",
      bodyHtml,
      unsubscribeUrl: `${SITE_URL}/unsubscribe?email=${encodeURIComponent(String(prop.email || ""))}`,
    });

    const toEmail = String(prop.email || "").trim();
    if (!toEmail) {
      console.error("send-systematic-preavis: proprietaire email missing for proprietaire_id", row.proprietaire_id);
      return new Response(
        JSON.stringify({ success: false, error: "Proprietaire email missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("send-systematic-preavis: sending to", toEmail, "scheduledId", scheduledId);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Quittance Simple <noreply@quittancesimple.fr>",
        to: [toEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("send-systematic-preavis Resend error:", res.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: `Resend: ${res.status}`, details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("send-systematic-preavis: email sent successfully to", toEmail);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-systematic-preavis error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
