/*
  # Setup CRON job for automatic quittance sending

  1. Purpose
    - Creates a pg_cron job that runs every 5 minutes
    - Calls the auto-send-quittances edge function
    - Checks for locataires whose scheduled time matches current time
  
  2. Configuration
    - Runs every 5 minutes
    - Calls edge function via HTTP request
    - Uses service role key for authentication
  
  3. Notes
    - pg_cron extension must be enabled
    - Job will check date_rappel, heure_rappel, and minute_rappel
    - Tolerance within 5 minutes around scheduled time
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if exists (ignore if not exists)
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
      url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-send-quittances',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);