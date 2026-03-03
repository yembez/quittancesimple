-- Désabonnement des communications (campagnes, relances, etc.)

-- Colonne sur proprietaires pour cohérence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proprietaires' AND column_name = 'mailing_desabonne'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN mailing_desabonne boolean DEFAULT false;
  END IF;
END $$;

-- Table pour toute adresse désabonnée (y compris hors table proprietaires)
CREATE TABLE IF NOT EXISTS mailing_desabonnes (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE mailing_desabonnes IS 'Adresses e-mail ayant cliqué sur Se désabonner ; à exclure de toute campagne.';
