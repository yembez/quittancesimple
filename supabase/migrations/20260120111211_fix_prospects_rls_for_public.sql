/*
  # Fix RLS policies for prospects_revision_loyer - Add public access

  1. Changes
    - Drop existing anonymous policy
    - Create new policy for public role (includes anon and authenticated)
    - Keep service role policy

  2. Security
    - Public users (anon + authenticated) can INSERT prospects
    - Service role can do everything
*/

DROP POLICY IF EXISTS "Enable insert for anonymous users" ON prospects_revision_loyer;

CREATE POLICY "Enable insert for public"
  ON prospects_revision_loyer
  FOR INSERT
  TO public
  WITH CHECK (true);
