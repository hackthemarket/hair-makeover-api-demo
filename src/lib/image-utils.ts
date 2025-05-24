import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function saveUploadedImage(
  file: File
): Promise<{ id: string; filename: string; filePath: string }> {
  const id = uuidv4();
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const filename = `${id}.${fileExtension}`;
  const filePath = join(process.cwd(), 'public', 'uploads', filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await writeFile(filePath, buffer);

  return {
    id,
    filename: file.name,
    filePath: `/uploads/${filename}`,
  };
}

export async function saveGeneratedImage(
  imageUrl: string
): Promise<{ id: string; filePath: string }> {
  const id = uuidv4();
  const filename = `${id}.jpg`;
  const filePath = join(process.cwd(), 'public', 'generated', filename);

  // Fetch the image from the URL
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  await writeFile(filePath, buffer);

  return {
    id,
    filePath: `/generated/${filename}`,
  };
}

export function getImageUrl(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}
