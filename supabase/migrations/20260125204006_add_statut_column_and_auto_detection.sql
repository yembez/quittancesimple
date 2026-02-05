/*
  # Ajout de la colonne statut avec détection automatique
  
  1. Nouvelle colonne
    - Ajout de `statut` (text, nullable) à la table `proprietaires`
    - Valeurs possibles: 'nouveau', 'actif', 'inactif', 'gratuit', 'essai'
  
  2. Fonction de détection automatique
    - Calcule le statut en fonction de:
      - plan_type ('free' = gratuit)
      - abonnement_actif (true = actif, false = inactif)
      - date_inscription (nouveau si récent et pas d'abonnement)
      - nombre_locataires (actif si des locataires existent)
  
  3. Trigger automatique
    - Se déclenche sur INSERT et UPDATE de proprietaires
    - Met à jour automatiquement le statut selon la logique métier
  
  4. Notes importantes
    - Les propriétaires existants auront NULL (sera calculé au prochain UPDATE)
    - Les nouveaux propriétaires auront le statut calculé automatiquement
    - Le statut se met à jour automatiquement quand l'abonnement change
*/

-- Ajouter la colonne statut (nullable pour ne pas affecter les données existantes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proprietaires' AND column_name = 'statut'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN statut text;
  END IF;
END $$;

-- Créer la fonction qui calcule automatiquement le statut
CREATE OR REPLACE FUNCTION calculate_proprietaire_statut()
RETURNS trigger AS $$
BEGIN
  -- Si plan gratuit
  IF NEW.plan_type = 'free' THEN
    NEW.statut := 'gratuit';
  
  -- Si abonnement actif avec plan payant
  ELSIF NEW.abonnement_actif = true AND NEW.plan_type IS NOT NULL AND NEW.plan_type != 'free' THEN
    -- Vérifier si c'est une période d'essai (inscrit il y a moins de 14 jours)
    IF NEW.date_inscription IS NOT NULL AND NEW.date_inscription > NOW() - INTERVAL '14 days' THEN
      NEW.statut := 'essai';
    ELSE
      NEW.statut := 'actif';
    END IF;
  
  -- Si abonnement inactif mais a déjà eu un plan
  ELSIF NEW.abonnement_actif = false AND NEW.plan_type IS NOT NULL THEN
    NEW.statut := 'inactif';
  
  -- Si nouveau propriétaire (créé récemment et pas d'abonnement)
  ELSIF NEW.date_inscription IS NOT NULL 
    AND NEW.date_inscription > NOW() - INTERVAL '7 days' 
    AND (NEW.abonnement_actif IS NULL OR NEW.abonnement_actif = false)
    AND (NEW.plan_type IS NULL OR NEW.plan_type = 'free') THEN
    NEW.statut := 'nouveau';
  
  -- Si a des locataires mais pas d'abonnement payant
  ELSIF COALESCE(NEW.nombre_locataires, 0) > 0 
    AND (NEW.plan_type IS NULL OR NEW.plan_type = 'free') THEN
    NEW.statut := 'nouveau';
  
  -- Par défaut, nouveau
  ELSE
    NEW.statut := 'nouveau';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger qui s'exécute automatiquement
DROP TRIGGER IF EXISTS trigger_calculate_proprietaire_statut ON proprietaires;

CREATE TRIGGER trigger_calculate_proprietaire_statut
  BEFORE INSERT OR UPDATE ON proprietaires
  FOR EACH ROW
  EXECUTE FUNCTION calculate_proprietaire_statut();

-- Mettre à jour les statuts des propriétaires existants (forcer le recalcul)
UPDATE proprietaires SET updated_at = NOW() WHERE id IS NOT NULL;
