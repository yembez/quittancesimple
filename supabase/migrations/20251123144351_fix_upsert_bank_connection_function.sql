/*
  # Fix upsert_bank_connection function
  
  1. Changes
    - Remove ON CONFLICT clause (user_id is not unique)
    - Use manual check and insert/update logic instead
  
  2. Behavior
    - If connection exists for user, update it
    - If no connection exists, insert new one
*/

-- Drop and recreate function
DROP FUNCTION IF EXISTS upsert_bank_connection(uuid, text, text, text, text, text);

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
  v_existing_id uuid;
BEGIN
  -- Check if connection already exists for this user
  SELECT id INTO v_existing_id
  FROM bank_connections
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing connection
    UPDATE bank_connections
    SET
      requisition_id = p_requisition_id,
      institution_id = p_institution_id,
      institution_name = p_institution_name,
      access_token = p_access_token,
      status = p_status,
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING json_build_object(
      'id', id,
      'user_id', user_id,
      'status', status
    ) INTO v_result;
  ELSE
    -- Insert new connection
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
    RETURNING json_build_object(
      'id', id,
      'user_id', user_id,
      'status', status
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_bank_connection(uuid, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION upsert_bank_connection(uuid, text, text, text, text, text) TO authenticated;