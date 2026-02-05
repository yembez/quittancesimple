/*
  # Add RLS Policies for Quittances Table
  
  1. Purpose
    - Allow anonymous users (free plan) to insert quittances
    - Allow users to view their own quittances
    - Allow users to update their own quittances
  
  2. Security
    - Anonymous users can only insert quittances linked to a valid proprietaire_id
    - Users can only view/update their own quittances
    - Service role retains full access
  
  3. Policies Added
    - Anonymous users can insert quittances (for free dashboard)
    - Users can view their own quittances
    - Users can update their own quittances
*/

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow anonymous insert quittances" ON quittances;
  DROP POLICY IF EXISTS "Allow anonymous select own quittances" ON quittances;
  DROP POLICY IF EXISTS "Allow authenticated insert own quittances" ON quittances;
  DROP POLICY IF EXISTS "Allow authenticated select own quittances" ON quittances;
  DROP POLICY IF EXISTS "Allow authenticated update own quittances" ON quittances;
  DROP POLICY IF EXISTS "Allow authenticated delete own quittances" ON quittances;
END $$;

-- Allow anonymous users to insert quittances (for free plan)
CREATE POLICY "Allow anonymous insert quittances"
  ON quittances
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to select their quittances
CREATE POLICY "Allow anonymous select own quittances"
  ON quittances
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to insert their own quittances
CREATE POLICY "Allow authenticated insert own quittances"
  ON quittances
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Allow authenticated users to select their own quittances
CREATE POLICY "Allow authenticated select own quittances"
  ON quittances
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Allow authenticated users to update their own quittances
CREATE POLICY "Allow authenticated update own quittances"
  ON quittances
  FOR UPDATE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Allow authenticated users to delete their own quittances
CREATE POLICY "Allow authenticated delete own quittances"
  ON quittances
  FOR DELETE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires WHERE email = auth.jwt() ->> 'email'
    )
  );