/*
  Restore CRON job to run every minute

  1. Purpose
    - Change CRON back to running every minute for exact scheduling
    - Function now checks exact match on date, hour, and minute
    - No more time window that caused multiple SMS
  
  2. Configuration
    - Schedule: every minute
*/

-- Remove existing job
DO $$
BEGIN
  PERFORM cron.unschedule('auto-send-quittances-job');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create new CRON job that runs every minute
SELECT cron.schedule(
  'auto-send-quittances-job',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://drgqbgizfdhwpjjfszpt.supabase.co/functions/v1/auto-send-quittances',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);