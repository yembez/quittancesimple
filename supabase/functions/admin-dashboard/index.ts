import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Liste des emails admin autorisés
const ADMIN_EMAILS = (Deno.env.get('ADMIN_EMAILS') || '').split(',').map(e => e.trim());

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Récupérer le token JWT depuis l'en-tête Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Créer un client Supabase avec le token utilisateur pour vérifier l'auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Vérifier l'utilisateur authentifié
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Vérifier que l'email est dans la liste des admins autorisés
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      console.log(`Access denied for user: ${user.email}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Créer un client Supabase avec la SERVICE_ROLE_KEY pour accéder aux données
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le paramètre range (7d ou 30d)
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || '7d';
    const daysBack = range === '30d' ? 30 : 7;

    // Calculer la date limite
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysBack);
    const dateLimitStr = dateLimit.toISOString();

    // KPIs - Leads (proprietaires)
    const { count: leadsTotal } = await supabaseAdmin
      .from('proprietaires')
      .select('*', { count: 'exact', head: true });

    const { count: leads7d } = await supabaseAdmin
      .from('proprietaires')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { count: leads30d } = await supabaseAdmin
      .from('proprietaires')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // KPIs - Leads IRL
    const { count: irlLeadsProspects } = await supabaseAdmin
      .from('prospects_revision_loyer')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { count: irlLeadsRappels } = await supabaseAdmin
      .from('rappels_nouveau_loyer')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const irlLeads7d = (irlLeadsProspects || 0) + (irlLeadsRappels || 0);

    // KPIs - Quittances générées (7 derniers jours)
    const { count: quittancesGenerated } = await supabaseAdmin
      .from('quittances_generated')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { count: quittancesSystem } = await supabaseAdmin
      .from('quittances')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const quittancesGenerated7d = (quittancesGenerated || 0) + (quittancesSystem || 0);

    // KPIs - Abonnements actifs
    const { count: subscriptionsActive } = await supabaseAdmin
      .from('proprietaires')
      .select('*', { count: 'exact', head: true })
      .eq('abonnement_actif', true);

    // KPIs - CA Stripe (optionnel, peut échouer si pas de données)
    let stripeRevenue30d = null;
    try {
      const { data: factures } = await supabaseAdmin
        .from('factures')
        .select('montant_ttc')
        .eq('statut', 'payee')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (factures && factures.length > 0) {
        stripeRevenue30d = factures.reduce((sum, f) => sum + (Number(f.montant_ttc) || 0), 0);
      }
    } catch (err) {
      console.log('Could not fetch stripe revenue:', err);
    }

    // Derniers leads (proprietaires)
    const { data: lastLeads } = await supabaseAdmin
      .from('proprietaires')
      .select('email, created_at, source, plan_actuel')
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedLeads = (lastLeads || []).map(lead => ({
      email: lead.email,
      created_at: lead.created_at,
      source: lead.source || 'direct',
      product: lead.plan_actuel === 'free' ? 'Gratuit' : 'Automatisation'
    }));

    // Derniers abonnements
    const { data: lastSubscriptions } = await supabaseAdmin
      .from('proprietaires')
      .select('email, plan_actuel, abonnement_actif, created_at')
      .eq('abonnement_actif', true)
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedSubscriptions = (lastSubscriptions || []).map(sub => ({
      email: sub.email,
      plan: sub.plan_actuel || 'N/A',
      abonnement_actif: sub.abonnement_actif,
      created_at: sub.created_at
    }));

    // Construire la réponse
    const response = {
      kpis: {
        leads_total: leadsTotal || 0,
        leads_7d: leads7d || 0,
        leads_30d: leads30d || 0,
        irl_leads_7d: irlLeads7d,
        quittances_generated_7d: quittancesGenerated7d,
        subscriptions_active: subscriptionsActive || 0,
        stripe_revenue_30d: stripeRevenue30d
      },
      last_leads: formattedLeads,
      last_subscriptions: formattedSubscriptions
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in admin-dashboard:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
