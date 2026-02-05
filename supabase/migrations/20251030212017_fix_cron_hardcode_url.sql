/*
  # Fix CRON job to use hardcoded Supabase URL
  
  1. Purpose
    - Replace current_setting() calls with hardcoded values
    - The CRON job needs direct access to Supabase URL and service key
    - These values are available as environment variables in edge functions but not in CRON
  
  2. Changes
    - Remove dependency on app.settings
    - Use hardcoded Supabase URL from environment
*/

-- Remove existing job
DO $$
BEGIN
  PERFORM cron.unschedule('auto-send-quittances-job');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create new CRON job with hardcoded URL
SELECT cron.schedule(
  'auto-send-quittances-job',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/auto-send-quittances',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwNzg5NSwiZXhwIjoyMDc0MjgzODk1fQ.H_pxOdbV6OG9r_0m98rDLN0BxlzEsaPiLSkmv-DdCVs'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
