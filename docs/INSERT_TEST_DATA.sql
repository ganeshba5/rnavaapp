-- ============================================================================
-- INSERT TEST DATA INTO SUPABASE
-- ============================================================================
-- 
-- This script inserts comprehensive test data into the database.
-- Run this AFTER running DELETE_TEST_DATA.sql to have fresh test data.
--
-- IMPORTANT: You need to create a test user in Supabase Auth first!
-- 1. Go to Authentication > Users in Supabase dashboard
-- 2. Create a user with email: john.doe@example.com
-- 3. Set a password (e.g., "test123")
-- 4. Copy the user's UUID from the auth.users table
-- 5. Replace the placeholder UUID below with the actual user UUID
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Get or create test user
-- ============================================================================
-- First, you need to create a user in Supabase Auth:
-- Email: john.doe@example.com
-- Password: (any password you choose)
--
-- Then replace 'YOUR_TEST_USER_UUID_HERE' below with the actual UUID from auth.users
-- ============================================================================

-- Set the test user ID (replace with actual UUID from auth.users)
-- You can get this by running: SELECT id FROM auth.users WHERE email = 'john.doe@example.com';
DO $$
DECLARE
  test_user_id UUID;
  -- Canine IDs (will be generated)
  canine_1_id UUID := gen_random_uuid();
  canine_2_id UUID := gen_random_uuid();
  canine_3_id UUID := gen_random_uuid();
  -- Vet IDs
  vet_1_id UUID := gen_random_uuid();
  vet_2_id UUID := gen_random_uuid();
  -- Contact IDs
  contact_1_id UUID := gen_random_uuid();
  contact_2_id UUID := gen_random_uuid();
  contact_3_id UUID := gen_random_uuid();
  -- Media IDs
  media_1_id UUID := gen_random_uuid();
  media_2_id UUID := gen_random_uuid();
  media_3_id UUID := gen_random_uuid();
  media_4_id UUID := gen_random_uuid();
  media_5_id UUID := gen_random_uuid();
BEGIN
  -- Get or use a test user ID
  -- Option 1: Use existing user by email
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'john.doe@example.com' LIMIT 1;
  
  -- Option 2: If no user found, you'll need to create one manually in Supabase Auth dashboard
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'Test user not found. Please create a user in Supabase Auth with email: john.doe@example.com';
  END IF;

  -- ============================================================================
  -- STEP 2: Insert User Profile
  -- ============================================================================
  INSERT INTO user_profiles (
    id, first_name, last_name, email, phone, country, role, created_at, updated_at
  ) VALUES (
    test_user_id,
    'John',
    'Doe',
    'john.doe@example.com',
    '+1-555-0123',
    'US',
    'Pet Owner',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  -- ============================================================================
  -- STEP 3: Insert Canine Profiles
  -- ============================================================================
  INSERT INTO canine_profiles (
    id, user_id, name, breed, date_of_birth, gender, weight, weight_unit, color, microchip_number, profile_photo_id, notes, created_at, updated_at
  ) VALUES
  (
    canine_1_id, test_user_id, 'Max', 'Golden Retriever', '2020-05-15', 'Male', 65, 'lbs', 'Golden', '123456789012345', media_1_id, 'Friendly and energetic. Loves playing fetch.', NOW(), NOW()
  ),
  (
    canine_2_id, test_user_id, 'Bella', 'German Shepherd', '2019-08-20', 'Female', 55, 'lbs', 'Black and Tan', NULL, media_4_id, 'Very protective and loyal.', NOW(), NOW()
  ),
  (
    canine_3_id, test_user_id, 'Charlie', 'Beagle', '2021-03-10', 'Male', 25, 'lbs', 'Tri-color', NULL, NULL, 'Loves to sniff and explore.', NOW(), NOW()
  );

  -- ============================================================================
  -- STEP 4: Insert Vet Profiles
  -- ============================================================================
  INSERT INTO vet_profiles (
    id, name, clinic_name, phone, email, address, city, state, zip_code, country, specialization, notes, created_at, updated_at
  ) VALUES
  (
    vet_1_id, 'Dr. Sarah Johnson', 'Happy Paws Veterinary Clinic', '+1-555-1000', 'sarah.johnson@happypaws.com', '123 Main Street', 'New York', 'NY', '10001', 'US', 'Small Animal Medicine', 'Very experienced with Golden Retrievers.', NOW(), NOW()
  ),
  (
    vet_2_id, 'Dr. Michael Chen', 'City Animal Hospital', '+1-555-1001', 'm.chen@cityanimal.com', '456 Oak Avenue', 'Los Angeles', 'CA', '90001', 'US', 'Surgery', NULL, NOW(), NOW()
  );

  -- ============================================================================
  -- STEP 5: Insert Contacts
  -- ============================================================================
  INSERT INTO contacts (
    id, name, relationship, phone, email, address, is_emergency, notes, created_at, updated_at
  ) VALUES
  (
    contact_1_id, 'Jane Doe', 'Spouse', '+1-555-0200', 'jane.doe@example.com', '123 Pet Street', TRUE, 'Primary emergency contact', NOW(), NOW()
  ),
  (
    contact_2_id, 'Bob Smith', 'Friend', '+1-555-0201', 'bob.smith@example.com', NULL, TRUE, 'Can help with pet care', NOW(), NOW()
  ),
  (
    contact_3_id, 'Alice Brown', 'Neighbor', '+1-555-0202', NULL, NULL, FALSE, NULL, NOW(), NOW()
  );

  -- ============================================================================
  -- STEP 6: Insert Media Items
  -- ============================================================================
  INSERT INTO media_items (
    id, canine_id, type, uri, caption, date, created_at
  ) VALUES
  (
    media_1_id, canine_1_id, 'photo', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', 'Max playing in the park', CURRENT_DATE, NOW()
  ),
  (
    media_2_id, canine_1_id, 'photo', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', 'Max at the beach', CURRENT_DATE - INTERVAL '5 days', NOW()
  ),
  (
    media_3_id, canine_1_id, 'video', 'https://example.com/videos/max-playing.mp4', 'Max playing fetch', CURRENT_DATE - INTERVAL '3 days', NOW()
  ),
  (
    media_4_id, canine_2_id, 'photo', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400', 'Bella on guard', CURRENT_DATE, NOW()
  ),
  (
    media_5_id, canine_2_id, 'photo', 'https://images.unsplash.com/photo-1517849845537-4d58b0e09b8d?w=400', 'Bella relaxing', CURRENT_DATE - INTERVAL '2 days', NOW()
  );

  -- ============================================================================
  -- STEP 7: Insert Nutrition Entries
  -- ============================================================================
  INSERT INTO nutrition_entries (
    id, canine_id, date, meal_type, food_name, quantity, unit, notes, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), canine_1_id, CURRENT_DATE - INTERVAL '1 day', 'Breakfast', 'Premium Dry Dog Food', 2, 'cups', 'Ate well', NOW(), NOW()
  ),
  (
    gen_random_uuid(), canine_1_id, CURRENT_DATE - INTERVAL '1 day', 'Dinner', 'Premium Dry Dog Food', 2, 'cups', 'Normal appetite', NOW(), NOW()
  ),
  (
    gen_random_uuid(), canine_2_id, CURRENT_DATE, 'Breakfast', 'Grain-Free Dog Food', 1.5, 'cups', NULL, NOW(), NOW()
  );

  -- ============================================================================
  -- STEP 8: Insert Training Logs
  -- ============================================================================
  INSERT INTO training_logs (
    id, canine_id, date, skill, duration, activity, success, notes, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), canine_1_id, CURRENT_DATE - INTERVAL '2 days', 'Sit', 15, 'Basic Training', TRUE, 'Excellent progress', NOW(), NOW()
  ),
  (
    gen_random_uuid(), canine_1_id, CURRENT_DATE - INTERVAL '1 day', 'Stay', 20, 'Basic Training', TRUE, 'Held for 30 seconds', NOW(), NOW()
  ),
  (
    gen_random_uuid(), canine_2_id, CURRENT_DATE, 'Heel', 10, 'Basic Training', FALSE, 'Needs more practice', NOW(), NOW()
  );

  -- ============================================================================
  -- STEP 9: Insert Appointments
  -- ============================================================================
  INSERT INTO appointments (
    id, canine_id, vet_id, title, date, time, type, status, notes, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), canine_1_id, vet_1_id, 'Annual Checkup for Max', CURRENT_DATE + INTERVAL '7 days', '10:00', 'Annual Checkup', 'Scheduled', 'Routine health check', NOW(), NOW()
  ),
  (
    gen_random_uuid(), canine_2_id, vet_1_id, 'Vaccination for Bella', CURRENT_DATE + INTERVAL '14 days', '14:30', 'Vaccination', 'Scheduled', NULL, NOW(), NOW()
  ),
  (
    gen_random_uuid(), canine_1_id, vet_2_id, 'Checkup for Max', CURRENT_DATE - INTERVAL '30 days', '11:00', 'Checkup', 'Completed', 'All clear', NOW(), NOW()
  );

  RAISE NOTICE 'Test data inserted successfully!';
  RAISE NOTICE 'Test user ID: %', test_user_id;
  RAISE NOTICE 'Canine IDs: %, %, %', canine_1_id, canine_2_id, canine_3_id;
END $$;

-- ============================================================================
-- VERIFY DATA INSERTION
-- ============================================================================
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

