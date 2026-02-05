import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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

Deno.serve(async (req) => {
  try {
    console.log('=== Resend Access Link Handler ===');

    if (req.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { email } = await req.json();

    if (!email) {
      console.error('❌ Missing email');
      return corsResponse({ error: 'Email is required' }, 400);
    }

    console.log('📧 Resending access link for:', email);

    // Vérifier si le propriétaire existe et a un abonnement actif
    const { data: proprietaire, error: propError } = await supabase
      .from('proprietaires')
      .select('abonnement_actif, plan_actuel')
      .eq('email', email)
      .maybeSingle();

    if (propError || !proprietaire) {
      console.error('❌ Proprietaire not found:', propError);
      return corsResponse({ error: 'Account not found' }, 404);
    }

    if (!proprietaire.abonnement_actif) {
      console.error('❌ No active subscription');
      return corsResponse({ error: 'No active subscription found' }, 403);
    }

    // Vérifier si l'utilisateur Auth existe
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);

    let magicLink: string;
    let linkType: 'invite' | 'magiclink';

    if (!existingUser || !existingUser.user) {
      // Générer un invite link
      console.log('🆕 Generating invite link');
      linkType = 'invite';

      const { data: inviteLinkData, error: inviteError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo: 'https://www.quittancesimple.fr/dashboard',
        },
      });

      if (inviteError || !inviteLinkData.properties?.action_link) {
        console.error('❌ Error generating invite link:', inviteError);
        return corsResponse({ error: 'Failed to generate link' }, 500);
      }

      magicLink = inviteLinkData.properties.action_link;
    } else {
      // Générer un magic link
      console.log('🔗 Generating magic link');
      linkType = 'magiclink';

      const { data: magicLinkData, error: magicError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: 'https://www.quittancesimple.fr/dashboard',
        },
      });

      if (magicError || !magicLinkData.properties?.action_link) {
        console.error('❌ Error generating magic link:', magicError);
        return corsResponse({ error: 'Failed to generate link' }, 500);
      }

      magicLink = magicLinkData.properties.action_link;
    }

    console.log(`✅ ${linkType} generated`);

    // Envoyer l'email
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-subscription-confirmation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email,
        magicLink,
        planName: proprietaire.plan_actuel,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error('❌ Error sending email:', emailError);
      return corsResponse({ error: 'Failed to send email' }, 500);
    }

    console.log('✅ Email sent successfully');

    return corsResponse({
      success: true,
      message: 'Access link sent successfully',
    });

  } catch (error: any) {
    console.error('❌ Resend link error:', error);
    return corsResponse({ error: error.message }, 500);
  }
});
