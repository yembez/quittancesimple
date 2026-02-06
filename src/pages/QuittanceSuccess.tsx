import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userEmail } = await req.json();
    
    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'Email requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // 1. Trouver le propriétaire
    const { data: proprietaire, error: propError } = await supabase
      .from('proprietaires')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('email', userEmail)
      .single();

    if (propError || !proprietaire) {
      return new Response(JSON.stringify({ error: 'Utilisateur non trouvé' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Annuler l'abonnement Stripe
    if (proprietaire.stripe_subscription_id) {
      const cancelResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${proprietaire.stripe_subscription_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      if (!cancelResponse.ok) {
        const error = await cancelResponse.text();
        console.error('Erreur Stripe:', error);
        return new Response(JSON.stringify({ 
          error: 'Erreur annulation Stripe',
          details: error
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. Mettre à jour Supabase
    const { error: updateError } = await supabase
      .from('proprietaires')
      .update({
        stripe_subscription_id: null,
        stripe_subscription_status: 'canceled',
        plan_type: null,
        updated_at: new Date().toISOString()
      })
      .eq('email', userEmail);

    if (updateError) {
      console.error('Erreur mise à jour Supabase:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Abonnement annulé pour ${userEmail}`,
      subscriptionId: proprietaire.stripe_subscription_id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erreur:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
