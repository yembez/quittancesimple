/*
  # Allow service_role to bypass RLS on bank_connections
  
  1. Solution
    - Grant full permissions to service_role on bank_connections
    - This allows Edge Functions using service_role key to insert/update
  
  2. Security
    - Only service_role key can bypass RLS
    - Regular authenticated users still protected by existing policies
*/

-- Grant all permissions to service_role
GRANT ALL ON bank_connections TO service_role;

-- Also grant on sequence if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'bank_connections_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE bank_connections_id_seq TO service_role;
  END IF;
END $$;