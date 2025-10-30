/*
  # Ajouter la clé étrangère entre locataires et propriétaires

  1. Modifications
    - Ajoute une contrainte de clé étrangère entre locataires.proprietaire_id et proprietaires.id
    - Cette relation permet à Supabase de comprendre le lien entre les deux tables
    
  2. Notes
    - Utilise ON DELETE CASCADE pour supprimer automatiquement les locataires si le propriétaire est supprimé
    - Utilise ON UPDATE CASCADE pour mettre à jour les locataires si l'ID du propriétaire change
*/

-- Ajouter la clé étrangère si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'locataires_proprietaire_id_fkey'
  ) THEN
    ALTER TABLE locataires
    ADD CONSTRAINT locataires_proprietaire_id_fkey 
    FOREIGN KEY (proprietaire_id) 
    REFERENCES proprietaires(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
  END IF;
END $$;
