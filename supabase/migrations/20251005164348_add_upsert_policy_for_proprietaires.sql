/*
  # Ajouter politique UPSERT pour proprietaires

  1. Changements
    - Ajoute une politique permettant aux utilisateurs anonymes de faire des UPSERT
    - Nécessaire pour l'inscription via le formulaire de paiement
  
  2. Sécurité
    - Permet INSERT et UPDATE pour les utilisateurs anonymes
    - Essentiel pour le processus d'inscription sans authentification
*/

-- Supprimer les anciennes politiques conflictuelles
DROP POLICY IF EXISTS "Anyone can insert proprietaires" ON proprietaires;
DROP POLICY IF EXISTS "Anyone can update proprietaires" ON proprietaires;
DROP POLICY IF EXISTS "Anonymous users can insert proprietaires" ON proprietaires;
DROP POLICY IF EXISTS "Enable update for anonymous users by email" ON proprietaires;

-- Politique pour permettre INSERT aux utilisateurs anonymes
CREATE POLICY "Allow anonymous insert"
  ON proprietaires
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Politique pour permettre UPDATE aux utilisateurs anonymes
CREATE POLICY "Allow anonymous update"
  ON proprietaires
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Politique pour permettre SELECT aux utilisateurs anonymes (nécessaire pour upsert avec .select())
CREATE POLICY "Allow anonymous select"
  ON proprietaires
  FOR SELECT
  TO anon
  USING (true);