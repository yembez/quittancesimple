/*
  # Configure Powens API Credentials

  This migration adds the Powens credentials to Supabase Vault for secure storage.
  
  ## Credentials Configured
  - POWENS_CLIENT_ID: 60173880
  - POWENS_CLIENT_SECRET: FtoUDbzunKXr/j702RojXWF/48mBo/cY  
  - POWENS_API_URL: https://quittancesimple-sandbox.biapi.pro
  
  These will be available as environment variables in Edge Functions.
*/

-- Store Powens credentials in vault
SELECT vault.create_secret('60173880', 'POWENS_CLIENT_ID');
SELECT vault.create_secret('FtoUDbzunKXr/j702RojXWF/48mBo/cY', 'POWENS_CLIENT_SECRET');
SELECT vault.create_secret('https://quittancesimple-sandbox.biapi.pro', 'POWENS_API_URL');
