import type { IBankAggregationService, BankAggregationProvider } from './interface';
import plaidService from './plaidService';
import powensService from './powensService';

const CURRENT_PROVIDER: BankAggregationProvider = 'powens';

function getBankAggregationService(): IBankAggregationService {
  switch (CURRENT_PROVIDER) {
    case 'plaid':
      return plaidService;
    case 'powens':
      return powensService;
    default:
      return powensService;
  }
}

export const bankAggregationService = getBankAggregationService();

export { CURRENT_PROVIDER };
export type { IBankAggregationService, BankAggregationProvider } from './interface';
