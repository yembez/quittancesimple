import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  SignatureRequestRow,
  corsHeaders,
  generateOtpCode,
  getSupabaseAdmin,
  jsonResponse,
  sendOtpSms,
  sha256Hex,
} from "../_shared/signature-utils.ts";

interface SendOtpPayload {
  token: string;
  signer_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as SendOtpPayload;
    if (!body.token || !body.signer_id) {
      return jsonResponse({ error: "token et signer_id requis" }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("token", body.token)
      .single();

    if (error || !data) return jsonResponse({ error: "Demande introuvable" }, 404);
    const request = data as SignatureRequestRow;

    if (request.status !== "pending") return jsonResponse({ error: "Demande non signable" }, 400);
    if (new Date(request.token_expires_at).getTime() < Date.now()) {
      await supabase.from("signature_requests").update({ status: "expired" }).eq("id", request.id);
      return jsonResponse({ error: "Lien expiré" }, 410);
    }

    const signers = [...request.signers];
    const signerIdx = signers.findIndex((s) => s.id === body.signer_id);
    if (signerIdx < 0) return jsonResponse({ error: "Signataire introuvable" }, 404);

    const signer = signers[signerIdx];
    if (signer.status === "signed") return jsonResponse({ error: "Signataire déjà signé" }, 400);
    if (signer.otp_attempts >= 3) return jsonResponse({ error: "Maximum de tentatives OTP atteint" }, 429);
    if (!signer.phone) return jsonResponse({ error: "Téléphone signataire manquant" }, 400);

    const otp = generateOtpCode();
    const otpHash = await sha256Hex(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    signers[signerIdx] = {
      ...signer,
      otp_hash: otpHash,
      otp_expires_at: otpExpiresAt,
    };

    const { error: updateError } = await supabase
      .from("signature_requests")
      .update({ signers })
      .eq("id", request.id);

    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    await sendOtpSms(
      signer.phone,
      `Votre code de signature Quittance Simple: ${otp}. Valide 10 minutes.`
    );

    return jsonResponse({ success: true, otp_expires_at: otpExpiresAt });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      500
    );
  }
});
