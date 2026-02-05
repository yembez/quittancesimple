/*
  # Simplify proprietaires RLS policies

  ## Changes
  
  1. Security Updates
    - Remove policies that query auth.users table (causes permission errors)
    - Allow anonymous inserts for signup flow
    - Authenticated users can manage data linked to their user_id
    - Email-based access for unauthenticated flows
  
  ## Notes
  
  - Anonymous users can insert new proprietaire records
  - Authenticated users can only access records where user_id matches
  - No cross-table queries to auth.users to avoid permission issues
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can insert proprietaire data" ON proprietaires;
DROP POLICY IF EXISTS "Users can read own data" ON proprietaires;
DROP POLICY IF EXISTS "Users can update own data" ON proprietaires;
DROP POLICY IF EXISTS "Users can delete own data" ON proprietaires;
DROP POLICY IF EXISTS "Service role full access" ON proprietaires;

-- Allow anyone to insert (for signup/registration flow)
CREATE POLICY "Enable insert for all users"
  ON proprietaires
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to select their own data by user_id
CREATE POLICY "Enable read for authenticated users"
  ON proprietaires
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to update their own data by user_id
CREATE POLICY "Enable update for authenticated users"
  ON proprietaires
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to delete their own data by user_id
CREATE POLICY "Enable delete for authenticated users"
  ON proprietaires
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role has full access
CREATE POLICY "Service role full access"
  ON proprietaires
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);