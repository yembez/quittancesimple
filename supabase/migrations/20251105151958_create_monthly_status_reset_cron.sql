/*
  # Cron job pour réinitialiser le statut des locataires

  1. Fonction
    - Crée une fonction pour réinitialiser le statut de tous les locataires à 'en_attente'
  
  2. Cron Job
    - S'exécute le 31 de chaque mois à minuit (00:00)
    - Remet tous les statuts des locataires actifs à 'en_attente'
    - Permet de suivre les paiements mensuels
  
  3. Notes importantes
    - Le cron utilise la timezone UTC
    - Minuit UTC = 1h du matin en heure française (hiver) ou 2h (été)
    - Pour avoir minuit heure française en hiver, on utilise 23:00 UTC le 30
*/

-- Créer la fonction de réinitialisation des statuts
CREATE OR REPLACE FUNCTION reset_monthly_locataire_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mettre à jour tous les locataires actifs pour remettre leur statut à 'en_attente'
  UPDATE locataires
  SET statut = 'en_attente'
  WHERE actif = true;
  
  RAISE NOTICE 'Statuts des locataires réinitialisés à en_attente';
END;
$$;

-- Planifier l'exécution tous les mois le 31 à minuit (heure de Paris)
-- Note: Le 31 n'existe pas tous les mois, donc on utilise le dernier jour du mois
-- On utilise '0 23 30 * *' pour 23h le 30 en UTC = minuit le 31 en heure française (hiver)
SELECT cron.schedule(
  'reset-locataire-status-monthly',
  '0 23 30 * *',
  $$SELECT reset_monthly_locataire_status()$$
);
