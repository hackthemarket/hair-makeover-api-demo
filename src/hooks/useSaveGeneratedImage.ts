'use client';

export async function saveGeneratedImage(
  imageUrl: string,
  originalImageId: string | null,
  hairstyleIndex: number
) {
  console.log('💾 saveGeneratedImage called with:', {
    imageUrl: imageUrl?.substring(0, 50) + '...',
    originalImageId,
    hairstyleIndex,
  });

  try {
    const payload = {
      imageUrl,
      originalImageId,
      hairstyleIndex,
    };

    console.log('🚀 Sending save request to /api/save-generated...');
    const response = await fetch('/api/save-generated', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Save API response:', response.status, response.statusText);

    if (response.ok) {
      const savedImage = await response.json();
      console.log('✅ Image saved successfully:', savedImage);
      return savedImage;
    } else if (response.status === 409) {
      // Duplicate request - this is expected and not an error
      console.log('⚠️ Duplicate save request - image already being saved');
      return { duplicate: true };
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to save generated image:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('💥 Error saving generated image:', error);
    return null;
  }
}
