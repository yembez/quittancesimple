import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RegisteredMailRequest {
  type: 'electronique' | 'postal';
  recipient: {
    name: string;
    address: string;
    email?: string;
  };
  sender: {
    name: string;
    address: string;
    email: string;
  };
  document: {
    content: string;
    filename: string;
  };
  subject: string;
}

async function sendElectronicMail(request: RegisteredMailRequest) {
  const ar24Token = Deno.env.get('AR24_API_TOKEN');

  if (!ar24Token) {
    throw new Error('AR24 API token not configured');
  }

  const payload = {
    recipient_email: request.recipient.email,
    recipient_name: request.recipient.name,
    sender_name: request.sender.name,
    sender_email: request.sender.email,
    subject: request.subject,
    content: request.document.content,
    content_type: 'text/html',
  };

  const response = await fetch('https://api.ar24.fr/api/v1/letters/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ar24Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AR24 API error: ${error}`);
  }

  return await response.json();
}

async function sendPostalMail(request: RegisteredMailRequest) {
  const mailevaToken = Deno.env.get('MAILEVA_API_TOKEN');

  if (!mailevaToken) {
    throw new Error('Maileva API token not configured');
  }

  const payload = {
    recipient: {
      name: request.recipient.name,
      address_line_1: request.recipient.address.split(',')[0],
      address_line_2: request.recipient.address.split(',').slice(1).join(','),
    },
    sender: {
      name: request.sender.name,
      address_line_1: request.sender.address.split(',')[0],
      address_line_2: request.sender.address.split(',').slice(1).join(','),
    },
    document: {
      content_base64: btoa(request.document.content),
      filename: request.document.filename,
    },
    options: {
      registered: true,
      acknowledgment_of_receipt: true,
    },
  };

  const response = await fetch('https://api.maileva.com/v2/letters', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mailevaToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Maileva API error: ${error}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const request: RegisteredMailRequest = await req.json();

    let result;
    if (request.type === 'electronique') {
      result = await sendElectronicMail(request);
    } else {
      result = await sendPostalMail(request);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `Courrier recommandé ${request.type} envoyé avec succès`,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending registered mail:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
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
