# Image Management Options for AVA Application

This guide outlines your options for creating, capturing, storing, and managing images in the AVA application.

## Current Setup

- ✅ **Display**: Using `expo-image` (already installed)
- ✅ **Storage**: Supabase database (metadata) + Supabase Storage (files)
- ✅ **Data Model**: `MediaItem` interface supports photos and videos
- ⚠️ **Capture**: Not yet implemented (placeholder in `handleAddMedia`)

---

## Option 1: Supabase Storage (Recommended)

### Overview
Store images directly in Supabase Storage, which integrates seamlessly with your existing Supabase setup.

### Pros
- ✅ Integrated with your existing Supabase backend
- ✅ Built-in CDN and global distribution
- ✅ Automatic image optimization and transformations
- ✅ Row Level Security (RLS) policies
- ✅ Free tier: 1GB storage, 2GB bandwidth
- ✅ Simple API for upload/download

### Cons
- ❌ Requires Supabase Storage setup
- ❌ Storage costs after free tier

### Implementation Steps

1. **Install dependencies**:
   ```bash
   npx expo install expo-image-picker expo-file-system
   ```

2. **Set up Supabase Storage bucket**:
   - Go to Supabase Dashboard > Storage
   - Create a bucket named `pet-media`
   - Set it to private (or public if you want)
   - Set up RLS policies

3. **Upload function example**:
   ```typescript
   import * as ImagePicker from 'expo-image-picker';
   import * as FileSystem from 'expo-file-system';
   import { supabase } from '@/lib/supabase';

   async function uploadImageToSupabase(uri: string, canineId: string) {
     // 1. Get file extension
     const fileExtension = uri.split('.').pop();
     const fileName = `${canineId}/${Date.now()}.${fileExtension}`;
     
     // 2. Read file as base64 or blob
     const response = await fetch(uri);
     const blob = await response.blob();
     
     // 3. Upload to Supabase Storage
     const { data, error } = await supabase.storage
       .from('pet-media')
       .upload(fileName, blob, {
         contentType: `image/${fileExtension}`,
         upsert: false
       });
     
     if (error) throw error;
     
     // 4. Get public URL
     const { data: { publicUrl } } = supabase.storage
       .from('pet-media')
       .getPublicUrl(data.path);
     
     return publicUrl;
   }
   ```

4. **Image picker integration**:
   ```typescript
   async function pickImage() {
     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
     if (status !== 'granted') {
       Alert.alert('Permission needed', 'We need camera roll permissions!');
       return;
     }
     
     const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       allowsEditing: true,
       aspect: [4, 3],
       quality: 0.8,
     });
     
     if (!result.canceled) {
       const uploadedUrl = await uploadImageToSupabase(result.assets[0].uri, canineId);
       // Save to database
       await addMediaItem({
         canineId,
         type: 'photo',
         uri: uploadedUrl,
         date: new Date().toISOString().split('T')[0],
       });
     }
   }
   ```

---

## Option 2: AWS S3 + CloudFront

### Overview
Store images in AWS S3 with CloudFront CDN for delivery.

### Pros
- ✅ Highly scalable
- ✅ Very fast CDN delivery
- ✅ Advanced image processing with Lambda@Edge
- ✅ Fine-grained access control

### Cons
- ❌ More complex setup
- ❌ Requires AWS account
- ❌ Additional service to manage
- ❌ More expensive than Supabase Storage

### When to Use
- If you need advanced image processing
- If you expect very high traffic
- If you need custom CDN configurations

---

## Option 3: Cloudinary (Recommended for Advanced Features)

### Overview
Image and video management platform with built-in transformations.

### Pros
- ✅ Automatic optimization and resizing
- ✅ Built-in image transformations (crop, resize, filters)
- ✅ Automatic format conversion (WebP, AVIF)
- ✅ Free tier: 25GB storage, 25GB bandwidth
- ✅ Video support included
- ✅ Face detection and AI features

### Cons
- ❌ Additional service to manage
- ❌ Costs after free tier
- ❌ Requires separate API integration

### Implementation Steps

1. **Install SDK**:
   ```bash
   npm install cloudinary
   ```

2. **Upload function**:
   ```typescript
   import { v2 as cloudinary } from 'cloudinary';
   
   async function uploadToCloudinary(uri: string) {
     const formData = new FormData();
     formData.append('file', {
       uri,
       type: 'image/jpeg',
       name: 'photo.jpg',
     });
     formData.append('upload_preset', 'your_upload_preset');
     
     const response = await fetch('https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', {
       method: 'POST',
       body: formData,
     });
     
     const data = await response.json();
     return data.secure_url;
   }
   ```

---

## Option 4: Azure Blob Storage

### Overview
Microsoft Azure's object storage service for storing unstructured data like images.

### Pros
- ✅ **Cost-effective**: Pay-as-you-go pricing, very competitive rates
- ✅ **Highly scalable**: Enterprise-grade storage
- ✅ **CDN integration**: Azure CDN for fast global delivery
- ✅ **Security**: Azure AD integration, SAS tokens, encryption at rest
- ✅ **Multiple tiers**: Hot, Cool, Archive for cost optimization
- ✅ **Azure ecosystem**: Integrates with other Azure services (Functions, Logic Apps)
- ✅ **Free tier**: 5GB storage/month (first 12 months)
- ✅ **Lifecycle management**: Automatic tier transitions

### Cons
- ❌ Requires Azure account setup (you have this ✅)
- ❌ Additional service to manage (separate from Supabase)
- ❌ More complex setup than Supabase Storage
- ❌ Need to configure CDN separately (optional but recommended)

### When to Use
- ✅ **You already have Azure account** (perfect for you!)
- If you want enterprise-grade storage
- If you need integration with other Azure services
- If you want to leverage existing Azure infrastructure
- If you need advanced lifecycle management

### Pricing (US East)
- **Hot tier**: $0.0184/GB/month (frequently accessed)
- **Cool tier**: $0.01/GB/month (infrequently accessed)
- **Archive tier**: $0.00099/GB/month (rarely accessed)
- **Transfer**: First 5GB/month free, then $0.087/GB

### Implementation Steps

1. **Install Azure SDK**:
   ```bash
   npm install @azure/storage-blob
   ```

2. **Set up Azure Storage Account**:
   - Go to Azure Portal > Storage Accounts
   - Create new storage account
   - Create a container named `pet-media`
   - Set container access level (private recommended)
   - Get connection string or access key

3. **Create upload service** (`services/azureStorage.ts`):
   ```typescript
   import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
   import * as FileSystem from 'expo-file-system';
   
   // Get from environment variables
   const AZURE_STORAGE_CONNECTION_STRING = process.env.EXPO_PUBLIC_AZURE_STORAGE_CONNECTION_STRING;
   const AZURE_CONTAINER_NAME = 'pet-media';
   
   export async function uploadImageToAzure(
     uri: string,
     canineId: string,
     type: 'photo' | 'video' = 'photo'
   ): Promise<string> {
     try {
       if (!AZURE_STORAGE_CONNECTION_STRING) {
         throw new Error('Azure Storage connection string not configured');
       }
       
       // Initialize Blob Service Client
       const blobServiceClient = BlobServiceClient.fromConnectionString(
         AZURE_STORAGE_CONNECTION_STRING
       );
       
       // Get container client
       const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);
       
       // Ensure container exists
       await containerClient.createIfNotExists({
         access: 'blob', // Private, but accessible via URL
       });
       
       // Generate unique file name
       const fileExtension = uri.split('.').pop() || 'jpg';
       const fileName = `${canineId}/${Date.now()}.${fileExtension}`;
       
       // Get block blob client
       const blockBlobClient = containerClient.getBlockBlobClient(fileName);
       
       // Read file
       const fileInfo = await FileSystem.getInfoAsync(uri);
       if (!fileInfo.exists) {
         throw new Error('File does not exist');
       }
       
       // Read as base64
       const base64 = await FileSystem.readAsStringAsync(uri, {
         encoding: FileSystem.EncodingType.Base64,
       });
       
       // Convert base64 to buffer
       const buffer = Buffer.from(base64, 'base64');
       
       // Upload to Azure Blob Storage
       const contentType = type === 'photo' ? 'image/jpeg' : 'video/mp4';
       await blockBlobClient.upload(buffer, buffer.length, {
         blobHTTPHeaders: {
           blobContentType: contentType,
         },
       });
       
       // Get URL (public if container is public, or use SAS token for private)
       const url = blockBlobClient.url;
       
       // For private containers, generate SAS token URL
       const sasUrl = await generateSasUrl(blockBlobClient, fileName);
       
       return sasUrl || url;
     } catch (error) {
       console.error('Error uploading to Azure:', error);
       throw error;
     }
   }
   
   // Generate SAS (Shared Access Signature) URL for private blobs
   async function generateSasUrl(blockBlobClient: BlockBlobClient, fileName: string): Promise<string> {
     // Option 1: Use SAS token (recommended for private containers)
     // You'll need to generate this on your backend or use Azure Functions
     
     // Option 2: Make container public (less secure, but simpler)
     // Set container access level to 'blob' or 'container'
     
     return blockBlobClient.url; // For now, return direct URL if container is public
   }
   
   export async function deleteImageFromAzure(filePath: string): Promise<void> {
     const blobServiceClient = BlobServiceClient.fromConnectionString(
       AZURE_STORAGE_CONNECTION_STRING!
     );
     const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);
     const blockBlobClient = containerClient.getBlockBlobClient(filePath);
     
     await blockBlobClient.delete();
   }
   ```

4. **Alternative: Use Azure Functions for Upload** (More Secure):
   ```typescript
   // Upload via Azure Function (recommended for production)
   export async function uploadImageViaAzureFunction(
     uri: string,
     canineId: string
   ): Promise<string> {
     const base64 = await FileSystem.readAsStringAsync(uri, {
       encoding: FileSystem.EncodingType.Base64,
     });
     
     const response = await fetch('YOUR_AZURE_FUNCTION_URL', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${await getAuthToken()}`, // Supabase auth token
       },
       body: JSON.stringify({
         image: base64,
         canineId,
         contentType: 'image/jpeg',
       }),
     });
     
     const data = await response.json();
     return data.url;
   }
   ```

5. **Update .env file**:
   ```env
   EXPO_PUBLIC_AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey;EndpointSuffix=core.windows.net
   ```

### Azure CDN Setup (Optional but Recommended)

1. Create Azure CDN profile
2. Add endpoint pointing to your storage account
3. Configure caching rules
4. Use CDN URL instead of direct blob URL

### Security Best Practices

1. **Use SAS tokens** for private containers (time-limited access)
2. **Azure AD authentication** for backend services
3. **Container-level access policies**
4. **Enable encryption at rest**
5. **Use Azure Functions** as a proxy for uploads (hides connection string)

### Comparison with Supabase Storage

| Feature | Azure Blob Storage | Supabase Storage |
|---------|-------------------|------------------|
| **Setup Complexity** | Medium | Low |
| **Cost (1TB/month)** | ~$18.40 (Hot) | ~$21 |
| **CDN** | Separate setup | Built-in |
| **Integration** | Azure ecosystem | Supabase ecosystem |
| **Security** | Advanced (SAS, AD) | RLS policies |
| **Scalability** | Enterprise-grade | Very good |
| **Free Tier** | 5GB (12 months) | 1GB (permanent) |

## Option 5: Firebase Storage

### Overview
Google's Firebase Storage for image storage.

### Pros
- ✅ Free tier: 5GB storage, 1GB/day transfer
- ✅ Good integration with Firebase ecosystem
- ✅ Built-in security rules

### Cons
- ❌ Another service to manage (separate from Supabase)
- ❌ Mixed ecosystem (Supabase + Firebase)

### When to Use
- If you're already using Firebase for other features
- If you need Google Cloud integration

---

## Option 5: Local Storage (Development Only)

### Overview
Store images locally on device using file system.

### Pros
- ✅ No external dependencies
- ✅ Fast access
- ✅ No storage costs
- ✅ Works offline

### Cons
- ❌ Not synced across devices
- ❌ Limited storage space
- ❌ Lost on app uninstall
- ❌ Not suitable for production

### When to Use
- Development/testing only
- Offline-first apps (with sync mechanism)

---

## Recommended Implementation: Supabase Storage

For your AVA application, I recommend **Supabase Storage** because:

1. **Already integrated**: You're using Supabase for database
2. **Simple**: One platform for data and storage
3. **Secure**: RLS policies work with storage
4. **Cost-effective**: Free tier is generous
5. **Fast**: Built-in CDN

### Complete Implementation Guide

#### Step 1: Install Required Packages

```bash
npx expo install expo-image-picker expo-file-system
```

#### Step 2: Create Storage Bucket

Run this SQL in Supabase SQL Editor:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-media', 'pet-media', false);

-- Set up RLS policies for storage
CREATE POLICY "Users can upload their own pet media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pet-media' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM canine_profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own pet media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pet-media' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM canine_profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own pet media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pet-media' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM canine_profiles 
    WHERE user_id = auth.uid()
  )
);
```

#### Step 3: Create Upload Service

Create `services/storage.ts`:

```typescript
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

export async function uploadImageToSupabase(
  uri: string,
  canineId: string,
  type: 'photo' | 'video' = 'photo'
): Promise<string> {
  try {
    // Get file extension
    const fileExtension = uri.split('.').pop() || 'jpg';
    const fileName = `${canineId}/${Date.now()}.${fileExtension}`;
    
    // Read file
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { 
      type: type === 'photo' ? 'image/jpeg' : 'video/mp4' 
    });
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('pet-media')
      .upload(fileName, blob, {
        contentType: type === 'photo' ? 'image/jpeg' : 'video/mp4',
        upsert: false,
      });
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pet-media')
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function deleteImageFromSupabase(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('pet-media')
    .remove([filePath]);
  
  if (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}
```

#### Step 4: Update Canine Profile Screen

Update `app/canine-profile.tsx` to use the upload service:

```typescript
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToSupabase } from '@/services/storage';

const handleAddMedia = async () => {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'We need camera roll permissions!');
    return;
  }

  // Show picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled && existingCanine) {
    try {
      // Upload to Supabase Storage
      const uploadedUrl = await uploadImageToSupabase(
        result.assets[0].uri,
        existingCanine.id,
        'photo'
      );

      // Save to database
      await addMediaItem({
        canineId: existingCanine.id,
        type: 'photo',
        uri: uploadedUrl,
        caption: '',
        date: new Date().toISOString().split('T')[0],
      });

      Alert.alert('Success', 'Media uploaded successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload media');
    }
  }
};
```

---

## Additional Features to Consider

### 1. Camera Capture
```typescript
const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'We need camera permissions!');
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  // ... handle result
};
```

### 2. Image Compression
Use `expo-image-manipulator`:
```bash
npx expo install expo-image-manipulator
```

### 3. Multiple Image Selection
```typescript
const pickMultiple = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
  });
  // ... handle multiple images
};
```

### 4. Image Preview/Viewer
Use `react-native-image-viewing`:
```bash
npm install react-native-image-viewing
```

---

## Cost Comparison

| Service | Free Tier | Paid (1TB/month) |
|---------|-----------|------------------|
| **Azure Blob Storage** | 5GB storage (12 months) | ~$18.40 (Hot tier) |
| Supabase Storage | 1GB storage, 2GB bandwidth | ~$21 |
| Cloudinary | 25GB storage, 25GB bandwidth | ~$100 |
| AWS S3 | 5GB storage, 20GB transfer | ~$23 + CloudFront |
| Firebase Storage | 5GB storage, 1GB/day transfer | ~$26 |

---

## Recommendation

### For Your Situation (You Have Azure Account)

**Azure Blob Storage** is a strong option because:
1. ✅ **You already have Azure account** - no additional account setup needed
2. ✅ **Cost-effective** - Competitive pricing, especially for larger volumes
3. ✅ **Enterprise-grade** - Highly scalable and reliable
4. ✅ **Azure ecosystem** - Can integrate with Azure Functions, Logic Apps, etc.
5. ✅ **Security** - Advanced security features (SAS tokens, Azure AD)
6. ✅ **Flexibility** - Multiple storage tiers for cost optimization

**OR Supabase Storage** if you prefer:
1. Simpler integration with existing Supabase setup
2. Built-in CDN (no separate setup)
3. RLS policies work seamlessly
4. Single platform for database and storage

### Recommendation Decision Matrix

**Choose Azure Blob Storage if:**
- ✅ You want to leverage your existing Azure account
- ✅ You need enterprise-grade scalability
- ✅ You plan to use other Azure services
- ✅ You want more control over storage tiers and lifecycle

**Choose Supabase Storage if:**
- ✅ You want the simplest integration
- ✅ You prefer a single platform (database + storage)
- ✅ You want built-in CDN without setup
- ✅ You're okay with slightly higher per-GB costs

### Hybrid Approach

You could also use **both**:
- **Supabase Storage** for smaller files and quick setup
- **Azure Blob Storage** for larger files, videos, or archival

Would you like me to implement the complete Azure Blob Storage integration for your app? I can create the service files and update your canine profile screen to use Azure.

