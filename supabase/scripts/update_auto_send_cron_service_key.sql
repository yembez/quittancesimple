  /*
  Mise à jour du cron auto-send-quittances avec la clé service_role actuelle

  À exécuter dans Supabase : SQL Editor (une seule fois, ou après rotation de la clé).

  1. Va dans Project Settings → API
  2. Copie la clé "service_role" (secret)
  3. Remplace YOUR_SERVICE_ROLE_KEY_HERE ci-dessous par cette clé (coller tout le JWT, sans "Bearer ")
  4. Exécute ce script dans le SQL Editor
*/

SELECT cron.unschedule('auto-send-quittances-job');

SELECT cron.schedule(
  'auto-send-quittances-job',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/auto-send-quittances',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcGJkZHRkYmxxYWthYnlqeGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwNzg5NSwiZXhwIjoyMDc0MjgzODk1fQ.zw8lY_n0fiydg4qFgQIXlPvsXWsm1nXNbmA7F5KnT1U'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
