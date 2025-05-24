'use client';

import { useUploadedImages } from '@/hooks/useUploadedImages';
import { shouldUploadImage } from '@/utils/imageUtils';
import { useState } from 'react';

export function useImageUpload() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const { uploadImage } = useUploadedImages();

  const handleImageSelection = async (file: File, existingId?: string) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));

    // If we have an existing ID (from previously uploaded image), use it
    if (existingId) {
      setUploadedImageId(existingId);
    } else if (shouldUploadImage(file)) {
      // Only upload if it's a genuinely new image (camera capture or new file selection)
      const uploadedImage = await uploadImage(file);
      setUploadedImageId(uploadedImage?.id || null);
    } else {
      // For demo/example images, don't upload
      setUploadedImageId(null);
    }
  };

  const resetImage = () => {
    setImage(null);
    setImagePreview(null);
    setUploadedImageId(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  return {
    image,
    imagePreview,
    handleImageSelection,
    resetImage,
    uploadedImageId,
  };
}
