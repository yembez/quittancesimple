/*
  # Add Storage Policies for Public Website Images
  
  1. Security Changes
    - Allow public uploads to website-images bucket
    - Allow public reads from website-images bucket
    - Allow public updates to website-images bucket (for upserts)
    
  2. Notes
    - This bucket is specifically for static website assets
    - Images need to be publicly accessible
    - Authenticated and anonymous users can upload
*/

-- Allow anyone to read from website-images bucket
CREATE POLICY "Public read access for website images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'website-images');

-- Allow anyone to upload to website-images bucket
CREATE POLICY "Public upload access for website images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'website-images');

-- Allow anyone to update in website-images bucket (for upserts)
CREATE POLICY "Public update access for website images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'website-images')
  WITH CHECK (bucket_id = 'website-images');

-- Allow anyone to delete from website-images bucket (for upserts)
CREATE POLICY "Public delete access for website images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'website-images');
