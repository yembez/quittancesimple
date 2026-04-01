-- Avant : DEFAULT 'rappel_classique' présélectionnait le mode côté DB si l'insert ne passait pas la colonne.
-- Après : NULL tant que l'utilisateur n'a pas choisi explicitement (UI + enregistrement automatisation).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'locataires'
      AND column_name = 'mode_envoi_quittance'
  ) THEN
    ALTER TABLE public.locataires
      ALTER COLUMN mode_envoi_quittance DROP DEFAULT;
  END IF;
END $$;
