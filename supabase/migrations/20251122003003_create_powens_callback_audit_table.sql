/*
  # Create Powens Callback Audit Table
  
  1. New Tables
    - `powens_callback_logs`
      - Logs all callbacks/redirects from Powens for debugging
      - Stores full request details (headers, body, query params)
      - Helps troubleshoot connection issues
  
  2. Security
    - Enable RLS
    - Only authenticated users can view their own logs
*/

CREATE TABLE IF NOT EXISTS powens_callback_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL, -- 'redirect', 'webhook', 'token_exchange'
  request_method text,
  request_url text,
  request_headers jsonb,
  request_body jsonb,
  query_params jsonb,
  response_status integer,
  response_body jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE powens_callback_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own callback logs"
  ON powens_callback_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_powens_callback_logs_user_id 
  ON powens_callback_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_powens_callback_logs_created_at 
  ON powens_callback_logs(created_at DESC);