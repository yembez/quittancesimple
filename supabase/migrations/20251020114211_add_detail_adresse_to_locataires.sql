/*
  # Add address detail field to locataires

  1. Changes
    - Add `detail_adresse` text column to `locataires` table
      - Optional field for apartment number, room, etc. (e.g., "Chambre 1", "Appt 2")
      - Used for clarity when multiple tenants share the same building address

  2. Security
    - No RLS changes needed (inherits existing policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'detail_adresse'
  ) THEN
    ALTER TABLE locataires ADD COLUMN detail_adresse text;
  END IF;
END $$;
