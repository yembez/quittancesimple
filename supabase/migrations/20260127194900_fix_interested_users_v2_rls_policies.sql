/*
  # Fix RLS Policies for interested_users_v2 Table
  
  1. Purpose
    - Enable anonymous users to register their interest via NotifyMeModal
    - Allow public insertion into interested_users_v2 table
    - Maintain data security with appropriate read restrictions
  
  2. Changes
    - Drop any existing restrictive policies
    - Add policy for anonymous INSERT operations
    - Add policy for authenticated users to read their own data
    - Add policy for service role (admin) to manage all data
  
  3. Security
    - Anonymous users can only INSERT (register interest)
    - Authenticated users can only read their own entries
    - Full access for service role for admin operations
*/

-- Drop existing policies if any (clean slate)
DROP POLICY IF EXISTS "Allow anonymous insert" ON interested_users_v2;
DROP POLICY IF EXISTS "Allow authenticated read own data" ON interested_users_v2;
DROP POLICY IF EXISTS "Service role full access" ON interested_users_v2;

-- Policy 1: Allow anonymous users to insert (register their interest)
CREATE POLICY "Allow anonymous insert"
  ON interested_users_v2
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert"
  ON interested_users_v2
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Allow authenticated users to read their own entries
CREATE POLICY "Allow authenticated read own data"
  ON interested_users_v2
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM proprietaires WHERE user_id = auth.uid()));

-- Policy 4: Service role has full access for admin operations
CREATE POLICY "Service role full access"
  ON interested_users_v2
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);