/*
  # Make bank_connections.user_id nullable for testing
  
  1. Changes
    - Drop the existing foreign key constraint
    - Make user_id column nullable
    - Add back the foreign key constraint but allow NULL values
    
  2. Rationale
    - Allows testing Powens integration without full Supabase Auth setup
    - Proprietaires without user_id can still connect their banks
    - For production, we'll ensure all proprietaires have proper user_id
    
  3. Security
    - RLS policies will still protect data access
    - NULL user_id connections will be filtered by application logic
*/

-- Drop the existing foreign key constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bank_connections_user_id_fkey'
  ) THEN
    ALTER TABLE bank_connections 
    DROP CONSTRAINT bank_connections_user_id_fkey;
  END IF;
END $$;

-- Make user_id nullable
ALTER TABLE bank_connections 
ALTER COLUMN user_id DROP NOT NULL;

-- Add back the foreign key constraint (allowing NULL)
ALTER TABLE bank_connections
ADD CONSTRAINT bank_connections_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id 
ON bank_connections(user_id) 
WHERE user_id IS NOT NULL;