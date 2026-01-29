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
  private redirectUri: string;

  constructor() {
    this.apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/powens-connect`;

    // Déterminer automatiquement la bonne URL (dev ou prod)
    this.redirectUri = "https://www.quittancesimple.fr/powens/callback";
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    return {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'apikey': anonKey,
    };
  }

  // ======================================================
  // 🔵 1. Créer le lien de connexion Powens (webauth)
  // ======================================================
  async createLinkToken(userId: string): Promise<LinkTokenResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/webauth`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        redirectUri: this.redirectUri
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Échec de la création du lien de connexion');
    }

    return await response.json();
  }

  // ======================================================
  // 🔵 2. Échanger le code Powens pour un token permanent
  // ======================================================
  async exchangePublicToken(code: string, userId: string): Promise<BankConnectionResult> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/exchange`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code,
        userId,
        redirectUri: this.redirectUri
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Échec de l'échange du code: ${errorText}`);
    }

    const result = await response.json();
    return result;
  }

  async getAccounts(connectionId: string): Promise<BankAccount[]> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.apiUrl}/accounts?connection_id=${connectionId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Échec de la récupération des comptes');
    }

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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Échec de la récupération des transactions');
    }

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
