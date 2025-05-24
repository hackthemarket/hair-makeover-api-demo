// Utility functions for image handling

export function isExampleImage(filename: string): boolean {
  return filename.includes('demo-') || filename.startsWith('/images/examples/');
}

export function isCameraCapture(filename: string): boolean {
  return filename.includes('camera-capture');
}

export function isFileUpload(filename: string): boolean {
  return !isExampleImage(filename) && !isCameraCapture(filename);
}

export function shouldUploadImage(file: File): boolean {
  // Only upload camera captures and genuine file uploads
  // Don't upload example images that are selected from the preset gallery
  return isCameraCapture(file.name) || isFileUpload(file.name);
}

export function generateImageId(file: File): string {
  // Generate a consistent ID based on file properties
  return `${file.name}-${file.size}-${file.lastModified}`;
}
