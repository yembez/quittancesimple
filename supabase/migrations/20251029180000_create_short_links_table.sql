/*
  # Create short links table for SMS optimization

  1. New Tables
    - `short_links`
      - `id` (text, primary key) - Short code (6 chars)
      - `proprietaire_id` (uuid) - Reference to proprietaire
      - `locataire_id` (uuid) - Reference to locataire
      - `mois` (text) - Month name
      - `annee` (integer) - Year
      - `action` (text) - Action type (send/remind)
      - `source` (text) - Source (sms/email)
      - `created_at` (timestamptz) - Creation timestamp
      - `expires_at` (timestamptz) - Expiration timestamp
      - `used_at` (timestamptz) - Usage timestamp (nullable)

  2. Security
    - Enable RLS on `short_links` table
    - Add policy for anonymous users to read valid links

  3. Indexes
    - Index on `id` for fast lookups
    - Index on `expires_at` for cleanup
*/

CREATE TABLE IF NOT EXISTS short_links (
  id text PRIMARY KEY,
  proprietaire_id uuid NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  locataire_id uuid NOT NULL REFERENCES locataires(id) ON DELETE CASCADE,
  mois text NOT NULL,
  annee integer NOT NULL,
  action text NOT NULL DEFAULT 'send',
  source text NOT NULL DEFAULT 'sms',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  used_at timestamptz
);

ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read valid short links"
  ON short_links FOR SELECT
  TO anon, authenticated
  USING (expires_at > now());

CREATE INDEX IF NOT EXISTS idx_short_links_expires ON short_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_short_links_proprietaire ON short_links(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_short_links_locataire ON short_links(locataire_id);