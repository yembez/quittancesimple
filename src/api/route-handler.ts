// Handler pour l'API d'envoi de quittance
import { sendQuittanceByEmail } from './send-quittance';

export async function handleSendQuittance(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const data = await request.json();
    
    // Validation des données requises
    if (!data.baillorEmail || !data.baillorName) {
      return new Response('Email et nom du bailleur requis', { status: 400 });
    }

    const result = await sendQuittanceByEmail(data);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erreur API:', error);
    return new Response('Erreur serveur', { status: 500 });
  }
}

// Pour Vite, on peut créer un mock de l'API en développement
if (import.meta.env.DEV) {
  // Mock de l'API pour les tests en développement
  const originalFetch = window.fetch;
  window.fetch = async (url, options) => {
    if (typeof url === 'string' && url.includes('/api/send-quittance')) {
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = JSON.parse(options?.body as string);
      console.log('Données de quittance reçues:', data);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Quittance envoyée avec succès à ${data.baillorEmail}` 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return originalFetch(url, options);
  };
}