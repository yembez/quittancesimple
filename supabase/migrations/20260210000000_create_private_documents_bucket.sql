/*
  # Create Private Documents Storage Bucket with User Isolation

  1. New Bucket
    - `private-documents` bucket for private user files
    - Private bucket (public = false)

  2. Security (RLS Policies)
    - Users can only access files in their own folder: private-documents/{user_id}/...
    - Files are organized by user ID for isolation
    - Authenticated users only

  3. File Structure
    - private-documents/{user_id}/documents/file.pdf
    - private-documents/{user_id}/uploads/file.jpg
    - etc.

  4. Notes
    - Each user has their own folder based on their auth.uid()
    - Users cannot access other users' files
    - Files are not publicly accessible
*/

-- Create private-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-documents',
  'private-documents',
  false, -- Private bucket
  52428800, -- 50MB file size limit (adjust as needed)
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 52428800;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;

-- Policy: Users can upload files only to their own folder
CREATE POLICY "Users can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'private-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read files only from their own folder
CREATE POLICY "Users can read their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'private-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete files only from their own folder
CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'private-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update files only in their own folder
CREATE POLICY "Users can update their own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'private-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'private-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
