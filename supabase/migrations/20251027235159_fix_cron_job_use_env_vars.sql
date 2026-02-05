/*
  # Fix CRON job to use environment variables

  1. Purpose
    - Remove hardcoded service_role_key from cron job
    - Use Supabase environment variables instead
  
  2. Changes
    - Use current_setting('app.settings.service_role_key') to get the key
*/

-- Remove existing job
SELECT cron.unschedule('auto-send-quittances-job');

-- Create new CRON job using environment variables
SELECT cron.schedule(
  'auto-send-quittances-job',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-send-quittances',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
