/*
  # Table trial_reminders pour gérer les relances pendant la période d'essai
  
  1. Nouvelle table
    - Création de `trial_reminders` pour tracer les e-mails de relance envoyés
    - Permet d'éviter les doublons et de suivre l'efficacité des relances
  
  2. Colonnes
    - id : UUID primary key
    - proprietaire_id : FK vers proprietaires
    - reminder_type : type de relance (day_7, day_15, day_23, day_29, day_30_expired)
    - sent_at : timestamp d'envoi
    - status : statut (scheduled, sent, failed)
    - created_at, updated_at : timestamps automatiques
  
  3. Index
    - Index sur proprietaire_id pour les requêtes rapides
    - Index sur reminder_type et status pour les requêtes de filtrage
*/

-- Créer la table trial_reminders
CREATE TABLE IF NOT EXISTS trial_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('day_7', 'day_15', 'day_23', 'day_29', 'day_30_expired')),
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proprietaire_id, reminder_type)
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_trial_reminders_proprietaire_id ON trial_reminders(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_trial_reminders_type_status ON trial_reminders(reminder_type, status);
CREATE INDEX IF NOT EXISTS idx_trial_reminders_sent_at ON trial_reminders(sent_at);

-- Commentaire sur la table
COMMENT ON TABLE trial_reminders IS 'Table de suivi des e-mails de relance envoyés pendant la période d''essai gratuit';
