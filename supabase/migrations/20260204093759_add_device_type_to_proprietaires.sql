/*
  # Add device type tracking to proprietaires table

  1. Changes
    - Add `device_type` column to `proprietaires` table
      - Stores whether the owner signed up from mobile or desktop
      - Values: 'mobile', 'desktop', or null (for legacy data)
    - Add `device_detected_at` column to track when device was first detected
  
  2. Purpose
    - Track user acquisition channel (mobile vs desktop)
    - Enable targeted marketing campaigns
    - Analyze conversion rates by device type
    - Improve UX based on device-specific behavior
*/

-- Add device_type column to proprietaires table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proprietaires' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE proprietaires 
    ADD COLUMN device_type text CHECK (device_type IN ('mobile', 'desktop'));
  END IF;
END $$;

-- Add device_detected_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proprietaires' AND column_name = 'device_detected_at'
  ) THEN
    ALTER TABLE proprietaires 
    ADD COLUMN device_detected_at timestamptz;
  END IF;
END $$;

-- Create index for device_type queries
CREATE INDEX IF NOT EXISTS idx_proprietaires_device_type 
ON proprietaires(device_type) 
WHERE device_type IS NOT NULL;

-- Add comment
COMMENT ON COLUMN proprietaires.device_type IS 'Device type used for initial signup: mobile or desktop';
COMMENT ON COLUMN proprietaires.device_detected_at IS 'Timestamp when device type was first detected';
