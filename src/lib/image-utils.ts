// Export functions from the new image storage module
export { saveUploadedImage, saveGeneratedImage } from './image-storage';

export function getImageUrl(path: string): string {
  // If it's already a full URL (Supabase), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // For local paths, ensure they start with /
  return path.startsWith('/') ? path : `/${path}`;
}
