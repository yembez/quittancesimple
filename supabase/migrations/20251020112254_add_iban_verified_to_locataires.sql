/*
  # Add IBAN verification field to locataires

  1. Changes
    - Add `iban_verified` boolean column to `locataires` table
      - Defaults to false
      - Used to track if the locataire's IBAN has been validated through a confirmed payment
    - This field controls whether automatic sending is available

  2. Security
    - No RLS changes needed (inherits existing policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'iban_verified'
  ) THEN
    ALTER TABLE locataires ADD COLUMN iban_verified boolean DEFAULT false;
  END IF;
END $$;
