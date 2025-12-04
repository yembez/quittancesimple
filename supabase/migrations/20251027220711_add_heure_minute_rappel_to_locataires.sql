/*
  # Add time fields for automated sending

  1. Changes
    - Add `heure_rappel` (integer 0-23) to locataires table
    - Add `minute_rappel` (integer 0-59) to locataires table
    - Set default values: 9:00 AM (9h00)
  
  2. Purpose
    - Allow precise scheduling of automatic quittance sending
    - Enable real-time testing of automation system
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'heure_rappel'
  ) THEN
    ALTER TABLE locataires ADD COLUMN heure_rappel integer DEFAULT 9 CHECK (heure_rappel >= 0 AND heure_rappel <= 23);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'minute_rappel'
  ) THEN
    ALTER TABLE locataires ADD COLUMN minute_rappel integer DEFAULT 0 CHECK (minute_rappel >= 0 AND minute_rappel <= 59);
  END IF;
END $$;