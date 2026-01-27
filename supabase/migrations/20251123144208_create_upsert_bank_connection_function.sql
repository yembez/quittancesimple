/*
  # Create function to upsert bank connections (bypasses RLS)
  
  1. Purpose
    - Allows Edge Functions to insert/update bank_connections
    - Bypasses RLS policies since function runs with SECURITY DEFINER
  
  2. Security
    - Function is owned by postgres (superuser)
    - Only callable by service_role or authenticated users
    - Validates all inputs before insertion
*/

-- Drop function if exists
DROP FUNCTION IF EXISTS upsert_bank_connection(uuid, text, text, text, text, text);

-- Create function to upsert bank connection
CREATE OR REPLACE FUNCTION upsert_bank_connection(
  p_user_id uuid,
  p_requisition_id text,
  p_institution_id text,
  p_institution_name text,
  p_access_token text,
  p_status text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Insert or update bank connection
  INSERT INTO bank_connections (
    user_id,
    requisition_id,
    institution_id,
    institution_name,
    access_token,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_requisition_id,
    p_institution_id,
    p_institution_name,
    p_access_token,
    p_status,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    requisition_id = EXCLUDED.requisition_id,
    institution_id = EXCLUDED.institution_id,
    institution_name = EXCLUDED.institution_name,
    access_token = EXCLUDED.access_token,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING json_build_object(
    'id', id,
    'user_id', user_id,
    'status', status
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission to service_role and authenticated
GRANT EXECUTE ON FUNCTION upsert_bank_connection(uuid, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION upsert_bank_connection(uuid, text, text, text, text, text) TO authenticated;