/*
  # Recréation de la table proprietaires

  1. Nouvelles Tables
    - `proprietaires` - Stockage des propriétaires pour marketing
    
  2. Sécurité
    - RLS activé
    - Accès anonyme pour permettre l'insertion depuis le formulaire
*/

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

-- Politique pour permettre l'insertion anonyme (formulaire de contact)
CREATE POLICY "Anyone can insert proprietaires"
  ON proprietaires
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Politique pour permettre la mise à jour anonyme
CREATE POLICY "Anyone can update proprietaires"
  ON proprietaires
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

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