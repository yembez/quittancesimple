/*
  # Create prospects table for IRL revision leads

  1. New Tables
    - `prospects_revision_loyer`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `nouveau_loyer` (decimal)
      - `ancien_loyer` (decimal)
      - `gain_mensuel` (decimal)
      - `gain_annuel` (decimal)
      - `relance_2_semaines_envoyee` (boolean)
      - `relance_1_mois_envoyee` (boolean)
      - `date_creation` (timestamptz)
      - `date_relance_2_semaines` (timestamptz)
      - `date_relance_1_mois` (timestamptz)

  2. Security
    - Enable RLS on `prospects_revision_loyer` table
    - Add policies for anonymous insert and service role access
*/

CREATE TABLE IF NOT EXISTS prospects_revision_loyer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  nouveau_loyer decimal(10,2) NOT NULL,
  ancien_loyer decimal(10,2) NOT NULL,
  gain_mensuel decimal(10,2) NOT NULL,
  gain_annuel decimal(10,2) NOT NULL,
  relance_2_semaines_envoyee boolean DEFAULT false,
  relance_1_mois_envoyee boolean DEFAULT false,
  date_creation timestamptz DEFAULT now(),
  date_relance_2_semaines timestamptz,
  date_relance_1_mois timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prospects_revision_loyer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert prospects"
  ON prospects_revision_loyer
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow service role full access"
  ON prospects_revision_loyer
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects_revision_loyer(email);
CREATE INDEX IF NOT EXISTS idx_prospects_relances ON prospects_revision_loyer(relance_2_semaines_envoyee, relance_1_mois_envoyee);
