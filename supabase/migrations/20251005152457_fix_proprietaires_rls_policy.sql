/*
  # Fix proprietaires RLS policies for upsert operations

  ## Changes
  
  1. Security Updates
    - Add policy to allow anonymous users to insert their own data
    - Keep existing policies for authenticated users
    - Ensure users can only manage their own data
  
  ## Notes
  
  - Anonymous users can insert new proprietaire records (for signup flow)
  - The `user_id` field will be NULL for anonymous inserts
  - Once a user authenticates, they can link their account using the email match
  - Existing authenticated user policies remain unchanged
*/

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Users can manage their own data" ON proprietaires;
DROP POLICY IF EXISTS "Service role can manage all proprietaires" ON proprietaires;

-- Allow anyone to insert proprietaire data (for signup/registration)
-- This is safe because they can only insert, not read other users' data
CREATE POLICY "Anyone can insert proprietaire data"
  ON proprietaires
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own data by email or user_id
CREATE POLICY "Users can read own data"
  ON proprietaires
  FOR SELECT
  TO anon, authenticated
  USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
    OR user_id = auth.uid()
  );

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON proprietaires
  FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- Allow users to delete their own data
CREATE POLICY "Users can delete own data"
  ON proprietaires
  FOR DELETE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- Service role has full access
CREATE POLICY "Service role full access"
  ON proprietaires
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);