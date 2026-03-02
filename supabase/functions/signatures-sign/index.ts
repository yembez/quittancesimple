import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  SignatureRequestRow,
  corsHeaders,
  getClientIp,
  getSupabaseAdmin,
  getUserAgent,
  jsonResponse,
  sha256Hex,
} from "../_shared/signature-utils.ts";

interface SignPayload {
  token: string;
  signer_id: string;
  otp: string;
  consent: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as SignPayload;
    if (!body.token || !body.signer_id || !body.otp) {
      return jsonResponse({ error: "token, signer_id et otp requis" }, 400);
    }
    if (!body.consent) {
      return jsonResponse({ error: "Consentement signataire obligatoire" }, 400);
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

    if (signer.status === "signed") {
      return jsonResponse({ error: "Signataire déjà signé" }, 400);
    }
    if (signer.otp_attempts >= 3) {
      return jsonResponse({ error: "Maximum de tentatives OTP atteint" }, 429);
    }
    if (!signer.otp_hash || !signer.otp_expires_at) {
      return jsonResponse({ error: "OTP non généré" }, 400);
    }
    if (new Date(signer.otp_expires_at).getTime() < Date.now()) {
      return jsonResponse({ error: "OTP expiré" }, 410);
    }

    const otpHash = await sha256Hex(body.otp.trim());
    if (otpHash !== signer.otp_hash) {
      signers[signerIdx] = {
        ...signer,
        otp_attempts: signer.otp_attempts + 1,
      };
      await supabase
        .from("signature_requests")
        .update({ signers })
        .eq("id", request.id);
      return jsonResponse({ error: "OTP invalide" }, 400);
    }

    signers[signerIdx] = {
      ...signer,
      status: "signed",
      otp_hash: null,
      otp_expires_at: null,
      signed_at: new Date().toISOString(),
      ip: getClientIp(req),
      user_agent: getUserAgent(req),
    };

    const allSigned = signers.every((s) => s.status === "signed");
    const { error: updateError } = await supabase
      .from("signature_requests")
      .update({ signers })
      .eq("id", request.id);
    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    let finalization: unknown = null;
    if (allSigned) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceRole) {
        const resp = await fetch(`${supabaseUrl}/functions/v1/signatures-generate-final-pdf`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRole}`,
            apikey: serviceRole,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: body.token }),
        });
        finalization = await resp.json();
      }
    }

    return jsonResponse({
      success: true,
      all_signed: allSigned,
      finalization,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      500
    );
  }
});
