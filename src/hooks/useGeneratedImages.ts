'use client';

import { useGalleryRefresh } from '@/contexts/GalleryRefreshContext';
import { useEffect, useState } from 'react';

export type GeneratedImage = {
  id: string;
  original_image_id: string;
  hairstyle_index: number;
  result_url: string;
  created_date: string;
  original_filename: string;
  original_thumbnail: string;
};

export function useGeneratedImages() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshTrigger } = useGalleryRefresh();

  const fetchImages = async () => {
    console.log('📖 Fetching gallery images...');
    setIsLoading(true);
    try {
      const response = await fetch('/api/gallery');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Gallery images fetched:', data.length);
        setImages(data);
      } else {
        console.error('❌ Failed to fetch gallery images:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching generated images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (id: string) => {
    try {
      const response = await fetch(`/api/gallery?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== id));
      }
    } catch (error) {
      console.error('Error deleting generated image:', error);
    }
  };

  // Fetch images on mount
  useEffect(() => {
    fetchImages();
  }, []);

  // Auto-refresh when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 Auto-refreshing gallery due to trigger:', refreshTrigger);
      fetchImages();
    }
  }, [refreshTrigger]);

  return {
    images,
    isLoading,
    deleteImage,
    refetch: fetchImages,
  };
}
