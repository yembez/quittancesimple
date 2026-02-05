/*
  # Fix RLS policies for prospects_revision_loyer table

  1. Changes
    - Drop existing policies
    - Create new policy allowing anonymous users to insert prospects
    - Create policy for service role to manage all operations

  2. Security
    - Anonymous users can only INSERT (to register as prospects)
    - Service role can do everything (for automated follow-ups)
*/

DROP POLICY IF EXISTS "Allow anonymous insert prospects" ON prospects_revision_loyer;
DROP POLICY IF EXISTS "Allow service role full access" ON prospects_revision_loyer;

CREATE POLICY "Enable insert for anonymous users"
  ON prospects_revision_loyer
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable all for service role"
  ON prospects_revision_loyer
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
