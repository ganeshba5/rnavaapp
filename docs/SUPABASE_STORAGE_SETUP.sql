-- ============================================================================
-- SUPABASE STORAGE SETUP FOR PET MEDIA
-- ============================================================================
-- 
-- Run this SQL in your Supabase SQL Editor to set up the storage bucket
-- and Row Level Security (RLS) policies for pet media.
--
-- ============================================================================

-- Create the storage bucket (if it doesn't exist)
-- Note: This requires the storage admin role
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-media',
  'pet-media',
  false, -- Private bucket (use RLS for access control)
  10485760, -- 10MB file size limit (adjust as needed)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR STORAGE
-- ============================================================================

-- Policy: Users can upload media for their own canines
CREATE POLICY "Users can upload their own pet media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pet-media' AND
  auth.role() = 'authenticated' AND
  -- Extract canine ID from path: {canineId}/{filename}
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM canine_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can view media for their own canines
CREATE POLICY "Users can view their own pet media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pet-media' AND
  auth.role() = 'authenticated' AND
  -- Extract canine ID from path: {canineId}/{filename}
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM canine_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update media for their own canines (if needed)
CREATE POLICY "Users can update their own pet media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pet-media' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM canine_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete media for their own canines
CREATE POLICY "Users can delete their own pet media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pet-media' AND
  auth.role() = 'authenticated' AND
  -- Extract canine ID from path: {canineId}/{filename}
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM canine_profiles 
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- VERIFY SETUP
-- ============================================================================

-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'pet-media';

-- Check if policies were created
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%pet media%';

