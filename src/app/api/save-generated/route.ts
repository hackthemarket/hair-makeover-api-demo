import { insertGeneratedImage } from '@/lib/database-adapter';
import { saveGeneratedImage } from '@/lib/image-utils';
import { NextRequest, NextResponse } from 'next/server';

// In-memory cache to prevent duplicate saves within a short time window
const recentSaves = new Map<string, number>();
const DUPLICATE_WINDOW_MS = 5000; // 5 seconds

function createSaveKey(
  imageUrl: string,
  originalImageId: string | null,
  hairstyleIndex: number
): string {
  return `${imageUrl}|${originalImageId || 'null'}|${hairstyleIndex}`;
}

function isDuplicateRequest(saveKey: string): boolean {
  const now = Date.now();
  const lastSave = recentSaves.get(saveKey);

  if (lastSave && now - lastSave < DUPLICATE_WINDOW_MS) {
    return true;
  }

  // Clean up old entries
  for (const [key, timestamp] of recentSaves.entries()) {
    if (now - timestamp > DUPLICATE_WINDOW_MS) {
      recentSaves.delete(key);
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  console.log('💾 Save-generated API route called');

  try {
    console.log('📥 Parsing request body...');
    const { imageUrl, originalImageId, hairstyleIndex } = await req.json();

    console.log('📝 Save request data:', {
      hasImageUrl: !!imageUrl,
      imageUrlLength: imageUrl?.length || 0,
      originalImageId,
      hairstyleIndex,
    });

    if (!imageUrl || hairstyleIndex === undefined) {
      console.error('❌ Missing required fields:', {
        hasImageUrl: !!imageUrl,
        hasOriginalImageId: !!originalImageId,
        hasHairstyleIndex: hairstyleIndex !== undefined,
      });
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl or hairstyleIndex' },
        { status: 400 }
      );
    }

    // Check for duplicate request
    const saveKey = createSaveKey(imageUrl, originalImageId, hairstyleIndex);
    if (isDuplicateRequest(saveKey)) {
      console.log('⚠️ Duplicate save request detected, skipping...', saveKey);
      return NextResponse.json(
        { error: 'Duplicate request - image already being saved' },
        { status: 409 }
      );
    }

    // Mark this request as in progress
    recentSaves.set(saveKey, Date.now());

    console.log('💾 Saving generated image to disk...');
    // Save the generated image to disk
    const { id, filePath } = await saveGeneratedImage(imageUrl);
    console.log('✅ Image saved to disk:', { id, filePath });

    console.log('💾 Saving to database...', {
      id,
      originalImageId: originalImageId || null,
      hairstyleIndex,
      filePath,
    });
    // Save to database (originalImageId can be null for demo images)
    await insertGeneratedImage(id, originalImageId || null, hairstyleIndex, filePath);
    console.log('✅ Saved to database successfully');

    const result = {
      id,
      originalImageId,
      hairstyleIndex,
      resultUrl: filePath,
      createdDate: new Date().toISOString(),
    };

    console.log('✅ Save-generated completed:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('💥 Error saving generated image:', error);
    return NextResponse.json({ error: 'Failed to save generated image' }, { status: 500 });
  }
}
