/*
  # Cron : relances essai gratuit
  
  1. Cron Job
    - Exécution quotidienne à 09:00 UTC (10:00 CET / 11:00 CEST)
    - Appelle l'edge function send-trial-reminder-email
    - Envoie les e-mails de relance aux propriétaires en période d'essai
  
  2. Notes
    - Utilise pg_cron et net.http_post pour appeler la fonction
    - Vérifie automatiquement les jours restants et envoie la relance appropriée
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('send-trial-reminder-emails-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-trial-reminder-emails-daily'
);

SELECT cron.schedule(
  'send-trial-reminder-emails-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/send-trial-reminder-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwNzg5NSwiZXhwIjoyMDc0MjgzODk1fQ.trs0pQEPKrCOqFpGAE7y-lIcXOuv0ddhYYeHcS0zxFY'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
