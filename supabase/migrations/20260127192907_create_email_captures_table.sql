/*
  # Create email_captures table for comprehensive email tracking

  1. Purpose
    - Capture ALL email addresses entered across the entire application
    - Track the context: which page, which form field, device type
    - Store immediately when email is validated, even if form is not submitted
    - Enable funnel analysis and lead tracking

  2. New Table
    - `email_captures`
      - `id` (uuid, primary key)
      - `email` (text) - The captured email address
      - `page_source` (text) - Which page the email was entered (home, generator, irl, automation, etc.)
      - `form_type` (text) - Type of form (quittance_generation, free_signup, notify_me, etc.)
      - `device_type` (text) - mobile or desktop
      - `user_agent` (text) - Full user agent string
      - `referrer` (text) - HTTP referrer
      - `form_completed` (boolean) - Whether the user completed the entire form
      - `converted` (boolean) - Whether this lead converted to a customer
      - `proprietaire_id` (uuid, nullable) - Link if user later creates account
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Indexes
    - Index on email for quick lookups
    - Index on page_source for analytics
    - Index on created_at for time-based queries

  4. Security
    - Enable RLS
    - Allow anonymous inserts (for capturing emails)
    - Allow updates to link to proprietaire later
*/

-- Create email_captures table
CREATE TABLE IF NOT EXISTS email_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  page_source text NOT NULL,
  form_type text NOT NULL,
  device_type text DEFAULT 'desktop',
  user_agent text,
  referrer text,
  form_completed boolean DEFAULT false,
  converted boolean DEFAULT false,
  proprietaire_id uuid REFERENCES proprietaires(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (capture emails)
CREATE POLICY "Anyone can capture emails"
  ON email_captures
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow updates to mark form completed or link to proprietaire
CREATE POLICY "Anyone can update their email captures"
  ON email_captures
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow reading own captures (for authenticated users)
CREATE POLICY "Users can read their own captures"
  ON email_captures
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = proprietaire_id::text OR proprietaire_id IS NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON email_captures(email);
CREATE INDEX IF NOT EXISTS idx_email_captures_page_source ON email_captures(page_source);
CREATE INDEX IF NOT EXISTS idx_email_captures_created_at ON email_captures(created_at);
CREATE INDEX IF NOT EXISTS idx_email_captures_proprietaire ON email_captures(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_email_captures_form_type ON email_captures(form_type);

-- Add comments
COMMENT ON TABLE email_captures IS 'Captures all email addresses entered across the application for lead tracking and funnel analysis';
COMMENT ON COLUMN email_captures.page_source IS 'Page where email was captured (home, generator, irl, automation, pricing, etc.)';
COMMENT ON COLUMN email_captures.form_type IS 'Type of form (quittance_generation, free_signup, notify_me, subscription, etc.)';
COMMENT ON COLUMN email_captures.device_type IS 'Device type: mobile or desktop';
COMMENT ON COLUMN email_captures.form_completed IS 'Whether user completed the entire form after entering email';
COMMENT ON COLUMN email_captures.converted IS 'Whether this lead converted to a paying customer';
COMMENT ON COLUMN email_captures.metadata IS 'Additional metadata (form fields, utm params, etc.)';
