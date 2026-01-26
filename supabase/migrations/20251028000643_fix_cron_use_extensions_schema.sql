/*
  # Fix CRON job to use extensions.http_post

  1. Purpose
    - Update CRON job to use the correct schema for pg_net
    - pg_net is installed in the 'extensions' schema, not 'net'
  
  2. Changes
    - Replace net.http_post with extensions.http_post
*/

-- Remove existing job
SELECT cron.unschedule('auto-send-quittances-job');

-- Create new CRON job with correct schema
SELECT cron.schedule(
  'auto-send-quittances-job',
  '* * * * *',
  $$
  SELECT
    extensions.http_post(
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
