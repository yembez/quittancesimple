import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function logEvent(type: string, payload: any) {
  try {
    await supabase.from("powens_callback_logs").insert({
      event_type: type,
      request_body: payload,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Failed to log event:", err);
  }
}

async function insertTransaction(bank_connection_id: string, account_id: string, t: any) {
  try {
    const { error } = await supabase.from("bank_transactions").insert({
      bank_connection_id,
      account_id,
      transaction_id: t.id?.toString() || null,
      date: t.date || null,
      amount: t.value ?? null,
      currency: t.currency || "EUR",
      description: t.label || t.original_wording || "—",
      sender_name: t.sender?.name || null,
      sender_iban: t.sender?.iban || null,
      raw_data: t,
    });

    if (error) console.error("❌ Insert error:", error);
  } catch (err) {
    console.error("❌ Transaction insert failed:", err);
  }
}

async function processEvent(body: any) {
  if (!body?.connection?.id) {
    console.warn("⚠️ No connection ID in webhook");
    return;
  }

  const connectionPowensId = body.connection.id.toString();

  const { data: conn, error } = await supabase
    .from("bank_connections")
    .select("*")
    .eq("requisition_id", connectionPowensId)
    .single();

  if (error || !conn) {
    console.warn("⚠️ No matching bank_connection found for Powens ID:", connectionPowensId);
    return;
  }

  const bank_connection_id = conn.id;

  await supabase
    .from("bank_connections")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", bank_connection_id);

  for (const acc of body.connection.accounts || []) {
    const account_id = acc.id?.toString();

    if (!acc.transactions?.length) continue;

    for (const t of acc.transactions) {
      await insertTransaction(bank_connection_id, account_id, t);
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();

    console.log("⚡ Powens webhook received:", body?.type);
    await logEvent(`webhook_${body?.type || "unknown"}`, body);

    if (
      body.type === "ACCOUNT_SYNCED" ||
      body.type === "CONNECTION_SYNCED" ||
      body.type === "TRANSACTIONS_CLUSTERED"
    ) {
      await processEvent(body);
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    await logEvent("webhook_error", { error: err.message });

    return new Response("Internal Error", { status: 500 });
  }
});