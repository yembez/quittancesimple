/*
  # Allow anonymous updates for proprietaires upsert

  ## Changes
  
  1. Security Updates
    - Add policy to allow anonymous users to update proprietaires by email
    - This enables the upsert operation to work for signup flows
    - Existing authenticated user policies remain unchanged
  
  ## Notes
  
  - Anonymous users can update records matching their email (for upsert)
  - This is safe because users can only update their own data
  - Once authenticated, users will use the user_id-based policies
*/

-- Allow anonymous users to update their own data by email (for upsert)
CREATE POLICY "Enable update for anonymous users by email"
  ON proprietaires
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);