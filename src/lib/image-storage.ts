import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Check if we're in production and have Supabase credentials
const isDevelopment = process.env.NODE_ENV === 'development';
const forceSupabase = process.env.USE_SUPABASE === 'true';
const hasSupabaseKey = !!(
  process.env.SSD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const useSupabaseStorage = forceSupabase || (!isDevelopment && hasSupabaseKey);

let supabase: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

if (useSupabaseStorage) {
  const supabaseUrl = process.env.SSD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SSD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
}

const STORAGE_BUCKET = 'hair-makeover-images';

// Ensure bucket exists (only run once)
let bucketChecked = false;

async function ensureBucketExists() {
  if (!supabase || bucketChecked) return;

  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(
      (bucket: any) => bucket.name === STORAGE_BUCKET // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    if (!bucketExists) {
      console.log('📦 Creating Supabase storage bucket:', STORAGE_BUCKET);
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });

      if (error && error.message !== 'Bucket already exists') {
        console.error('❌ Error creating storage bucket:', error);
        throw error;
      }
    }

    bucketChecked = true;
    console.log('✅ Storage bucket ready:', STORAGE_BUCKET);
  } catch (error) {
    console.error('❌ Error ensuring bucket exists:', error);
    throw error;
  }
}

// Download image from URL and return buffer
async function downloadImage(imageUrl: string): Promise<Buffer> {
  console.log('⬇️ Downloading image from URL...');
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Save uploaded image (from form data)
export async function saveUploadedImage(file: File) {
  const id = uuidv4();
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `${file.name}`;
  const filePath = `/uploads/${id}.${extension}`;

  console.log('💾 Saving uploaded image:', { id, filename, filePath, useSupabaseStorage });

  if (useSupabaseStorage && supabase) {
    await ensureBucketExists();

    // Convert File to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`uploads/${id}.${extension}`, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase storage upload error:', error);
      throw error;
    }

    // Get public URL
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(`uploads/${id}.${extension}`);

    console.log('✅ Uploaded to Supabase Storage:', data.publicUrl);

    return {
      id,
      filename,
      filePath: data.publicUrl, // Return Supabase URL instead of local path
    };
  } else {
    // Local development - save to public directory
    const buffer = Buffer.from(await file.arrayBuffer());
    const localPath = join(process.cwd(), 'public', 'uploads', `${id}.${extension}`);
    await writeFile(localPath, buffer);

    console.log('✅ Saved to local file system:', localPath);

    return {
      id,
      filename,
      filePath,
    };
  }
}

// Save generated image (from URL)
export async function saveGeneratedImage(imageUrl: string) {
  const id = uuidv4();
  const filePath = `/generated/${id}.jpg`;

  console.log('💾 Saving generated image:', { id, filePath, useSupabaseStorage });

  if (useSupabaseStorage && supabase) {
    await ensureBucketExists();

    // Download image and upload to Supabase
    const imageBuffer = await downloadImage(imageUrl);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`generated/${id}.jpg`, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase storage upload error:', error);
      throw error;
    }

    // Get public URL
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(`generated/${id}.jpg`);

    console.log('✅ Uploaded to Supabase Storage:', data.publicUrl);

    return {
      id,
      filePath: data.publicUrl, // Return Supabase URL instead of local path
    };
  } else {
    // Local development - save to public directory
    const imageBuffer = await downloadImage(imageUrl);
    const localPath = join(process.cwd(), 'public', 'generated', `${id}.jpg`);
    await writeFile(localPath, imageBuffer);

    console.log('✅ Saved to local file system:', localPath);

    return {
      id,
      filePath,
    };
  }
}
