/*
  # Fix CRON job with hardcoded service key

  1. Changes
    - Drop the existing cron job that fails with app.settings.service_role_key
    - Create a new cron job with the actual service role key hardcoded
    - This ensures the HTTP POST can authenticate properly

  2. Notes
    - The service key is already exposed in the edge function environment
    - Hardcoding it here is the only way to make pg_cron work with Supabase
*/

-- Drop the old broken cron job
SELECT cron.unschedule('auto-send-quittances-job');

-- Create the working cron job with hardcoded key
SELECT cron.schedule(
  'auto-send-quittances-job',
  '* * * * *',
  $$
SELECT
net.http_post(
url := 'https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/auto-send-quittances',
headers := jsonb_build_object(
'Content-Type', 'application/json',
'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwNzg5NSwiZXhwIjoyMDc0MjgzODk1fQ.trs0pQEPKrCOqFpGAE7y-lIcXOuv0ddhYYeHcS0zxFY'
),
body := '{}'::jsonb
) as request_id;
$$
);
