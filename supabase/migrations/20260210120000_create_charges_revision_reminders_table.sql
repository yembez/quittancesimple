/*
  # Création de la table Rappels Révision des Charges

  1. Nouvelle table
    - `charges_revision_reminders`
      - `id` (uuid, clé primaire)
      - `proprietaire_id` (uuid, clé étrangère vers proprietaires)
      - `reminder_date` (date) - date du rappel pour la révision des charges
      - `status` (text) - scheduled, sent, cancelled
      - `charges_revision_data` (jsonb) - données optionnelles (infos régularisation, etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé sur la table
    - Politiques pour les utilisateurs authentifiés et anon (comme irl_reminders)
*/

-- Création de la table charges_revision_reminders
CREATE TABLE IF NOT EXISTS charges_revision_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  reminder_date date NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  charges_revision_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Un seul rappel actif par propriétaire
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_charges_reminder_per_proprietaire
  ON charges_revision_reminders(proprietaire_id)
  WHERE status = 'scheduled';

-- Index pour les requêtes par date et statut
CREATE INDEX IF NOT EXISTS idx_charges_revision_reminders_date_status
  ON charges_revision_reminders(reminder_date, status);

-- Activer RLS
ALTER TABLE charges_revision_reminders ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs authentifiés voient leurs rappels
CREATE POLICY "Users can view own charges revision reminders"
  ON charges_revision_reminders
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Politique : les utilisateurs authentifiés peuvent insérer
CREATE POLICY "Users can insert own charges revision reminders"
  ON charges_revision_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Politique : les utilisateurs authentifiés peuvent modifier
CREATE POLICY "Users can update own charges revision reminders"
  ON charges_revision_reminders
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

-- Politique : les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Users can delete own charges revision reminders"
  ON charges_revision_reminders
  FOR DELETE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Politiques pour accès anon (transition, comme irl_reminders)
CREATE POLICY "Allow anonymous read charges revision reminders"
  ON charges_revision_reminders
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert charges revision reminders"
  ON charges_revision_reminders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update charges revision reminders"
  ON charges_revision_reminders
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete charges revision reminders"
  ON charges_revision_reminders
  FOR DELETE
  TO anon
  USING (true);
