import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const POWENS_CLIENT_ID = Deno.env.get('POWENS_CLIENT_ID');
const POWENS_CLIENT_SECRET = Deno.env.get('POWENS_CLIENT_SECRET');
const POWENS_API_URL = Deno.env.get('POWENS_API_URL') || 'https://quittancesimple-sandbox.biapi.pro';
const POWENS_REDIRECT_URI = Deno.env.get('POWENS_REDIRECT_URI') || 'https://app.quittancesimple.fr/dashboard';
const POWENS_WEBVIEW_URL = Deno.env.get('POWENS_WEBVIEW_URL') || 'https://webview.powens.com/fr/connect';

function base64Encode(str: string): string {
  return btoa(str);
}

async function callPowensAPI(
  endpoint: string,
  method: string,
  accessToken?: string,
  body?: any
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    const auth = base64Encode(`${POWENS_CLIENT_ID}:${POWENS_CLIENT_SECRET}`);
    headers['Authorization'] = `Basic ${auth}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  // Log de la requ\u00eate envoy\u00e9e \u00e0 Powens
  console.log('\ud83d\udd35 Requ\u00eate vers Powens API:');
  console.log('\ud83d\udd35 URL:', `${POWENS_API_URL}${endpoint}`);
  console.log('\ud83d\udd35 Method:', method);
  console.log('\ud83d\udd35 Headers:', JSON.stringify(headers, null, 2));
  console.log('\ud83d\udd35 Body:', body ? JSON.stringify(body, null, 2) : 'null');

  const response = await fetch(`${POWENS_API_URL}${endpoint}`, options);

  // Log de la r\u00e9ponse de Powens
  console.log('\ud83d\udfeb R\u00e9ponse de Powens API:');
  console.log('\ud83d\udfeb Status:', response.status);
  console.log('\ud83d\udfeb Status Text:', response.statusText);
  console.log('\ud83d\udfeb Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('\ud83d\udd34 Powens API error body:', errorText);
    throw new Error(`Powens API error: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log('\ud83d\udfeb Response Body:', JSON.stringify(responseData, null, 2));

  return responseData;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.endsWith('/webauth') && req.method === 'POST') {
      const { userId, redirectUri } = await req.json();

      const finalRedirectUri = redirectUri || POWENS_REDIRECT_URI;
      console.log('\ud83d\udd17 Redirect URI utilis\u00e9e:', finalRedirectUri);

      const domain = POWENS_API_URL.replace('https://', '');

      const webviewUrl = new URL(POWENS_WEBVIEW_URL);
      webviewUrl.searchParams.set('domain', domain);
      webviewUrl.searchParams.set('client_id', POWENS_CLIENT_ID!);
      webviewUrl.searchParams.set('redirect_uri', finalRedirectUri);
      webviewUrl.searchParams.set('state', userId || 'anonymous');
      webviewUrl.searchParams.set('types', 'banks');
      webviewUrl.searchParams.set('connector_uuids', '');

      return new Response(
        JSON.stringify({
          link_token: webviewUrl.toString(),
          expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (pathname.endsWith('/callback') && req.method === 'POST') {
      console.log('\u2705 Callback re\u00e7u');

      // Log complet de la requ\u00eate re\u00e7ue
      console.log('\ud83d\udce5 URL compl\u00e8te:', req.url);
      console.log('\ud83d\udce5 Method:', req.method);
      console.log('\ud83d\udce5 Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));

      const url = new URL(req.url);
      console.log('\ud83d\udce5 Query params:', JSON.stringify(Object.fromEntries(url.searchParams.entries()), null, 2));

      const bodyText = await req.text();
      console.log('\ud83d\udce5 Body (raw):', bodyText);

      let body;
      try {
        body = JSON.parse(bodyText);
        console.log('\ud83d\udce5 Body (parsed):', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('\u26a0\ufe0f Body n\'est pas du JSON valide');
        body = {};
      }

      const { code, userId } = body;
      console.log('\ud83d\udce5 Code extrait:', code);
      console.log('\ud83d\udce5 UserId extrait:', userId);
      console.log('\ud83d\udce5 Code length:', code?.length);

      const tokenData = await callPowensAPI('/auth/token/code', 'POST', undefined, {
        code,
      });

      console.log('Token received from Powens');
      const accessToken = tokenData.access_token;

      const userInfoData = await callPowensAPI('/users/me', 'GET', accessToken);

      const connectionsData = await callPowensAPI(
        `/users/${userInfoData.id}/connections`,
        'GET',
        accessToken
      );

      let institutionName = 'Banque';
      let accountId = 'unknown';

      if (connectionsData.connections && connectionsData.connections.length > 0) {
        const firstConnection = connectionsData.connections[0];
        institutionName = firstConnection.bank_name || 'Banque';

        const accountsData = await callPowensAPI(
          `/users/${userInfoData.id}/accounts`,
          'GET',
          accessToken
        );

        if (accountsData.accounts && accountsData.accounts.length > 0) {
          accountId = accountsData.accounts[0].id.toString();
        }
      }

      const { data: connection, error: dbError } = await supabase
        .from('bank_connections')
        .insert({
          user_id: userId,
          requisition_id: userInfoData.id.toString(),
          account_id: accountId,
          institution_id: 'powens',
          institution_name: institutionName,
          access_token: accessToken,
          refresh_token: tokenData.refresh_token || null,
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
          account_id: accountId,
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
        .select('access_token, requisition_id')
        .eq('id', connectionId)
        .single();

      if (connError || !connection) {
        throw new Error('Connection not found');
      }

      const accountsData = await callPowensAPI(
        `/users/${connection.requisition_id}/accounts`,
        'GET',
        connection.access_token
      );

      const accounts = (accountsData.accounts || []).map((account: any) => ({
        id: account.id.toString(),
        name: account.name || account.bank_name,
        mask: account.number ? account.number.slice(-4) : undefined,
        type: account.type || 'checking',
        subtype: account.type,
        institution_name: account.bank_name,
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
        .select('access_token, requisition_id')
        .eq('id', connectionId)
        .single();

      if (connError || !connection) {
        throw new Error('Connection not found');
      }

      const accountsData = await callPowensAPI(
        `/users/${connection.requisition_id}/accounts`,
        'GET',
        connection.access_token
      );

      if (!accountsData.accounts || accountsData.accounts.length === 0) {
        return new Response(
          JSON.stringify({ transactions: [] }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const accountId = accountsData.accounts[0].id;

      const params = new URLSearchParams();
      if (startDate) params.append('min_date', startDate);
      if (endDate) params.append('max_date', endDate);

      const transactionsData = await callPowensAPI(
        `/users/${connection.requisition_id}/accounts/${accountId}/transactions?${params.toString()}`,
        'GET',
        connection.access_token
      );

      const transactions = (transactionsData.transactions || []).map((tx: any) => ({
        id: tx.id.toString(),
        amount: Math.abs(tx.value),
        date: tx.date || tx.rdate,
        description: tx.wording || tx.original_wording || '',
        pending: tx.coming || false,
        sender_name: tx.simplified_wording || tx.wording,
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
        .single();

      if (connError || !connection) {
        throw new Error('Connection not found');
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Synchronisation r\u00e9ussie' }),
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

      await supabase
        .from('bank_connections')
        .update({ status: 'revoked' })
        .eq('id', connection_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Connexion r\u00e9voqu\u00e9e' }),
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
    console.error('\u274c Erreur callback:', error);
    console.error('Error in powens-connect function:', error);
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