-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR AVA APPLICATION
-- ============================================================================
-- 
-- Run these policies in your Supabase SQL Editor after creating the tables.
-- These policies ensure users can only access their own data.
--
-- ============================================================================

-- ============================================================================
-- USER_PROFILES Policies
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (required for initial profile creation)
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================================================
-- CANINE_PROFILES Policies
-- ============================================================================

-- Users can view their own canines
CREATE POLICY "Users can view own canines" ON canine_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert canines for themselves
CREATE POLICY "Users can insert own canines" ON canine_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own canines
CREATE POLICY "Users can update own canines" ON canine_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own canines
CREATE POLICY "Users can delete own canines" ON canine_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- VET_PROFILES Policies (All authenticated users can manage)
-- ============================================================================

-- All authenticated users can view vet profiles
CREATE POLICY "Authenticated users can view vet profiles" ON vet_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can insert vet profiles
CREATE POLICY "Authenticated users can insert vet profiles" ON vet_profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update vet profiles
CREATE POLICY "Authenticated users can update vet profiles" ON vet_profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

-- All authenticated users can delete vet profiles
CREATE POLICY "Authenticated users can delete vet profiles" ON vet_profiles
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- CONTACTS Policies
-- ============================================================================
-- Note: The contacts table doesn't have a user_id column in the current schema.
-- For now, all authenticated users can manage contacts. 
-- To add user-specific contacts, update the schema to add user_id column first.

-- All authenticated users can view contacts
CREATE POLICY "Authenticated users can view contacts" ON contacts
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can insert contacts
CREATE POLICY "Authenticated users can insert contacts" ON contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update contacts
CREATE POLICY "Authenticated users can update contacts" ON contacts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- All authenticated users can delete contacts
CREATE POLICY "Authenticated users can delete contacts" ON contacts
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- NUTRITION_ENTRIES Policies
-- ============================================================================

-- Users can view nutrition entries for their own canines
CREATE POLICY "Users can view own nutrition entries" ON nutrition_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = nutrition_entries.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can insert nutrition entries for their own canines
CREATE POLICY "Users can insert own nutrition entries" ON nutrition_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = nutrition_entries.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can update nutrition entries for their own canines
CREATE POLICY "Users can update own nutrition entries" ON nutrition_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = nutrition_entries.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can delete nutrition entries for their own canines
CREATE POLICY "Users can delete own nutrition entries" ON nutrition_entries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = nutrition_entries.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRAINING_LOGS Policies
-- ============================================================================

-- Users can view training logs for their own canines
CREATE POLICY "Users can view own training logs" ON training_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = training_logs.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can insert training logs for their own canines
CREATE POLICY "Users can insert own training logs" ON training_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = training_logs.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can update training logs for their own canines
CREATE POLICY "Users can update own training logs" ON training_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = training_logs.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can delete training logs for their own canines
CREATE POLICY "Users can delete own training logs" ON training_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = training_logs.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- APPOINTMENTS Policies
-- ============================================================================

-- Users can view appointments for their own canines
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = appointments.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can insert appointments for their own canines
CREATE POLICY "Users can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = appointments.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can update appointments for their own canines
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = appointments.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can delete appointments for their own canines
CREATE POLICY "Users can delete own appointments" ON appointments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = appointments.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- MEDIA_ITEMS Policies
-- ============================================================================

-- Users can view media items for their own canines
CREATE POLICY "Users can view own media items" ON media_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = media_items.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can insert media items for their own canines
CREATE POLICY "Users can insert own media items" ON media_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = media_items.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can update media items for their own canines
CREATE POLICY "Users can update own media items" ON media_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = media_items.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

-- Users can delete media items for their own canines
CREATE POLICY "Users can delete own media items" ON media_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM canine_profiles 
      WHERE canine_profiles.id = media_items.canine_id 
      AND canine_profiles.user_id = auth.uid()
    )
  );

