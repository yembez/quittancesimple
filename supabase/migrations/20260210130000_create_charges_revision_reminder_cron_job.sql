/*
  # Cron : rappels révision des charges

  1. Cron Job
    - Exécution quotidienne à 08:00 UTC (09:00 CET / 10:00 CEST)
    - Appelle l'edge function send-charges-revision-reminder-email
    - Envoie un e-mail aux propriétaires dont reminder_date = aujourd'hui (table charges_revision_reminders)

  2. Notes
    - Même principe que send-irl-reminder-emails-daily
    - Utilise pg_cron et net.http_post pour appeler la fonction
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('send-charges-revision-reminder-emails-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-charges-revision-reminder-emails-daily'
);

SELECT cron.schedule(
  'send-charges-revision-reminder-emails-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/send-charges-revision-reminder-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwNzg5NSwiZXhwIjoyMDc0MjgzODk1fQ.trs0pQEPKrCOqFpGAE7y-lIcXOuv0ddhYYeHcS0zxFY'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
