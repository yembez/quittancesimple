import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Quittance Simple',
    version: '1.0.0',
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function corsResponse(body: any, status = 200) {
  if (status === 204) {
    return new Response(null, { status, headers: corsHeaders });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Mapping price_id vers plan config
const PRICE_TO_PLAN: Record<string, { max_locataires: number; plan_actuel: string }> = {
  // Mode Tranquillité - Mensuels
  'price_1SpTqEB1aSt8zL1num8XjK2d': { max_locataires: 2, plan_actuel: 'Mode Tranquillité (1-2 locataires)' },
  'price_1SqivyB1aSt8zL1nIQcsn7bU': { max_locataires: 5, plan_actuel: 'Mode Tranquillité (3-5 locataires)' },
  'price_1SpTu8B1aSt8zL1nZ7Xx0oZE': { max_locataires: 999, plan_actuel: 'Mode Tranquillité (5+ locataires)' },

  // Mode Tranquillité - Annuels
  'price_1SqizVB1aSt8zL1nwJdEIzkl': { max_locataires: 2, plan_actuel: 'Mode Tranquillité (1-2 locataires)' },
  'price_1Sqj1nB1aSt8zL1neyt7IuZp': { max_locataires: 5, plan_actuel: 'Mode Tranquillité (3-5 locataires)' },
  'price_1Sqj3DB1aSt8zL1nyy6Hf5N7': { max_locataires: 999, plan_actuel: 'Mode Tranquillité (5+ locataires)' },

  // Connectée+ (pour futur)
  'price_1SNhrwB1aSt8zL1nCiVq1dUs': { max_locataires: 1, plan_actuel: 'Quittance Connectée+' },
  'price_1SXTfsB1aSt8zL1nfHya3Dsh': { max_locataires: 1, plan_actuel: 'Quittance Connectée+' },
};

Deno.serve(async (req) => {
  try {
    console.log('=== Checkout Success Handler ===');

    if (req.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { session_id } = await req.json();

    if (!session_id) {
      console.error('❌ Missing session_id');
      return corsResponse({ error: 'session_id is required' }, 400);
    }

    console.log('📦 Fetching Stripe session:', session_id);

    // 1. Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'subscription'],
    });

    console.log('✅ Session retrieved:', session.id);
    console.log('Payment status:', session.payment_status);

    // 2. Vérifier que le paiement est réussi
    if (session.payment_status !== 'paid') {
      console.error('❌ Payment not completed:', session.payment_status);
      return corsResponse({ error: 'Payment not completed' }, 400);
    }

    // 3. Récupérer l'email du client
    const customer_email = session.customer_details?.email || session.customer_email;

    if (!customer_email) {
      console.error('❌ No customer email found');
      return corsResponse({ error: 'Customer email not found' }, 400);
    }

    console.log('📧 Customer email:', customer_email);

    // 4. Récupérer le price_id depuis line_items
    const lineItems = session.line_items?.data || [];

    if (lineItems.length === 0) {
      console.error('❌ No line items found');
      return corsResponse({ error: 'No line items found' }, 400);
    }

    const price_id = lineItems[0].price?.id;

    if (!price_id) {
      console.error('❌ No price_id found');
      return corsResponse({ error: 'Price ID not found' }, 400);
    }

    console.log('💰 Price ID:', price_id);

    // 5. Déduire le plan depuis le price_id
    const planConfig = PRICE_TO_PLAN[price_id];

    if (!planConfig) {
      console.error('❌ Unknown price_id:', price_id);
      return corsResponse({ error: 'Unknown pricing plan' }, 400);
    }

    console.log('📋 Plan config:', planConfig);

    // 6. Upsert dans proprietaires
    const { error: upsertError } = await supabase
      .from('proprietaires')
      .upsert(
        {
          email: customer_email,
          abonnement_actif: true,
          plan_type: 'auto',
          plan_actuel: planConfig.plan_actuel,
          max_locataires: planConfig.max_locataires,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: (session.subscription as any)?.id || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'email',
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error('❌ Error upserting proprietaire:', upsertError);
      return corsResponse({ error: 'Failed to update account' }, 500);
    }

    console.log('✅ Proprietaire updated successfully');

    // 7. Vérifier si l'utilisateur Supabase Auth existe
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(customer_email);

    let magicLink: string;
    let linkType: 'invite' | 'magiclink';

    if (!existingUser || !existingUser.user) {
      // Cas 1: Utilisateur n'existe pas → invite link
      console.log('🆕 Creating invite link for new user');
      linkType = 'invite';

      const { data: inviteLinkData, error: inviteError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: customer_email,
        options: {
          redirectTo: 'https://www.quittancesimple.fr/dashboard',
        },
      });

      if (inviteError || !inviteLinkData.properties?.action_link) {
        console.error('❌ Error generating invite link:', inviteError);
        return corsResponse({ error: 'Failed to generate invite link' }, 500);
      }

      magicLink = inviteLinkData.properties.action_link;
    } else {
      // Cas 2: Utilisateur existe → magic link
      console.log('🔗 Creating magic link for existing user');
      linkType = 'magiclink';

      const { data: magicLinkData, error: magicError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: customer_email,
        options: {
          redirectTo: 'https://www.quittancesimple.fr/dashboard',
        },
      });

      if (magicError || !magicLinkData.properties?.action_link) {
        console.error('❌ Error generating magic link:', magicError);
        return corsResponse({ error: 'Failed to generate magic link' }, 500);
      }

      magicLink = magicLinkData.properties.action_link;
    }

    console.log(`✅ ${linkType} generated:`, magicLink.substring(0, 50) + '...');

    // 8. Envoyer l'email avec le lien
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-subscription-confirmation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email: customer_email,
        magicLink,
        planName: planConfig.plan_actuel,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error('❌ Error sending email:', emailError);
      // Ne pas échouer si l'email échoue, l'utilisateur peut utiliser "renvoyer"
    } else {
      console.log('✅ Confirmation email sent successfully');
    }

    // 9. Mettre à jour le lead_statut après succès
    await supabase
      .from('proprietaires')
      .update({ lead_statut: 'QA_paying_customer' })
      .eq('email', customer_email);

    console.log('✅ Lead status updated to paying customer');

    return corsResponse({
      success: true,
      email: customer_email,
      plan: planConfig.plan_actuel,
      linkType,
    });

  } catch (error: any) {
    console.error('❌ Checkout success error:', error);
    return corsResponse({ error: error.message }, 500);
  }
});
