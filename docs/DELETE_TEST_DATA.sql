-- ============================================================================
-- DELETE TEST DATA FROM SUPABASE
-- ============================================================================
-- 
-- This script deletes all test data from the database.
-- WARNING: This will delete ALL data from these tables!
-- 
-- Run this in your Supabase SQL Editor to clear test data.
--
-- ============================================================================

-- Delete in reverse order of dependencies (child tables first)
DELETE FROM media_items;
DELETE FROM appointments;
DELETE FROM training_logs;
DELETE FROM nutrition_entries;
DELETE FROM contacts;
DELETE FROM canine_profiles;
DELETE FROM vet_profiles;
DELETE FROM user_profiles;

-- Reset sequences (if any)
-- Note: Supabase uses UUIDs, so no sequences to reset

-- Verify deletion
SELECT 
  'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'canine_profiles', COUNT(*) FROM canine_profiles
UNION ALL
SELECT 'vet_profiles', COUNT(*) FROM vet_profiles
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'nutrition_entries', COUNT(*) FROM nutrition_entries
UNION ALL
SELECT 'training_logs', COUNT(*) FROM training_logs
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'media_items', COUNT(*) FROM media_items;



