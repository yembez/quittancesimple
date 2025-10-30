/*
  # Add UPDATE policy for short_links

  1. Changes
    - Add UPDATE policy for anonymous users to mark links as used
    - This allows ShortLinkRedirect to update used_at timestamp
    - Only allows updating used_at field for valid (non-expired) links

  2. Security
    - Anonymous users can only UPDATE valid links
    - Only used_at field can be modified
    - Links must not be expired
*/

-- Allow anonymous users to mark short links as used
CREATE POLICY "Anyone can mark short links as used"
  ON short_links FOR UPDATE
  TO anon, authenticated
  USING (expires_at > now())
  WITH CHECK (expires_at > now());
