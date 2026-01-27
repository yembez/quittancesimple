/*
  # Add invoice tracking columns

  1. Changes
    - Add `plan` column to track subscription plan
    - Add `periode_debut` and `periode_fin` for billing period
    - Add `stripe_invoice_id` to link with Stripe invoice
    - Add `stripe_payment_intent` to track payment
    - Rename `montant_ttc` usage to align with code

  2. Notes
    - These columns are needed to properly track subscription invoices
    - Links invoices to Stripe for reference
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'factures' AND column_name = 'plan'
  ) THEN
    ALTER TABLE factures ADD COLUMN plan text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'factures' AND column_name = 'periode_debut'
  ) THEN
    ALTER TABLE factures ADD COLUMN periode_debut timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'factures' AND column_name = 'periode_fin'
  ) THEN
    ALTER TABLE factures ADD COLUMN periode_fin timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'factures' AND column_name = 'stripe_invoice_id'
  ) THEN
    ALTER TABLE factures ADD COLUMN stripe_invoice_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'factures' AND column_name = 'stripe_payment_intent'
  ) THEN
    ALTER TABLE factures ADD COLUMN stripe_payment_intent text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'factures' AND column_name = 'montant'
  ) THEN
    ALTER TABLE factures ADD COLUMN montant numeric;
  END IF;
END $$;
