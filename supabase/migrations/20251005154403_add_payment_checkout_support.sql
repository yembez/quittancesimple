/*
  # Add Payment Checkout Support

  1. Changes to proprietaires table
    - Add `plan_actuel` column to store subscription plan
    
  2. Changes to locataires table
    - Add `adresse_logement` column for tenant property address
    - Add `loyer_mensuel` column for monthly rent
    - Add `charges_mensuelles` column for monthly charges
    - Add `date_rappel` column for reminder date (day of month)
    - Add `periodicite` column for payment frequency
    - Add `statut` column for tenant status
    
  3. Security
    - No RLS changes needed as tables already have RLS enabled
*/

-- Add plan_actuel to proprietaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proprietaires' AND column_name = 'plan_actuel'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN plan_actuel text DEFAULT 'solo';
  END IF;
END $$;

-- Add columns to locataires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'adresse_logement'
  ) THEN
    ALTER TABLE locataires ADD COLUMN adresse_logement text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'loyer_mensuel'
  ) THEN
    ALTER TABLE locataires ADD COLUMN loyer_mensuel numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'charges_mensuelles'
  ) THEN
    ALTER TABLE locataires ADD COLUMN charges_mensuelles numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'date_rappel'
  ) THEN
    ALTER TABLE locataires ADD COLUMN date_rappel integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'periodicite'
  ) THEN
    ALTER TABLE locataires ADD COLUMN periodicite text DEFAULT 'mensuel';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'statut'
  ) THEN
    ALTER TABLE locataires ADD COLUMN statut text DEFAULT 'actif';
  END IF;
END $$;