import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from 'npm:stripe@17.7.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Proprietaire {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  date_fin_essai: string;
  abonnement_actif: boolean;
  lead_statut: string;
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
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!stripeSecret) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecret);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Récupérer les propriétaires dont l'essai est expiré ou expire aujourd'hui
    const { data: expiredProprietaires, error: propError } = await supabase
      .from('proprietaires')
      .select('id, email, nom, prenom, date_fin_essai, abonnement_actif, lead_statut')
      .not('date_fin_essai', 'is', null)
      .lte('date_fin_essai', today.toISOString())
      .eq('abonnement_actif', true)
      .eq('lead_statut', 'QA_1st_interested');

    if (propError) {
      throw propError;
    }

    if (!expiredProprietaires || expiredProprietaires.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired trials found' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const results = [];

    for (const proprietaire of expiredProprietaires as Proprietaire[]) {
      try {
        // Vérifier si l'utilisateur a un abonnement Stripe actif
        // On cherche dans Stripe par email
        const customers = await stripe.customers.list({
          email: proprietaire.email,
          limit: 1,
        });

        let hasActiveSubscription = false;
        if (customers.data.length > 0) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: 'active',
            limit: 1,
          });
          hasActiveSubscription = subscriptions.data.length > 0;
        }

        if (hasActiveSubscription) {
          // L'utilisateur a payé, mettre à jour son statut
          const { error: updateError } = await supabase
            .from('proprietaires')
            .update({
              date_fin_essai: null,
              abonnement_actif: true,
              lead_statut: 'QA_paid_subscriber',
            })
            .eq('id', proprietaire.id);

          if (updateError) {
            console.error(`Error updating proprietaire ${proprietaire.id}:`, updateError);
            results.push({
              proprietaire_id: proprietaire.id,
              email: proprietaire.email,
              action: 'converted',
              success: false,
              error: updateError.message,
            });
          } else {
            console.log(`Proprietaire ${proprietaire.email} converted from trial to paid`);
            results.push({
              proprietaire_id: proprietaire.id,
              email: proprietaire.email,
              action: 'converted',
              success: true,
            });
          }
        } else {
          // L'essai est expiré et pas de paiement, désactiver l'accès
          const endDate = new Date(proprietaire.date_fin_essai);
          const daysSinceExpiration = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

          // Si l'expiration est exactement aujourd'hui (jour 0), envoyer l'email d'expiration
          if (daysSinceExpiration === 0) {
            const checkoutUrl = `${supabaseUrl.replace('.supabase.co', '.vercel.app')}/payment-checkout?reactivate=true&email=${encodeURIComponent(proprietaire.email)}`;

            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #E65F3F 0%, #d95530 100%); padding: 40px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Votre essai gratuit est terminé
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Bonjour${proprietaire.prenom ? ` ${proprietaire.prenom}` : ''},
              </p>

              <p style="margin: 0 0 20px 0; color: #E65F3F; font-size: 18px; font-weight: bold; line-height: 1.6;">
                Votre période d'essai gratuit de 30 jours est maintenant terminée.
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Ne perdez pas l'accès à vos données et à toutes les fonctionnalités de Quittance Simple. Réactivez votre compte dès maintenant pour continuer à bénéficier du Pack Automatique.
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>Bonne nouvelle :</strong> Vos données sont toujours là ! Réactivez dans les 3 jours et bénéficiez d'un accès immédiat à toutes vos quittances et documents.
              </p>

              <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>Tarifs à partir de 3,25€/mois</strong> en paiement annuel (1-2 logements). Sans engagement, résiliation possible à tout moment.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${checkoutUrl}" style="display: inline-block; background-color: #E65F3F; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                      Réactiver mon compte maintenant
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #1E40AF; font-size: 14px; line-height: 1.6;">
                  <strong>💳 Paiement sécurisé :</strong> Le paiement est géré par Stripe, leader mondial des paiements en ligne. Vos données bancaires sont 100% sécurisées.
                </p>
              </div>

              <p style="margin: 30px 0 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                À bientôt,<br>
                <strong style="color: #E65F3F;">QS – Espace Bailleur</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 12px;">
                Vous recevez cet e-mail car votre essai gratuit vient de se terminer.
              </p>
              <p style="margin: 0; color: #6B7280; font-size: 12px;">
                <a href="${checkoutUrl.replace('/payment-checkout', '/unsubscribe')}?email=${encodeURIComponent(proprietaire.email)}" style="color: #6B7280; text-decoration: underline;">Se désabonner</a> | 
                <a href="${checkoutUrl.replace('/payment-checkout', '/contact')}" style="color: #6B7280; text-decoration: underline;">Nous contacter</a>
              </p>
              <p style="margin: 10px 0 0 0; color: #6B7280; font-size: 12px;">
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

            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Marc – Quittance Simple <contact@quittancesimple.fr>',
                reply_to: 'Marc – Quittance Simple <contact@quittancesimple.fr>',
                to: [proprietaire.email],
                subject: 'Réactivez votre compte Quittance Simple',
                html: emailHtml,
              }),
            });

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error(`Failed to send expiration email to ${proprietaire.email}:`, errorText);
            }
          }

          // Désactiver l'accès
          const { error: updateError } = await supabase
            .from('proprietaires')
            .update({
              abonnement_actif: false,
              lead_statut: 'trial_expired',
            })
            .eq('id', proprietaire.id);

          if (updateError) {
            console.error(`Error deactivating proprietaire ${proprietaire.id}:`, updateError);
            results.push({
              proprietaire_id: proprietaire.id,
              email: proprietaire.email,
              action: 'deactivated',
              success: false,
              error: updateError.message,
            });
          } else {
            console.log(`Proprietaire ${proprietaire.email} trial expired and access deactivated`);
            results.push({
              proprietaire_id: proprietaire.id,
              email: proprietaire.email,
              action: 'deactivated',
              success: true,
              days_since_expiration: daysSinceExpiration,
            });
          }
        }

      } catch (error) {
        console.error(`Error processing proprietaire ${proprietaire.id}:`, error);
        results.push({
          proprietaire_id: proprietaire.id,
          email: proprietaire.email,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} expired trials`,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
