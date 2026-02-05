/*
  # Add Monthly Status Reset CRON Job

  1. Function
    - reset_monthly_status() checks if today is last day of month
    - Resets all locataires statut to 'en_attente'

  2. CRON Job
    - Runs daily at 23:59
    - Calls the function which only acts on last day of month

  3. Notes
    - CRON expression: '59 23 * * *' (every day at 23:59)
    - Function checks if tomorrow is the 1st day of month
*/

-- Create function to reset statuts on last day of month
CREATE OR REPLACE FUNCTION reset_monthly_status()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  tomorrow DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN
  -- Only reset if tomorrow is the 1st (meaning today is last day of month)
  IF EXTRACT(DAY FROM tomorrow) = 1 THEN
    UPDATE locataires
    SET statut = 'en_attente'
    WHERE actif = true;

    RAISE NOTICE 'Monthly status reset completed at %', NOW();
  END IF;
END;
$$;

-- Drop existing CRON job if exists
SELECT cron.unschedule('monthly-status-reset')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'monthly-status-reset'
);

-- Create CRON job to check daily and reset on last day of month
SELECT cron.schedule(
  'monthly-status-reset',
  '59 23 * * *',
  $$ SELECT reset_monthly_status(); $$
);
