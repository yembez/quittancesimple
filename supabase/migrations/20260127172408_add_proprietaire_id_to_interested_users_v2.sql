/*
  # Add proprietaire_id link to interested_users_v2

  1. Changes
    - Add optional proprietaire_id column to interested_users_v2
    - Add foreign key constraint to link with proprietaires table
    - Add index for performance
    - Add product_interest column to track which product they're interested in
  
  2. Purpose
    - Link interested users (leads) to existing proprietaire accounts when applicable
    - Track which specific product users are interested in
    - Enable better segmentation for marketing and product launch notifications
  
  3. Security
    - Maintains existing RLS policies
    - Optional relationship - can be NULL for anonymous leads
*/

-- Add proprietaire_id column (optional - can be NULL for new leads)
ALTER TABLE interested_users_v2 
ADD COLUMN IF NOT EXISTS proprietaire_id uuid REFERENCES proprietaires(id) ON DELETE SET NULL;

-- Add product interest tracking
ALTER TABLE interested_users_v2 
ADD COLUMN IF NOT EXISTS product_interest text DEFAULT 'quittance_connectee_plus';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_interested_users_proprietaire 
ON interested_users_v2(proprietaire_id);

-- Add index for product filtering
CREATE INDEX IF NOT EXISTS idx_interested_users_product 
ON interested_users_v2(product_interest);

-- Add comments for documentation
COMMENT ON COLUMN interested_users_v2.proprietaire_id IS 'Links to existing proprietaire if user is already registered, NULL for new leads';
COMMENT ON COLUMN interested_users_v2.product_interest IS 'Which product/feature the user is interested in (e.g., quittance_connectee_plus, automation_premium)';
