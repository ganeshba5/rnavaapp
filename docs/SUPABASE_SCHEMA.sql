-- ============================================================================
-- AVA Application - Supabase Database Schema
-- ============================================================================
-- 
-- This file contains the SQL schema for creating all tables in Supabase.
-- 
-- To set up the database:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Run each CREATE TABLE statement below
-- 4. Set up Row Level Security (RLS) policies as needed
--
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER_PROFILES Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  profile_photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'Pet Owner' CHECK (role IN ('Admin', 'Pet Owner', 'Vet', 'Dog Walker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ============================================================================
-- CANINE_PROFILES Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS canine_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Unknown')),
  weight DECIMAL(10, 2),
  weight_unit TEXT CHECK (weight_unit IN ('kg', 'lbs')),
  color TEXT,
  microchip_number TEXT,
  profile_photo_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_canine_profiles_user_id ON canine_profiles(user_id);

-- ============================================================================
-- VET_PROFILES Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS vet_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  clinic_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT NOT NULL DEFAULT 'US' CHECK (country IN ('US', 'India')),
  specialization TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONTACTS Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- NUTRITION_ENTRIES Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canine_id UUID NOT NULL REFERENCES canine_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Treat', 'Other')),
  food_name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('grams', 'cups', 'oz', 'pieces')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on canine_id for faster queries
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_canine_id ON nutrition_entries(canine_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_date ON nutrition_entries(date);

-- ============================================================================
-- TRAINING_LOGS Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canine_id UUID NOT NULL REFERENCES canine_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  skill TEXT NOT NULL,
  duration INTEGER, -- in minutes
  activity TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on canine_id for faster queries
CREATE INDEX IF NOT EXISTS idx_training_logs_canine_id ON training_logs(canine_id);
CREATE INDEX IF NOT EXISTS idx_training_logs_date ON training_logs(date);

-- ============================================================================
-- APPOINTMENTS Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  canine_id UUID REFERENCES canine_profiles(id) ON DELETE CASCADE,
  vet_id UUID REFERENCES vet_profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  notes TEXT,
  reminder BOOLEAN DEFAULT FALSE,
  reminder_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_canine_id ON appointments(canine_id);
CREATE INDEX IF NOT EXISTS idx_appointments_vet_id ON appointments(vet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================================================
-- MEDIA_ITEMS Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canine_id UUID NOT NULL REFERENCES canine_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  uri TEXT NOT NULL,
  thumbnail_uri TEXT,
  caption TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on canine_id for faster queries
CREATE INDEX IF NOT EXISTS idx_media_items_canine_id ON media_items(canine_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canine_profiles_updated_at BEFORE UPDATE ON canine_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vet_profiles_updated_at BEFORE UPDATE ON vet_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_entries_updated_at BEFORE UPDATE ON nutrition_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_logs_updated_at BEFORE UPDATE ON training_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- 
-- Note: RLS policies should be configured based on your authentication setup.
-- Below are example policies - adjust based on your needs.
--
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE canine_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (adjust based on your auth setup):
-- Users can only see their own profiles
-- CREATE POLICY "Users can view own profile" ON user_profiles
--   FOR SELECT USING (auth.uid()::text = id::text);

-- Users can only see their own canines
-- CREATE POLICY "Users can view own canines" ON canine_profiles
--   FOR SELECT USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

