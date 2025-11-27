/**
 * Supabase Storage Service
 * Handles image and video uploads to Supabase Storage
 */

import { supabaseService, isSupabaseConfigured } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy'; // Use legacy API to avoid deprecation warnings

const STORAGE_BUCKET = 'pet-media';

// Supabase Storage file size limits (in bytes)
// Free tier: 50MB, Pro/Team: 5GB (configurable in Supabase dashboard)
// Defaulting to 50MB for safety, but this can be increased if your project allows larger files
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos (more lenient)

/**
 * Get a signed URL for a media item (for private buckets)
 * @param filePath - Path of the file in storage
 * @param expiresIn - Expiration time in seconds (default: 1 year)
 * @returns Signed URL that expires after the specified time
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 31536000): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  try {
    const { data, error } = await supabaseService.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }

    return data.signedUrl;
  } catch (error: any) {
    console.error('Error getting signed URL:', error);
    throw new Error(error.message || 'Failed to get signed URL');
  }
}

/**
 * Upload an image or video to Supabase Storage
 * @param uri - Local file URI from expo-image-picker
 * @param canineId - ID of the canine this media belongs to
 * @param type - 'photo' or 'video'
 * @returns Public URL or signed URL of the uploaded file
 */
export async function uploadMediaToSupabase(
  uri: string,
  canineId: string,
  type: 'photo' | 'video' = 'photo'
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  try {
    // Check file size before upload (for native platforms)
    // Note: For web, file size check is done in the UI before calling this function
    if (Platform.OS !== 'web') {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      const fileSize = fileInfo.size || 0;

      // Check against size limits
      const maxSize = type === 'video' ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
      if (fileSize > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        throw new Error(
          `File size (${fileSizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB. ` +
          `Please compress or reduce the ${type === 'video' ? 'video' : 'image'} size and try again.`
        );
      }
    }

    // Generate unique file name: {canineId}/{timestamp}.{extension}
    const fileExtension = uri.split('.').pop() || (type === 'photo' ? 'jpg' : 'mp4');
    const timestamp = Date.now();
    const fileName = `${canineId}/${timestamp}.${fileExtension}`;

    // Read file - use different approaches for web vs native
    // Determine content type based on file extension and media type
    let contentType: string;
    if (type === 'video') {
      // Support common video formats
      const ext = fileExtension.toLowerCase();
      if (ext === 'mp4') contentType = 'video/mp4';
      else if (ext === 'mov') contentType = 'video/quicktime';
      else if (ext === 'avi') contentType = 'video/x-msvideo';
      else if (ext === 'webm') contentType = 'video/webm';
      else contentType = 'video/mp4'; // Default
    } else {
      // Support common image formats
      const ext = fileExtension.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'gif') contentType = 'image/gif';
      else if (ext === 'webp') contentType = 'image/webp';
      else contentType = 'image/jpeg'; // Default
    }
    
    if (Platform.OS === 'web') {
      // For web, use fetch to get the file as blob
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      // Upload to Supabase Storage using blob
      const { data, error } = await supabaseService.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, blob, {
          contentType,
          upsert: false,
        });
        
      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        throw error;
      }

      // Get URL - try signed URL first (for private buckets), fallback to public
      return await getFileUrl(data.path);
    } else {
      // For native (iOS/Android), we need to read the file and convert it
      // Supabase Storage on native needs the actual file data, not just metadata
      // Read file as base64 using legacy API
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Upload to Supabase Storage using ArrayBuffer
      // Supabase accepts ArrayBuffer/Uint8Array on native platforms
      const { data, error } = await supabaseService.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, byteArray, {
          contentType,
          upsert: false,
        });
        
      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        throw error;
      }

      // Get URL - try signed URL first (for private buckets), fallback to public
      return await getFileUrl(data.path);
    }
  } catch (error: any) {
    console.error('Error uploading media:', error);
    throw new Error(error.message || 'Failed to upload media');
  }
}

/**
 * Get the appropriate URL for a file (signed URL for private buckets, public URL for public buckets)
 * @param filePath - Path of the file in storage
 * @returns URL to access the file
 */
export async function getFileUrl(filePath: string): Promise<string> {
  // First, try to get a signed URL (works for private buckets)
  try {
    const { data: signedUrlData, error: signedError } = await supabaseService.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 31536000); // 1 year expiration

    if (!signedError && signedUrlData?.signedUrl) {
      return signedUrlData.signedUrl;
    }
  } catch (error) {
    console.warn('Failed to create signed URL, trying public URL:', error);
  }

  // Fallback to public URL (works for public buckets)
  const { data: urlData } = supabaseService.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Refresh a signed URL if it's expired or about to expire
 * @param currentUrl - Current URL (signed or public)
 * @param filePath - Path of the file in storage
 * @returns New URL
 */
export async function refreshMediaUrl(currentUrl: string, filePath: string): Promise<string> {
  // If it's already a signed URL, create a new one
  if (currentUrl.includes('token=')) {
    return await getSignedUrl(filePath);
  }

  // Otherwise, try to get the appropriate URL
  return await getFileUrl(filePath);
}

/**
 * Delete a media file from Supabase Storage
 * @param filePath - Path of the file in storage (e.g., "canine-1/1234567890.jpg")
 */
export async function deleteMediaFromSupabase(filePath: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  try {
    const { error } = await supabaseService.storage.from(STORAGE_BUCKET).remove([filePath]);

    if (error) {
      console.error('Error deleting from Supabase Storage:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting media:', error);
    throw new Error(error.message || 'Failed to delete media');
  }
}

/**
 * Extract file path from a Supabase Storage URL
 * @param url - Full public URL or signed URL from Supabase Storage
 * @returns File path relative to bucket
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    // Supabase Storage URLs look like:
    // Public: https://{project-id}.supabase.co/storage/v1/object/public/{bucket}/{path}
    // Signed: https://{project-id}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...
    const publicMatch = url.match(/\/object\/public\/[^/]+\/(.+?)(\?|$)/);
    const signedMatch = url.match(/\/object\/sign\/[^/]+\/(.+?)(\?|$)/);
    
    return publicMatch?.[1] || signedMatch?.[1] || null;
  } catch {
    return null;
  }
}

/**
 * Check if Supabase Storage is configured and accessible
 */
export async function checkStorageAccess(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const { data, error } = await supabaseService.storage.from(STORAGE_BUCKET).list('', {
      limit: 1,
    });

    if (error) {
      console.warn('Storage bucket may not exist:', error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
