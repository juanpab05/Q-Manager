/**
 * Utility functions for handling media URLs
 */
import supabase from './supabaseClient';

/**
 * Formats a media URL from Supabase Storage
 * @param path The media path in Supabase storage bucket (e.g., '123-image.jpg')
 * @returns The complete public URL for accessing the media file
 */
export const formatMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // Debug the incoming path
  console.log("Original media path:", path);
  
  // If the path already starts with http:// or https://, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    console.log("URL already absolute, returning as is:", path);
    return path;
  }
  
  // Get the public URL from Supabase storage
  const { data } = supabase.storage
    .from('announcements-media')
    .getPublicUrl(path);
    
  const publicUrl = data?.publicUrl || '';
  console.log("Formatted media URL:", publicUrl);
  return publicUrl;
}; 