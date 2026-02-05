/*
  # Add Octopush SMS credentials to Vault

  1. Purpose
    - Store Octopush API credentials securely in Supabase Vault
    - Set default SMS provider to Octopush
  
  2. Credentials stored
    - octopush_api_key: User login for Octopush API
    - octopush_api_token: API key for Octopush
    - sms_provider: Default SMS provider (octopush)
*/

-- Store Octopush credentials
SELECT vault.create_secret('2speek@gmail.com', 'octopush_api_key');
SELECT vault.create_secret('mQOacltqPuKein0XohFZsvkyrAb38SG9', 'octopush_api_token');
SELECT vault.create_secret('octopush', 'sms_provider');
