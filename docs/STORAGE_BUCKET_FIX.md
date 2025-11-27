# Fixing "Bucket not found" Error for Supabase Storage

## Problem
When uploading images to Supabase Storage, you may see this error when trying to access the image:
```json
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

This happens because the bucket is **private**, but the app was trying to use `getPublicUrl()` which only works for **public** buckets.

## Solution

I've updated the code to automatically use **signed URLs** for private buckets. Signed URLs:
- Work with private buckets (more secure)
- Expire after 1 year (can be adjusted)
- Require authentication to generate

### What Changed

1. **`services/storage.ts`**:
   - Now uses `createSignedUrl()` for private buckets
   - Falls back to `getPublicUrl()` for public buckets
   - Automatically refreshes URLs when loading media items

2. **`services/database.ts`**:
   - `mediaItemService.mapFromDb()` now refreshes URLs when loading media items
   - This ensures existing images with expired URLs get fresh signed URLs

### How It Works Now

- **New uploads**: Automatically get signed URLs (for private buckets)
- **Existing images**: URLs are refreshed when loading from the database
- **Both public and private buckets**: The code automatically detects which type you're using

## Options

You have two options for your bucket:

### Option 1: Keep Bucket Private (Recommended - More Secure)
- Bucket remains private
- Images require signed URLs (automatically handled)
- Better for private pet data
- **No action needed** - the code now handles this automatically

### Option 2: Make Bucket Public (Simpler, Less Secure)
If you prefer public access (simpler but less secure), run this SQL in Supabase:

```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'pet-media';
```

Then the app will use public URLs instead of signed URLs.

## Testing

1. **Upload a new image**: Should work and get a signed URL
2. **View existing images**: URLs should refresh automatically when loading
3. **Check console**: Should see no more "Bucket not found" errors

## Additional Notes

- Signed URLs expire after 1 year (31536000 seconds)
- URLs are automatically refreshed when loading images from the database
- If you switch between public/private, existing images will adapt automatically



