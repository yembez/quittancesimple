import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  to: string;
  message: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const requestData: RequestBody = await req.json();
    console.log("Données reçues:", requestData);

    const { to, message } = requestData;

    if (!to || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Paramètres manquants (to, message)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: secretData, error: secretError } = await supabase
      .rpc('get_secret', { secret_name: 'smsmode_api_key' });

    if (secretError || !secretData) {
      console.error("Erreur récupération clé API SMSMode:", secretError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Configuration SMS non disponible",
          skipped: true 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const smsmodeApiKey = secretData;
    console.log("Clé API SMSMode récupérée avec succès");

    let cleanedPhone = to.replace(/\s+/g, "");
    if (cleanedPhone.startsWith("+")) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    
    console.log("Numéro nettoyé:", cleanedPhone);
    console.log("Message à envoyer:", message);
    console.log("Longueur du message:", message.length);

    const smsmodeUrl = "https://api.smsmode.com/http/1.6/sendSMS.do";
    const params = new URLSearchParams({
      accessToken: smsmodeApiKey,
      message: message,
      numero: cleanedPhone,
      emetteur: "Quittance",
    });

    console.log("Envoi vers SMSMode...");
    const smsmodeResponse = await fetch(`${smsmodeUrl}?${params.toString()}`, {
      method: "GET",
    });

    const responseText = await smsmodeResponse.text();
    console.log("Réponse SMSMode:", responseText);
    console.log("Status HTTP:", smsmodeResponse.status);

    const statusCode = parseInt(responseText.trim());

    if (statusCode === 0) {
      console.log("✅ SMS envoyé avec succès via SMSMode");
      return new Response(
        JSON.stringify({
          success: true,
          message: "SMS envoyé avec succès",
          provider: "smsmode",
          data: {
            status: statusCode,
            phone: cleanedPhone,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      const errorMessages: Record<number, string> = {
        2: "Paramètres manquants",
        3: "Identifiants invalides",
        5: "Crédit insuffisant",
        10: "Numéro invalide",
        11: "Emetteur invalide",
        32: "Message trop long",
        50: "Erreur interne",
      };

      const errorMessage = errorMessages[statusCode] || `Erreur inconnue (code ${statusCode})`;
      console.error("❌ Erreur SMSMode:", errorMessage);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Erreur SMSMode: ${errorMessage}`,
          provider: "smsmode",
          statusCode: statusCode,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ Erreur générale:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});