import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  SignatureRequestRow,
  corsHeaders,
  ESPACE_BAILLEUR_FROM,
  ESPACE_BAILLEUR_SIGNATURE_HTML,
  getSupabaseAdmin,
  jsonResponse,
} from "../_shared/signature-utils.ts";
import { Resend } from "npm:resend@4.0.0";

interface Payload {
  token: string;
  signer_id: string;
  comment: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as Payload;
    if (!body.token || !body.signer_id || !body.comment?.trim()) {
      return jsonResponse({ error: "token, signer_id et comment requis" }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("token", body.token)
      .single();

    if (error || !data) return jsonResponse({ error: "Demande introuvable" }, 404);
    const request = data as SignatureRequestRow;
    if (request.status !== "pending" && request.status !== "correction_requested") {
      return jsonResponse({ error: "Demande non modifiable" }, 400);
    }

    const signer = request.signers.find((s) => s.id === body.signer_id);
    if (!signer) return jsonResponse({ error: "Signataire introuvable" }, 404);

    const currentAudit = Array.isArray(request.audit) ? request.audit : [];
    const nextAudit = [
      ...currentAudit,
      {
        type: "modification_requested",
        created_at: new Date().toISOString(),
        signer_id: signer.id,
        signer_name: signer.name,
        comment: body.comment.trim(),
      },
    ];

    const { error: updateError } = await supabase
      .from("signature_requests")
      .update({ audit: nextAudit, status: "correction_requested" })
      .eq("id", request.id);
    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    await supabase
      .from("baux")
      .update({ signature_status: "correction_requested" })
      .eq("id", request.bail_id);

    const ownerSig = request.owner_signature as Record<string, unknown> | undefined;
    const ownerUserId = ownerSig?.owner_user_id as string | undefined;
    const ownerEmailFromPayload = ownerSig?.owner_email ? String(ownerSig.owner_email).trim() : "";
    let ownerEmail = "";
    let ownerName = "Bailleur";

    // 1) Récupérer l'email depuis la table proprietaires (priorité user_id, puis email)
    if (ownerUserId) {
      const { data: propByUser, error: errUser } = await supabase
        .from("proprietaires")
        .select("email, prenom, nom")
        .eq("user_id", ownerUserId)
        .limit(1)
        .maybeSingle();
      if (errUser) {
        console.warn("[signatures-request-modification] lookup proprietaires by user_id:", errUser.message);
      }
      if (propByUser) {
        ownerEmail = String(propByUser.email ?? "").trim();
        ownerName = [propByUser.prenom, propByUser.nom].filter(Boolean).join(" ") || "Bailleur";
      }
    }
    if (!ownerEmail && ownerEmailFromPayload) {
      const { data: propByEmail } = await supabase
        .from("proprietaires")
        .select("email, prenom, nom")
        .eq("email", ownerEmailFromPayload)
        .limit(1)
        .maybeSingle();
      if (propByEmail) {
        ownerEmail = String(propByEmail.email ?? "").trim();
        ownerName = [propByEmail.prenom, propByEmail.nom].filter(Boolean).join(" ") || "Bailleur";
      }
    }
    if (!ownerEmail && ownerEmailFromPayload) {
      ownerEmail = ownerEmailFromPayload;
      ownerName = String(ownerSig?.owner_name ?? ownerName);
    }

    console.log("[signatures-request-modification] owner_email pour notification:", ownerEmail || "(vide)", "owner_user_id:", ownerUserId ?? "(vide)");

    if (ownerEmail) {
      let resendApiKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
      if (!resendApiKey) {
        const { data: vaultKey } = await supabase.rpc("get_secret", {
          secret_name: "RESEND_API_KEY",
        });
        if (vaultKey && typeof vaultKey === "string") resendApiKey = (vaultKey as string).trim();
      }
      if (resendApiKey) {
        const appUrl = (Deno.env.get("APP_URL") ?? "https://quittancesimple.fr").replace(/\/$/, "");
        const signatureUrl = `${appUrl}/dashboard/baux/${request.bail_id}/signature`;
        const resend = new Resend(resendApiKey);
        const { data: sendData, error: mailError } = await resend.emails.send({
          from: ESPACE_BAILLEUR_FROM,
          to: [ownerEmail],
          subject: "Demande de modification sur un bail en signature",
          html: `<!DOCTYPE html><html><body style="font-family: Arial,sans-serif; line-height: 1.6; color: #333;">
<p>Bonjour ${ownerName},</p>
<p>Le signataire <strong>${signer.name}</strong> a demandé une modification du bail.</p>
<p><strong>Commentaire :</strong><br/>${String(body.comment).replace(/</g, "&lt;")}</p>
<p><a href="${signatureUrl}" style="display:inline-block; background:#1e3a5f; color:#fff; padding:12px 24px; text-decoration:none; border-radius:8px;">Voir le suivi de signature et corriger le bail</a></p>
<p style="font-size:14px; color:#666;">Ou copiez ce lien : ${signatureUrl}</p>
${ESPACE_BAILLEUR_SIGNATURE_HTML}
</body></html>`,
        });
        if (mailError) {
          console.error("[signatures-request-modification] Resend error:", JSON.stringify(mailError));
        } else {
          console.log("[signatures-request-modification] Email envoyé à", ownerEmail, "id:", sendData?.id);
        }
      } else {
        console.warn("[signatures-request-modification] RESEND_API_KEY manquante - email non envoyé au bailleur");
      }
    } else {
      console.warn("[signatures-request-modification] Aucun email bailleur trouvé (proprietaires + owner_signature) - notification non envoyée");
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      500
    );
  }
});
