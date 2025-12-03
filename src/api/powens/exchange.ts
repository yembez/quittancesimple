import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, user_id } = req.body;

  if (!code || !user_id) {
    return res.status(400).json({ error: 'Missing code or user_id' });
  }

  try {
    const response = await fetch(`${process.env.POWENS_API_URL}/2.0/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.POWENS_CLIENT_ID,
        client_secret: process.env.POWENS_CLIENT_SECRET,
        code
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.description || 'Exchange failed' });
    }

    const accessToken = data.access_token;

    // Fetch connection details
    const me = await fetch(`${process.env.POWENS_API_URL}/2.0/users/me/connections?expand=bank,accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(r => r.json());

    return res.status(200).json({
      success: true,
      connection_id: me.connections[0]?.id,
      institution_name: me.connections[0]?.bank?.name || 'Banque',
      account_id: me.connections[0]?.accounts?.[0]?.id,
      powens_token: accessToken
    });

  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
