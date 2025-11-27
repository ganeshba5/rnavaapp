-- ============================================================================
-- STORAGE BUCKET OPTIONS
-- ============================================================================
-- 
-- Choose ONE of these options based on your security needs:
--
-- OPTION 1: Public Bucket (Simpler, but less secure)
--           - Images are accessible via public URLs
--           - No authentication needed to view
--           - Good for public pet photos
--
-- OPTION 2: Private Bucket with Signed URLs (More secure, recommended)
--           - Images require authentication or signed URLs
--           - Better for private pet data
--           - Current implementation uses signed URLs
--
-- ============================================================================

-- ============================================================================
-- OPTION 1: Make Bucket Public
-- ============================================================================
-- Run this if you want public access to images (simpler setup)

UPDATE storage.buckets 
SET public = true 
WHERE id = 'pet-media';

-- ============================================================================
-- OPTION 2: Keep Bucket Private (Recommended)
-- ============================================================================
-- The bucket is already set to private (public = false)
-- The app will use signed URLs which expire after 1 year
-- This is more secure as it requires authentication

-- No changes needed - bucket is already private

-- ============================================================================
-- VERIFY CURRENT SETTING
-- ============================================================================

SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'pet-media';



