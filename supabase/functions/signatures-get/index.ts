import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  SignatureRequestRow,
  corsHeaders,
  getSupabaseAdmin,
  jsonResponse,
  sanitizeSigners,
} from "../_shared/signature-utils.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return jsonResponse({ error: "token requis" }, 400);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !data) return jsonResponse({ error: "Demande introuvable" }, 404);

    const request = data as SignatureRequestRow;
    if (new Date(request.token_expires_at).getTime() < Date.now() && request.status !== "signed") {
      await supabase
        .from("signature_requests")
        .update({ status: "expired" })
        .eq("id", request.id);
      return jsonResponse({ error: "Lien expiré", status: "expired" }, 410);
    }

    return jsonResponse({
      id: request.id,
      bail_id: request.bail_id,
      document_url: request.document_url,
      document_hash: request.document_hash,
      status: request.status,
      signers: sanitizeSigners(request.signers),
      owner_signature: request.owner_signature,
      audit: Array.isArray(request.audit) ? request.audit : [],
      created_at: request.created_at,
      completed_at: request.completed_at,
      token_expires_at: request.token_expires_at,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      500
    );
  }
});
