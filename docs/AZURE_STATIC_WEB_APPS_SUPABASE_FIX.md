# Fixing Supabase Connection Issues in Azure Static Web Apps

## Problem
The app connects to Supabase locally and in Azure Blob Storage, but fails in Azure Static Web Apps.

## Root Causes

### 1. Environment Variables Not Embedded in Build
Expo needs environment variables with `EXPO_PUBLIC_` prefix to be available during the build process. They get baked into the JavaScript bundle at build time.

**Fix Applied:**
- Updated `scripts/ship-web.sh` to explicitly export environment variables
- Added verification step to ensure variables are set before building

### 2. Supabase CORS Configuration
If your Azure Static Web Apps domain is different from your Blob Storage domain, Supabase might be blocking requests due to CORS.

**How to Check:**
1. Open your Azure Static Web Apps URL in a browser
2. Open Developer Tools (F12) → Console
3. Look for CORS errors like:
   ```
   Access to fetch at 'https://xxx.supabase.co/...' from origin 'https://your-app.azurestaticapps.net' 
   has been blocked by CORS policy
   ```

**How to Fix:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Under **CORS**, add your Azure Static Web Apps domain:
   - `https://your-app.azurestaticapps.net`
   - `https://*.azurestaticapps.net` (if you want to allow all Azure Static Web Apps)
4. Save the changes

### 3. Verify Environment Variables in Build

To verify that environment variables are embedded in the build:

1. After the build completes, check the built JavaScript files:
   ```bash
   grep -r "EXPO_PUBLIC_SUPABASE_URL" dist/
   ```

2. Or inspect the built bundle in the browser:
   - Open your deployed app
   - View page source or use DevTools → Sources
   - Search for your Supabase URL in the JavaScript files
   - It should be embedded as a string constant

### 4. Network/Firewall Issues

Azure Static Web Apps might have different network configurations. Check:
- Azure Static Web Apps doesn't block outbound HTTPS requests (it shouldn't)
- Your Supabase project allows connections from Azure IP ranges (it should by default)

## Debugging Steps

1. **Check Browser Console:**
   - Look for network errors
   - Check if Supabase URL is present in the code
   - Look for CORS errors

2. **Verify Build Logs:**
   - Check GitHub Actions logs for the build step
   - Verify that environment variables are set:
     ```
     EXPO_PUBLIC_SUPABASE_URL: SET
     EXPO_PUBLIC_SUPABASE_ANON_KEY: SET
     ```

3. **Compare with Working Blob Storage:**
   - Check the domain difference
   - Verify Supabase CORS settings include both domains

4. **Test Direct Connection:**
   - Open browser console on Azure Static Web Apps site
   - Run: `fetch('https://your-supabase-url.supabase.co/rest/v1/', { headers: { 'apikey': 'your-anon-key' } })`
   - Check for CORS errors

## Most Likely Solution

Since it works in Blob Storage but not in Azure Static Web Apps, the most likely issue is **CORS configuration in Supabase**. 

Add your Azure Static Web Apps domain to Supabase's allowed origins:
1. Supabase Dashboard → Settings → API → CORS
2. Add: `https://your-app-name.azurestaticapps.net`
3. Save and wait a few minutes for changes to propagate

## Next Steps

After applying the build script fix and updating Supabase CORS:
1. Trigger a new deployment: `gh workflow run "Azure Static Web Apps CI/CD"`
2. Wait for deployment to complete
3. Test the connection in the browser console
4. Check for any remaining errors

