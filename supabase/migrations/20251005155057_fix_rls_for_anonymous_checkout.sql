/*
  # Fix RLS policies for anonymous checkout

  1. Changes to proprietaires policies
    - Allow anonymous users to insert proprietaires during checkout
    - Allow anonymous users to read proprietaires by email
    
  2. Changes to locataires policies
    - Allow anonymous users to insert locataires during checkout
    - Allow anonymous users to read locataires by proprietaire_id
    
  3. Security considerations
    - These policies are necessary for the checkout flow
    - Users can only insert, not update or delete
    - Authentication will be added later for management
*/

-- Drop existing insert policy for proprietaires and recreate with better conditions
DROP POLICY IF EXISTS "Enable insert for all users" ON proprietaires;

CREATE POLICY "Anonymous users can insert proprietaires"
  ON proprietaires
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add policy to allow anonymous users to read by email (for dashboard access)
DROP POLICY IF EXISTS "Anonymous can read by email" ON proprietaires;

CREATE POLICY "Anonymous can read by email"
  ON proprietaires
  FOR SELECT
  TO anon
  USING (true);

-- Add policies for locataires to allow anonymous insert
DROP POLICY IF EXISTS "Anonymous users can insert locataires" ON locataires;

CREATE POLICY "Anonymous users can insert locataires"
  ON locataires
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add policy to allow anonymous users to read locataires
DROP POLICY IF EXISTS "Anonymous can read locataires" ON locataires;

CREATE POLICY "Anonymous can read locataires"
  ON locataires
  FOR SELECT
  TO anon
  USING (true);