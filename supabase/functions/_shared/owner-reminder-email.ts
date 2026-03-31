import { buildEmailHtml } from "./email-template.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SITE_URL = "https://www.quittancesimple.fr";

/** Comme signature-utils / autres fonctions : env puis Vault (get_secret). */
async function resolveResendApiKey(): Promise<string | null> {
  const fromEnv = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
  if (fromEnv) return fromEnv;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("owner-reminder-email: pas de SUPABASE_URL/SERVICE_ROLE pour lire le Vault");
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  for (const name of ["RESEND_API_KEY", "resend_api_key"]) {
    const { data, error } = await supabase.rpc("get_secret", { secret_name: name });
    if (!error && data && typeof data === "string" && data.trim()) {
      console.log(`owner-reminder-email: clé Resend lue via get_secret(${name})`);
      return data.trim();
    }
  }
  return null;
}

export type OwnerReminderEmailParams = {
  proprietaireId?: string;
  proprietaireEmail: string;
  proprietaireName?: string;
  locataireName?: string;
  locataireId?: string;
  mois?: string;
  annee?: string | number;
  montantTotal?: number;
};

/** Même contenu que send-owner-reminder, mais appelable sans HTTP depuis auto-send-quittances. */
export async function sendOwnerReminderEmail(
  params: OwnerReminderEmailParams
): Promise<{ success: true; messageId: string } | { success: false; error: string }> {
  const toEmail = (params.proprietaireEmail ?? "").trim();
  if (!toEmail) {
    return { success: false, error: "proprietaireEmail required" };
  }

  const resendApiKey = await resolveResendApiKey();
  if (!resendApiKey) {
    console.error("owner-reminder-email: aucune clé Resend (env ni Vault)");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const baseUrl = SITE_URL.replace(/\/$/, "");
  const moisEnc = encodeURIComponent(params.mois ?? "");
  const anneeStr =
    params.annee != null ? String(params.annee) : new Date().getFullYear().toString();

  const lienLoyerRecu = `${baseUrl}/quick-confirm?action=send&proprietaireId=${encodeURIComponent(
    params.proprietaireId ?? ""
  )}&locataireId=${encodeURIComponent(params.locataireId ?? "")}&mois=${moisEnc}&annee=${encodeURIComponent(
    anneeStr
  )}&source=email`;

  const lienRelancer = `${baseUrl}/quick-confirm?action=remind&proprietaireId=${encodeURIComponent(
    params.proprietaireId ?? ""
  )}&locataireId=${encodeURIComponent(params.locataireId ?? "")}&mois=${moisEnc}&annee=${encodeURIComponent(
    anneeStr
  )}&source=email`;

  const bodyHtml = `
      <p>Bonjour ${params.proprietaireName ?? "Propriétaire"},</p>
      <p>Rappel pour <strong>${params.locataireName ?? "votre locataire"}</strong> – ${params.mois ?? ""} ${anneeStr} (${params.montantTotal ?? 0} €).</p>
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
      subject: `Rappel : Loyer ${params.locataireName ?? "locataire"} – ${params.mois ?? ""} ${anneeStr}`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("owner-reminder-email: Resend error:", res.status, errText);
    return { success: false, error: errText || "Failed to send email" };
  }

  const data = (await res.json()) as { id?: string };
  const messageId = data?.id ?? "";
  console.log(`owner-reminder-email: sent ok messageId=${messageId || "?"}`);
  return { success: true, messageId };
}
