/*
  # Add SMSMode SMS credentials to Vault

  1. Purpose
    - Store SMSMode API credentials securely in Supabase Vault
    - Set default SMS provider to SMSMode
  
  2. Credentials stored
    - smsmode_api_key: API key for SMSMode
    - sms_provider: Default SMS provider (smsmode)
*/

-- Store SMSMode API key
SELECT vault.create_secret('EiSUM4Mhj8MUWCJPTRygslRyAlNZRJum', 'smsmode_api_key');

-- Update SMS provider to SMSMode (using UUID from existing secret)
SELECT vault.update_secret(
  '14bb84d3-ef7e-4bc9-a041-f4e807aceecb',
  'sms_provider',
  'smsmode'
);
