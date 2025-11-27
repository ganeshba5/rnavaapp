# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for CI/CD with your AVA app.

## Overview

The repository includes three GitHub Actions workflows:

1. **CI Workflow** (`ci.yml`) - Runs on every push/PR to validate code quality
2. **Azure Static Web Apps Deployment** (`deploy-azure-static-web-apps.yml`) - Deploys to Azure Static Web Apps
3. **Azure Blob Storage Deployment** (`deploy-azure-blob-storage.yml`) - Alternative deployment to Azure Blob Storage

## Prerequisites

1. GitHub repository set up
2. Azure account with either:
   - Azure Static Web Apps resource, OR
   - Azure Storage Account with a container
3. Supabase project with environment variables

## Step 1: Set Up GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets for All Workflows

Add these secrets:

1. **`EXPO_PUBLIC_SUPABASE_URL`**
   - Value: Your Supabase project URL
   - Example: `https://xxxxx.supabase.co`

2. **`EXPO_PUBLIC_SUPABASE_ANON_KEY`**
   - Value: Your Supabase anonymous/public key
   - Found in: Supabase Dashboard → Settings → API

### For Azure Static Web Apps Deployment

3. **`AZURE_STATIC_WEB_APPS_API_TOKEN`**
   - How to get it:
     1. Go to Azure Portal → Your Static Web App
     2. Click **Manage deployment token**
     3. Copy the token
   - This token is used by the GitHub Action to deploy

### For Azure Blob Storage Deployment

3. **`AZURE_CREDENTIALS`** (Service Principal JSON)
   - How to create:
     ```bash
     az ad sp create-for-rbac --name "github-actions-ava" \
       --role contributor \
       --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
       --sdk-auth
     ```
   - Copy the entire JSON output as the secret value

4. **`AZURE_STORAGE_ACCOUNT`**
   - Value: Your Azure Storage Account name
   - Example: `mystorageaccount`

5. **`AZURE_STORAGE_CONTAINER`**
   - Value: Container name where files will be uploaded
   - Example: `$web` or `static-site`

## Step 2: Choose Your Deployment Method

### Option A: Azure Static Web Apps (Recommended)

**Advantages:**
- Built-in CI/CD integration
- Automatic SSL certificates
- Custom domains support
- Serverless API support
- Free tier available

**Setup:**
1. Create an Azure Static Web Apps resource in Azure Portal
2. During creation, connect it to your GitHub repository
3. The workflow `deploy-azure-static-web-apps.yml` will automatically deploy on push to `main`

**Manual Setup (if not connected during creation):**
1. Go to Azure Portal → Your Static Web App → **Deployment Center**
2. Select **GitHub** as source
3. Authorize and select your repository
4. Configure:
   - **Build Presets**: Custom
   - **App location**: `/`
   - **Output location**: `dist`
   - **Skip app build**: `true` (we build in the workflow)

### Option B: Azure Blob Storage

**Advantages:**
- More control over storage
- Can use CDN
- Lower cost for high traffic

**Setup:**
1. Create an Azure Storage Account
2. Create a container (e.g., `$web` for static website hosting)
3. Enable static website hosting:
   ```bash
   az storage blob service-properties update \
     --account-name <storage-account> \
     --static-website \
     --404-document error.html \
     --index-document index.html
   ```
4. The workflow `deploy-azure-blob-storage.yml` will deploy on push to `main`

## Step 3: Configure Branch Protection (Optional but Recommended)

1. Go to **Settings** → **Branches**
2. Add a branch protection rule for `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select **lint-and-typecheck** and **build-web** as required checks

## Step 4: Test the Workflows

### Test CI Workflow

1. Create a new branch:
   ```bash
   git checkout -b test-ci
   ```

2. Make a small change and commit:
   ```bash
   git add .
   git commit -m "Test CI workflow"
   git push origin test-ci
   ```

3. Create a Pull Request to `main`
4. Check the **Actions** tab to see the CI workflow running

### Test Deployment Workflow

1. Merge your PR to `main` (or push directly to `main` if branch protection isn't enabled)
2. Go to **Actions** tab
3. Watch the deployment workflow run
4. Once complete, visit your Azure Static Web App URL or Blob Storage static website URL

## Workflow Details

### CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs:**
1. **lint-and-typecheck**: Runs ESLint and TypeScript type checking
2. **build-web**: Builds the web app and uploads artifacts

**Duration:** ~3-5 minutes

### Azure Static Web Apps Deployment (`deploy-azure-static-web-apps.yml`)

**Triggers:**
- Push to `main`
- Manual trigger via `workflow_dispatch`

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Build web app
5. Deploy to Azure Static Web Apps

**Duration:** ~5-8 minutes

### Azure Blob Storage Deployment (`deploy-azure-blob-storage.yml`)

**Triggers:**
- Push to `main`
- Manual trigger via `workflow_dispatch`

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Build web app
5. Login to Azure
6. Upload to Blob Storage

**Duration:** ~5-8 minutes

## Troubleshooting

### Build Fails

**Error: "dist directory is empty"**
- Check that `npm run ship:web` completes successfully
- Verify environment variables are set correctly
- Check build logs for Expo errors

**Error: "staticwebapp.config.json not found"**
- The script should copy it automatically
- Verify `public/staticwebapp.config.json` exists
- Check that `scripts/ship-web.sh` includes the copy step

### Deployment Fails

**Azure Static Web Apps: "Invalid API token"**
- Regenerate the deployment token in Azure Portal
- Update the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret

**Azure Blob Storage: "Authentication failed"**
- Verify `AZURE_CREDENTIALS` secret is valid JSON
- Check that the service principal has proper permissions
- Ensure storage account name is correct

### Environment Variables Not Working

- Verify secrets are set in GitHub (Settings → Secrets)
- Check that variable names match exactly (case-sensitive)
- Ensure `.env.production` is created in the workflow (it's in `.gitignore`)

## Manual Deployment

You can also trigger deployments manually:

1. Go to **Actions** tab
2. Select the deployment workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Monitoring

- View workflow runs: **Actions** tab
- View deployment logs: Click on a workflow run
- Azure Static Web Apps logs: Azure Portal → Your Static Web App → **Monitoring**
- Azure Blob Storage metrics: Azure Portal → Your Storage Account → **Metrics**

## Best Practices

1. **Never commit secrets**: Always use GitHub Secrets
2. **Use branch protection**: Require PR reviews and passing CI
3. **Test locally first**: Run `npm run ship:web` before pushing
4. **Monitor deployments**: Check Azure Portal after each deployment
5. **Keep workflows updated**: Update action versions periodically
6. **Use environment-specific configs**: Consider separate workflows for staging/production

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure Blob Storage Documentation](https://learn.microsoft.com/azure/storage/blobs/)
- [Expo Deployment Guide](https://docs.expo.dev/distribution/publishing-websites/)

