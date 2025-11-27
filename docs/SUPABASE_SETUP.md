# Supabase Setup Guide for AVA Application

This guide will help you set up Supabase as the backend for the AVA application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: AVA App (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"

## Step 2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` `public` key)

## Step 3: Set Up Environment Variables

Create a `.env` file in the root of your project (`AvaApp/.env`):

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url-here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- Never commit the `.env` file to version control
- Add `.env` to your `.gitignore` file

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Open the file `docs/SUPABASE_SCHEMA.sql`
3. Copy the entire SQL content
4. Paste it into the SQL Editor
5. Click "Run" to execute

This will create all necessary tables:
- `user_profiles`
- `canine_profiles`
- `vet_profiles`
- `contacts`
- `nutrition_entries`
- `training_logs`
- `appointments`
- `media_items`

## Step 5: Configure Row Level Security (RLS)

The schema includes RLS policies. You may need to adjust them based on your authentication setup:

1. Go to **Authentication** → **Policies**
2. Review and adjust policies for each table
3. For development, you can temporarily disable RLS:
   ```sql
   ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
   ```

**Note**: For production, enable RLS and create proper policies based on user authentication.

## Step 6: Set Up Authentication (Optional)

If you want to use Supabase authentication:

1. Go to **Authentication** → **Providers**
2. Enable email/password authentication
3. Configure other providers as needed (Google, Apple, etc.)
4. Update the login function in `context/AppContext.tsx` to use Supabase auth

## Step 7: Test the Connection

1. Start your app: `npm start`
2. The app will automatically try to connect to Supabase
3. If Supabase is not configured, it will fall back to test data
4. Check the console for any connection errors

## Troubleshooting

### "Supabase URL or Anon Key not found"

- Make sure your `.env` file is in the root directory
- Restart your development server after creating/updating `.env`
- Verify the environment variable names are correct

### "Error fetching data"

- Check your Supabase project is active
- Verify your API keys are correct
- Check the browser console for detailed error messages
- Ensure tables are created properly

### Authentication Issues

- Make sure RLS policies allow the operations you're trying to perform
- Check that the user is properly authenticated
- Review Supabase authentication logs

## Development vs Production

### Development
- Can use test data fallback if Supabase is not configured
- RLS can be disabled for easier testing
- Use `anon` key for client-side operations

### Production
- Always use Supabase (no fallback)
- Enable RLS with proper policies
- Consider using service role key for admin operations (server-side only)
- Set up proper authentication flow

## Next Steps

1. **Set up authentication**: Configure Supabase Auth for user login
2. **Upload media**: Set up Supabase Storage for images/videos
3. **Real-time updates**: Use Supabase Realtime for live data updates
4. **Backups**: Configure automatic database backups in Supabase

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Issues: Create an issue in your repository

