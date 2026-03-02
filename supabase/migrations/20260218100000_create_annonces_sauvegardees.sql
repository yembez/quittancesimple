-- Table des annonces sauvegardées (générateur d'annonces)
CREATE TABLE IF NOT EXISTS annonces_sauvegardees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annonces_sauvegardees_proprietaire ON annonces_sauvegardees(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_annonces_sauvegardees_created ON annonces_sauvegardees(created_at DESC);

ALTER TABLE annonces_sauvegardees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proprio can view own annonces" ON annonces_sauvegardees;
DROP POLICY IF EXISTS "Proprio can insert own annonces" ON annonces_sauvegardees;
DROP POLICY IF EXISTS "Proprio can update own annonces" ON annonces_sauvegardees;
DROP POLICY IF EXISTS "Proprio can delete own annonces" ON annonces_sauvegardees;

CREATE POLICY "Proprio can view own annonces"
  ON annonces_sauvegardees FOR SELECT
  TO authenticated
  USING (proprietaire_id = (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Proprio can insert own annonces"
  ON annonces_sauvegardees FOR INSERT
  TO authenticated
  WITH CHECK (proprietaire_id = (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Proprio can update own annonces"
  ON annonces_sauvegardees FOR UPDATE
  TO authenticated
  USING (proprietaire_id = (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'))
  WITH CHECK (proprietaire_id = (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Proprio can delete own annonces"
  ON annonces_sauvegardees FOR DELETE
  TO authenticated
  USING (proprietaire_id = (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'));

-- Table des photos liées aux annonces (chemins storage)
CREATE TABLE IF NOT EXISTS annonce_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id UUID NOT NULL REFERENCES annonces_sauvegardees(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annonce_photos_annonce ON annonce_photos(annonce_id);

ALTER TABLE annonce_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proprio can view own annonce photos" ON annonce_photos;
DROP POLICY IF EXISTS "Proprio can insert own annonce photos" ON annonce_photos;
DROP POLICY IF EXISTS "Proprio can delete own annonce photos" ON annonce_photos;

CREATE POLICY "Proprio can view own annonce photos"
  ON annonce_photos FOR SELECT
  TO authenticated
  USING (
    annonce_id IN (
      SELECT id FROM annonces_sauvegardees
      WHERE proprietaire_id = (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email')
    )
  );

CREATE POLICY "Proprio can insert own annonce photos"
  ON annonce_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    annonce_id IN (
      SELECT id FROM annonces_sauvegardees
      WHERE proprietaire_id = (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email')
    )
  );

CREATE POLICY "Proprio can delete own annonce photos"
  ON annonce_photos FOR DELETE
  TO authenticated
  USING (
    annonce_id IN (
      SELECT id FROM annonces_sauvegardees
      WHERE proprietaire_id = (SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email')
    )
  );
