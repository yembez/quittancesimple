/*
  # Create IRL Reminder Cron Job
  
  1. New Cron Job
    - Creates a scheduled task that runs daily at 08:00 UTC
    - Calls the send-irl-reminder-email edge function
    - Sends reminder emails to users whose reminder_date is today
  
  2. Important Notes
    - Uses pg_cron extension to schedule the task
    - Runs every day at 08:00 UTC (09:00 CET / 10:00 CEST)
    - Calls the edge function via HTTP request
*/

-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing cron job if it exists
SELECT cron.unschedule('send-irl-reminder-emails-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-irl-reminder-emails-daily'
);

-- Create cron job to send IRL reminder emails daily at 08:00 UTC
SELECT cron.schedule(
  'send-irl-reminder-emails-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gqybhqvdxdycjhgvwzaz.supabase.co/functions/v1/send-irl-reminder-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeWJocXZkeGR5Y2poZ3Z3emF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzI4NjU5NSwiZXhwIjoyMDQyODYyNTk1fQ.GkrZ-j3tJzShohIRnl3H3k_lnALVjy0pMr9j2KIBaG8'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
