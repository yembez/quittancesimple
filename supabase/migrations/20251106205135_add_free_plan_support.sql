/*
  # Ajouter le support du plan gratuit

  ## Changements
  
  1. Modifications de la table `proprietaires`
    - Ajout de valeurs possibles pour `plan_actuel` : 'free', 'Quittance Automatique', 'Quittance Connectée+'
    - Support du plan gratuit avec restrictions (1 locataire, 3 quittances)
  
  2. Nouvelles colonnes
    - `plan_type` : type de plan ('free', 'auto', 'premium')
    - `max_locataires` : nombre maximum de locataires autorisés
    - `max_quittances` : nombre maximum de quittances conservées
    - `features_enabled` : fonctionnalités activées (JSON)
  
  3. Sécurité
    - Les politiques RLS existantes restent en place
    - Les utilisateurs du plan gratuit ont les mêmes droits d'accès mais avec des limites fonctionnelles
*/

-- Ajouter les colonnes pour gérer les plans
ALTER TABLE proprietaires 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'auto' CHECK (plan_type IN ('free', 'auto', 'premium')),
ADD COLUMN IF NOT EXISTS max_locataires integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_quittances integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS features_enabled jsonb DEFAULT '{"auto_send": true, "reminders": true, "bank_sync": false}'::jsonb;

-- Mettre à jour les plans existants selon leur plan_actuel
UPDATE proprietaires
SET 
  plan_type = CASE 
    WHEN plan_actuel = 'Quittance Connectée+' OR plan_actuel = 'premium' THEN 'premium'
    ELSE 'auto'
  END,
  max_locataires = CASE 
    WHEN plan_actuel = 'Quittance Connectée+' OR plan_actuel = 'premium' THEN 50
    ELSE 10
  END,
  features_enabled = CASE 
    WHEN plan_actuel = 'Quittance Connectée+' OR plan_actuel = 'premium' THEN '{"auto_send": true, "reminders": true, "bank_sync": true}'::jsonb
    ELSE '{"auto_send": true, "reminders": true, "bank_sync": false}'::jsonb
  END
WHERE plan_type = 'auto';

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_proprietaires_plan_type ON proprietaires(plan_type);

-- Ajouter un commentaire sur la table
COMMENT ON COLUMN proprietaires.plan_type IS 'Type de plan: free (1 locataire, 3 quittances), auto (illimité), premium (avec sync bancaire)';
COMMENT ON COLUMN proprietaires.max_locataires IS 'Nombre maximum de locataires autorisés pour ce plan';
COMMENT ON COLUMN proprietaires.max_quittances IS 'Nombre maximum de quittances conservées (NULL = illimité)';
COMMENT ON COLUMN proprietaires.features_enabled IS 'Fonctionnalités activées pour ce plan (JSON)';
