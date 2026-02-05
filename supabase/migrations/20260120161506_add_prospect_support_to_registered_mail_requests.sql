/*
  # Add prospect support to registered_mail_requests

  1. Changes
    - Make proprietaire_id nullable to support prospects
    - Add prospect_id column for anonymous users
    - Add baillor_email column for contact
    - Add locataire_email column for electronic mail
    - Add policy for anonymous insert

  2. Security
    - Allow anonymous users to insert requests (for prospects)
    - Service role can access all requests
*/

-- Make proprietaire_id nullable
DO $$
BEGIN
  ALTER TABLE registered_mail_requests 
  ALTER COLUMN proprietaire_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registered_mail_requests' AND column_name = 'prospect_id'
  ) THEN
    ALTER TABLE registered_mail_requests ADD COLUMN prospect_id uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registered_mail_requests' AND column_name = 'baillor_email'
  ) THEN
    ALTER TABLE registered_mail_requests ADD COLUMN baillor_email text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registered_mail_requests' AND column_name = 'locataire_email'
  ) THEN
    ALTER TABLE registered_mail_requests ADD COLUMN locataire_email text;
  END IF;
END $$;

-- Drop old policies
DROP POLICY IF EXISTS "Users can create their own registered mail requests" ON registered_mail_requests;
DROP POLICY IF EXISTS "Users can view their own registered mail requests" ON registered_mail_requests;

-- Create new policies
CREATE POLICY "Authenticated users can create their requests"
  ON registered_mail_requests FOR INSERT
  TO authenticated
  WITH CHECK (proprietaire_id = (SELECT id FROM proprietaires WHERE user_id = auth.uid()));

CREATE POLICY "Anonymous users can create prospect requests"
  ON registered_mail_requests FOR INSERT
  TO anon
  WITH CHECK (prospect_id IS NOT NULL);

CREATE POLICY "Authenticated users can view their requests"
  ON registered_mail_requests FOR SELECT
  TO authenticated
  USING (proprietaire_id IN (SELECT id FROM proprietaires WHERE user_id = auth.uid()));

CREATE POLICY "Service role can access all requests"
  ON registered_mail_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
