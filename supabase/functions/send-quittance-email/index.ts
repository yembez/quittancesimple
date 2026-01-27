import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuittanceEmailRequest {
  locataireEmail: string;
  locataireName: string;
  baillorName: string;
  periode: string;
  loyer: number;
  charges: number;
  total: number;
  pdfUrl: string;
  pdfBase64?: string;
  locataireId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      locataireEmail,
      locataireName,
      baillorName,
      periode,
      loyer,
      charges,
      total,
      pdfUrl,
      pdfBase64,
      locataireId
    }: QuittanceEmailRequest = await req.json();

    const emailBody = `Bonjour ${locataireName},

Veuillez trouver ci-joint votre quittance de loyer pour la période : ${periode}

Détails du paiement :
- Loyer mensuel : ${loyer.toFixed(2)} €
- Charges mensuelles : ${charges.toFixed(2)} €
- Total réglé : ${total.toFixed(2)} €

Cordialement,
${baillorName}`;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    let pdfContent = pdfBase64;
    if (!pdfContent) {
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error('Failed to fetch PDF from URL');
      }
      const pdfBuffer = await pdfResponse.arrayBuffer();
      pdfContent = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Quittance Simple <noreply@quittancesimple.fr>',
        to: [locataireEmail],
        subject: `Quittance de loyer - ${periode}`,
        text: emailBody,
        attachments: [
          {
            filename: `quittance-${periode.toLowerCase().replace(/\s+/g, '-')}.pdf`,
            content: pdfContent,
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();

    if (locataireId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        try {
          // Obtenir les infos du locataire pour créer la quittance
          const { data: locataireData, error: locataireError } = await supabase
            .from('locataires')
            .select('proprietaire_id')
            .eq('id', locataireId)
            .maybeSingle();

          if (!locataireError && locataireData) {
            // Calculer les dates de la période
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const periodeDebut = new Date(year, month, 1).toISOString().split('T')[0];
            const periodeFin = new Date(year, month + 1, 0).toISOString().split('T')[0];

            // Créer ou mettre à jour la quittance dans l'historique
            const { error: quittanceError } = await supabase
              .from('quittances')
              .upsert({
                proprietaire_id: locataireData.proprietaire_id,
                locataire_id: locataireId,
                periode_debut: periodeDebut,
                periode_fin: periodeFin,
                loyer: loyer,
                charges: charges,
                date_generation: new Date().toISOString(),
                pdf_url: pdfUrl,
                statut: 'envoye',
                source: 'email'
              }, {
                onConflict: 'proprietaire_id,locataire_id,periode_debut,periode_fin',
                ignoreDuplicates: false
              });

            if (quittanceError) {
              console.error('⚠️ Erreur création quittance:', quittanceError);
            } else {
              console.log('✅ Quittance enregistrée dans l\'historique');
            }
          }

          console.log('📝 Mise à jour du statut du locataire:', locataireId);
          const { data: updateData, error: updateError } = await supabase
            .from('locataires')
            .update({ statut: 'paye' })
            .eq('id', locataireId)
            .select();

          if (updateError) {
            console.error('⚠️ Erreur mise à jour statut:', updateError);
          } else {
            console.log('✅ Statut mis à jour avec succès:', updateData);
          }
        } catch (err) {
          console.error('❌ Erreur lors de la mise à jour du statut:', err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending quittance email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});