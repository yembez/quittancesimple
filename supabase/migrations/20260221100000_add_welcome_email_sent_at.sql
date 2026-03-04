-- Trace de l'envoi du welcome email (pour savoir si un compte essai gratuit l'a bien reçu)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proprietaires' AND column_name = 'welcome_email_sent_at'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN welcome_email_sent_at timestamptz;
  END IF;
END $$;

COMMENT ON COLUMN proprietaires.welcome_email_sent_at IS 'Date d''envoi du dernier email de bienvenue (Espace Bailleur). NULL = pas encore envoyé ou compte créé avant cette colonne.';
