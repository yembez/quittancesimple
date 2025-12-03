/*
  Update CRON job to run every 5 minutes

  1. Purpose
    - Change CRON from running every minute to every 5 minutes
    - Prevents multiple SMS being sent in quick succession
  
  2. Configuration
    - New schedule: every 5 minutes
*/

-- Remove existing job
DO $$
BEGIN
  PERFORM cron.unschedule('auto-send-quittances-job');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create new CRON job that runs every 5 minutes
SELECT cron.schedule(
  'auto-send-quittances-job',
  '*/5 * * * *',
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