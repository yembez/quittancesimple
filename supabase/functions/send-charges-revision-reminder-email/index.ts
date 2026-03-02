import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChargesRevisionReminder {
  id: string;
  proprietaire_id: string;
  reminder_date: string;
  status: string;
}

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.quittancesimple.fr";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Date du jour au fuseau de l'utilisateur (France) pour correspondre au choix dans l'app
    const timezone = Deno.env.get("TZ") || "Europe/Paris";
    const today = new Date().toLocaleDateString("en-CA", { timeZone: timezone });

    const { data: reminders, error: remindersError } = await supabase
      .from("charges_revision_reminders")
      .select("*")
      .eq("reminder_date", today)
      .eq("status", "scheduled");

    if (remindersError) {
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No charges revision reminders to send today" }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results: { reminder_id: string; email?: string; success: boolean; error?: string }[] = [];

    for (const reminder of reminders as ChargesRevisionReminder[]) {
      try {
        const { data: proprietaire, error: propError } = await supabase
          .from("proprietaires")
          .select("email, nom, prenom")
          .eq("id", reminder.proprietaire_id)
          .single();

        if (propError || !proprietaire) {
          console.error(`Proprietaire not found for reminder ${reminder.id}`);
          continue;
        }

        const prop = proprietaire as Proprietaire;
        const dashboardUrl = `${siteUrl}/overview`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); border: 1px solid #e8e7ef;">

          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #1a2f4d 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">
                Rappel : Révision des charges
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px 0; color: #151b2c; font-size: 15px; line-height: 1.6;">
                Bonjour${prop.prenom ? ` ${prop.prenom}` : ""},
              </p>

              <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                Comme vous l'avez programmé, c'est le moment de penser à la révision des charges (régularisation annuelle) pour vos locations.
              </p>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                Retrouvez votre Vue d'ensemble pour gérer vos rappels et suivre vos quittances.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 14px;">
                      Ouvrir ma Vue d'ensemble
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f0f4ff; border-left: 4px solid #1e3a5f; padding: 14px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #1e3a5f; font-size: 13px; line-height: 1.5;">
                  <strong>À savoir :</strong> La régularisation des charges est généralement effectuée une fois par an. Pensez à conserver les justificatifs pour vos locataires.
                </p>
              </div>

              <p style="margin: 24px 0 0 0; color: #5e6478; font-size: 14px; line-height: 1.6;">
                À bientôt,<br>
                <strong style="color: #1e3a5f;">QS – Espace Bailleur</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f5f5f7; padding: 24px; text-align: center; border-top: 1px solid #e8e7ef;">
              <p style="margin: 0 0 8px 0; color: #5e6478; font-size: 12px;">
                Vous recevez cet e-mail car vous avez programmé un rappel de révision des charges sur Quittance Simple.
              </p>
              <p style="margin: 0; color: #5e6478; font-size: 12px;">
                <strong>QS – Espace Bailleur</strong><br/>
                Un service édité par Quittance Simple<br/>
                <a href="https://quittancesimple.fr">quittancesimple.fr</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "QS - Espace Bailleur <noreply@quittancesimple.fr>",
            to: [prop.email],
            subject: "Rappel : révision des charges (régularisation annuelle)",
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email to ${prop.email}:`, errorText);
          results.push({
            reminder_id: reminder.id,
            email: prop.email,
            success: false,
            error: errorText,
          });
          continue;
        }

        await supabase
          .from("charges_revision_reminders")
          .update({ status: "sent", updated_at: new Date().toISOString() })
          .eq("id", reminder.id);

        results.push({
          reminder_id: reminder.id,
          email: prop.email,
          success: true,
        });
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        results.push({
          reminder_id: reminder.id,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} charges revision reminders`,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
