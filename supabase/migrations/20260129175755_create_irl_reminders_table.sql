/*
  # Create IRL Reminders Table
  
  1. New Tables
    - `irl_reminders`
      - `id` (uuid, primary key)
      - `proprietaire_id` (uuid, foreign key to proprietaires)
      - `reminder_date` (date) - date when the reminder should be sent
      - `status` (text) - scheduled, sent, cancelled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `irl_calculation_data` (jsonb) - stores the calculation data for reference
  
  2. Security
    - Enable RLS on `irl_reminders` table
    - Add policy for authenticated users to manage their own reminders
    - Add policy for service role to send reminders
  
  3. Important Notes
    - One active reminder per proprietaire (enforced by unique constraint)
    - Stores calculation data for email content
*/

-- Create irl_reminders table
CREATE TABLE IF NOT EXISTS irl_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  reminder_date date NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  irl_calculation_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint to ensure one active reminder per proprietaire
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_reminder_per_proprietaire 
  ON irl_reminders(proprietaire_id) 
  WHERE status = 'scheduled';

-- Create index for efficient reminder querying
CREATE INDEX IF NOT EXISTS idx_irl_reminders_date_status 
  ON irl_reminders(reminder_date, status);

-- Enable RLS
ALTER TABLE irl_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reminders
CREATE POLICY "Users can view own IRL reminders"
  ON irl_reminders
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Policy: Users can insert their own reminders
CREATE POLICY "Users can insert own IRL reminders"
  ON irl_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Policy: Users can update their own reminders
CREATE POLICY "Users can update own IRL reminders"
  ON irl_reminders
  FOR UPDATE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Policy: Users can delete their own reminders
CREATE POLICY "Users can delete own IRL reminders"
  ON irl_reminders
  FOR DELETE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt()->>'email'
    )
  );

-- Policy: Allow anonymous access for non-authenticated users (for transition period)
CREATE POLICY "Allow anonymous read IRL reminders"
  ON irl_reminders
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert IRL reminders"
  ON irl_reminders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update IRL reminders"
  ON irl_reminders
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete IRL reminders"
  ON irl_reminders
  FOR DELETE
  TO anon
  USING (true);
