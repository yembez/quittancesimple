/*
  # Allow service role to manage bank connections
  
  1. Changes
    - Add policy to allow service role (bypass RLS) to insert/update bank_connections
    - This is needed for Edge Functions that create connections on behalf of users
  
  2. Security
    - Service role policies only apply when using SUPABASE_SERVICE_ROLE_KEY
    - Regular users still restricted by existing authenticated policies
*/

-- Drop existing service role policies if they exist
DROP POLICY IF EXISTS "Service role can insert bank connections" ON bank_connections;
DROP POLICY IF EXISTS "Service role can update bank connections" ON bank_connections;
DROP POLICY IF EXISTS "Service role can select bank connections" ON bank_connections;

-- Allow service role to insert bank connections for any user
CREATE POLICY "Service role can insert bank connections"
  ON bank_connections
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to update bank connections
CREATE POLICY "Service role can update bank connections"
  ON bank_connections
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to select bank connections
CREATE POLICY "Service role can select bank connections"
  ON bank_connections
  FOR SELECT
  TO service_role
  USING (true);