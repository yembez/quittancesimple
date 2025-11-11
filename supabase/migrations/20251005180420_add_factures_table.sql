/*
  # Add Factures (Invoices) Table

  1. New Tables
    - `factures`
      - `id` (uuid, primary key)
      - `proprietaire_id` (uuid, foreign key to proprietaires)
      - `numero_facture` (text, unique invoice number)
      - `date_emission` (timestamptz, invoice issue date)
      - `date_echeance` (timestamptz, payment due date)
      - `montant` (numeric, invoice amount)
      - `statut` (text, payment status: 'payee', 'en_attente', 'annulee')
      - `plan` (text, subscription plan name)
      - `periode_debut` (timestamptz, billing period start)
      - `periode_fin` (timestamptz, billing period end)
      - `pdf_url` (text, optional PDF storage URL)
      - `created_at` (timestamptz, creation timestamp)

  2. Security
    - Enable RLS on `factures` table
    - Add policy for authenticated users to read their own invoices
*/

-- Create factures table
CREATE TABLE IF NOT EXISTS factures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  numero_facture text NOT NULL UNIQUE,
  date_emission timestamptz NOT NULL DEFAULT now(),
  date_echeance timestamptz NOT NULL,
  montant numeric(10, 2) NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('payee', 'en_attente', 'annulee')),
  plan text NOT NULL,
  periode_debut timestamptz NOT NULL,
  periode_fin timestamptz NOT NULL,
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_factures_proprietaire_id ON factures(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_factures_date_emission ON factures(date_emission DESC);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);

-- Enable RLS
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own invoices
CREATE POLICY "Users can view own invoices"
  ON factures
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE auth.uid() = id::text
    )
  );

-- Policy: Allow anonymous select for demo/simulation (optional, can be removed in production)
CREATE POLICY "Allow anonymous select for demo"
  ON factures
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Users can insert their own invoices (for system-generated invoices)
CREATE POLICY "Users can insert own invoices"
  ON factures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE auth.uid() = id::text
    )
  );
