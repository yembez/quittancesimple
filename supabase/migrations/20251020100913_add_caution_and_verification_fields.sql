/*
  # Ajout des champs pour caution et détection intelligente de l'IBAN

  1. Modifications de la table `locataires`
    - `caution_initiale` (numeric) - Montant de la caution versée initialement
    - Aide à l'identification de l'IBAN lors du premier versement

  2. Modifications de la table `rent_payment_rules`
    - `verification_day_start` (integer) - Jour de début de période de vérification (1-31)
    - `verification_day_end` (integer) - Jour de fin de période de vérification (1-31)
    - `iban_confirmed` (boolean) - Si le propriétaire a confirmé l'IBAN lors du 1er paiement
    - `iban_confirmed_at` (timestamptz) - Date de confirmation de l'IBAN
    - `last_verification_alert_sent` (timestamptz) - Date du dernier email/SMS d'alerte

  3. Notes importantes
    - La caution aide à identifier l'IBAN : si on reçoit loyer+caution ou 2 virements séparés
    - La confirmation du 1er paiement est OBLIGATOIRE pour sécuriser l'identification
    - Les alertes de loyer non reçu sont envoyées si aucun paiement pendant la période
*/

-- Ajouter le champ caution à la table locataires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locataires' AND column_name = 'caution_initiale'
  ) THEN
    ALTER TABLE locataires ADD COLUMN caution_initiale NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- Ajouter les champs de vérification et confirmation à rent_payment_rules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payment_rules' AND column_name = 'verification_day_start'
  ) THEN
    ALTER TABLE rent_payment_rules ADD COLUMN verification_day_start INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payment_rules' AND column_name = 'verification_day_end'
  ) THEN
    ALTER TABLE rent_payment_rules ADD COLUMN verification_day_end INTEGER DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payment_rules' AND column_name = 'iban_confirmed'
  ) THEN
    ALTER TABLE rent_payment_rules ADD COLUMN iban_confirmed BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payment_rules' AND column_name = 'iban_confirmed_at'
  ) THEN
    ALTER TABLE rent_payment_rules ADD COLUMN iban_confirmed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payment_rules' AND column_name = 'last_verification_alert_sent'
  ) THEN
    ALTER TABLE rent_payment_rules ADD COLUMN last_verification_alert_sent TIMESTAMPTZ;
  END IF;
END $$;

-- Ajouter des contraintes de validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_day_start_range'
  ) THEN
    ALTER TABLE rent_payment_rules 
    ADD CONSTRAINT verification_day_start_range 
    CHECK (verification_day_start >= 1 AND verification_day_start <= 31);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_day_end_range'
  ) THEN
    ALTER TABLE rent_payment_rules 
    ADD CONSTRAINT verification_day_end_range 
    CHECK (verification_day_end >= 1 AND verification_day_end <= 31);
  END IF;
END $$;

-- Créer une table pour les paiements détectés en attente de confirmation
CREATE TABLE IF NOT EXISTS pending_payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  locataire_id UUID NOT NULL REFERENCES locataires(id) ON DELETE CASCADE,
  rent_payment_rule_id UUID NOT NULL REFERENCES rent_payment_rules(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  detected_iban TEXT NOT NULL,
  detected_amount NUMERIC(10,2) NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  sender_name TEXT,
  description TEXT,
  confidence_score INTEGER DEFAULT 50, -- Score de confiance de 0 à 100
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(transaction_id, rent_payment_rule_id)
);

-- Activer RLS sur pending_payment_confirmations
ALTER TABLE pending_payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Politique : Les propriétaires peuvent voir leurs propres confirmations en attente
CREATE POLICY "Proprietaires can view own pending confirmations"
  ON pending_payment_confirmations
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = proprietaire_id::text);

-- Politique : Les utilisateurs anonymes peuvent voir leurs confirmations (via email match)
CREATE POLICY "Anonymous can view own pending confirmations"
  ON pending_payment_confirmations
  FOR SELECT
  TO anon
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Politique : Les propriétaires peuvent mettre à jour leurs confirmations
CREATE POLICY "Proprietaires can update own pending confirmations"
  ON pending_payment_confirmations
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = proprietaire_id::text)
  WITH CHECK (auth.uid()::text = proprietaire_id::text);

-- Politique : Les utilisateurs anonymes peuvent mettre à jour leurs confirmations
CREATE POLICY "Anonymous can update own pending confirmations"
  ON pending_payment_confirmations
  FOR UPDATE
  TO anon
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  )
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Politique : Insertion pour les edge functions (service role)
CREATE POLICY "Service role can insert pending confirmations"
  ON pending_payment_confirmations
  FOR INSERT
  TO service_role
  WITH CHECK (true);
