import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  email: string;
  plan: 'auto' | 'plus';
  billingCycle: 'monthly' | 'yearly';
  tenantTier?: '1-2' | '3-5' | '5+';
  expressCheckout?: boolean;
}

const generateSecurePassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specialChars = '!@#$%';
  let password = '';

  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

  return password.split('').sort(() => Math.random() - 0.5).join('');
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-12-18.acacia",
    });

    const body: RequestBody = await req.json();
    const { email, plan, billingCycle, tenantTier = '1-2', expressCheckout } = body;

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email invalide' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const getTierPrice = (tier: string, cycle: 'monthly' | 'yearly') => {
      const prices: Record<string, { monthly: number; yearly: number }> = {
        '1-2': { monthly: 0.99, yearly: 9.90 },
        '3-5': { monthly: 1.49, yearly: 14.90 },
        '5+': { monthly: 2.49, yearly: 24.90 },
      };
      return prices[tier][cycle];
    };

    const price = getTierPrice(tenantTier, billingCycle);
    const planName = 'Mode Tranquillité';
    const cycleLabel = billingCycle === 'monthly' ? 'Mensuel' : 'Annuel';

    const generatedPassword = generateSecurePassword();

    const successUrl = `${req.headers.get('origin') || 'https://quittance-simple.fr'}/quick-payment-confirm?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`;

    const cancelUrl = `${req.headers.get('origin') || 'https://quittance-simple.fr'}/pricing`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${planName} - ${cycleLabel}`,
              description: 'Automatisation des quittances et rappels',
            },
            unit_amount: Math.round(price * 100),
            recurring: billingCycle === 'monthly'
              ? { interval: 'month' }
              : { interval: 'year' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        email,
        plan,
        billingCycle,
        tenantTier,
        quickCheckout: 'true',
        generatedPassword,
        timestamp: new Date().toISOString(),
      },
      subscription_data: {
        metadata: {
          email,
          plan,
          billingCycle,
          tenantTier,
          quickCheckout: 'true',
        },
      },
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Quick checkout error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Une erreur est survenue',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
