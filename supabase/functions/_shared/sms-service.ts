/**
 * SMS Service Abstraction Layer
 *
 * Supports multiple SMS providers:
 * - SMSMode (default, cost-effective, whitelisted)
 * - SMS.to (backup, reliable)
 * - Octopush (backup)
 * - Twilio (backup, widely used)
 * - Brevo (legacy, expensive)
 *
 * Configuration via Supabase Vault secrets:
 * - sms_provider: 'smsmode' | 'smsto' | 'octopush' | 'twilio' | 'brevo' (default: 'smsmode')
 *
 * SMS.to:
 * - smsto_api_key
 *
 * SMSMode:
 * - smsmode_api_key
 *
 * Octopush:
 * - octopush_api_key (User Login)
 * - octopush_api_token (API Key)
 *
 * Twilio:
 * - twilio_account_sid
 * - twilio_auth_token
 * - twilio_phone_number
 *
 * Brevo:
 * - brevo_api_key
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

export interface SMSMessage {
  to: string;
  message: string;
  sender?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

/**
 * Get secret from Supabase Vault
 */
async function getSecret(name: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .rpc('get_secret', { secret_name: name });

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

/**
 * SMS.to SMS Provider
 * Documentation: https://sms.to/docs/
 */
async function sendViaSMSTo(msg: SMSMessage): Promise<SMSResult> {
  const apiKey = await getSecret('smsto_api_key');

  console.log('SMS.to credentials:', { apiKey: apiKey ? 'found' : 'not found' });

  if (!apiKey) {
    return {
      success: false,
      error: 'SMS.to credentials not configured (smsto_api_key)',
      provider: 'smsto'
    };
  }

  try {
    const response = await fetch('https://api.sms.to/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: msg.to,
        message: msg.message,
        sender_id: msg.sender || 'QuittanceS',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('SMS.to API error:', data);
      return {
        success: false,
        error: `SMS.to API error: ${JSON.stringify(data)}`,
        provider: 'smsto'
      };
    }

    return {
      success: true,
      messageId: data.message_id || data.data?.message_id,
      provider: 'smsto'
    };
  } catch (error) {
    console.error('SMS.to error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'smsto'
    };
  }
}

/**
 * SMSMode SMS Provider
 * Documentation: https://www.smsmode.com/api-sms/
 */
async function sendViaSMSMode(msg: SMSMessage): Promise<SMSResult> {
  const apiKey = await getSecret('smsmode_api_key');

  console.log('SMSMode credentials:', { apiKey: apiKey ? 'found' : 'not found' });

  if (!apiKey) {
    return {
      success: false,
      error: 'SMSMode credentials not configured (smsmode_api_key)',
      provider: 'smsmode'
    };
  }

  try {
    const params = new URLSearchParams({
      accessToken: apiKey,
      message: msg.message,
      numero: msg.to,
      emetteur: msg.sender || 'QuittanceS',
    });

    const response = await fetch('https://api.smsmode.com/http/1.6/sendSMS.do', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();

    if (!response.ok || responseText.includes('|') || !responseText.match(/^0\s*$/)) {
      console.error('SMSMode API error:', responseText);
      return {
        success: false,
        error: `SMSMode API error: ${responseText}`,
        provider: 'smsmode'
      };
    }

    return {
      success: true,
      messageId: responseText,
      provider: 'smsmode'
    };
  } catch (error) {
    console.error('SMSMode error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'smsmode'
    };
  }
}

/**
 * Octopush SMS Provider
 * Documentation: https://www.octopush.com/en/sms-api
 */
async function sendViaOctopush(msg: SMSMessage): Promise<SMSResult> {
  const apiKey = await getSecret('octopush_api_key');
  const apiToken = await getSecret('octopush_api_token');

  console.log('Octopush credentials:', { apiKey: apiKey ? 'found' : 'not found', apiToken: apiToken ? 'found' : 'not found' });

  if (!apiKey || !apiToken) {
    return {
      success: false,
      error: 'Octopush credentials not configured (octopush_api_key, octopush_api_token)',
      provider: 'octopush'
    };
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
        recipients: [{ phone_number: msg.to }],
        text: msg.message,
        type: 'sms_premium',
        purpose: 'alert',
        sender: msg.sender || 'QuittanceS',
        with_replies: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Octopush API error:', data);
      return {
        success: false,
        error: `Octopush API error: ${JSON.stringify(data)}`,
        provider: 'octopush'
      };
    }

    return {
      success: true,
      messageId: data.sms_ticket,
      provider: 'octopush'
    };
  } catch (error) {
    console.error('Octopush error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'octopush'
    };
  }
}

/**
 * Twilio SMS Provider
 * Documentation: https://www.twilio.com/docs/sms/api
 */
async function sendViaTwilio(msg: SMSMessage): Promise<SMSResult> {
  const accountSid = await getSecret('twilio_account_sid');
  const authToken = await getSecret('twilio_auth_token');
  const fromNumber = await getSecret('twilio_phone_number');

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: 'Twilio credentials not configured (twilio_account_sid, twilio_auth_token, twilio_phone_number)',
      provider: 'twilio'
    };
  }

  try {
    const credentials = btoa(`${accountSid}:${authToken}`);
    const params = new URLSearchParams({
      To: msg.to,
      From: fromNumber,
      Body: msg.message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);
      return {
        success: false,
        error: `Twilio API error: ${JSON.stringify(data)}`,
        provider: 'twilio'
      };
    }

    return {
      success: true,
      messageId: data.sid,
      provider: 'twilio'
    };
  } catch (error) {
    console.error('Twilio error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'twilio'
    };
  }
}

/**
 * Brevo SMS Provider (Legacy)
 * Documentation: https://developers.brevo.com/reference/sendtransacsms
 */
async function sendViaBrevo(msg: SMSMessage): Promise<SMSResult> {
  const apiKey = await getSecret('brevo_api_key');

  if (!apiKey) {
    return {
      success: false,
      error: 'Brevo API key not configured (brevo_api_key)',
      provider: 'brevo'
    };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: msg.sender || 'QuittanceS',
        recipient: msg.to,
        content: msg.message,
        type: 'transactional',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API error:', data);
      return {
        success: false,
        error: `Brevo API error: ${JSON.stringify(data)}`,
        provider: 'brevo'
      };
    }

    return {
      success: true,
      messageId: data.reference,
      provider: 'brevo'
    };
  } catch (error) {
    console.error('Brevo error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'brevo'
    };
  }
}

/**
 * Generic SMS Sending Function
 *
 * Automatically selects the configured provider based on SMS_PROVIDER env var.
 * Falls back to other providers if the primary one fails.
 *
 * @param message - SMS message details
 * @returns Promise<SMSResult> - Result of SMS sending operation
 */
export async function sendSMS(message: SMSMessage): Promise<SMSResult> {
  const provider = (await getSecret('sms_provider') || 'smsmode').toLowerCase();

  console.log(`📱 Attempting to send SMS via ${provider}...`);

  let result: SMSResult;

  switch (provider) {
    case 'smsmode':
      result = await sendViaSMSMode(message);
      if (!result.success) {
        console.warn('SMSMode failed, trying SMS.to...');
        result = await sendViaSMSTo(message);
        if (!result.success) {
          console.warn('SMS.to failed, trying Octopush...');
          result = await sendViaOctopush(message);
          if (!result.success) {
            console.warn('Octopush failed, trying Twilio...');
            result = await sendViaTwilio(message);
            if (!result.success) {
              console.warn('Twilio failed, trying Brevo...');
              result = await sendViaBrevo(message);
            }
          }
        }
      }
      break;

    case 'smsto':
      result = await sendViaSMSTo(message);
      if (!result.success) {
        console.warn('SMS.to failed, trying SMSMode...');
        result = await sendViaSMSMode(message);
        if (!result.success) {
          console.warn('SMSMode failed, trying Octopush...');
          result = await sendViaOctopush(message);
          if (!result.success) {
            console.warn('Octopush failed, trying Twilio...');
            result = await sendViaTwilio(message);
            if (!result.success) {
              console.warn('Twilio failed, trying Brevo...');
              result = await sendViaBrevo(message);
            }
          }
        }
      }
      break;

    case 'octopush':
      result = await sendViaOctopush(message);
      if (!result.success) {
        console.warn('Octopush failed, trying Twilio...');
        result = await sendViaTwilio(message);
        if (!result.success) {
          console.warn('Twilio failed, trying Brevo...');
          result = await sendViaBrevo(message);
        }
      }
      break;

    case 'twilio':
      result = await sendViaTwilio(message);
      if (!result.success) {
        console.warn('Twilio failed, trying Octopush...');
        result = await sendViaOctopush(message);
        if (!result.success) {
          console.warn('Octopush failed, trying Brevo...');
          result = await sendViaBrevo(message);
        }
      }
      break;

    case 'brevo':
      result = await sendViaBrevo(message);
      if (!result.success) {
        console.warn('Brevo failed, trying Octopush...');
        result = await sendViaOctopush(message);
        if (!result.success) {
          console.warn('Octopush failed, trying Twilio...');
          result = await sendViaTwilio(message);
        }
      }
      break;

    default:
      result = {
        success: false,
        error: `Unknown SMS provider: ${provider}. Valid options: smsto, smsmode, octopush, twilio, brevo`,
      };
  }

  if (result.success) {
    console.log(`✅ SMS sent successfully via ${result.provider} - ID: ${result.messageId}`);
  } else {
    console.error(`❌ All SMS providers failed: ${result.error}`);
  }

  return result;
}
