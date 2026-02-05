/*
  # Add 'pending' status to bank_connections

  1. Changes
    - Modify the status check constraint to allow 'pending' status
    - This allows storing connections where accounts aren't synced yet

  2. Security
    - No changes to RLS policies
*/

ALTER TABLE bank_connections
DROP CONSTRAINT IF EXISTS bank_connections_status_check;

ALTER TABLE bank_connections
ADD CONSTRAINT bank_connections_status_check
CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'expired'::text, 'revoked'::text]));