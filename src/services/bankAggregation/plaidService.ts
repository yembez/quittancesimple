import { supabase } from '../../lib/supabase';
import type {
  IBankAggregationService,
  LinkTokenResponse,
  BankConnectionResult,
  BankAccount,
  BankTransaction,
} from './interface';

class PlaidService implements IBankAggregationService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plaid-connect`;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Non authentifié');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async createLinkToken(userId: string): Promise<LinkTokenResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/link-token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de la création du token de connexion');
    }

    return await response.json();
  }

  async exchangePublicToken(publicToken: string, userId: string): Promise<BankConnectionResult> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/exchange-token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        public_token: publicToken,
        userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de l\'échange du token');
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

export default new PlaidService();
