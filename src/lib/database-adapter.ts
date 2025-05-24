// Database adapter that switches between SQLite (dev) and Supabase (prod)
const isDevelopment = process.env.NODE_ENV === 'development';
const forceSupabase = process.env.USE_SUPABASE === 'true';
const hasSupabaseKey = !!(
  process.env.SSD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Only use Supabase if explicitly requested OR (in production AND has keys)
const useSupabase = forceSupabase || (!isDevelopment && hasSupabaseKey);

console.log('🔧 Database adapter:', {
  isDevelopment,
  forceSupabase,
  hasSupabaseKey,
  useSupabase,
  NODE_ENV: process.env.NODE_ENV,
  USE_SUPABASE: process.env.USE_SUPABASE,
});

// Define the database implementation
let db: any; // eslint-disable-line @typescript-eslint/no-explicit-any

if (useSupabase) {
  console.log('📡 Using Supabase database');
  db = require('./database-supabase'); // eslint-disable-line @typescript-eslint/no-require-imports
} else {
  console.log('💾 Using SQLite database');
  db = require('./database'); // eslint-disable-line @typescript-eslint/no-require-imports
}

// Uploaded images functions
export async function insertUploadedImage(
  id: string,
  filename: string,
  filePath: string,
  thumbnailPath?: string
) {
  if (useSupabase) {
    return db.insertUploadedImage(id, filename, filePath, thumbnailPath);
  } else {
    try {
      db.insertUploadedImage.run(id, filename, filePath, thumbnailPath);
    } catch (error) {
      console.error('❌ SQLite: Error inserting uploaded image:', error);
      throw error;
    }
  }
}

export async function getUploadedImages() {
  if (useSupabase) {
    return db.getUploadedImages();
  } else {
    try {
      return db.getUploadedImages.all();
    } catch (error) {
      console.error('❌ SQLite: Error getting uploaded images:', error);
      throw error;
    }
  }
}

export async function getUploadedImageById(id: string) {
  if (useSupabase) {
    return db.getUploadedImageById(id);
  } else {
    try {
      return db.getUploadedImageById.get(id) || null;
    } catch (error) {
      console.error('❌ SQLite: Error getting uploaded image by ID:', error);
      throw error;
    }
  }
}

export async function deleteUploadedImage(id: string) {
  if (useSupabase) {
    return db.deleteUploadedImage(id);
  } else {
    try {
      db.deleteUploadedImage.run(id);
    } catch (error) {
      console.error('❌ SQLite: Error deleting uploaded image:', error);
      throw error;
    }
  }
}

// Generated images functions
export async function insertGeneratedImage(
  id: string,
  originalImageId: string | null,
  hairstyleIndex: number,
  resultUrl: string
) {
  if (useSupabase) {
    return db.insertGeneratedImage(id, originalImageId, hairstyleIndex, resultUrl);
  } else {
    try {
      db.insertGeneratedImage.run(id, originalImageId, hairstyleIndex, resultUrl);
    } catch (error) {
      console.error('❌ SQLite: Error inserting generated image:', error);
      throw error;
    }
  }
}

export async function getGeneratedImages() {
  if (useSupabase) {
    return db.getGeneratedImages();
  } else {
    try {
      return db.getGeneratedImages.all();
    } catch (error) {
      console.error('❌ SQLite: Error getting generated images:', error);
      throw error;
    }
  }
}

export async function getGeneratedImageById(id: string) {
  if (useSupabase) {
    return db.getGeneratedImageById(id);
  } else {
    try {
      return db.getGeneratedImageById.get(id) || null;
    } catch (error) {
      console.error('❌ SQLite: Error getting generated image by ID:', error);
      throw error;
    }
  }
}

export async function deleteGeneratedImage(id: string) {
  if (useSupabase) {
    return db.deleteGeneratedImage(id);
  } else {
    try {
      db.deleteGeneratedImage.run(id);
    } catch (error) {
      console.error('❌ SQLite: Error deleting generated image:', error);
      throw error;
    }
  }
}

export async function initializeTables() {
  if (useSupabase) {
    return db.initializeTables();
  } else {
    // SQLite tables are already initialized in database.ts
    console.log('✅ SQLite: Database tables are ready');
  }
}
