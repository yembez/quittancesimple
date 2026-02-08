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
  // Pack Automatique - Mensuels
  'price_1SpTqEB1aSt8zL1num8XjK2d': { max_locataires: 2, plan_actuel: 'Pack Automatique (1-2 locataires)' },
  'price_1SqivyB1aSt8zL1nIQcsn7bU': { max_locataires: 5, plan_actuel: 'Pack Automatique (3-5 locataires)' },
  'price_1SpTu8B1aSt8zL1nZ7Xx0oZE': { max_locataires: 999, plan_actuel: 'Pack Automatique (5+ locataires)' },

  // Pack Automatique - Annuels
  'price_1SqizVB1aSt8zL1nwJdEIzkl': { max_locataires: 2, plan_actuel: 'Pack Automatique (1-2 locataires)' },
  'price_1Sqj1nB1aSt8zL1neyt7IuZp': { max_locataires: 5, plan_actuel: 'Pack Automatique (3-5 locataires)' },
  'price_1Sqj3DB1aSt8zL1nyy6Hf5N7': { max_locataires: 999, plan_actuel: 'Pack Automatique (5+ locataires)' },

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

    // 5. Déduire le plan depuis le price_id OU les metadata
    let planConfig = PRICE_TO_PLAN[price_id];

    // Si le price_id n'est pas trouvé, essayer de déduire depuis les metadata
    if (!planConfig && session.metadata) {
      console.log('📋 Price ID not found in mapping, using metadata:', session.metadata);
      
      const { tenantTier, quickCheckout } = session.metadata;
      
      if (quickCheckout === 'true' && tenantTier) {
        // Mapping des tiers pour quick checkout
        const tierToMaxLocataires: Record<string, number> = {
          '1-2': 2,
          '3-5': 5,
          '5+': 999,
        };
        
        const maxLocataires = tierToMaxLocataires[tenantTier] || 2;
        planConfig = {
          max_locataires: maxLocataires,
          plan_actuel: `Pack Automatique (${tenantTier} locataires)`,
        };
        
        console.log('✅ Plan config from metadata:', planConfig);
      }
    }

    if (!planConfig) {
      console.error('❌ Unknown price_id and no valid metadata:', price_id);
      return corsResponse({ error: 'Unknown pricing plan' }, 400);
    }

    console.log('📋 Final plan config:', planConfig);

    // 6. CORRECTION: Chercher d'abord si le propriétaire existe
    const { data: existingProprietaire, error: searchError } = await supabase
      .from('proprietaires')
      .select('id, nom, prenom')
      .eq('email', customer_email)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('❌ Error searching proprietaire:', searchError);
      return corsResponse({ error: 'Database error' }, 500);
    }

    let proprietaireId: string;

    if (existingProprietaire) {
      // CAS 1: Le propriétaire existe déjà → UPDATE
      console.log('✅ Propriétaire found, updating:', existingProprietaire.id);
      
      const { error: updateError } = await supabase
        .from('proprietaires')
        .update({
          abonnement_actif: true,
          plan_type: 'auto',
          plan_actuel: planConfig.plan_actuel,
          max_locataires: planConfig.max_locataires,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: (session.subscription as any)?.id || null,
          lead_statut: 'QA_paying_customer',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProprietaire.id);

      if (updateError) {
        console.error('❌ Error updating proprietaire:', updateError);
        return corsResponse({ error: 'Failed to update account' }, 500);
      }

      proprietaireId = existingProprietaire.id;
      console.log('✅ Proprietaire updated successfully');

    } else {
      // CAS 2: Nouveau propriétaire → INSERT avec valeurs par défaut
      console.log('🆕 Creating new proprietaire');
      
      // Extraire nom/prénom de l'email si possible
      const emailName = customer_email.split('@')[0];
      const defaultName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

      const { data: newProprietaire, error: insertError } = await supabase
        .from('proprietaires')
        .insert({
          email: customer_email,
          nom: defaultName,
          prenom: '',
          telephone: '',
          abonnement_actif: true,
          plan_type: 'auto',
          plan_actuel: planConfig.plan_actuel,
          max_locataires: planConfig.max_locataires,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: (session.subscription as any)?.id || null,
          lead_statut: 'QA_paying_customer',
          source: 'quick_payment',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Error creating proprietaire:', insertError);
        return corsResponse({ error: 'Failed to create account' }, 500);
      }

      proprietaireId = newProprietaire.id;
      console.log('✅ Proprietaire created successfully:', proprietaireId);
    }

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
