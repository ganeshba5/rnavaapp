-- ============================================================================
-- SCHEMA UPDATES FOR AVA APPLICATION
-- ============================================================================
-- 
-- These updates add user_id to contacts table to make contacts user-specific.
-- Run this AFTER creating the base schema and BEFORE running RLS policies.
--
-- ============================================================================

-- Add user_id column to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Make user_id NOT NULL (after adding it, you may need to update existing rows)
-- ALTER TABLE contacts ALTER COLUMN user_id SET NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- ============================================================================
-- Note: If you have existing contacts, you'll need to update them:
-- UPDATE contacts SET user_id = (SELECT id FROM user_profiles LIMIT 1) WHERE user_id IS NULL;
-- ============================================================================



