import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { sendOwnerReminderEmail } from "../_shared/owner-reminder-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await req.json()) as {
      proprietaireId?: string;
      proprietaireEmail?: string;
      proprietaireName?: string;
      locataireName?: string;
      locataireId?: string;
      mois?: string;
      annee?: string | number;
      montantTotal?: number;
      shortCode?: string;
    };

    const result = await sendOwnerReminderEmail({
      proprietaireId: body.proprietaireId,
      proprietaireEmail: body.proprietaireEmail ?? "",
      proprietaireName: body.proprietaireName,
      locataireName: body.locataireName,
      locataireId: body.locataireId,
      mois: body.mois,
      annee: body.annee,
      montantTotal: body.montantTotal,
    });

    if (!result.success) {
      const status = result.error === "proprietaireEmail required" ? 400 : 500;
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-owner-reminder error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
