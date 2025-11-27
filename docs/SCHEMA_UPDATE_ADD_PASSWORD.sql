-- ============================================================================
-- Schema Update: Add password_hash to user_profiles
-- ============================================================================
-- This update adds password_hash field to store hashed passwords for app-based authentication
-- Run this in Supabase SQL Editor after running the main schema

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index on email for faster authentication lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Note: password_hash should be set to NOT NULL after migrating existing users
-- For now, we allow NULL for backward compatibility with existing test data

