import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Activity } from 'lucide-react';


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const POWENS_CLIENT_ID = Deno.env.get("POWENS_CLIENT_ID") || "60173880";
const POWENS_CLIENT_SECRET = Deno.env.get("POWENS_CLIENT_SECRET") || "FtoUDbzunKXr/j702RojXWF/48mBo/cY";
const POWENS_API_URL =
  Deno.env.get("POWENS_API_URL") || "https://quittancesimple-sandbox.biapi.pro";
const POWENS_WEBVIEW_URL =
  Deno.env.get("POWENS_WEBVIEW_URL") || "https://webview.powens.com/fr/connect";

const auth = () => {
  const credentials = `${POWENS_CLIENT_ID}:${POWENS_CLIENT_SECRET}`;
  const encoded = btoa(credentials);
  console.log("🔑 Auth credentials:", {
    client_id: POWENS_CLIENT_ID,
    secret_length: POWENS_CLIENT_SECRET?.length,
    encoded_length: encoded.length,
  });
  return `Basic ${encoded}`;
};

async function callAPI(
  endpoint: string,
  method: string,
  token?: string,
  body?: any,
) {
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  else headers["Authorization"] = auth();
  const opts: any = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  console.log(
    `Calling ${POWENS_API_URL}${endpoint}`,
    method,
    token ? "with token" : "with basic auth",
  );
  const r = await fetch(`${POWENS_API_URL}${endpoint}`, opts);
  if (!r.ok) {
    const errorText = await r.text();
    console.error(`API error ${r.status}:`, errorText);
    throw new Error(`API error: ${r.status} - ${errorText}`);
  }
  return await r.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    console.log("Request:", req.method, pathname);

    // -------------------------------------------------------------------------
    // 1) WEBHOOK POWENS → /callback  (TRANSACTIONS_CLUSTERED / CONNECTION_SYNCED / ACCOUNT_SYNCED)
    // -------------------------------------------------------------------------
    if (pathname.endsWith("/callback") && req.method === "POST") {
      const body = await req.json();

      // Log brut du webhook
      await supabase.from("powens_callback_logs").insert({
        event_type: "webhook_received",
        request_method: req.method,
        request_url: req.url,
        request_headers: Object.fromEntries(req.headers.entries()),
        request_body: body,
      });

      console.log(
        "📩 Powens webhook received (truncated):",
        JSON.stringify(body).slice(0, 1000),
      );

      // -----------------------------
      // Extraire accounts + connectionId selon le FORMAT
      // -----------------------------
      let accounts: any[] = [];
      let connectionId: string | null = null;

      // FORMAT 1 : {"connection": { "id": ..., "accounts":[...] }}
      if (body?.connection?.accounts) {
        accounts = body.connection.accounts;
        connectionId = body.connection.id?.toString() ?? null;
      }
      // FORMAT 2 : un seul Account avec { id, transactions: [...] }
      else if (body?.transactions && body?.id) {
        accounts = [body];
        // certains payloads Powens ajoutent id_connection / connection_id
        if (body.id_connection) {
          connectionId = body.id_connection.toString();
        } else if (body.connection_id) {
          connectionId = body.connection_id.toString();
        } else {
          connectionId = null;
        }
      }
      // FORMAT 3 : cluster → {"cluster": { "id":..., "accounts":[...] }}
      else if (body?.cluster?.accounts) {
        accounts = body.cluster.accounts;
        connectionId = body.cluster.id?.toString() ?? null;
      }

      console.log("🔎 Extracted accounts count:", accounts.length);
      console.log("🔎 Extracted connectionId:", connectionId);

      if (!accounts.length) {
        console.log("⚠️ No accounts found in webhook payload");
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      // -----------------------------
      // Retrouver la bank_connection QS correspondante
      // -----------------------------
      let conn: any = null;

      // 1) Si on a un connectionId → match sur requisition_id (où on stocke l'id de connection Powens)
      if (connectionId) {
        const { data, error } = await supabase
          .from("bank_connections")
          .select("*")
          .eq("requisition_id", connectionId)
          .maybeSingle();

        if (error) {
          console.error("❌ Error fetching bank_connection by requisition_id:", error);
        }
        conn = data;
      }

      // 2) Si pas trouvé, on essaie via account_id (Powens account id)
      if (!conn && accounts[0]?.id) {
        const accountId = accounts[0].id.toString();
        const { data, error } = await supabase
          .from("bank_connections")
          .select("*")
          .eq("account_id", accountId)
          .maybeSingle();

        if (error) {
          console.error("❌ Error fetching bank_connection by account_id:", error);
        }
        conn = data;
      }

      console.log("🔎 Matching bank_connection:", conn);

      if (!conn) {
        console.log(
          "⚠️ No matching bank_connection found for webhook (connectionId or accountId mismatch)",
        );
        return new Response("ok", { status: 200, headers: corsHeaders });
      }
//-------------------------------------------------
console.log("🔄 Fetching real transactions from Powens...");

const powensToken = conn.access_token;
const accountId = conn.account_id;

if (!powensToken || !accountId) {
  console.log("⚠️ Missing Powens token or account id");
  return new Response("ok", { status: 200 });
}

const fromDate = new Date();
fromDate.setMonth(fromDate.getMonth() - 3);
const formattedFromDate = fromDate.toISOString().split("T")[0];

const transactionsUrl = `https://quittancesimple-sandbox.biapi.pro/2.0/users/me/transactions?account_id=${accountId}&limit=200&from=${formattedFromDate}`;

const txRes = await fetch(transactionsUrl, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${powensToken}`,
    "Content-Type": "application/json"
  }
});

if (!txRes.ok) {
  console.log("❌ Failed to fetch transactions:", txRes.status);
  await supabase.from("powens_callback_logs").insert({
    event_type: "transaction_fetch_fail",
    response_status: txRes.status
  });
} else {
  const txData = await txRes.json();
  const txs = txData.transactions || [];

  console.log(`📥 Transactions fetched: ${txs.length}`);

  for (const t of txs) {
    await supabase.from("bank_transactions")
      .upsert({
        bank_connection_id: conn.id,
        account_id: accountId.toString(),
        transaction_id: t.id.toString(),
        date: t.date,
        amount: t.value,
        currency: "EUR",
        description: t.simplified_wording || t.wording || "Sans libellé",
        sender_name: t.counterparty?.name || null,
        raw_data: t
      }, { onConflict: "transaction_id" });
  }
}

console.log("✅ Transactions updated");
//-------------------------------------------------

      // -----------------------------
      // Insérer / upsert les transactions
      // -----------------------------
      let insertedCount = 0;

      for (const acc of accounts) {
        const txs = acc.transactions || [];
        for (const tx of txs) {
          const txId = tx.id?.toString();
          if (!txId) continue;

          const { error } = await supabase.from("bank_transactions").upsert({
  bank_connection_id: conn.id,
  account_id: acc.id?.toString(),
  transaction_id: tx.id?.toString(),
  date: tx.date,
  amount: tx.value ?? tx.amount ?? null,
  currency: "EUR",
  description: tx.wording ?? tx.label ?? "",
  sender_name: tx.counterparty_name ?? null,
  sender_iban: tx.counterparty_iban ?? null,
  raw_data: tx
}, { onConflict: "transaction_id" });


          if (error) {
            console.error(
              "❌ Error inserting transaction",
              txId,
              "-",
              error.message,
            );
            await supabase.from("powens_callback_logs").insert({
              event_type: "transaction_insert_error",
              user_id: conn.user_id,
              error_message: error.message,
              request_body: tx,
            });
          } else {
            insertedCount++;
          }
        }
      }

      console.log(
        `✅ Webhook processed. Inserted/updated transactions: ${insertedCount}`,
      );

      await supabase.from("powens_callback_logs").insert({
        event_type: "webhook_processed",
        user_id: conn.user_id,
        response_status: 200,
        response_body: { insertedCount },
      });

      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // -------------------------------------------------------------------------
    // 2) WEBAUTH (création token permanent + URL webview Powens)
    // -------------------------------------------------------------------------
    if (pathname.endsWith("/webauth") && req.method === "POST") {
      const { userId, redirectUri } = await req.json();
      const finalRedirectUri =
        redirectUri || "https://www.quittancesimple.fr/dashboard";

      console.log("Step 1: Creating permanent user token for userId:", userId);

      const initResponse = await callAPI(
        "/2.0/auth/init",
        "POST",
        undefined,
        {
          client_id: POWENS_CLIENT_ID,
          client_secret: POWENS_CLIENT_SECRET,
        },
      );

      const permanentToken = initResponse.auth_token;
      console.log(
        "✅ Permanent token created:",
        permanentToken.substring(0, 20) + "...",
      );

      const { data: upsertResult, error: upsertError } = await supabase.rpc(
        "upsert_bank_connection",
        {
          p_user_id: userId,
          p_requisition_id: "powens_" + Date.now(),
          p_institution_id: "powens",
          p_institution_name: "En attente de connexion",
          p_access_token: permanentToken,
          p_status: "pending",
        },
      );

      if (upsertError) {
        console.error("❌ Could not store token:", upsertError);
        throw new Error(`Failed to store token: ${upsertError.message}`);
      }
      console.log("✅ Token stored in database:", upsertResult);

      console.log("Step 2: Generating temporary code with permanent token");
      const codeResponse = await callAPI(
        "/2.0/auth/token/code",
        "GET",
        permanentToken,
      );
      const temporaryCode = codeResponse.code;
      console.log(
        "✅ Temporary code generated:",
        temporaryCode.substring(0, 20) + "...",
      );

      const domain = POWENS_API_URL.replace("https://", "").replace(
        "http://",
        "",
      );
      const webviewUrl = new URL(POWENS_WEBVIEW_URL);
      webviewUrl.searchParams.set("domain", domain);
      webviewUrl.searchParams.set("client_id", POWENS_CLIENT_ID!);
      webviewUrl.searchParams.set("redirect_uri", finalRedirectUri);
      webviewUrl.searchParams.set("code", temporaryCode);
      webviewUrl.searchParams.set("state", userId || "anonymous");
      webviewUrl.searchParams.set("types", "banks");

      console.log(
        "✅ Webview URL created:",
        webviewUrl.toString().substring(0, 100) + "...",
      );

      return new Response(
        JSON.stringify({
          link_token: webviewUrl.toString(),
          expiration: new Date(Date.now() + 1800000).toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // -------------------------------------------------------------------------
    // 3) EXCHANGE (callback côté backend après /powens/callback du front)
    // -------------------------------------------------------------------------
    if (pathname.endsWith("/exchange") && req.method === "POST") {
      const { code, userId } = await req.json();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      console.log(
        "Step 4: Exchange callback - code (connection_id from Powens):",
        code,
      );

      const { data: existingConn, error: connError } = await supabase
        .from("bank_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (connError || !existingConn) {
        console.error(
          "No pending connection found for user:",
          userId,
          connError,
        );
        throw new Error(
          "No pending connection found. Please try connecting again.",
        );
      }

      const permanentToken = existingConn.access_token;
      console.log("✅ Found permanent token for user");

      console.log("Fetching connections with permanent token...");
      const connectionsResp = await callAPI(
        "/2.0/users/me/connections",
        "GET",
        permanentToken,
      );

      if (!connectionsResp.connections?.length) {
        throw new Error("No connections found. Please complete the bank connection.");
      }

      const bankConn = connectionsResp.connections[0];
      const connectionId = bankConn.id;
      const institutionName =
        bankConn.bank?.name || bankConn.connector?.name || "Banque";

      console.log("✅ Connection found:", institutionName, "ID:", connectionId);

      const accountsResp = await callAPI(
        "/2.0/users/me/accounts",
        "GET",
        permanentToken,
      );
      const accountId = accountsResp.accounts?.[0]?.id?.toString() || null;

      console.log(
        "✅ Accounts fetched:",
        accountsResp.accounts?.length || 0,
      );

      const { error: updateError } = await supabase
        .from("bank_connections")
        .update({
          requisition_id: connectionId.toString(),
          institution_name: institutionName,
          account_id: accountId,
          status: "active",
        })
        .eq("id", existingConn.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw new Error(`Update failed: ${updateError.message}`);
      }

      console.log("✅ Connection updated in database");

      return new Response(
        JSON.stringify({
          success: true,
          connection_id: existingConn.id,
          institution_name: institutionName,
          account_id: accountId,
          accounts: accountsResp.accounts || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // -------------------------------------------------------------------------
    // 4) SYNC manuel (si besoin)
    // -------------------------------------------------------------------------
    if (pathname.endsWith("/sync") && req.method === "POST") {
      const { connection_id } = await req.json();
      if (!connection_id) {
        return new Response(
          JSON.stringify({ error: "Missing connection_id" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { data: conn, error: connError } = await supabase
        .from("bank_connections")
        .select("*")
        .eq("id", connection_id)
        .single();

      if (connError || !conn) throw new Error("Connection not found");

      const accessToken = conn.access_token;

      const connectionsResp = await callAPI(
        "/2.0/users/me/connections",
        "GET",
        accessToken,
      );
      const accountsResp = await callAPI(
        "/2.0/users/me/accounts",
        "GET",
        accessToken,
      );

      const institutionName =
        connectionsResp.connections?.[0]?.bank?.name ||
        connectionsResp.connections?.[0]?.connector?.name ||
        conn.institution_name;
      const accountId = accountsResp.accounts?.[0]?.id?.toString() ||
        conn.account_id;

      const { error: updateError } = await supabase
        .from("bank_connections")
        .update({
          institution_name: institutionName,
          account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection_id);

      if (updateError) throw new Error(`Update failed: ${updateError.message}`);

      return new Response(
        JSON.stringify({
          success: true,
          institution_name: institutionName,
          account_id: accountId,
          accounts: accountsResp.accounts || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // -------------------------------------------------------------------------
    // 5) GET /connections (si besoin côté front)
    // -------------------------------------------------------------------------
    if (pathname.endsWith("/connections") && req.method === "GET") {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");

      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(
        token,
      );
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { data: connections, error } = await supabase
        .from("bank_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) {
        throw new Error(`Failed to fetch connections: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ connections: connections || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // -------------------------------------------------------------------------
    // Route inconnue
    // -------------------------------------------------------------------------
    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error:", error);
    await supabase.from("powens_callback_logs").insert({
      event_type: "edge_function_error",
      error_message: error.message,
      request_url: req.url,
      request_method: req.method,
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
