/*
  # Create Quittances Storage Bucket and Policies

  1. New Bucket
    - `quittances` bucket for PDF storage

  2. Security (RLS Policies)
    - Anyone can upload quittances (organized by proprietaire_id)
    - Public read access for sharing via links

  3. Notes
    - Files are organized by proprietaire_id: quittances/{proprietaire_id}/file.pdf
    - Bucket is public for downloads and uploads (needed for unauthenticated dashboard users)
*/

-- Create quittances bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('quittances', 'quittances', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload quittances" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read quittances" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete quittances" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update quittances" ON storage.objects;

-- Allow anyone to upload quittances
CREATE POLICY "Anyone can upload quittances"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'quittances');

-- Allow anyone to read quittances (for sharing)
CREATE POLICY "Anyone can read quittances"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'quittances');

-- Allow anyone to delete quittances
CREATE POLICY "Anyone can delete quittances"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'quittances');

-- Allow anyone to update quittances
CREATE POLICY "Anyone can update quittances"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'quittances')
  WITH CHECK (bucket_id = 'quittances');
