/*
  # Create rent payment detection rules

  1. New Tables
    - `rent_payment_rules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `bank_connection_id` (uuid, references bank_connections)
      - `property_id` (uuid, nullable - for future use)
      - `expected_amount` (decimal) - Montant attendu du loyer
      - `sender_iban` (text, nullable) - IBAN du locataire attendu
      - `sender_name` (text, nullable) - Nom du locataire attendu
      - `description_contains` (text, nullable) - Mots-clés dans la description
      - `tolerance_amount` (decimal) - Tolérance de montant (+/- en euros)
      - `auto_generate_receipt` (boolean) - Générer automatiquement la quittance
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `rent_payment_rules` table
    - Add policies for authenticated users to manage their own rules
*/

CREATE TABLE IF NOT EXISTS rent_payment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_connection_id uuid REFERENCES bank_connections(id) ON DELETE CASCADE,
  property_id uuid,
  expected_amount decimal(10,2) NOT NULL,
  sender_iban text,
  sender_name text,
  description_contains text,
  tolerance_amount decimal(10,2) DEFAULT 5.00,
  auto_generate_receipt boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rent_payment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment rules"
  ON rent_payment_rules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment rules"
  ON rent_payment_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment rules"
  ON rent_payment_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment rules"
  ON rent_payment_rules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);