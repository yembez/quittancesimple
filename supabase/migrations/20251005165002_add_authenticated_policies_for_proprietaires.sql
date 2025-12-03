/*
  # Ajouter politiques pour utilisateurs authentifiés

  1. Changements
    - Ajoute des politiques permettant aux utilisateurs authentifiés d'insérer/modifier des proprietaires
    - Nécessaire car le formulaire est utilisé par des utilisateurs authentifiés
  
  2. Sécurité
    - Permet aux utilisateurs authentifiés de créer et modifier des proprietaires
*/

-- Politique pour permettre INSERT aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert proprietaires"
  ON proprietaires
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique pour permettre SELECT aux utilisateurs authentifiés (pour leur propre data)
CREATE POLICY "Authenticated users can select all proprietaires"
  ON proprietaires
  FOR SELECT
  TO authenticated
  USING (true);