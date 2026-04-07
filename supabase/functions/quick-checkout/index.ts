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
  stripePriceId?: string;
  expressCheckout?: boolean;
}

// IDs autorisés Pack Automatique (alignés avec checkout-success PRICE_TO_PLAN)
const ALLOWED_PACK_AUTO_PRICE_IDS = new Set([
  'price_1T2a6NB1aSt8zL1nyNy1v2gT',   // 1-2 mensuel
  'price_1T2a8DB1aSt8zL1n1T0H7NPy',   // 3-5 mensuel
  'price_1T2a8sB1aSt8zL1nbkpWQdp6',   // 6+ mensuel
  'price_1T0sYUB1aSt8zL1nm3DDI9F3',   // 1-2 annuel
  'price_1T2e1uB1aSt8zL1nlIrT3UdR',   // 3-5 annuel
  'price_1Sqj3DB1aSt8zL1nyy6Hf5N7',   // 6+ annuel
]);

// Mapping “hard fallback” (évite la dépendance aux secrets env).
const PACK_AUTO_PRICE_ID_BY_TIER_AND_CYCLE: Record<
  'monthly' | 'yearly',
  Record<'1-2' | '3-5' | '5+', string>
> = {
  monthly: {
    '1-2': 'price_1T2a6NB1aSt8zL1nyNy1v2gT',
    '3-5': 'price_1T2a8DB1aSt8zL1n1T0H7NPy',
    '5+': 'price_1T2a8sB1aSt8zL1nbkpWQdp6',
  },
  yearly: {
    '1-2': 'price_1T0sYUB1aSt8zL1nm3DDI9F3',
    '3-5': 'price_1T2e1uB1aSt8zL1nlIrT3UdR',
    '5+': 'price_1Sqj3DB1aSt8zL1nyy6Hf5N7',
  },
};

function normalizeBillingCycle(raw: unknown): 'monthly' | 'yearly' {
  const s = String(raw ?? '').toLowerCase().trim();
  if (s === 'monthly' || s === 'yearly') return s;
  return 'yearly';
}

function normalizeTenantTier(raw: unknown): '1-2' | '3-5' | '5+' {
  const s = String(raw ?? '1-2').trim();
  if (s === '1-2' || s === '3-5' || s === '5+') return s;
  // Tolère d’éventuelles variantes côté client / proxies
  if (s === '6+' || s === '6' || s.startsWith('6')) return '5+';
  return '1-2';
}

function resolveHardcodedPackPriceId(
  cycle: 'monthly' | 'yearly',
  tier: '1-2' | '3-5' | '5+',
): string {
  return PACK_AUTO_PRICE_ID_BY_TIER_AND_CYCLE[cycle][tier] || '';
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
    const { email, plan, stripePriceId: clientPriceId, expressCheckout } = body;
    const billingCycle = normalizeBillingCycle(body.billingCycle);
    const tenantTier = normalizeTenantTier(body.tenantTier);

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email invalide' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prix : priorité au stripePriceId envoyé par le client (depuis .env VITE_STRIPE_*),
    // puis fallback env Supabase, puis fallback hardcodé (mapping).
    let stripePriceId = '';
    if (clientPriceId && ALLOWED_PACK_AUTO_PRICE_IDS.has(clientPriceId)) {
      stripePriceId = clientPriceId;
    }
    if (!stripePriceId) {
      const getStripePriceIdFromEnv = (tier: string, cycle: 'monthly' | 'yearly'): string => {
        if (cycle === 'yearly') {
          if (tier === '1-2') return Deno.env.get('STRIPE_PRICE_AUTO_TIER1_YEARLY') || '';
          if (tier === '3-5') return Deno.env.get('STRIPE_PRICE_AUTO_TIER2_YEARLY') || '';
          return Deno.env.get('STRIPE_PRICE_AUTO_TIER3_YEARLY') || '';
        }
        if (tier === '1-2') return Deno.env.get('STRIPE_PRICE_AUTO_TIER1') || '';
        if (tier === '3-5') return Deno.env.get('STRIPE_PRICE_AUTO_TIER2') || '';
        return Deno.env.get('STRIPE_PRICE_AUTO_TIER3') || '';
      };
      stripePriceId = getStripePriceIdFromEnv(tenantTier, billingCycle);
    }
    if (!stripePriceId) {
      stripePriceId = resolveHardcodedPackPriceId(billingCycle, tenantTier);
    }

    if (!stripePriceId) {
      console.error('[quick-checkout] Price ID introuvable', {
        billingCycle,
        tenantTier,
        clientPriceId: clientPriceId ?? null,
        rawBody: { billingCycle: body.billingCycle, tenantTier: body.tenantTier },
      });
      return new Response(
        JSON.stringify({
          error:
            'Configuration Stripe manquante pour ce tier. Vérifiez le déploiement de la fonction quick-checkout (mapping price) ou définissez STRIPE_PRICE_AUTO_TIER* dans les secrets Supabase.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const planName = 'Pack Automatique';
    const cycleLabel = billingCycle === 'monthly' ? 'Mensuel' : 'Annuel';

    const generatedPassword = generateSecurePassword();

    const origin = req.headers.get('origin') || 'https://quittance-simple.fr';
    const successUrl = `${origin}/quick-payment-confirm?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`;

    // Annulation Stripe : revenir sur l’écran checkout (QuickPayment embarqué), pas sur /pricing
    const cancelUrl = `${origin}/payment-checkout?email=${encodeURIComponent(email)}&checkout=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
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
