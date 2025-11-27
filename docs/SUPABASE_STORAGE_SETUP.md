# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for image and video management in the AVA application.

## Prerequisites

- ✅ Supabase project created
- ✅ Database tables created (run `SUPABASE_SCHEMA.sql`)
- ✅ RLS policies set up (run `RLS_POLICIES.sql`)
- ✅ Supabase credentials in `.env` file

## Step 1: Install Required Packages

Run this command in your project directory:

```bash
npx expo install expo-image-picker expo-file-system
```

This installs:
- `expo-image-picker` - For selecting images from gallery or taking photos
- `expo-file-system` - For reading files from device storage

## Step 2: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Enter:
   - **Name**: `pet-media`
   - **Public bucket**: ❌ Unchecked (we'll use RLS for security)
   - **File size limit**: 10MB (or adjust as needed)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp, video/mp4, video/quicktime`

**OR** run the SQL script:

1. Open **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `SUPABASE_STORAGE_SETUP.sql`
3. Click **"Run"**

This will:
- Create the `pet-media` bucket
- Set up Row Level Security (RLS) policies
- Configure file size limits and allowed MIME types

## Step 3: Verify Storage Setup

After creating the bucket, verify it exists:

1. Go to **Storage** > **Buckets**
2. You should see `pet-media` listed
3. Click on it to see bucket details

## Step 4: Test the Implementation

1. Open your app
2. Navigate to a pet profile (create one if needed)
3. Click **"Add Photos or Videos"** or the **+** button
4. Choose **Camera** or **Photo Library**
5. Select or take a photo
6. The image should upload and appear in the media gallery

## How It Works

### Upload Flow

1. User selects/takes a photo
2. App requests permissions (camera/gallery)
3. Image is read from device storage
4. Image is converted to blob format
5. Image is uploaded to Supabase Storage at path: `{canineId}/{timestamp}.jpg`
6. Public URL is returned
7. Metadata is saved to `media_items` table in database

### Storage Structure

```
pet-media/
  ├── {canine-id-1}/
  │   ├── 1234567890.jpg
  │   ├── 1234567891.jpg
  │   └── 1234567892.mp4
  ├── {canine-id-2}/
  │   ├── 1234567893.jpg
  │   └── 1234567894.jpg
  └── ...
```

### Security (RLS Policies)

The RLS policies ensure:
- ✅ Users can only upload media for their own pets
- ✅ Users can only view media for their own pets
- ✅ Users can only delete media for their own pets
- ✅ Media is automatically deleted when a pet is deleted (cascade)

## Troubleshooting

### Error: "Bucket not found"

**Solution**: Make sure you've created the `pet-media` bucket in Supabase Storage.

### Error: "Permission denied"

**Possible causes**:
1. RLS policies not set up - Run `SUPABASE_STORAGE_SETUP.sql`
2. User not authenticated - Make sure user is logged in
3. Canine doesn't belong to user - Check `canine_profiles.user_id`

**Solution**: Check the browser console for specific error messages.

### Error: "File size too large"

**Solution**: 
- Reduce image quality in `launchImageLibraryAsync` (currently set to 0.8)
- Increase file size limit in bucket settings
- Compress images before upload

### Images not displaying

**Possible causes**:
1. Storage bucket is private but URL is being used directly
2. CORS issues
3. Invalid URL format

**Solution**:
- Make sure you're using `getPublicUrl()` from Supabase Storage
- Check that the URL is correct in the database
- Verify bucket is set to allow public access or use signed URLs

### Upload fails on mobile

**Possible causes**:
1. Permissions not granted
2. Network issues
3. File format not supported

**Solution**:
- Check app permissions in device settings
- Test with a smaller image first
- Verify file format is in allowed MIME types

## Features Implemented

✅ **Image selection from gallery**
✅ **Camera capture**
✅ **Upload to Supabase Storage**
✅ **Automatic file naming** (`{canineId}/{timestamp}.{extension}`)
✅ **Progress indicators** (uploading state)
✅ **Error handling** with user-friendly messages
✅ **Delete from storage** when media is deleted
✅ **Profile photo management** (set/remove)
✅ **RLS security** (users can only access their own pet media)

## Next Steps

### Optional Enhancements

1. **Image Compression**:
   ```bash
   npx expo install expo-image-manipulator
   ```
   Then compress images before upload to reduce file size.

2. **Multiple Image Selection**:
   Update `launchImageLibraryAsync` to include `allowsMultipleSelection: true`.

3. **Video Support**:
   Enable `MediaTypeOptions.All` and add video handling.

4. **Image Preview/Viewer**:
   ```bash
   npm install react-native-image-viewing
   ```
   Add full-screen image viewing.

5. **Upload Progress**:
   Use Supabase Storage's upload progress callback to show percentage.

## File Structure

```
AvaApp/
  ├── services/
  │   └── storage.ts              # Supabase Storage service
  ├── app/
  │   └── canine-profile.tsx      # Updated with upload functionality
  └── docs/
      ├── SUPABASE_STORAGE_SETUP.sql    # SQL for bucket and RLS
      └── SUPABASE_STORAGE_SETUP.md     # This guide
```

## Cost Considerations

- **Free tier**: 1GB storage, 2GB bandwidth/month
- **Paid tier**: $0.021/GB storage, $0.09/GB bandwidth
- **Tips**: 
  - Compress images before upload
  - Use appropriate image quality (0.8 is good balance)
  - Consider image optimization for large files

## Support

If you encounter issues:
1. Check the browser/device console for error messages
2. Verify Supabase Storage bucket exists and is configured correctly
3. Check RLS policies are set up
4. Ensure user is authenticated
5. Verify network connectivity



