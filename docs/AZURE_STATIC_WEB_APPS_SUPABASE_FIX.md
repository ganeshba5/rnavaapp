# Fixing Supabase Connection Issues in Azure Static Web Apps

## Problem
The app connects to Supabase locally and in Azure Blob Storage, but fails in Azure Static Web Apps.

## Important Note About CORS
**Supabase handles CORS automatically** - there is no CORS setting in the Supabase dashboard. Supabase's REST API includes default CORS headers that allow cross-origin requests from web applications. If you're seeing CORS errors, they're likely coming from something else (browser extensions, network proxies, etc.).

## Root Causes

### 1. Environment Variables Not Embedded in Build
Expo needs environment variables with `EXPO_PUBLIC_` prefix to be available during the build process. They get baked into the JavaScript bundle at build time.

**Fix Applied:**
- Updated `scripts/ship-web.sh` to explicitly export environment variables
- Added verification step to ensure variables are set before building
- Added build verification step in GitHub Actions workflow

### 2. Network/Firewall Issues
Azure Static Web Apps might have different network configurations than Blob Storage.

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

## Debugging Steps

### Step 1: Check Browser Console
Open your Azure Static Web Apps site and check the browser console:
1. Look for network errors in the **Network** tab
2. Check if Supabase requests are being made (filter by "supabase")
3. Look for any error messages in the **Console** tab

### Step 2: Verify Environment Variables
The console shows "✅ Supabase is configured" - this means the variables are being read. To verify they're actually in the build:
1. View page source on your deployed site
2. Search for your Supabase URL in the JavaScript files
3. It should appear as a string constant in the code

### Step 3: Check Network Requests
1. Open DevTools → Network tab
2. Filter by "supabase" or "fetch"
3. Check if requests are being made
4. Look at the response status codes:
   - **200/201**: Connection is working
   - **401**: Authentication issue (not a connection problem)
   - **403**: Permission/RLS issue
   - **404**: Endpoint not found
   - **CORS error**: Network/CORS issue (rare with Supabase)

### Step 4: Compare with Working Blob Storage
1. Check the Network tab on both sites
2. Compare the request URLs and headers
3. Look for differences in how requests are made

## Common Issues and Solutions

### Issue: "No account found" Error
**Symptom:** `Login error: Error: No account found with this email address`

**Solution:** This is NOT a connection problem - Supabase is responding. The issue is:
- The user account doesn't exist in Supabase
- You need to sign up first, or
- Check your authentication flow

### Issue: Route Errors
**Symptom:** `[Layout children]: No route named "nutrition" exists`

**Solution:** These are routing issues, not Supabase connection issues. Check:
- Your route structure matches the file structure
- All route files are being included in the build

### Issue: Environment Variables Not Working
**Symptom:** Supabase shows as "NOT SET" in console

**Solution:**
1. Check GitHub Actions build logs for the "Verify environment variables in build" step
2. Ensure secrets are set in GitHub repository settings
3. Verify the `.env.production` file is created correctly in the workflow

## Next Steps

1. Check the browser console on your Azure Static Web Apps site
2. Look at the Network tab to see what requests are being made
3. Compare with your working Blob Storage deployment
4. Share the specific error messages you're seeing for more targeted help

