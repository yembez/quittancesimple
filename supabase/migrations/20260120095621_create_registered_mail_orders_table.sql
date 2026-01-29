/*
  # Table des commandes de courrier recommandé

  1. Nouvelle table
    - registered_mail_orders pour tracker tous les envois de courrier recommandé
    - Liens avec proprietaires pour l'historique
    - Support pour recommandé électronique (AR24) et postal (Maileva)

  2. Sécurité
    - Enable RLS sur registered_mail_orders
    - Politique pour que les utilisateurs voient uniquement leurs commandes

  3. Notes
    - Les credentials AR24_API_TOKEN et MAILEVA_API_TOKEN doivent être configurés
      dans les secrets Supabase via l'interface web
*/

-- Créer la table des commandes de courrier recommandé
CREATE TABLE IF NOT EXISTS registered_mail_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid REFERENCES proprietaires(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('electronique', 'postal')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  recipient_name text NOT NULL,
  recipient_address text NOT NULL,
  recipient_email text,
  sender_name text NOT NULL,
  sender_address text NOT NULL,
  sender_email text NOT NULL,
  document_url text,
  tracking_number text,
  external_id text,
  price_ht numeric(10, 2) NOT NULL,
  price_ttc numeric(10, 2) NOT NULL,
  payment_intent_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE registered_mail_orders ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs authentifiés puissent voir leurs propres commandes
CREATE POLICY "Users can view own registered mail orders"
  ON registered_mail_orders
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE user_id = auth.uid()
    )
  );

-- Politique pour créer des commandes
CREATE POLICY "Users can create registered mail orders"
  ON registered_mail_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE user_id = auth.uid()
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_registered_mail_orders_proprietaire_id 
  ON registered_mail_orders(proprietaire_id);

CREATE INDEX IF NOT EXISTS idx_registered_mail_orders_status 
  ON registered_mail_orders(status);

CREATE INDEX IF NOT EXISTS idx_registered_mail_orders_created_at 
  ON registered_mail_orders(created_at DESC);
