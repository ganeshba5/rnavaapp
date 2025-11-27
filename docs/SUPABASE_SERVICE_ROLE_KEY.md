# How to Get Your Supabase Service Role Key

The service role key is **automatically generated** when you create a Supabase project. You don't need to create it - you just need to find it in your Supabase dashboard.

## Steps to Find Your Service Role Key

### 1. Log in to Supabase Dashboard

Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and log in to your account.

### 2. Select Your Project

Click on the project you want to use (or create a new project if you don't have one).

### 3. Navigate to API Settings

1. In the left sidebar, click on **Settings** (gear icon at the bottom)
2. Click on **API** in the settings menu

### 4. Find the Service Role Key

On the API settings page, you'll see several sections:

- **Project URL**: Your Supabase project URL
- **anon/public key**: The anon key (used for app authentication)
- **service_role key**: The service role key (used for database operations) ⚠️

**Important Security Notes:**
- The service role key has **full access** to your database and **bypasses Row Level Security (RLS)**
- **Never expose this key** in client-side code, public repositories, or share it publicly
- It should only be used in secure server-side code or, in this case, in your mobile app's secure configuration

### 5. Copy the Service Role Key

1. Click the **eye icon** or **"Reveal"** button next to the service_role key to show it
2. Click the **copy icon** to copy the key
3. The key will look something like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJwcm9qZWN0aWQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ...`

### 6. Add to Your Configuration

Add the service role key to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Or add it to `app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project-id.supabase.co",
      "supabaseAnonKey": "your-anon-key",
      "supabaseServiceRoleKey": "your-service-role-key"
    }
  }
}
```

## Visual Guide

The API settings page will look like this:

```
┌─────────────────────────────────────────┐
│  API Settings                           │
├─────────────────────────────────────────┤
│                                         │
│  Project URL                            │
│  https://xxxxx.supabase.co             │
│                                         │
│  anon public                            │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6...       │
│  [Copy]                                 │
│                                         │
│  service_role ⚠️ SECRET                 │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6...       │
│  [Reveal] [Copy]                        │
│                                         │
└─────────────────────────────────────────┘
```

## Security Best Practices

1. **Never commit the service role key to version control**
   - Make sure `.env` is in `.gitignore`
   - Never commit `app.json` with the service role key in production

2. **Rotate the key if exposed**
   - If you accidentally expose the key, go to Settings → API
   - Click "Reset service_role key" to generate a new one
   - Update your configuration with the new key

3. **Use different keys for different environments**
   - Use different Supabase projects for development, staging, and production
   - Each project has its own service role key

4. **Monitor usage**
   - Check your Supabase dashboard regularly for unusual activity
   - Set up alerts for suspicious database access

## Troubleshooting

### "Service role key not configured" warning

If you see this warning in the console:
- Check that you've added `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` to your `.env` file
- Make sure you've restarted the Expo dev server after adding it
- Verify the key is correct (no extra spaces, quotes, or line breaks)

### Key not working

- Make sure you copied the entire key (they're very long)
- Check for any extra spaces or characters
- Verify you're using the service_role key, not the anon key
- Try resetting the key in Supabase dashboard and using the new one

## What's the Difference?

| Key Type | Usage | Access Level | RLS |
|----------|-------|--------------|-----|
| **anon key** | App user authentication | Limited by RLS policies | ✅ Enforced |
| **service_role key** | Database operations | Full database access | ❌ Bypassed |

The service role key is what allows your app to perform database operations without being restricted by Row Level Security policies, which is why it's used for all CRUD operations in the database service layer.

