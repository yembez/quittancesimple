/*
  # Ajout de la colonne date_fin_essai pour gérer l'essai gratuit de 30 jours
  
  1. Nouvelle colonne
    - Ajout de `date_fin_essai` (timestamptz, nullable) à la table `proprietaires`
    - Cette colonne stocke la date de fin de la période d'essai gratuit de 30 jours
  
  2. Notes importantes
    - NULL signifie qu'il n'y a pas d'essai en cours ou qu'il est terminé
    - La date est définie lors de l'inscription au Pack Automatique
    - Après cette date, l'abonnement doit être payant pour continuer
*/

-- Ajouter la colonne date_fin_essai
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proprietaires' AND column_name = 'date_fin_essai'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN date_fin_essai timestamptz;
  END IF;
END $$;

-- Créer un index pour les performances des requêtes sur la date de fin d'essai
CREATE INDEX IF NOT EXISTS idx_proprietaires_date_fin_essai ON proprietaires(date_fin_essai);

-- Commentaire sur la colonne
COMMENT ON COLUMN proprietaires.date_fin_essai IS 'Date de fin de la période d''essai gratuit de 30 jours. NULL si pas d''essai en cours.';
