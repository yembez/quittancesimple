import { supabase } from '../../lib/supabase';
import type {
  IBankAggregationService,
  LinkTokenResponse,
  BankConnectionResult,
  BankAccount,
  BankTransaction,
} from './interface';

class PowernsService implements IBankAggregationService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/powens-connect`;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    // Utiliser l'anon key pour l'authentification de base
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    return {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'apikey': anonKey,
    };
  }

  async createLinkToken(userId: string): Promise<LinkTokenResponse> {
    const headers = await this.getAuthHeaders();

    // Détecter l'URL de redirection basée sur l'environnement actuel
    // Pour WebContainer (URLs .webcontainer-api.io), utiliser toujours la prod
    const isWebContainer = window.location.hostname.includes('webcontainer-api.io');
    const redirectUri = isWebContainer
      ? 'https://app.quittancesimple.fr/dashboard'
      : `${window.location.origin}/dashboard`;

    console.log('🔗 Redirect URI pour Powens:', redirectUri);

    const response = await fetch(`${this.apiUrl}/webauth`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        redirectUri
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de la création du lien de connexion');
    }

    return await response.json();
  }

  async exchangePublicToken(code: string, userId: string): Promise<BankConnectionResult> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/callback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code,
        userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de l\'échange du code');
    }

    return await response.json();
  }

  async getAccounts(connectionId: string): Promise<BankAccount[]> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/accounts?connection_id=${connectionId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de la récupération des comptes');
    }

    const data = await response.json();
    return data.accounts || [];
  }

  async getTransactions(
    connectionId: string,
    startDate: string,
    endDate: string
  ): Promise<BankTransaction[]> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(
      `${this.apiUrl}/transactions?connection_id=${connectionId}&start_date=${startDate}&end_date=${endDate}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de la récupération des transactions');
    }

    const data = await response.json();
    return data.transactions || [];
  }

  async syncTransactions(connectionId: string): Promise<void> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ connection_id: connectionId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de la synchronisation');
    }
  }

  async revokeConnection(connectionId: string): Promise<void> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/revoke`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ connection_id: connectionId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de la révocation');
    }
  }
}

export default new PowernsService();
