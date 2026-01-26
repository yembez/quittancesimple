/*
  # Add relances (reminders) tracking table

  1. New Tables
    - `relances`
      - `id` (uuid, primary key)
      - `proprietaire_id` (uuid, foreign key to proprietaires)
      - `locataire_id` (uuid, foreign key to locataires)
      - `date_envoi` (timestamptz)
      - `email_content` (jsonb) - stores the reminder email details
      - `statut` (text) - 'envoyee' or 'echouee'
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `relances` table
    - Add policy for authenticated users to read their own reminders
    - Add policy for authenticated users to insert their own reminders
*/

CREATE TABLE IF NOT EXISTS relances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  locataire_id uuid NOT NULL REFERENCES locataires(id) ON DELETE CASCADE,
  date_envoi timestamptz DEFAULT now(),
  email_content jsonb NOT NULL,
  statut text DEFAULT 'envoyee',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE relances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relances"
  ON relances
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can insert own relances"
  ON relances
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE INDEX IF NOT EXISTS idx_relances_proprietaire ON relances(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_relances_locataire ON relances(locataire_id);
CREATE INDEX IF NOT EXISTS idx_relances_date ON relances(date_envoi DESC);
