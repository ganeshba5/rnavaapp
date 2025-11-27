# Test Data Setup Guide

This guide explains how to delete old test data and load new test data into Supabase.

## Prerequisites

1. Your Supabase database tables are created (run `SUPABASE_SCHEMA.sql`)
2. RLS policies are set up (run `RLS_POLICIES.sql`)
3. You have access to your Supabase project dashboard

## Step 1: Create Test User in Supabase Auth

Before inserting test data, you need to create a test user in Supabase Authentication:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add user"** or **"Create new user"**
4. Enter:
   - **Email**: `john.doe@example.com`
   - **Password**: (choose any password, e.g., `test123`)
   - **Auto Confirm User**: ✅ (checked)
5. Click **"Create user"**
6. Copy the user's **UUID** (you'll see it in the users list)

## Step 2: Delete Old Test Data

1. Open your Supabase **SQL Editor**
2. Copy and paste the contents of `DELETE_TEST_DATA.sql`
3. Click **"Run"** to execute
4. This will delete ALL data from all tables (be careful!)

## Step 3: Insert New Test Data

1. Open your Supabase **SQL Editor**
2. Copy and paste the contents of `INSERT_TEST_DATA.sql`
3. **IMPORTANT**: The script will automatically find the user by email (`john.doe@example.com`). If you used a different email, update the script accordingly.
4. Click **"Run"** to execute
5. The script will:
   - Find the test user you created
   - Insert a user profile
   - Insert 3 canine profiles (Max, Bella, Charlie)
   - Insert 2 vet profiles
   - Insert 3 contacts
   - Insert 5 media items
   - Insert nutrition entries, training logs, and appointments

## Step 4: Verify Data

After running `INSERT_TEST_DATA.sql`, it will show a summary of how many records were inserted into each table. You should see:

- `user_profiles`: 1
- `canine_profiles`: 3
- `vet_profiles`: 2
- `contacts`: 3
- `nutrition_entries`: 3
- `training_logs`: 3
- `appointments`: 3
- `media_items`: 5

## Test User Credentials

- **Email**: `john.doe@example.com`
- **Password**: (whatever you set in Step 1)

## Test Data Overview

### User Profile
- **Name**: John Doe
- **Email**: john.doe@example.com
- **Role**: Pet Owner

### Canine Profiles
1. **Max** - Golden Retriever, Male, 65 lbs
2. **Bella** - German Shepherd, Female, 55 lbs
3. **Charlie** - Beagle, Male, 25 lbs

### Vet Profiles
1. **Dr. Sarah Johnson** - Happy Paws Veterinary Clinic
2. **Dr. Michael Chen** - City Animal Hospital

### Contacts
1. **Jane Doe** - Spouse (Emergency contact)
2. **Bob Smith** - Friend (Emergency contact)
3. **Alice Brown** - Neighbor

## Troubleshooting

### Error: "Test user not found"
- Make sure you created the user in Supabase Auth with email `john.doe@example.com`
- Check that the user is confirmed (not pending)

### Error: "duplicate key value violates unique constraint"
- The data already exists. Run `DELETE_TEST_DATA.sql` first, then run `INSERT_TEST_DATA.sql` again

### Error: "violates row-level security policy"
- Make sure you've run `RLS_POLICIES.sql` to set up the policies
- Check that you're running the scripts as a user with proper permissions

### Data not showing in the app
- Make sure you're logged in with the test user account (`john.doe@example.com`)
- Check the browser console for any errors
- Verify that RLS policies allow the authenticated user to view their own data

## Re-running Test Data

To refresh test data:

1. Run `DELETE_TEST_DATA.sql` to clear everything
2. Run `INSERT_TEST_DATA.sql` to insert fresh data

**Note**: You don't need to recreate the test user in Auth - it will be reused.



