export interface BankAccount {
  id: string;
  name: string;
  mask?: string;
  type: string;
  subtype?: string;
  institution_name?: string;
}

export interface BankTransaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  pending: boolean;
  sender_name?: string;
  sender_iban?: string;
}

export interface LinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface AccessTokenResponse {
  access_token: string;
  item_id: string;
}

export interface BankConnectionResult {
  connection_id: string;
  institution_name: string;
  account_id: string;
}

export interface IBankAggregationService {
  createLinkToken(userId: string): Promise<LinkTokenResponse>;

  exchangePublicToken(publicToken: string, userId: string): Promise<BankConnectionResult>;

  getAccounts(connectionId: string): Promise<BankAccount[]>;

  getTransactions(
    connectionId: string,
    startDate: string,
    endDate: string
  ): Promise<BankTransaction[]>;

  syncTransactions(connectionId: string): Promise<void>;

  revokeConnection(connectionId: string): Promise<void>;
}

export type BankAggregationProvider = 'plaid' | 'linxo' | 'bridge' | 'powens';
