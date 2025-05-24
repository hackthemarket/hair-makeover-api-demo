'use client';

import { useEffect, useState } from 'react';

export type UploadedImage = {
  id: string;
  filename: string;
  file_path: string;
  upload_date: string;
  thumbnail_path?: string;
};

export function useUploadedImages() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching uploaded images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<UploadedImage | null> => {
    try {
      // Check if this image is already uploaded by comparing file names
      // For demo images, they have predictable names like 'demo-1.jpg'
      const isDemoImage = file.name.includes('demo-');

      if (isDemoImage) {
        console.log('Skipping upload for demo image:', file.name);
        return null;
      }

      // Check for recent duplicates by name and timing
      const existingImage = images.find(
        img =>
          img.filename === file.name &&
          Math.abs(new Date(img.upload_date).getTime() - Date.now()) < 30000 // Don't upload if same file was uploaded in last 30 seconds
      );

      if (existingImage) {
        console.log('Image already exists, not uploading duplicate:', file.name);
        return existingImage;
      }

      console.log('Uploading new image:', file.name);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newImage = await response.json();
        setImages(prev => [newImage, ...prev]);
        return newImage;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
    return null;
  };

  // Delete functionality removed - images are permanent

  useEffect(() => {
    fetchImages();
  }, []);

  return {
    images,
    isLoading,
    uploadImage,
    refetch: fetchImages,
  };
}
