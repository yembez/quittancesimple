/*
  # Ajouter la colonne document_html à registered_mail_requests

  ## Changements
  
  1. Ajout de la colonne `document_html` à la table `registered_mail_requests`
     - Permet de stocker le contenu HTML complet du document
     - Type: text (peut contenir de longs documents)
     - Nullable: true (pour compatibilité avec les anciennes entrées)
  
  ## Raison
  
  Stripe limite les metadata values à 500 caractères maximum.
  Au lieu de passer le document HTML dans les metadata Stripe,
  on le stocke en base de données et on passe seulement le request_id.
*/

-- Ajouter la colonne document_html si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registered_mail_requests' AND column_name = 'document_html'
  ) THEN
    ALTER TABLE registered_mail_requests ADD COLUMN document_html text;
  END IF;
END $$;
