/*
  # Création des tables locataires et quittances

  1. Nouvelles Tables
    - `locataires` - Informations des locataires
      - `id` (uuid, primary key)
      - `proprietaire_id` (uuid, foreign key)
      - `nom` (text)
      - `prenom` (text)
      - `email` (text)
      - `telephone` (text)
      - `adresse_logement` (text)
      - `loyer_mensuel` (numeric)
      - `charges_mensuelles` (numeric)
      - `date_rappel` (integer)
      - `periodicite` (text)
      - `statut` (text)
      - `derniere_quittance` (timestamptz)
      - `actif` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `quittances` - Historique des quittances
      - `id` (uuid, primary key)
      - `proprietaire_id` (uuid, foreign key)
      - `locataire_id` (uuid, foreign key)
      - `periode` (text)
      - `loyer` (numeric)
      - `charges` (numeric)
      - `total` (numeric)
      - `statut` (text)
      - `date_generation` (timestamptz)
      - `date_envoi` (timestamptz)
      - `pdf_url` (text)
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur les deux tables
    - Politiques pour les utilisateurs authentifiés
    - Lecture/écriture basée sur proprietaire_id
*/

-- Création de la table locataires
CREATE TABLE IF NOT EXISTS locataires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prenom text,
  email text,
  telephone text,
  adresse_logement text NOT NULL,
  loyer_mensuel numeric NOT NULL DEFAULT 0,
  charges_mensuelles numeric NOT NULL DEFAULT 0,
  date_rappel integer DEFAULT 1 CHECK (date_rappel >= 1 AND date_rappel <= 31),
  periodicite text DEFAULT 'mensuel' CHECK (periodicite IN ('mensuel', 'trimestriel')),
  statut text DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'paye', 'non_paye')),
  derniere_quittance timestamptz,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_locataires_proprietaire_id ON locataires(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_locataires_actif ON locataires(actif);

-- Création de la table quittances
CREATE TABLE IF NOT EXISTS quittances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  locataire_id uuid NOT NULL REFERENCES locataires(id) ON DELETE CASCADE,
  periode text NOT NULL,
  loyer numeric NOT NULL DEFAULT 0,
  charges numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  statut text DEFAULT 'generee' CHECK (statut IN ('generee', 'envoyee', 'archivee')),
  date_generation timestamptz DEFAULT now(),
  date_envoi timestamptz,
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_quittances_proprietaire_id ON quittances(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_quittances_locataire_id ON quittances(locataire_id);
CREATE INDEX IF NOT EXISTS idx_quittances_date_generation ON quittances(date_generation DESC);

-- Activer RLS
ALTER TABLE locataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE quittances ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour locataires
CREATE POLICY "Users can view their own locataires"
  ON locataires
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can insert their own locataires"
  ON locataires
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can update their own locataires"
  ON locataires
  FOR UPDATE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can delete their own locataires"
  ON locataires
  FOR DELETE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Politiques RLS pour quittances
CREATE POLICY "Users can view their own quittances"
  ON quittances
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can insert their own quittances"
  ON quittances
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can update their own quittances"
  ON quittances
  FOR UPDATE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can delete their own quittances"
  ON quittances
  FOR DELETE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Trigger pour updated_at sur locataires
DROP TRIGGER IF EXISTS update_locataires_updated_at ON locataires;
CREATE TRIGGER update_locataires_updated_at
  BEFORE UPDATE ON locataires
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
