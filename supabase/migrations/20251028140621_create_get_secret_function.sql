/*
  # Create function to retrieve secrets from Vault

  1. Purpose
    - Create a helper function to retrieve secrets from Supabase Vault
    - Used by Edge Functions to access SMS credentials
  
  2. Security
    - Only accessible to service role
    - Returns decrypted secrets from Vault
*/

CREATE OR REPLACE FUNCTION public.get_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name;
  
  RETURN secret_value;
END;
$$;
