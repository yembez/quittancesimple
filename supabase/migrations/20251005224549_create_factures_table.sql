/*
  # Create factures table

  1. New Tables
    - `factures`
      - `id` (uuid, primary key)
      - `proprietaire_id` (uuid, references proprietaires)
      - `numero_facture` (text, unique)
      - `date_emission` (date)
      - `date_echeance` (date)
      - `montant_ht` (numeric)
      - `montant_tva` (numeric)
      - `montant_ttc` (numeric)
      - `statut` (text: brouillon, envoyee, payee, annulee)
      - `pdf_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `factures` table
    - Add policies for authenticated users to manage their own factures
*/

CREATE TABLE IF NOT EXISTS factures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid REFERENCES proprietaires(id),
  numero_facture text UNIQUE,
  date_emission date NOT NULL,
  date_echeance date,
  montant_ht numeric DEFAULT 0,
  montant_tva numeric DEFAULT 0,
  montant_ttc numeric DEFAULT 0,
  statut text DEFAULT 'brouillon',
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own factures"
  ON factures
  FOR SELECT
  TO authenticated
  USING (proprietaire_id IN (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can insert own factures"
  ON factures
  FOR INSERT
  TO authenticated
  WITH CHECK (proprietaire_id IN (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can update own factures"
  ON factures
  FOR UPDATE
  TO authenticated
  USING (proprietaire_id IN (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'))
  WITH CHECK (proprietaire_id IN (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can delete own factures"
  ON factures
  FOR DELETE
  TO authenticated
  USING (proprietaire_id IN (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'));