/*
  # Add locataire_id to rent_payment_rules table

  1. Changes
    - Add `locataire_id` column to `rent_payment_rules` table
    - Add foreign key constraint to `locataires` table
    - Create index for faster queries

  2. Purpose
    - Link payment rules directly to specific tenants
    - Allow multiple rules per bank connection (one per tenant)
    - Enable pre-filling tenant information in the configuration form

  3. Important Notes
    - Column is nullable for backward compatibility
    - Existing rules without locataire_id will still work
    - New rules should always specify a locataire_id
*/

-- Add locataire_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payment_rules' AND column_name = 'locataire_id'
  ) THEN
    ALTER TABLE rent_payment_rules 
    ADD COLUMN locataire_id uuid REFERENCES locataires(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_rent_payment_rules_locataire_id 
ON rent_payment_rules(locataire_id);

-- Create index for faster queries by bank_connection_id and locataire_id
CREATE INDEX IF NOT EXISTS idx_rent_payment_rules_connection_locataire 
ON rent_payment_rules(bank_connection_id, locataire_id);