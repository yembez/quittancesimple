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

  const url = new URL(req.url);
  let body: Record<string, string> = {};
  if (req.method === "POST" && req.body) {
    try {
      body = (await req.json()) as Record<string, string>;
    } catch {
      // ignore
    }
  }
  const action = url.searchParams.get("action") ?? body.action ?? null;
  const id = url.searchParams.get("id") ?? body.id ?? null;
  const token = url.searchParams.get("token") ?? body.token ?? null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- action = cancel (GET ou POST avec id) ---
    if (action === "cancel" && id) {
      const { data: row, error: fetchErr } = await supabase
        .from("quittances_systematic")
        .select("id, status, periode, action_token_send_manual, locataires(nom, prenom), proprietaires(email)")
        .eq("id", id)
        .single();

      if (fetchErr || !row || row.status !== "pending_owner_action") {
        const html = `<p>Lien invalide ou action déjà traitée.</p><p><a href="${SITE_URL}/dashboard">Retour au tableau de bord</a></p>`;
        return new Response(html, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        });
      }

      await supabase.from("quittances_systematic").update({ status: "cancelled" }).eq("id", id);

      const loc = row.locataires as Record<string, unknown> | null;
      const prop = row.proprietaires as Record<string, unknown> | null;
      const locataireNom = loc ? [loc.prenom, loc.nom].filter(Boolean).join(" ").trim() || String(loc.nom || "votre locataire") : "votre locataire";
      const periode = String(row.periode);
      const sendManualUrl = row.action_token_send_manual
        ? `${SITE_URL}/send-quittance-manual?token=${encodeURIComponent(row.action_token_send_manual)}`
        : `${SITE_URL}/dashboard`;

      if (resendApiKey && prop?.email) {
        const subject = `Annulation envoi auto – Quittance pour ${locataireNom} – ${periode}`;
        const bodyHtml = `
          <p>L'envoi automatique de la quittance pour <strong>${locataireNom}</strong> – ${periode} a été annulé.</p>
          <p>Quand le locataire aura payé, vous pourrez envoyer la quittance en manuel.</p>
          <p style="margin-top: 20px; text-align: center;">
            <a href="${sendManualUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold;">Envoyer la quittance en manuel</a>
          </p>
        `;
        const html = buildEmailHtml({
          title: "Quittance Simple",
          bodyHtml,
          closingHtml: "À bientôt,<br><strong>L'équipe Quittance Simple</strong>",
          unsubscribeUrl: `${SITE_URL}/unsubscribe?email=${encodeURIComponent(String(prop.email))}`,
        });
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Quittance Simple <noreply@quittancesimple.fr>",
            to: [String(prop.email)],
            subject,
            html,
          }),
        });
      }

      const successHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:20px;"><h1>Envoi automatique annulé</h1><p>L'envoi automatique de la quittance pour <strong>${locataireNom}</strong> – ${periode} a été annulé. Un email de confirmation vous a été envoyé avec un lien pour envoyer la quittance en manuel quand vous le souhaitez.</p><p><a href="${SITE_URL}/dashboard">Retour au tableau de bord</a></p></body></html>`;
      return new Response(successHtml, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // --- action = send_manual (POST avec token) ---
    if (action === "send_manual" && token) {
      const { data: row, error: fetchErr } = await supabase
        .from("quittances_systematic")
        .select(`
          id,
          locataire_id,
          proprietaire_id,
          periode,
          status,
          action_token_send_manual,
          action_token_expires_at,
          locataires ( id, nom, prenom, email, adresse_logement, loyer_mensuel, charges_mensuelles ),
          proprietaires ( id, nom, prenom, email, adresse )
        `)
        .eq("action_token_send_manual", token)
        .single();

      if (fetchErr || !row) {
        return new Response(
          JSON.stringify({ success: false, error: "Lien invalide ou expiré" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (row.status !== "pending_owner_action" && row.status !== "reminder_sent") {
        return new Response(
          JSON.stringify({ success: false, error: "Cette quittance a déjà été traitée" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiresAt = row.action_token_expires_at ? new Date(row.action_token_expires_at) : null;
      if (expiresAt && expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: "Lien expiré" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const loc = row.locataires as Record<string, unknown>;
      const prop = row.proprietaires as Record<string, unknown>;
      const locataireName = [loc.prenom, loc.nom].filter(Boolean).join(" ").trim() || String(loc.nom || "");
      const proprietaireName = [prop.prenom, prop.nom].filter(Boolean).join(" ").trim() || String(prop.nom || "");

      const payload = {
        action: "auto_send",
        locataireId: row.locataire_id,
        locataireEmail: loc.email ?? "",
        locataireName: locataireName || String(loc.nom),
        logementAddress: loc.adresse_logement ?? "",
        baillorEmail: prop.email,
        baillorName: proprietaireName,
        baillorAddress: prop.adresse ?? "",
        nomProprietaire: prop.nom ?? "",
        prenomProprietaire: prop.prenom ?? "",
        periode: row.periode,
        loyer: String(Number(loc.loyer_mensuel) || 0),
        charges: String(Number(loc.charges_mensuelles) || 0),
      };

      const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-quittance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify(payload),
      });

      const sendResult = await sendRes.json();
      if (!sendRes.ok || !sendResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: sendResult.error || "Erreur envoi quittance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("quittances_systematic")
        .update({ status: "sent_manual", action_token_send_manual: null })
        .eq("id", row.id);

      return new Response(
        JSON.stringify({
          success: true,
          locataireName: locataireName || String(loc.nom),
          periode: row.periode,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Paramètres manquants (action et id, ou token)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("quittances-systematic-action error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
