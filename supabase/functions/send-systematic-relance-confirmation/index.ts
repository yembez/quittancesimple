import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildEmailHtml } from "../_shared/email-template.ts";

const SITE_URL = "https://www.quittancesimple.fr";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getMonthName(month: number): string {
  const months = [
    "janvier", "fevrier", "mars", "avril", "mai", "juin",
    "juillet", "aout", "septembre", "octobre", "novembre", "decembre"
  ];
  return months[month];
}

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
    const { locataireId } = (await req.json()) as { locataireId?: string };
    if (!locataireId) {
      return new Response(
        JSON.stringify({ success: false, error: "locataireId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const parisTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const monthName = getMonthName(parisTime.getMonth());
    const periode = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${parisTime.getFullYear()}`;

    const { data: row, error: fetchErr } = await supabase
      .from("quittances_systematic")
      .select(`
        id,
        periode,
        action_token_send_manual,
        locataires ( id, nom, prenom ),
        proprietaires ( id, nom, prenom, email )
      `)
      .eq("locataire_id", locataireId)
      .eq("periode", periode)
      .eq("status", "pending_owner_action")
      .maybeSingle();

    if (fetchErr || !row) {
      return new Response(
        JSON.stringify({ success: true, updated: false, reason: "no_matching_row" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("quittances_systematic")
      .update({ status: "reminder_sent" })
      .eq("id", row.id);

    const loc = row.locataires as Record<string, unknown> | null;
    const prop = row.proprietaires as Record<string, unknown> | null;
    const locataireNom = loc ? [loc.prenom, loc.nom].filter(Boolean).join(" ").trim() || String(loc.nom || "") : "votre locataire";
    const sendManualUrl = row.action_token_send_manual
      ? `${SITE_URL}/send-quittance-manual?token=${encodeURIComponent(row.action_token_send_manual)}`
      : `${SITE_URL}/dashboard`;

    if (resendApiKey && prop?.email) {
      const subject = `Relance envoyée pour ${locataireNom} – ${row.periode}`;
      const bodyHtml = `
        <p>La relance a bien été envoyée à <strong>${locataireNom}</strong> pour la période <strong>${row.periode}</strong>.</p>
        <p>L'envoi automatique de la quittance à J+5 est annulé pour ce mois. Quand le locataire aura payé, vous pourrez envoyer la quittance en manuel.</p>
        <p style="margin-top: 20px; text-align: center;">
          <a href="${sendManualUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold;">Envoyer la quittance en manuel</a>
        </p>
      `;
      const html = buildEmailHtml({
        title: "Quittance Simple",
        bodyHtml,
        unsubscribeUrl: `${SITE_URL}/unsubscribe?email=${encodeURIComponent(String(prop.email))}`,
      });
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Quittance Simple <noreply@quittancesimple.fr>",
          to: [String(prop.email)],
          subject,
          html,
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, updated: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-systematic-relance-confirmation error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
