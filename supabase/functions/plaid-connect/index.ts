import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'npm:plaid@27';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox';

const configuration = new Configuration({
  basePath: PLAID_ENV === 'production'
    ? PlaidEnvironments.production
    : PLAID_ENV === 'development'
    ? PlaidEnvironments.development
    : PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.endsWith('/link-token') && req.method === 'POST') {
      const { userId } = await req.json();

      const request = {
        user: {
          client_user_id: userId || user.id,
        },
        client_name: 'Quittance Facile',
        products: [Products.Transactions],
        country_codes: [CountryCode.Fr, CountryCode.Gb],
        language: 'fr',
        redirect_uri: `${url.origin}/bank-sync`,
      };

      const response = await plaidClient.linkTokenCreate(request);

      return new Response(
        JSON.stringify({
          link_token: response.data.link_token,
          expiration: response.data.expiration,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (pathname.endsWith('/exchange-token') && req.method === 'POST') {
      const { public_token, userId } = await req.json();

      const exchangeResponse = await plaidClient.itemPublicTokenExchange({
        public_token,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      const itemResponse = await plaidClient.itemGet({
        access_token: accessToken,
      });

      const institutionId = itemResponse.data.item.institution_id;

      let institutionName = 'Unknown Bank';
      if (institutionId) {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Fr, CountryCode.Gb],
        });
        institutionName = institutionResponse.data.institution.name;
      }

      const accountsResponse = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      const primaryAccount = accountsResponse.data.accounts[0];

      const { data: connection, error: dbError } = await supabase
        .from('bank_connections')
        .insert({
          user_id: userId || user.id,
          requisition_id: itemId,
          account_id: primaryAccount.account_id,
          institution_id: institutionId || 'unknown',
          institution_name: institutionName,
          access_token: accessToken,
          status: 'active',
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      return new Response(
        JSON.stringify({
          connection_id: connection.id,
          institution_name: institutionName,
          account_id: primaryAccount.account_id,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (pathname.endsWith('/accounts') && req.method === 'GET') {
      const connectionId = url.searchParams.get('connection_id');

      const { data: connection, error: connError } = await supabase
        .from('bank_connections')
        .select('access_token')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        throw new Error('Connection not found');
      }

      const accountsResponse = await plaidClient.accountsGet({
        access_token: connection.access_token,
      });

      const accounts = accountsResponse.data.accounts.map((account) => ({
        id: account.account_id,
        name: account.name,
        mask: account.mask,
        type: account.type,
        subtype: account.subtype,
      }));

      return new Response(
        JSON.stringify({ accounts }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (pathname.endsWith('/transactions') && req.method === 'GET') {
      const connectionId = url.searchParams.get('connection_id');
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      const { data: connection, error: connError } = await supabase
        .from('bank_connections')
        .select('access_token')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        throw new Error('Connection not found');
      }

      const transactionsResponse = await plaidClient.transactionsGet({
        access_token: connection.access_token,
        start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0],
      });

      const transactions = transactionsResponse.data.transactions.map((tx) => ({
        id: tx.transaction_id,
        amount: tx.amount,
        date: tx.date,
        description: tx.name,
        pending: tx.pending,
        sender_name: tx.merchant_name,
      }));

      return new Response(
        JSON.stringify({ transactions }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (pathname.endsWith('/sync') && req.method === 'POST') {
      const { connection_id } = await req.json();

      const { data: connection, error: connError } = await supabase
        .from('bank_connections')
        .select('access_token')
        .eq('id', connection_id)
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        throw new Error('Connection not found');
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Synchronisation réussie' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (pathname.endsWith('/revoke') && req.method === 'POST') {
      const { connection_id } = await req.json();

      const { data: connection, error: connError } = await supabase
        .from('bank_connections')
        .select('access_token')
        .eq('id', connection_id)
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        throw new Error('Connection not found');
      }

      await plaidClient.itemRemove({
        access_token: connection.access_token,
      });

      await supabase
        .from('bank_connections')
        .update({ status: 'revoked' })
        .eq('id', connection_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Connexion révoquée' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (pathname.endsWith('/connections') && req.method === 'GET') {
      const { data: connections, error: connectionsError } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (connectionsError) {
        throw connectionsError;
      }

      return new Response(
        JSON.stringify({ connections: connections || [] }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in plaid-connect function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
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