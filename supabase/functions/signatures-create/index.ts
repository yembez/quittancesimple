import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  SignatureSigner,
  corsHeaders,
  generateSecureTokenHex,
  getClientIp,
  getPublicAppBaseUrl,
  getSupabaseAdmin,
  getSupabaseUserClient,
  getUserAgent,
  hashDocumentFromUrl,
  jsonResponse,
  sendSignatureEmail,
} from "../_shared/signature-utils.ts";

interface CreatePayloadSigner {
  name: string;
  email?: string;
  phone: string;
  role: "locataire" | "co-locataire" | "garant";
}

interface CreatePayload {
  bail_id?: string;
  document_url: string;
  signers: CreatePayloadSigner[];
  owner_consent: boolean;
  owner_name?: string;
  consent_version?: string;
}

function isValidRole(role: string): role is "locataire" | "co-locataire" | "garant" {
  return role === "locataire" || role === "co-locataire" || role === "garant";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUser = getSupabaseUserClient(req);
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Utilisateur non authentifié" }, 401);
    }

    const body = (await req.json()) as CreatePayload;
    const signersInput = Array.isArray(body.signers) ? body.signers : [];

    if (!body.owner_consent) {
      return jsonResponse({ error: "Consentement bailleur obligatoire" }, 400);
    }
    if (!body.document_url || typeof body.document_url !== "string") {
      return jsonResponse({ error: "document_url requis" }, 400);
    }
    if (signersInput.length < 1 || signersInput.length > 3) {
      return jsonResponse({ error: "Le nombre de signataires doit être entre 1 et 3" }, 400);
    }

    const normalizedSigners: SignatureSigner[] = signersInput.map((s) => {
      if (!s.name?.trim()) throw new Error("Nom signataire requis");
      if (!s.email?.trim()) throw new Error("E-mail signataire requis");
      if (!s.phone?.trim()) throw new Error("Téléphone signataire requis");
      if (!isValidRole(s.role)) throw new Error("Rôle signataire invalide");
      return {
        id: crypto.randomUUID(),
        name: s.name.trim(),
        email: (s.email ?? "").trim(),
        phone: s.phone.trim(),
        role: s.role,
        status: "pending",
        otp_hash: null,
        otp_expires_at: null,
        otp_attempts: 0,
        signed_at: null,
        ip: null,
        user_agent: null,
      };
    });

    const documentHash = await hashDocumentFromUrl(body.document_url);
    const token = generateSecureTokenHex(64);
    const now = new Date();
    const tokenExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);
    const bailId = body.bail_id && body.bail_id.trim() ? body.bail_id.trim() : crypto.randomUUID();

    const ownerSignature = {
      role: "proprietaire",
      signature_type: "confirmed_on_send",
      signed_at: now.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      document_hash: documentHash,
      consent_version: body.consent_version || "v1_2026",
      owner_user_id: user.id,
      owner_email: user.email || "",
      owner_name: body.owner_name || user.user_metadata?.full_name || "",
    };

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existingPending } = await supabaseAdmin
      .from("signature_requests")
      .select("id")
      .eq("bail_id", bailId)
      .eq("status", "pending")
      .limit(1);
    if (existingPending && existingPending.length > 0) {
      return jsonResponse({ error: "Une demande de signature est déjà en cours pour ce bail" }, 409);
    }

    const appUrl = getPublicAppBaseUrl();
    for (let i = 0; i < normalizedSigners.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 600));
      const signer = normalizedSigners[i];
      const signUrl = `${appUrl}/sign/${token}?signerId=${signer.id}`;
      await sendSignatureEmail({
        to: signer.email,
        signerName: signer.name,
        ownerName: String(ownerSignature.owner_name ?? "Le bailleur"),
        signatureUrl: signUrl,
      });
    }
    const { data: requestRow, error: insertError } = await supabaseAdmin
      .from("signature_requests")
      .insert({
        bail_id: bailId,
        document_hash: documentHash,
        document_url: body.document_url,
        token,
        token_expires_at: tokenExpiresAt,
        status: "pending",
        signers: normalizedSigners,
        owner_signature: ownerSignature,
        audit: [
          { at: new Date().toISOString(), event: "created" },
        ],
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("[signatures-create] insert signature_requests:", insertError);
      return jsonResponse(
        { error: `Erreur base de données: ${insertError.message}`, code: insertError.code },
        500
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("baux")
      .update({ signature_status: "pending" })
      .eq("id", bailId);
    if (updateError) {
      console.warn("[signatures-create] baux update (non-blocking):", updateError.message);
    }

    return jsonResponse({
      success: true,
      request: requestRow,
      token,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur interne";
    console.error("[signatures-create] catch:", error);
    return jsonResponse({ error: msg }, 500);
  }
});
