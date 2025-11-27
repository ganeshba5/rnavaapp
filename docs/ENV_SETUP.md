# Environment Variables Setup for AVA App

## Supabase Configuration

To connect to Supabase, you need to set up environment variables in a `.env` file.

## Step 1: Create `.env` file

Create a `.env` file in the `AvaApp` folder (same directory as `package.json`).

## Step 2: Add your Supabase credentials

Add the following to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url-here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important Notes:**
- Variables must be prefixed with `EXPO_PUBLIC_` for Expo to automatically load them in client code
- **Security Note**: The service role key will be accessible in the client bundle. For production, consider:
  - Using `app.json` extra config (still accessible but not in .env)
  - Using a backend API to proxy database operations
  - Using secure storage for sensitive keys
- Do NOT commit the `.env` file to version control (it should already be in `.gitignore`)
- Get your credentials from: Supabase Dashboard → Settings → API
  - **Anon key**: Used for app user authentication
  - **Service role key**: Used for database operations (bypasses RLS)

## Step 3: Restart your development server

After creating or updating the `.env` file, you **must** restart your Expo development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

Or:

```bash
npx expo start --clear
```

## Alternative: Using app.json

If you prefer not to use a `.env` file, you can add the credentials directly to `app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your-project-url",
      "supabaseAnonKey": "your-anon-key",
      "supabaseServiceRoleKey": "your-service-role-key"
    }
  }
}
```

**Note:** This method is less secure as credentials will be visible in the code, but it's fine for development.

## Verification

After restarting, check the console output. You should see:

```
✅ Supabase is configured and ready to use!
```

If you see:
```
⚠️ Supabase URL or Anon Key not found
```

Then the environment variables are not being loaded. Check:
1. File is named exactly `.env` (not `.env.local` or `.env.txt`)
2. File is in the `AvaApp` folder (not parent folder)
3. Variables are prefixed with `EXPO_PUBLIC_`
4. You've restarted the dev server after creating the file
5. No extra spaces or quotes around the values

## Troubleshooting

### Variables not loading?

1. **Check file location**: `.env` must be in `AvaApp/.env` (same level as `package.json`)
2. **Check variable names**: 
   - `EXPO_PUBLIC_SUPABASE_URL` (with EXPO_PUBLIC_ prefix)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (with EXPO_PUBLIC_ prefix)
   - `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (with EXPO_PUBLIC_ prefix - required for Expo to access it)
3. **Clear cache**: Run `npx expo start --clear`
4. **Check format**: No spaces around `=`, no quotes needed
   ```
   ✅ Correct: EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   ✅ Correct: EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ❌ Wrong: EXPO_PUBLIC_SUPABASE_URL = "https://xxx.supabase.co"
   ```

### Still not working?

Check the console logs for:
```
🔍 Supabase Configuration Check:
```

This will show you exactly what values are being read (or not read).

## Architecture: App User vs Service User

The AVA app uses two distinct Supabase clients:

1. **App Client (`supabase`)** - Uses anon key
   - Used for app user authentication
   - Respects Row Level Security (RLS) policies
   - Used in: `AppContext` for login/logout

2. **Service Client (`supabaseService`)** - Uses service role key
   - Used for all database operations
   - Bypasses RLS (has full database access)
   - Used in: `services/database.ts` and `services/storage.ts`

**Why this separation?**
- App users authenticate and their identity is tracked via `auth.uid()`
- Database operations use a service account that bypasses RLS for consistent access
- This allows RLS policies to check `auth.uid()` while database operations use a service account
- The service user is distinct from app users - it's a single configurable account for all DB operations

