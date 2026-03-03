-- Snapshot des données de la dernière quittance gratuite par email, pour pré-remplir l'Espace Bailleur
-- quand le lead s'inscrit plus tard (ex. après clic CTA campagne).
CREATE TABLE IF NOT EXISTS free_quittance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  baillor_address text,
  baillor_nom text,
  baillor_prenom text,
  locataire_nom text,
  locataire_prenom text,
  locataire_address text,
  loyer numeric,
  charges numeric,
  created_at timestamptz DEFAULT now(),
  applied_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_free_quittance_snapshots_email ON free_quittance_snapshots (email);

ALTER TABLE free_quittance_snapshots ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement si l'email correspond au propriétaire connecté
CREATE POLICY "User can read own snapshot"
  ON free_quittance_snapshots FOR SELECT
  TO authenticated
  USING (
    email IN (SELECT email FROM proprietaires WHERE user_id = auth.uid())
  );

-- Mise à jour applied_at : même règle (pour marquer comme appliqué après création du locataire)
CREATE POLICY "User can update own snapshot"
  ON free_quittance_snapshots FOR UPDATE
  TO authenticated
  USING (
    email IN (SELECT email FROM proprietaires WHERE user_id = auth.uid())
  )
  WITH CHECK (true);

-- L’insert/upsert depuis send-quittance utilise la clé service_role (bypass RLS).

COMMENT ON TABLE free_quittance_snapshots IS 'Dernière quittance gratuite par email, pour pré-remplir l’espace bailleur à l’inscription (CTA campagne, etc.)';
