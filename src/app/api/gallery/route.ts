import { deleteGeneratedImage, getGeneratedImages } from '@/lib/database-adapter';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const images = await getGeneratedImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching generated images:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery images' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    await deleteGeneratedImage(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting generated image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
