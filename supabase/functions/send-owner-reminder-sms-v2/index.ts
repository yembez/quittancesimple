import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getSecret(name: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.rpc('get_secret', { secret_name: name });

    if (error) {
      console.error(`Error fetching secret ${name}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error accessing Vault for ${name}:`, error);
    return null;
  }
}

async function sendViaSMSTo(telephone: string, message: string) {
  const apiKey = await getSecret('smsto_api_key');

  if (!apiKey) {
    return { success: false, error: 'SMS.to API key not configured', provider: 'smsto' };
  }

  try {
    const response = await fetch('https://api.sms.to/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: telephone,
        message: message,
        sender_id: 'QuittanceS',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('SMS.to API error:', data);
      return { success: false, error: `SMS.to error: ${JSON.stringify(data)}`, provider: 'smsto' };
    }

    return { success: true, messageId: data.message_id || data.data?.message_id, provider: 'smsto' };
  } catch (error) {
    console.error('SMS.to error:', error);
    return { success: false, error: error.message, provider: 'smsto' };
  }
}

async function sendViaSMSMode(telephone: string, message: string) {
  const apiKey = await getSecret('smsmode_api_key');

  if (!apiKey) {
    return { success: false, error: 'SMSMode API key not configured', provider: 'smsmode' };
  }

  try {
    const params = new URLSearchParams({
      accessToken: apiKey,
      message: message,
      numero: telephone,
      emetteur: 'QuittanceS',
    });

    const response = await fetch('https://api.smsmode.com/http/1.6/sendSMS.do', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text().then(t => t.trim());

    console.log('SMSMode response:', responseText);

    if (!response.ok || (responseText !== '0' && !responseText.startsWith('0 |'))) {
      console.error('SMSMode API error:', responseText);
      return { success: false, error: `SMSMode error: ${responseText}`, provider: 'smsmode' };
    }

    console.log('✅ SMSMode success!');
    return { success: true, messageId: responseText, provider: 'smsmode' };
  } catch (error) {
    console.error('SMSMode error:', error);
    return { success: false, error: error.message, provider: 'smsmode' };
  }
}

async function sendViaOctopush(telephone: string, message: string) {
  const apiKey = await getSecret('octopush_api_key');
  const apiToken = await getSecret('octopush_api_token');

  if (!apiKey || !apiToken) {
    return { success: false, error: 'Octopush credentials not configured', provider: 'octopush' };
  }

  try {
    const credentials = btoa(`${apiKey}:${apiToken}`);

    const response = await fetch('https://api.octopush.com/v1/public/sms-campaign/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        recipients: [{ phone_number: telephone }],
        text: message,
        type: 'sms_premium',
        purpose: 'alert',
        sender: 'QuittanceS',
        with_replies: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Octopush API error:', data);
      return { success: false, error: `Octopush error: ${JSON.stringify(data)}`, provider: 'octopush' };
    }

    return { success: true, messageId: data.sms_ticket, provider: 'octopush' };
  } catch (error) {
    console.error('Octopush error:', error);
    return { success: false, error: error.message, provider: 'octopush' };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      telephone,
      proprietaireName,
      locataireName,
      shortCode,
      montantTotal
    } = await req.json();

    console.log('📱 SMS request received:', { telephone, shortCode });

    const appUrl = (Deno.env.get('APP_URL') || 'quittancesimple.fr').replace(/^https?:\/\//, '');
    const shortLink = `${appUrl}/c/${shortCode}`;

    const message = `Loyer ${locataireName} ${montantTotal}EUR recu ?\n${shortLink}`;

    console.log('📤 Sending SMS via SMSMode...');
    console.log(`📝 Message (${message.length} chars):`, message);

    let result = await sendViaSMSMode(telephone, message);

    if (!result.success) {
      console.warn('⚠️ SMSMode failed, trying SMS.to...', result.error);
      result = await sendViaSMSTo(telephone, message);

      if (!result.success) {
        console.warn('⚠️ SMS.to failed, trying Octopush...', result.error);
        result = await sendViaOctopush(telephone, message);
      }
    }

    if (!result.success) {
      console.error('❌ All SMS providers failed:', result.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          provider: result.provider
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    console.log(`✅ SMS sent successfully via ${result.provider}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          messageId: result.messageId,
          provider: result.provider,
          recipient: telephone
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});