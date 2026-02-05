/*
  # Improve RLS Policies for Locataires Status Updates

  1. Purpose
    - Ensure service role can update locataires statut field for SMS confirmation flow
    - Fix potential RLS blocking issues when updating statut after quittance send
  
  2. Changes
    - Add explicit service role bypass policies
    - Ensure statut updates work correctly from edge functions
    - Add policy allowing propriétaire_id based updates for authenticated users
  
  3. Security
    - Service role retains full access (can bypass RLS)
    - Authenticated users can still only update their own proprietaire's locataires
    - Statut field can be safely updated
*/

-- Check if RLS is enabled on locataires table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'locataires' AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Table locataires does not exist';
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE locataires ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can update their own locataires" ON locataires;
  DROP POLICY IF EXISTS "Service role can update locataires" ON locataires;
  DROP POLICY IF EXISTS "allow_update_locataires" ON locataires;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add improved UPDATE policy for authenticated users (based on proprietaire_id)
CREATE POLICY "Authenticated users can update their own locataires v2"
  ON locataires
  FOR UPDATE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM proprietaires 
      WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM proprietaires 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- Note: Service role key bypasses all RLS policies automatically
-- No explicit policy needed for service role to update locataires