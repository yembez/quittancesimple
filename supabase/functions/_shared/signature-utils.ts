import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/** En-tête From pour les e-mails envoyés au bailleur depuis l'Espace Bailleur */
export const ESPACE_BAILLEUR_FROM = "QS - Espace Bailleur <noreply@quittancesimple.fr>";

/** Signature de pied de mail pour les e-mails Espace Bailleur */
export const ESPACE_BAILLEUR_SIGNATURE_HTML = `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
<strong>QS – Espace Bailleur</strong><br/>
Un service édité par Quittance Simple<br/>
<a href="https://quittancesimple.fr">quittancesimple.fr</a>
</div>`;

export type SignerRole = "locataire" | "co-locataire" | "garant";
export type SignerStatus = "pending" | "signed";

export interface SignatureSigner {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: SignerRole;
  status: SignerStatus;
  otp_hash: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  signed_at: string | null;
  ip: string | null;
  user_agent: string | null;
}

export interface SignatureRequestRow {
  id: string;
  bail_id: string;
  document_hash: string;
  document_url: string;
  token: string;
  token_expires_at: string;
  status: "pending" | "signed" | "expired";
  signers: SignatureSigner[];
  owner_signature: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
  audit?: unknown[];
}

export function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY manquants");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

export function getSupabaseUserClient(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!supabaseUrl || !anonKey) {
    throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY manquants");
  }
  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  return forwarded.split(",")[0].trim();
}

export function getUserAgent(req: Request) {
  return req.headers.get("user-agent");
}

export function generateSecureTokenHex(byteLength = 64) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateOtpCode() {
  const min = 100000;
  const max = 999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256HexFromBytes(bytes: Uint8Array) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashDocumentFromUrl(documentUrl: string) {
  try {
    const resp = await fetch(documentUrl);
    if (!resp.ok) {
      return sha256Hex(documentUrl);
    }
    const arr = new Uint8Array(await resp.arrayBuffer());
    return sha256HexFromBytes(arr);
  } catch {
    return sha256Hex(documentUrl);
  }
}

const DEFAULT_PUBLIC_APP_URL = "https://www.quittancesimple.fr";

/**
 * URL publique du site (sans slash final), pour les liens dans les e-mails (signature, etc.).
 * Priorité : SITE_URL → FRONTEND_URL → APP_URL.
 * Les valeurs localhost / 127.0.0.1 sont ignorées (évite les liens dev si APP_URL est mal configuré en prod).
 */
export function getPublicAppBaseUrl(): string {
  const candidates = [
    Deno.env.get("SITE_URL"),
    Deno.env.get("FRONTEND_URL"),
    Deno.env.get("APP_URL"),
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  for (const raw of candidates) {
    const trimmed = raw.trim().replace(/\/$/, "");
    try {
      const url = new URL(trimmed);
      const host = url.hostname.toLowerCase();
      if (host === "localhost" || host === "127.0.0.1") {
        continue;
      }
      return trimmed;
    } catch {
      continue;
    }
  }
  return DEFAULT_PUBLIC_APP_URL;
}

export function sanitizeSigners(signers: SignatureSigner[]) {
  return signers.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role,
    status: s.status,
    otp_expires_at: s.otp_expires_at,
    otp_attempts: s.otp_attempts,
    signed_at: s.signed_at,
    ip: s.ip,
    user_agent: s.user_agent,
  }));
}

export async function sendSignatureEmail({
  to,
  signerName,
  ownerName,
  signatureUrl,
}: {
  to: string;
  signerName: string;
  ownerName: string;
  signatureUrl: string;
}) {
  if (!to) {
    throw new Error("Email destinataire manquant");
  }
  let resendApiKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
  if (!resendApiKey) {
    const supabase = getSupabaseAdmin();
    for (const name of ["resend_api_key", "RESEND_API_KEY"]) {
      const { data: vaultKey, error } = await supabase.rpc("get_secret", {
        secret_name: name,
      });
      if (!error && vaultKey && typeof vaultKey === "string") {
        resendApiKey = (vaultKey as string).trim();
        break;
      }
    }
  }
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY non configurée - impossible d'envoyer l'email de signature");
  }

  const resend = new Resend(resendApiKey);
  const { data, error } = await resend.emails.send({
    from: "Quittance Simple <noreply@quittancesimple.fr>",
    to: [to],
    subject: "Signature électronique de votre bail",
    html: `<!DOCTYPE html>
<html><body style="font-family: Arial,sans-serif; line-height: 1.6; color: #333;">
<p>Bonjour ${signerName || "Locataire"},</p>
<p>${ownerName} vous invite à signer un bail électroniquement.</p>
<p><a href="${signatureUrl}" style="display:inline-block; background:#1e3a5f; color:#fff; padding:12px 24px; text-decoration:none; border-radius:8px;">Signer le bail</a></p>
<p style="font-size:14px; color:#666;">Ou copiez ce lien : ${signatureUrl}</p>
<p style="font-size:13px; color:#999;">Ce lien expire dans 30 jours.</p>
</body></html>`,
  });

  if (error) {
    throw new Error(error.message || "Erreur Resend");
  }
}

export async function sendSignatureOwnerModificationEmail({
  to,
  signerName,
  comment,
  bailUrl,
}: {
  to: string;
  signerName: string;
  comment: string;
  bailUrl: string;
}) {
  if (!to) return;
  const resendApiKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
  if (!resendApiKey) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ESPACE_BAILLEUR_FROM,
      to: [to],
      subject: "Demande de modification du bail",
      html: `<p>Bonjour,</p>
<p><strong>${signerName}</strong> a demandé une modification du bail.</p>
<p><strong>Commentaire :</strong><br/>${comment.replaceAll("<", "&lt;")}</p>
<p><a href="${bailUrl}">Ouvrir le bail</a></p>${ESPACE_BAILLEUR_SIGNATURE_HTML}`,
    }),
  });
}

export async function sendOtpSms(phone: string, message: string) {
  const supabase = getSupabaseAdmin();
  const { data: secretData, error: secretError } = await supabase
    .rpc("get_secret", { secret_name: "smsmode_api_key" });

  if (secretError || !secretData) {
    throw new Error("Clé SMS non disponible");
  }

  const smsmodeApiKey = secretData as string;
  let cleanedPhone = phone.replace(/\s+/g, "");
  if (cleanedPhone.startsWith("+")) cleanedPhone = cleanedPhone.substring(1);

  const params = new URLSearchParams({
    accessToken: smsmodeApiKey,
    message,
    numero: cleanedPhone,
    emetteur: "Quittance",
  });

  const response = await fetch(`https://api.smsmode.com/http/1.6/sendSMS.do?${params.toString()}`, {
    method: "GET",
  });
  const body = (await response.text()).trim();
  const normalized = body.split("|")[0].trim();
  const code = Number(normalized);
  if (Number.isNaN(code) || code !== 0) {
    throw new Error(`Erreur SMSMode (${body})`);
  }
}
