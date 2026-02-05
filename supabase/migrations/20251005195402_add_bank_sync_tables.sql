/*
  # Bank Synchronization and Payment Verification System

  1. New Tables
    - `bank_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Owner of the bank connection
      - `requisition_id` (text) - Nordigen requisition ID
      - `account_id` (text) - Nordigen account ID
      - `institution_id` (text) - Bank institution ID
      - `institution_name` (text) - Bank name
      - `access_token` (text, encrypted) - Nordigen access token
      - `refresh_token` (text, encrypted) - Nordigen refresh token
      - `access_valid_until` (timestamptz) - Token expiration
      - `status` (text) - Connection status: 'active', 'expired', 'revoked'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `expected_payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Owner expecting payment
      - `bank_connection_id` (uuid, references bank_connections)
      - `locataire_id` (uuid, references proprietaires) - Tenant who should pay
      - `montant_loyer` (numeric) - Expected rent amount
      - `date_expected` (date) - Expected payment date
      - `reference_keywords` (text[]) - Keywords to match in transaction description
      - `status` (text) - 'pending', 'verified', 'failed'
      - `last_check_date` (timestamptz) - Last verification date
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payment_verifications`
      - `id` (uuid, primary key)
      - `expected_payment_id` (uuid, references expected_payments)
      - `transaction_id` (text) - Bank transaction ID
      - `transaction_date` (date) - Actual payment date
      - `transaction_amount` (numeric) - Actual amount received
      - `transaction_description` (text) - Transaction description
      - `verified_at` (timestamptz) - When payment was verified
      - `quittance_sent` (boolean) - Whether receipt was sent
      - `quittance_sent_at` (timestamptz) - When receipt was sent
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own bank connections
    - Users can only access their own expected payments
    - Users can only access their own payment verifications

  3. Indexes
    - Index on user_id for fast lookups
    - Index on status for filtering active connections
    - Index on date_expected for scheduled checks
*/

-- Create bank_connections table
CREATE TABLE IF NOT EXISTS bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  requisition_id text NOT NULL,
  account_id text,
  institution_id text NOT NULL,
  institution_name text NOT NULL,
  access_token text,
  refresh_token text,
  access_valid_until timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expected_payments table
CREATE TABLE IF NOT EXISTS expected_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_connection_id uuid REFERENCES bank_connections(id) ON DELETE CASCADE,
  locataire_id uuid REFERENCES proprietaires(id) ON DELETE CASCADE,
  montant_loyer numeric NOT NULL,
  date_expected date NOT NULL,
  reference_keywords text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  last_check_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_verifications table
CREATE TABLE IF NOT EXISTS payment_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expected_payment_id uuid REFERENCES expected_payments(id) ON DELETE CASCADE,
  transaction_id text NOT NULL,
  transaction_date date NOT NULL,
  transaction_amount numeric NOT NULL,
  transaction_description text,
  verified_at timestamptz DEFAULT now(),
  quittance_sent boolean DEFAULT false,
  quittance_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE expected_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for bank_connections
CREATE POLICY "Users can view own bank connections"
  ON bank_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank connections"
  ON bank_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank connections"
  ON bank_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank connections"
  ON bank_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for expected_payments
CREATE POLICY "Users can view own expected payments"
  ON expected_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expected payments"
  ON expected_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expected payments"
  ON expected_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expected payments"
  ON expected_payments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for payment_verifications
CREATE POLICY "Users can view own payment verifications"
  ON payment_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expected_payments
      WHERE expected_payments.id = payment_verifications.expected_payment_id
      AND expected_payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own payment verifications"
  ON payment_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expected_payments
      WHERE expected_payments.id = expected_payment_id
      AND expected_payments.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_status ON bank_connections(status);
CREATE INDEX IF NOT EXISTS idx_expected_payments_user_id ON expected_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_expected_payments_status ON expected_payments(status);
CREATE INDEX IF NOT EXISTS idx_expected_payments_date ON expected_payments(date_expected);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_expected_payment ON payment_verifications(expected_payment_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_bank_connections_updated_at ON bank_connections;
CREATE TRIGGER update_bank_connections_updated_at
  BEFORE UPDATE ON bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expected_payments_updated_at ON expected_payments;
CREATE TRIGGER update_expected_payments_updated_at
  BEFORE UPDATE ON expected_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
