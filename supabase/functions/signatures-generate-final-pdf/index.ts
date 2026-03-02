import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { Resend } from "npm:resend@4.0.0";
import {
  SignatureRequestRow,
  corsHeaders,
  ESPACE_BAILLEUR_FROM,
  ESPACE_BAILLEUR_SIGNATURE_HTML,
  getSupabaseAdmin,
  jsonResponse,
  sha256HexFromBytes,
} from "../_shared/signature-utils.ts";

interface FinalizePayload {
  token?: string;
  request_id?: string;
}

/** Extrait le nom de famille (dernier mot) d’un nom complet. */
function familyName(fullName: string): string {
  const s = String(fullName ?? "").trim();
  if (!s) return "Bail";
  const parts = s.split(/\s+/);
  return parts[parts.length - 1] || s;
}

/** Construit un slug pour le nom de fichier : NomBailleur-NomLocataire1-NomLocataire2. */
function bailFileNameSlug(ownerName: string, signerNames: string[]): string {
  const owner = familyName(ownerName);
  const locataires = signerNames.map(familyName).filter(Boolean);
  const parts = [owner, ...locataires];
  const slug = parts
    .join("-")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return slug || "bail-signe";
}

/** Découpe le texte en lignes qui tiennent dans la largeur de page (≈ 85 caractères). */
function wrapLine(text: string, maxChars = 85): string[] {
  const s = String(text).trim();
  if (!s) return [];
  if (s.length <= maxChars) return [s];
  const lines: string[] = [];
  let rest = s;
  while (rest.length > 0) {
    if (rest.length <= maxChars) {
      lines.push(rest);
      break;
    }
    let chunk = rest.slice(0, maxChars + 1);
    const lastSpace = chunk.lastIndexOf(" ");
    if (lastSpace > maxChars * 0.5) {
      chunk = rest.slice(0, lastSpace);
      rest = rest.slice(lastSpace + 1);
    } else {
      chunk = rest.slice(0, maxChars);
      rest = rest.slice(maxChars);
    }
    lines.push(chunk);
  }
  return lines;
}

async function loadSourcePdf(documentUrl: string) {
  try {
    const resp = await fetch(documentUrl);
    if (!resp.ok) return null;
    const bytes = new Uint8Array(await resp.arrayBuffer());
    return bytes;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as FinalizePayload;
    if (!body.token && !body.request_id) {
      return jsonResponse({ error: "token ou request_id requis" }, 400);
    }

    const supabase = getSupabaseAdmin();
    let query = supabase.from("signature_requests").select("*");
    if (body.token) query = query.eq("token", body.token);
    if (body.request_id) query = query.eq("id", body.request_id);

    const { data, error } = await query.single();
    if (error || !data) return jsonResponse({ error: "Demande introuvable" }, 404);
    const request = data as SignatureRequestRow;

    if (request.status === "signed" && request.completed_at) {
      return jsonResponse({
        success: true,
        status: "already_signed",
        request_id: request.id,
        document_url: request.document_url,
      });
    }

    const sourcePdfBytes = await loadSourcePdf(request.document_url);
    if (!sourcePdfBytes) {
      return jsonResponse({ error: "Impossible de récupérer le document source" }, 400);
    }

    const currentHash = await sha256HexFromBytes(sourcePdfBytes);
    if (currentHash !== request.document_hash) {
      return jsonResponse({ error: "Hash document invalide, finalisation refusée" }, 409);
    }

    const allSigned = request.signers.every((s) => s.status === "signed");
    if (!allSigned) return jsonResponse({ error: "Tous les signataires n'ont pas signé" }, 400);

    const pdfDoc = await PDFDocument.load(sourcePdfBytes);
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    page.drawText("ATTESTATION DE SIGNATURE ELECTRONIQUE", {
      x: 40,
      y,
      size: 16,
      font: titleFont,
      color: rgb(0.1, 0.2, 0.35),
    });
    y -= 32;

    const owner = request.owner_signature || {};
    const ownerLine = `Bailleur: ${String(owner.owner_name ?? "")} - signe le ${String(owner.signed_at ?? "")}`;
    const ownerLines = wrapLine(ownerLine, 90);
    for (const line of ownerLines) {
      page.drawText(line, { x: 40, y, size: 11, font });
      y -= 14;
    }
    y -= 4;
    const ownerDetail = `IP: ${String(owner.ip_address ?? "")} | User-Agent: ${String(owner.user_agent ?? "")}`;
    for (const line of wrapLine(ownerDetail, 85)) {
      page.drawText(line, { x: 40, y, size: 9, font, color: rgb(0.25, 0.25, 0.25) });
      y -= 12;
    }
    y -= 10;

    page.drawText("Signataires:", {
      x: 40,
      y,
      size: 12,
      font: titleFont,
      color: rgb(0.1, 0.2, 0.35),
    });
    y -= 18;

    for (const signer of request.signers) {
      const line1 = `- ${signer.name} (${signer.role}) - ${signer.status === "signed" ? "SIGNE" : "NON SIGNE"} - ${signer.signed_at ?? ""}`;
      for (const line of wrapLine(line1, 88)) {
        page.drawText(line, { x: 50, y, size: 10, font });
        y -= 12;
      }
      const line2 = `  IP: ${signer.ip ?? ""} | UA: ${signer.user_agent ?? ""}`;
      for (const line of wrapLine(line2, 85)) {
        page.drawText(line, { x: 50, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
        y -= 10;
      }
      y -= 6;
      if (y < 60) break;
    }

    y -= 8;
    const hashLine = `Hash document (SHA-256): ${request.document_hash}`;
    for (const line of wrapLine(hashLine, 85)) {
      page.drawText(line, { x: 40, y, size: 8, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 10;
    }
    y -= 4;
    page.drawText(`Date de finalisation: ${new Date().toISOString()}`, {
      x: 40,
      y,
      size: 8,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    const finalBytes = await pdfDoc.save();
    const path = `signatures/${request.bail_id}/${request.id}-signed.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("private-documents")
      .upload(path, finalBytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) return jsonResponse({ error: uploadError.message }, 500);

    const { data: signedUrlData } = await supabase.storage
      .from("private-documents")
      .createSignedUrl(path, 7 * 24 * 60 * 60);
    const finalDocumentUrl = signedUrlData?.signedUrl ?? request.document_url;

    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("signature_requests")
      .update({
        status: "signed",
        completed_at: completedAt,
        document_url: finalDocumentUrl,
        token_expires_at: completedAt,
      })
      .eq("id", request.id);
    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    await supabase
      .from("baux")
      .update({
        signature_status: "signed",
        signed_document_url: finalDocumentUrl,
      })
      .eq("id", request.bail_id);

    const ownerSig = request.owner_signature as Record<string, unknown> | undefined;
    const ownerUserId = ownerSig?.owner_user_id as string | undefined;
    const ownerName = String(ownerSig?.owner_name ?? "Bailleur");
    const signerNames = (request.signers ?? []).map((s) => String(s.name ?? "").trim()).filter(Boolean);
    const fileNameSlug = bailFileNameSlug(ownerName, signerNames);

    // Copie dans Mes documents du bailleur (dossier baux-etat-des-lieux), nom : Nom famille bailleur - locataires
    if (ownerUserId) {
      const fileName = `bail-signe-${fileNameSlug}.pdf`;
      const docPath = `${ownerUserId}/baux-etat-des-lieux/${fileName}`;
      const { error: copyErr } = await supabase.storage
        .from("private-documents")
        .upload(docPath, finalBytes, { contentType: "application/pdf", upsert: true });
      if (copyErr) console.warn("[signatures-generate-final-pdf] copy to Mes documents:", copyErr.message);
    }

    // Envoyer une copie du bail signé au bailleur et à chaque signataire
    let resendApiKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
    if (!resendApiKey) {
      const { data: vaultKey } = await supabase.rpc("get_secret", { secret_name: "RESEND_API_KEY" });
      if (vaultKey && typeof vaultKey === "string") resendApiKey = (vaultKey as string).trim();
    }
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      let ownerEmail = "";
      if (ownerUserId) {
        const { data: prop } = await supabase
          .from("proprietaires")
          .select("email")
          .eq("user_id", ownerUserId)
          .limit(1)
          .maybeSingle();
        if (prop?.email) ownerEmail = String(prop.email).trim();
      }
      if (!ownerEmail && ownerSig?.owner_email) {
        ownerEmail = String(ownerSig.owner_email).trim();
      }
      const ownerName = String(ownerSig?.owner_name ?? "Bailleur");
      const subject = "Votre bail est signé – copie du document";
      const htmlBody = (recipientName: string) =>
        `<!DOCTYPE html><html><body style="font-family: Arial,sans-serif; line-height: 1.6; color: #333;">
<p>Bonjour ${recipientName},</p>
<p>Le bail a été signé par toutes les parties. Vous trouverez ci-dessous le lien pour télécharger votre copie du document signé.</p>
<p><a href="${finalDocumentUrl}" style="display:inline-block; background:#1e3a5f; color:#fff; padding:12px 24px; text-decoration:none; border-radius:8px;">Télécharger le bail signé</a></p>
<p style="font-size:14px; color:#666;">Ce lien est valable 7 jours. Pensez à enregistrer le document.</p>
${ESPACE_BAILLEUR_SIGNATURE_HTML}
</body></html>`;

      const toSend: { to: string; name: string }[] = [];
      if (ownerEmail) toSend.push({ to: ownerEmail, name: ownerName });
      for (const s of request.signers) {
        const email = String(s.email ?? "").trim();
        if (email && !toSend.some((x) => x.to === email)) toSend.push({ to: email, name: s.name });
      }
      for (let i = 0; i < toSend.length; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, 400));
        const { error: mailErr } = await resend.emails.send({
          from: ESPACE_BAILLEUR_FROM,
          to: [toSend[i].to],
          subject,
          html: htmlBody(toSend[i].name),
        });
        if (mailErr) console.error("[signatures-generate-final-pdf] email to", toSend[i].to, mailErr);
      }
    }

    return jsonResponse({
      success: true,
      request_id: request.id,
      bail_id: request.bail_id,
      status: "signed",
      final_document_url: finalDocumentUrl,
      storage_path: path,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      500
    );
  }
});
