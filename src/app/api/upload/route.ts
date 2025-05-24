import { insertUploadedImage } from '@/lib/database-adapter';
import { saveUploadedImage } from '@/lib/image-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Save the file to disk
    const { id, filename, filePath } = await saveUploadedImage(file);

    // Save to database
    await insertUploadedImage(id, filename, filePath, undefined);

    return NextResponse.json({
      id,
      filename,
      filePath,
      uploadDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
