/*
  # Analytics System - Simple and CNIL Compliant
  
  1. New Tables
    - `page_views`
      - `id` (uuid, primary key)
      - `page_url` (text) - URL de la page visitée
      - `page_title` (text) - Titre de la page
      - `referrer` (text) - Page précédente
      - `user_agent` (text) - Navigateur utilisé
      - `screen_width` (integer) - Largeur d'écran
      - `language` (text) - Langue du navigateur
      - `country` (text) - Pays (optionnel)
      - `created_at` (timestamptz) - Date de la visite
    
    - `events`
      - `id` (uuid, primary key)
      - `event_name` (text) - Nom de l'événement
      - `event_category` (text) - Catégorie
      - `event_label` (text) - Label/description
      - `event_value` (integer) - Valeur numérique (optionnel)
      - `page_url` (text) - URL où l'événement s'est produit
      - `created_at` (timestamptz) - Date de l'événement
  
  2. Security
    - Enable RLS on both tables
    - Allow anonymous INSERT only (for tracking)
    - No SELECT/UPDATE/DELETE for public (admin only via dashboard)
  
  3. Important Notes
    - No cookies used
    - No personal data stored
    - IP addresses NOT stored (CNIL compliant)
    - Anonymous tracking only
    - Data retention: 13 months (to be configured via cron job)
*/

-- Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url text NOT NULL,
  page_title text,
  referrer text,
  user_agent text,
  screen_width integer,
  language text,
  country text,
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_category text,
  event_label text,
  event_value integer,
  page_url text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_event_category ON events(event_category);

-- Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to INSERT page views
CREATE POLICY "Allow anonymous to insert page views"
  ON page_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anonymous users to INSERT events
CREATE POLICY "Allow anonymous to insert events"
  ON events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to SELECT their analytics data
CREATE POLICY "Allow authenticated to view analytics"
  ON page_views
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to view events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to clean old analytics data (13 months retention)
CREATE OR REPLACE FUNCTION clean_old_analytics_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '13 months';
  DELETE FROM events WHERE created_at < NOW() - INTERVAL '13 months';
END;
$$;

-- Optional: Create a scheduled job to run cleanup monthly
-- This can be configured in Supabase Dashboard under Database > Cron Jobs
COMMENT ON FUNCTION clean_old_analytics_data() IS 'Deletes analytics data older than 13 months for CNIL compliance';
