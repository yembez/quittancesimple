/*
  # Fix CRON job to use Vault secrets

  1. Purpose
    - Use Supabase Vault to securely store and retrieve service_role_key
    - Remove all hardcoded secrets from migrations
  
  2. Changes
    - Store secrets in Vault
    - Update CRON job to read from Vault
*/

-- Remove existing job
SELECT cron.unschedule('auto-send-quittances-job');

-- Drop the _secrets table if it exists
DROP TABLE IF EXISTS _secrets;

-- Store service role key in Vault (using pgsodium)
-- Note: This assumes the vault is set up. The actual key should be set via Supabase Dashboard

-- Create CRON job that uses Vault to get the service_role_key
SELECT cron.schedule(
  'auto-send-quittances-job',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/auto-send-quittances',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret 
          FROM vault.decrypted_secrets 
          WHERE name = 'service_role_key'
        )
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
