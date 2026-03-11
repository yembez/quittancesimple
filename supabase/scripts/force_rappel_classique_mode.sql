-- Force le mode "rappel classique" (SMS + email rappel, pas de quittance J+5) pour tous les locataires
-- qui sont actuellement en mode systématique. À exécuter en prod si vous n'utilisez que "validation par clic".
-- Effet : au prochain rappel, le cron enverra SMS + email de rappel au lieu du préavis J et de l'envoi J+5.

UPDATE locataires
SET mode_envoi_quittance = 'rappel_classique'
WHERE mode_envoi_quittance = 'systematic_preavis_5j';

-- Vérifier le nombre de lignes mises à jour (optionnel, en fonction du client SQL)
-- SELECT COUNT(*) FROM locataires WHERE mode_envoi_quittance = 'systematic_preavis_5j';
