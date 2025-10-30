/*
  # Update CRON job to run every minute

  1. Purpose
    - Update the CRON job to run every minute instead of every 5 minutes
    - This allows for precise minute-by-minute scheduling
  
  2. Configuration
    - New schedule: every minute
    - Maintains same functionality
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
      url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-send-quittances',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);