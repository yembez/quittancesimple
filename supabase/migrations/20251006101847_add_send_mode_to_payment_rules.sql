/*
  # Add send mode to payment rules

  1. Changes
    - Add `send_mode` column to `rent_payment_rules` table
      - Type: text with check constraint ('auto' or 'manual_validation')
      - Default: 'auto' for backward compatibility
      - Not null
    
  2. Notes
    - 'auto': Automatic generation and sending with email confirmation to landlord
    - 'manual_validation': Generate receipt but landlord must validate sending via email/SMS link
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payment_rules' AND column_name = 'send_mode'
  ) THEN
    ALTER TABLE rent_payment_rules 
    ADD COLUMN send_mode text NOT NULL DEFAULT 'auto'
    CHECK (send_mode IN ('auto', 'manual_validation'));
  END IF;
END $$;
