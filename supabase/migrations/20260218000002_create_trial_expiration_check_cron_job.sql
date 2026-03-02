/*
  # Cron : vérification expiration essai gratuit
  
  1. Cron Job
    - Exécution quotidienne à 10:00 UTC (11:00 CET / 12:00 CEST)
    - Appelle l'edge function check-trial-expiration
    - Vérifie les essais expirés et désactive l'accès si pas de paiement
  
  2. Notes
    - S'exécute après les relances (09:00) pour traiter les expirations du jour
    - Désactive l'accès et envoie un email d'expiration si nécessaire
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('check-trial-expiration-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-trial-expiration-daily'
);

SELECT cron.schedule(
  'check-trial-expiration-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/check-trial-expiration',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwNzg5NSwiZXhwIjoyMDc0MjgzODk1fQ.trs0pQEPKrCOqFpGAE7y-lIcXOuv0ddhYYeHcS0zxFY'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
