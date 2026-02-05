/*
  # Contrainte unique pour éviter les doublons de quittances

  1. Modifications
    - Ajoute une contrainte unique sur (proprietaire_id, locataire_id, periode_debut, periode_fin)
    - Cela garantit qu'on ne peut pas créer deux quittances pour le même locataire et la même période
    - Permet d'utiliser `upsert()` pour éviter les erreurs si on envoie plusieurs fois une quittance

  2. Sécurité
    - Les doublons existants ont été nettoyés au préalable
    - Permet uniquement de prévenir les futurs doublons
*/

-- Ajouter une contrainte unique pour éviter les doublons de quittances
ALTER TABLE quittances
ADD CONSTRAINT quittances_unique_period
UNIQUE (proprietaire_id, locataire_id, periode_debut, periode_fin);
