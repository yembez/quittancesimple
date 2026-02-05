/*
  # Add secure IBAN storage to locataires table

  1. Changes
    - Add `iban_hash` text column: stores SHA256 hash of full IBAN (for exact matching)
    - Add `iban_last_digits` text column: stores encrypted last 4-6 digits (for partial matching)
    - Add `iban_display` text column: stores masked IBAN for display (e.g., "••••90189")
    - Keep existing `iban_verified` boolean column

  2. Security
    - `iban_hash`: Non-reversible hash for secure matching
    - `iban_last_digits`: Encrypted storage, never in clear text
    - `iban_display`: Only masked version for UI display
    - Full IBAN never stored in database
    - No RLS changes needed (inherits existing policies)

  3. Usage
    - If user enters full IBAN: hash it, extract last 4 digits, create masked display
    - If user enters 4-6 digits only: encrypt and store in iban_last_digits
    - Matching priority: iban_hash > iban_last_digits > amount+label
*/

-- Add IBAN storage columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'iban_hash'
  ) THEN
    ALTER TABLE locataires ADD COLUMN iban_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'iban_last_digits'
  ) THEN
    ALTER TABLE locataires ADD COLUMN iban_last_digits text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'iban_display'
  ) THEN
    ALTER TABLE locataires ADD COLUMN iban_display text;
  END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN locataires.iban_hash IS 'SHA256 hash of full IBAN for secure matching - never reversible';
COMMENT ON COLUMN locataires.iban_last_digits IS 'Encrypted last 4-6 digits of IBAN for partial matching';
COMMENT ON COLUMN locataires.iban_display IS 'Masked IBAN for display only (e.g., ••••90189)';
