# Azure Static Web Apps Deployment Guide

This guide explains how to deploy the AVA app to Azure Static Web Apps.

## Prerequisites

1. Azure account with Static Web Apps resource created
2. Azure CLI installed (`az` command)
3. Build output in `dist/` directory

## Configuration

The app includes a `staticwebapp.config.json` file in the `public/` directory that will be automatically copied to the build output. This configuration:

- **Handles client-side routing**: All routes redirect to `index.html` so Expo Router can handle navigation
- **Sets up caching**: Static assets (CSS, JS, images) are cached for 1 year
- **Security headers**: Adds security headers like X-Frame-Options, X-Content-Type-Options, etc.
- **404 handling**: Returns `index.html` with 200 status for 404 errors (SPA fallback)

## Deployment Methods

### Method 1: Using Azure CLI (Recommended)

1. Build the web app:
   ```bash
   npm run ship:web
   ```

2. Deploy to Azure Blob Storage:
   ```bash
   npm run deploy:azure
   ```

   Make sure you have a `.env.azure` file with:
   ```bash
   AZURE_STORAGE_ACCOUNT=your-storage-account
   AZURE_STORAGE_CONTAINER=your-container
   AZURE_STORAGE_CONNECTION_STRING=your-connection-string
   # OR
   AZURE_STORAGE_ACCOUNT_KEY=your-account-key
   ```

### Method 2: Using Azure Static Web Apps GitHub Actions

If you're using GitHub Actions for CI/CD:

1. The `staticwebapp.config.json` will be automatically picked up from the build output
2. Ensure your GitHub Actions workflow builds the app and deploys the `dist/` folder

Example workflow:
```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build web app
        run: npm run ship:web
        env:
          # Add your environment variables here
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/dist"
          output_location: ""
```

### Method 3: Manual Upload

1. Build the web app:
   ```bash
   npm run ship:web
   ```

2. Upload the contents of the `dist/` folder to your Azure Static Web Apps deployment:
   - Via Azure Portal: Go to your Static Web App → Deployment Center → Manual deployment
   - Via Azure Storage Explorer: Upload files to the storage account
   - Via Azure CLI: Use `az storage blob upload-batch`

## Verification

After deployment:

1. Visit your Azure Static Web Apps URL
2. Test navigation to different routes (e.g., `/login`, `/dashboard`, `/appointments`)
3. Verify that:
   - All routes load correctly (no 404 errors)
   - Client-side navigation works
   - Static assets load with proper caching headers
   - Security headers are present (check browser DevTools → Network → Response Headers)

## Troubleshooting

### Routes return 404

- Ensure `staticwebapp.config.json` is in the root of your `dist/` folder
- Check that the `navigationFallback` configuration is correct
- Verify the file is being copied during build (check `dist/staticwebapp.config.json` exists)

### Assets not loading

- Check that asset paths in your app are relative (not absolute)
- Verify the `routes` configuration includes proper exclusions for static assets
- Ensure MIME types are correctly configured

### Environment Variables

Azure Static Web Apps supports environment variables via:
- Application Settings in Azure Portal
- Configuration in `staticwebapp.config.json` (for routing/headers only)
- For app-level env vars, use Azure Portal → Configuration → Application settings

Set these environment variables in Azure Portal:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Any other `EXPO_PUBLIC_*` variables your app needs

## Configuration File Reference

The `staticwebapp.config.json` includes:

- **navigationFallback**: Redirects all routes to `index.html` for SPA routing
- **routes**: Custom routing rules with caching headers
- **responseOverrides**: 404 → 200 with `index.html` rewrite
- **globalHeaders**: Security headers
- **mimeTypes**: Proper MIME type mappings

For more details, see [Azure Static Web Apps configuration documentation](https://learn.microsoft.com/azure/static-web-apps/configuration).

