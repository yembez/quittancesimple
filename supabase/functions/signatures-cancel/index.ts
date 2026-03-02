import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  SignatureRequestRow,
  corsHeaders,
  getSupabaseAdmin,
  getSupabaseUserClient,
  jsonResponse,
} from "../_shared/signature-utils.ts";

interface Payload {
  request_id?: string;
  bail_id?: string;
  reason?: string;
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
    if (userError || !user) return jsonResponse({ error: "Utilisateur non authentifié" }, 401);

    const body = (await req.json()) as Payload;
    if (!body.request_id && !body.bail_id) {
      return jsonResponse({ error: "request_id ou bail_id requis" }, 400);
    }

    const supabase = getSupabaseAdmin();
    let query = supabase.from("signature_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(1);
    if (body.request_id) query = query.eq("id", body.request_id);
    if (body.bail_id) query = query.eq("bail_id", body.bail_id);
    const { data, error } = await query.maybeSingle();
    if (error || !data) return jsonResponse({ error: "Demande non trouvée" }, 404);

    const request = data as SignatureRequestRow;
    const ownerUserId = String((request.owner_signature as Record<string, unknown>)?.owner_user_id ?? "");
    if (ownerUserId && ownerUserId !== user.id) {
      return jsonResponse({ error: "Accès refusé" }, 403);
    }

    const currentAudit = Array.isArray(request.audit) ? request.audit : [];
    const nextAudit = [
      ...currentAudit,
      {
        type: "cancelled",
        at: new Date().toISOString(),
        by: user.id,
        reason: body.reason ?? "cancelled_by_owner",
      },
    ];

    const { error: updateError } = await supabase
      .from("signature_requests")
      .update({ status: "expired", audit: nextAudit })
      .eq("id", request.id);
    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    await supabase.from("baux").update({ signature_status: "draft" }).eq("id", request.bail_id);

    return jsonResponse({ success: true, request_id: request.id, bail_id: request.bail_id });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Erreur interne" }, 500);
  }
});
