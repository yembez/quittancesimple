/*
  # Quittances systématiques (préavis + envoi auto)

  1. Nouvelle table `quittances_systematic`
    - Suit l'état d'une quittance programmée (préavis J, auto-envoi J+5, actions bailleur).

  2. Ajout d'un champ de mode sur `locataires`
    - Permet de distinguer le mode de gestion des quittances (rappel classique vs mode systématique avec préavis).
*/

-- Création de la table quittances_systematic
CREATE TABLE IF NOT EXISTS quittances_systematic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locataire_id uuid NOT NULL REFERENCES locataires(id) ON DELETE CASCADE,
  proprietaire_id uuid NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  periode text NOT NULL,
  date_preavis timestamptz NOT NULL DEFAULT now(),
  date_envoi_auto timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN (
    'pending_owner_action',
    'cancelled',
    'reminder_sent',
    'sent_manual',
    'sent_auto'
  )),
  action_token_send_manual text,
  action_token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unicité : une quittance systématique par locataire + période
CREATE UNIQUE INDEX IF NOT EXISTS uq_quittances_systematic_locataire_periode
  ON quittances_systematic(locataire_id, periode);

-- Index pour les recherches par date / statut
CREATE INDEX IF NOT EXISTS idx_quittances_systematic_envoi_auto
  ON quittances_systematic(date_envoi_auto);

CREATE INDEX IF NOT EXISTS idx_quittances_systematic_status
  ON quittances_systematic(status);

-- RLS sur quittances_systematic
ALTER TABLE quittances_systematic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quittances_systematic"
  ON quittances_systematic
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can insert their own quittances_systematic"
  ON quittances_systematic
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can update their own quittances_systematic"
  ON quittances_systematic
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

CREATE POLICY "Users can delete their own quittances_systematic"
  ON quittances_systematic
  FOR DELETE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Trigger updated_at sur quittances_systematic
DROP TRIGGER IF EXISTS update_quittances_systematic_updated_at ON quittances_systematic;
CREATE TRIGGER update_quittances_systematic_updated_at
  BEFORE UPDATE ON quittances_systematic
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ajout du mode d'envoi des quittances sur la table locataires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'mode_envoi_quittance'
  ) THEN
    ALTER TABLE locataires
      ADD COLUMN mode_envoi_quittance text DEFAULT 'rappel_classique'
      CHECK (mode_envoi_quittance IN ('rappel_classique', 'systematic_preavis_5j'));
  END IF;
END $$;

