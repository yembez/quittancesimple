/*
  # Fix CRON job to use net.http_post (correct schema)

  1. Purpose
    - Update CRON job to use net.http_post (not extensions.http_post)
    - pg_net creates the 'net' schema automatically
  
  2. Changes
    - Replace extensions.http_post with net.http_post
*/

-- Remove existing job
SELECT cron.unschedule('auto-send-quittances-job');

-- Create new CRON job with correct function
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
