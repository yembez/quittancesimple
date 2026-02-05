/*
  # Configuration propre pour Quittance Simple

  1. Nettoyage
    - Supprime les politiques existantes si elles existent
    - Supprime les tables si elles existent

  2. Nouvelles Tables
    - `proprietaires` - Stockage des propriétaires pour marketing
    - Configuration RLS propre

  3. Sécurité
    - Politiques RLS pour les utilisateurs authentifiés
    - Politique service_role pour l'administration
*/

-- Nettoyage des politiques existantes
DROP POLICY IF EXISTS "Service role can manage all proprietaires" ON proprietaires;
DROP POLICY IF EXISTS "Users can manage their own data" ON proprietaires;

-- Nettoyage des tables existantes
DROP TABLE IF EXISTS proprietaires CASCADE;

-- Création de la table proprietaires
CREATE TABLE IF NOT EXISTS proprietaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  nom text,
  prenom text,
  adresse text,
  telephone text,
  derniere_quittance timestamptz,
  nombre_quittances integer DEFAULT 0,
  source text DEFAULT 'website',
  user_id uuid,
  abonnement_actif boolean DEFAULT false,
  date_inscription timestamptz DEFAULT now(),
  derniere_connexion timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_proprietaires_email ON proprietaires(email);
CREATE INDEX IF NOT EXISTS idx_proprietaires_user_id ON proprietaires(user_id);

-- Activer RLS
ALTER TABLE proprietaires ENABLE ROW LEVEL SECURITY;

-- Politique pour le service role (administration)
CREATE POLICY "Service role can manage all proprietaires"
  ON proprietaires
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Politique pour les utilisateurs authentifiés
CREATE POLICY "Users can manage their own data"
  ON proprietaires
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_proprietaires_updated_at ON proprietaires;
CREATE TRIGGER update_proprietaires_updated_at
  BEFORE UPDATE ON proprietaires
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();