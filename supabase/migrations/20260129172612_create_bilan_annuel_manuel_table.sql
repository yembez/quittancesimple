/*
  # Création de la table bilan_annuel_manuel

  ## Description
  Cette migration crée une table pour stocker les montants manuels (loyers et charges)
  perçus avant la première quittance générée dans l'année, permettant aux propriétaires
  d'avoir un bilan annuel complet.

  ## Tables créées
  - `bilan_annuel_manuel` - Stockage des montants antérieurs saisis manuellement
    - `id` (uuid, primary key)
    - `proprietaire_id` (uuid, foreign key vers proprietaires)
    - `annee` (integer) - L'année civile concernée
    - `loyers_anterieurs` (numeric) - Montant total des loyers perçus avant première quittance (optionnel)
    - `charges_anterieures` (numeric) - Montant total des charges perçues avant première quittance (optionnel)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Sécurité
  - Enable RLS sur la table
  - Politiques pour les utilisateurs authentifiés uniquement
  - Lecture/écriture basée sur proprietaire_id

  ## Contraintes
  - Une seule entrée par propriétaire et par année (contrainte unique)
  - Les montants doivent être positifs ou nuls
*/

-- Création de la table bilan_annuel_manuel
CREATE TABLE IF NOT EXISTS bilan_annuel_manuel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  annee integer NOT NULL,
  loyers_anterieurs numeric DEFAULT 0 CHECK (loyers_anterieurs >= 0),
  charges_anterieures numeric DEFAULT 0 CHECK (charges_anterieures >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte unique : une seule entrée par propriétaire et par année
  UNIQUE(proprietaire_id, annee)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_bilan_annuel_proprietaire_annee 
  ON bilan_annuel_manuel(proprietaire_id, annee);

-- Activer RLS
ALTER TABLE bilan_annuel_manuel ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bilan_annuel_manuel
CREATE POLICY "Users can view their own bilan annuel"
  ON bilan_annuel_manuel
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own bilan annuel"
  ON bilan_annuel_manuel
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own bilan annuel"
  ON bilan_annuel_manuel
  FOR UPDATE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own bilan annuel"
  ON bilan_annuel_manuel
  FOR DELETE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE user_id = auth.uid()
    )
  );