/*
  # Ajouter politique UPDATE pour utilisateurs authentifiés
  
  1. Changements
    - Ajoute une politique permettant aux utilisateurs authentifiés de mettre à jour les proprietaires
    - Corrige le bug empêchant la mise à jour des informations dans FreeDashboard
  
  2. Sécurité
    - Permet aux utilisateurs authentifiés de modifier les données proprietaires
    - Complète les politiques existantes (INSERT et SELECT)
*/

-- Supprimer la politique si elle existe déjà
DROP POLICY IF EXISTS "Authenticated users can update proprietaires" ON proprietaires;

-- Politique pour permettre UPDATE aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update proprietaires"
  ON proprietaires
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);