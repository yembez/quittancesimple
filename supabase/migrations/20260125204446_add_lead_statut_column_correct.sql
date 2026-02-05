/*
  # Ajout de la colonne lead_statut pour le tracking du parcours utilisateur
  
  1. Nouvelle colonne
    - Ajout de `lead_statut` (text, nullable) à la table `proprietaires`
    - 6 statuts possibles correspondant aux étapes du funnel :
      * free_quittance_pdf : Lead a généré une quittance gratuite et laissé son email
      * free_account : Compte créé via /inscription (accès FreeDashboard)
      * QA_1st_interested : A cliqué "Souscrire" mais n'a pas encore payé
      * QA_payment_incomplete : A ouvert la session Stripe mais pas finalisé
      * QA_paid_subscriber : Paiement Stripe confirmé
      * cancelled : Abonnement résilié
  
  2. Nettoyage
    - Suppression de l'ancienne colonne `statut` et du trigger automatique
  
  3. Notes
    - Les statuts seront gérés manuellement depuis le code applicatif
    - Pas de trigger automatique pour cette colonne
*/

-- Supprimer le trigger et la fonction de l'ancienne colonne statut
DROP TRIGGER IF EXISTS trigger_calculate_proprietaire_statut ON proprietaires;
DROP FUNCTION IF EXISTS calculate_proprietaire_statut();

-- Supprimer l'ancienne colonne statut
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proprietaires' AND column_name = 'statut'
  ) THEN
    ALTER TABLE proprietaires DROP COLUMN statut;
  END IF;
END $$;

-- Créer la nouvelle colonne lead_statut
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proprietaires' AND column_name = 'lead_statut'
  ) THEN
    ALTER TABLE proprietaires ADD COLUMN lead_statut text;
  END IF;
END $$;

-- Ajouter un commentaire sur la colonne pour documenter les valeurs possibles
COMMENT ON COLUMN proprietaires.lead_statut IS 'Statut du lead dans le funnel de conversion: free_quittance_pdf, free_account, QA_1st_interested, QA_payment_incomplete, QA_paid_subscriber, cancelled';
