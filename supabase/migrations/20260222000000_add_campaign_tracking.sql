-- Tracking des envois de campagne pour les leads "quittance gratuite"

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proprietaires' AND column_name = 'campaign_j2_sent_at'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN campaign_j2_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proprietaires' AND column_name = 'campaign_j5_sent_at'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN campaign_j5_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proprietaires' AND column_name = 'campaign_j8_sent_at'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN campaign_j8_sent_at timestamptz;
  END IF;
END $$;

COMMENT ON COLUMN proprietaires.campaign_j2_sent_at IS 'Date d''envoi du 1er email de campagne (J+2) pour les leads quittance gratuite.';
COMMENT ON COLUMN proprietaires.campaign_j5_sent_at IS 'Date d''envoi du 2e email de campagne (J+5) pour les leads quittance gratuite.';
COMMENT ON COLUMN proprietaires.campaign_j8_sent_at IS 'Date d''envoi du 3e email de campagne (J+8) pour les leads quittance gratuite.';

