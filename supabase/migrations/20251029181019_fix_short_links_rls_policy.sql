/*
  # Fix RLS policy for short_links table

  1. Changes
    - Add INSERT policy for anonymous users to create short links
    - This is needed when Dashboard creates short links before sending SMS
    - Links are temporary (30 days expiration) and safe to create anonymously

  2. Security
    - Only INSERT is allowed for anonymous users
    - SELECT remains restricted to valid (non-expired) links
    - Links auto-expire after 30 days
*/

-- Allow anonymous users to create short links
CREATE POLICY "Anyone can create short links"
  ON short_links FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);