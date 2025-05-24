import { createClient } from '@supabase/supabase-js';

// Use SSD_ prefixed environment variables
const supabaseUrl = process.env.SSD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SSD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    availableVars: Object.keys(process.env).filter(
      key => key.includes('SUPABASE') || key.startsWith('SSD_')
    ),
  });
  throw new Error(
    'Missing required Supabase environment variables. Please check SSD_SUPABASE_URL and SSD_SUPABASE_SERVICE_ROLE_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database interface types
export interface UploadedImage {
  id: string;
  filename: string;
  file_path: string;
  upload_date?: string;
  thumbnail_path?: string;
}

export interface GeneratedImage {
  id: string;
  original_image_id: string | null;
  hairstyle_index: number;
  result_url: string;
  created_date?: string;
  uploaded_images?: {
    filename: string;
    thumbnail_path: string;
  } | null;
}

// Uploaded images functions
export async function insertUploadedImage(
  id: string,
  filename: string,
  filePath: string,
  thumbnailPath?: string
) {
  console.log('📝 Supabase: Inserting uploaded image:', { id, filename, filePath, thumbnailPath });

  const { error } = await supabase.from('uploaded_images').insert([
    {
      id,
      filename,
      file_path: filePath,
      thumbnail_path: thumbnailPath,
    },
  ]);

  if (error) {
    console.error('❌ Supabase: Error inserting uploaded image:', error);
    throw error;
  }

  console.log('✅ Supabase: Uploaded image inserted successfully');
}

export async function getUploadedImages(): Promise<UploadedImage[]> {
  console.log('📖 Supabase: Getting uploaded images...');

  const { data, error } = await supabase
    .from('uploaded_images')
    .select('*')
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('❌ Supabase: Error getting uploaded images:', error);
    throw error;
  }

  console.log('✅ Supabase: Retrieved uploaded images:', data?.length || 0);
  return data || [];
}

export async function getUploadedImageById(id: string): Promise<UploadedImage | null> {
  console.log('📖 Supabase: Getting uploaded image by ID:', id);

  const { data, error } = await supabase.from('uploaded_images').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      console.log('📭 Supabase: No uploaded image found with ID:', id);
      return null;
    }
    console.error('❌ Supabase: Error getting uploaded image by ID:', error);
    throw error;
  }

  console.log('✅ Supabase: Retrieved uploaded image by ID');
  return data;
}

export async function deleteUploadedImage(id: string) {
  console.log('🗑️ Supabase: Deleting uploaded image:', id);

  const { error } = await supabase.from('uploaded_images').delete().eq('id', id);

  if (error) {
    console.error('❌ Supabase: Error deleting uploaded image:', error);
    throw error;
  }

  console.log('✅ Supabase: Uploaded image deleted successfully');
}

// Generated images functions
export async function insertGeneratedImage(
  id: string,
  originalImageId: string | null,
  hairstyleIndex: number,
  resultUrl: string
) {
  console.log('📝 Supabase: Inserting generated image:', {
    id,
    originalImageId,
    hairstyleIndex,
    resultUrl,
  });

  const { error } = await supabase.from('generated_images').insert([
    {
      id,
      original_image_id: originalImageId,
      hairstyle_index: hairstyleIndex,
      result_url: resultUrl,
    },
  ]);

  if (error) {
    console.error('❌ Supabase: Error inserting generated image:', error);
    throw error;
  }

  console.log('✅ Supabase: Generated image inserted successfully');
}

export async function getGeneratedImages(): Promise<GeneratedImage[]> {
  console.log('📖 Supabase: Getting generated images...');

  const { data, error } = await supabase
    .from('generated_images')
    .select(
      `
      *,
      uploaded_images (
        filename,
        thumbnail_path
      )
    `
    )
    .order('created_date', { ascending: false });

  if (error) {
    console.error('❌ Supabase: Error getting generated images:', error);
    throw error;
  }

  console.log('✅ Supabase: Retrieved generated images:', data?.length || 0);
  return data || [];
}

export async function getGeneratedImageById(id: string): Promise<GeneratedImage | null> {
  console.log('📖 Supabase: Getting generated image by ID:', id);

  const { data, error } = await supabase.from('generated_images').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      console.log('📭 Supabase: No generated image found with ID:', id);
      return null;
    }
    console.error('❌ Supabase: Error getting generated image by ID:', error);
    throw error;
  }

  console.log('✅ Supabase: Retrieved generated image by ID');
  return data;
}

export async function deleteGeneratedImage(id: string) {
  console.log('🗑️ Supabase: Deleting generated image:', id);

  const { error } = await supabase.from('generated_images').delete().eq('id', id);

  if (error) {
    console.error('❌ Supabase: Error deleting generated image:', error);
    throw error;
  }

  console.log('✅ Supabase: Generated image deleted successfully');
}

// Initialize database tables (for first setup)
export async function initializeTables() {
  console.log('🔧 Supabase: Checking/initializing database tables...');

  try {
    // Check if tables exist by attempting to read from them
    await supabase.from('uploaded_images').select('id').limit(1);
    await supabase.from('generated_images').select('id').limit(1);
    console.log('✅ Supabase: Database tables are ready');
  } catch (error) {
    console.error('❌ Supabase: Database tables may not exist. Please run the SQL setup script.');
    console.error('Error:', error);
    throw new Error('Database tables not found. Please ensure tables are created in Supabase.');
  }
}

export default supabase;
