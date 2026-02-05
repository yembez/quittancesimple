import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    console.log('=== Stripe Checkout Request ===');
    console.log('Method:', req.method);

    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { price_id, line_items, success_url, cancel_url, mode, metadata } = await req.json();
    console.log('Request params:', { price_id, line_items, success_url, cancel_url, mode, metadata });
    console.log('Line items details:', JSON.stringify(line_items));

    if (!price_id && !line_items) {
      console.error('❌ Missing price_id and line_items');
      return corsResponse({ error: 'Either price_id or line_items must be provided' }, 400);
    }

    if (price_id && line_items) {
      console.error('❌ Both price_id and line_items provided');
      return corsResponse({ error: 'Cannot provide both price_id and line_items' }, 400);
    }

    const error = validateParameters(
      { success_url, cancel_url, mode },
      {
        cancel_url: 'string',
        success_url: 'string',
        mode: { values: ['payment', 'subscription'] },
      },
    );

    if (error) {
      console.error('❌ Parameter validation failed:', error);
      return corsResponse({ error: `Parameter validation failed: ${error}` }, 400);
    }

    if (line_items) {
      if (!Array.isArray(line_items)) {
        console.error('❌ line_items is not an array:', typeof line_items);
        return corsResponse({ error: 'line_items must be an array' }, 400);
      }

      for (let i = 0; i < line_items.length; i++) {
        const item = line_items[i];
        console.log(`Checking line item ${i}:`, item);
        if (!item.price || typeof item.price !== 'string') {
          console.error(`❌ Line item ${i} has invalid price:`, item.price, typeof item.price);
          return corsResponse({ error: `Line item ${i} has invalid price: ${item.price} (type: ${typeof item.price})` }, 400);
        }
        if (item.quantity !== undefined && (typeof item.quantity !== 'number' || item.quantity < 1)) {
          console.error(`❌ Line item ${i} has invalid quantity:`, item.quantity);
          return corsResponse({ error: `Line item ${i} has invalid quantity: ${item.quantity}` }, 400);
        }
      }
    }

    const authHeader = req.headers.get('Authorization');
    let user = null;
    let customerId;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user: authenticatedUser },
        error: getUserError,
      } = await supabase.auth.getUser(token);

      if (!getUserError && authenticatedUser) {
        user = authenticatedUser;
      }
    }

    if (user) {
      const { data: customer, error: getCustomerError } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (getCustomerError) {
        console.error('Failed to fetch customer information from the database', getCustomerError);

        return corsResponse({ error: 'Failed to fetch customer information' }, 500);
      }

      if (!customer || !customer.customer_id) {
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });

        console.log(`Created new Stripe customer ${newCustomer.id} for user ${user.id}`);

        const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
          user_id: user.id,
          customer_id: newCustomer.id,
        });

        if (createCustomerError) {
          console.error('Failed to save customer information in the database', createCustomerError);

          try {
            await stripe.customers.del(newCustomer.id);
            await supabase.from('stripe_subscriptions').delete().eq('customer_id', newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to clean up after customer mapping error:', deleteError);
          }

          return corsResponse({ error: 'Failed to create customer mapping' }, 500);
        }

        if (mode === 'subscription') {
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
            customer_id: newCustomer.id,
            status: 'not_started',
          });

          if (createSubscriptionError) {
            console.error('Failed to save subscription in the database', createSubscriptionError);

            try {
              await stripe.customers.del(newCustomer.id);
            } catch (deleteError) {
              console.error('Failed to delete Stripe customer after subscription creation error:', deleteError);
            }

            return corsResponse({ error: 'Unable to save the subscription in the database' }, 500);
          }
        }

        customerId = newCustomer.id;

        console.log(`Successfully set up new customer ${customerId} with subscription record`);
      } else {
        customerId = customer.customer_id;

        if (mode === 'subscription') {
          const { data: subscription, error: getSubscriptionError } = await supabase
            .from('stripe_subscriptions')
            .select('status')
            .eq('customer_id', customerId)
            .maybeSingle();

          if (getSubscriptionError) {
            console.error('Failed to fetch subscription information from the database', getSubscriptionError);

            return corsResponse({ error: 'Failed to fetch subscription information' }, 500);
          }

          if (!subscription) {
            const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
              customer_id: customerId,
              status: 'not_started',
            });

            if (createSubscriptionError) {
              console.error('Failed to create subscription record for existing customer', createSubscriptionError);

              return corsResponse({ error: 'Failed to create subscription record for existing customer' }, 500);
            }
          }
        }
      }
    }

    const checkoutLineItems = line_items || [
      {
        price: price_id,
        quantity: 1,
      },
    ];

    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: checkoutLineItems,
      mode,
      success_url,
      cancel_url,
    };

    if (customerId) {
      sessionParams.customer = customerId;
    }

    if (metadata) {
      sessionParams.metadata = metadata;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`Created checkout session ${session.id}${customerId ? ` for customer ${customerId}` : ' (no customer)'}`);

    // Mise à jour du statut lead : session de paiement ouverte mais non finalisée
    if (user?.email) {
      try {
        const { error: leadStatusError } = await supabase
          .from('proprietaires')
          .upsert({
            email: user.email,
            lead_statut: 'QA_payment_incomplete',
            source: 'website'
          }, {
            onConflict: 'email',
            ignoreDuplicates: false
          });

        if (leadStatusError) {
          console.error('⚠️ Erreur mise à jour lead_statut:', leadStatusError);
        } else {
          console.log('✅ Lead statut mis à jour: QA_payment_incomplete pour', user.email);
        }
      } catch (err: any) {
        console.error('❌ Exception mise à jour lead_statut:', err);
      }
    }

    return corsResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}
