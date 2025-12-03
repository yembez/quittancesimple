/*
  # Ajout du champ nombre_locataires à la table proprietaires

  1. Modifications
    - Ajout de la colonne `nombre_locataires` (integer, default 0)
    - Ajout de la colonne `plan_actuel` (text) si elle n'existe pas déjà

  2. Objectif
    - Permettre le calcul du prix dynamique selon le nombre de locataires
    - Stocker le plan actuel du propriétaire
*/

-- Ajout de la colonne nombre_locataires si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proprietaires' AND column_name = 'nombre_locataires'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN nombre_locataires integer DEFAULT 0;
  END IF;
END $$;

-- Ajout de la colonne plan_actuel si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proprietaires' AND column_name = 'plan_actuel'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN plan_actuel text;
  END IF;
END $$;
