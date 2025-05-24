import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables with migration support
const createTables = () => {
  // Uploaded images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS uploaded_images (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      thumbnail_path TEXT
    )
  `);

  // Check if generated_images table has correct schema
  const tableInfo = db.prepare(`PRAGMA table_info(generated_images)`).all() as Array<{
    name: string;
    type: string;
    notnull: number;
    pk: number;
  }>;

  const needsSchemaUpdate =
    tableInfo.length > 0 &&
    !tableInfo.find(col => col.name === 'original_image_id' && col.notnull === 0);

  if (needsSchemaUpdate) {
    // Only drop and recreate if schema needs updating
    console.log('Updating generated_images table schema...');
    db.exec('DROP TABLE IF EXISTS generated_images');
  }

  // Generated images table (foreign key is optional to allow demo images)
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_images (
      id TEXT PRIMARY KEY,
      original_image_id TEXT,
      hairstyle_index INTEGER NOT NULL,
      result_url TEXT NOT NULL,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables created/updated successfully');
};

// Initialize database
createTables();

// Prepared statements for uploaded images
export const insertUploadedImage = db.prepare(`
  INSERT INTO uploaded_images (id, filename, file_path, thumbnail_path)
  VALUES (?, ?, ?, ?)
`);

export const getUploadedImages = db.prepare(`
  SELECT * FROM uploaded_images ORDER BY upload_date DESC
`);

export const getUploadedImageById = db.prepare(`
  SELECT * FROM uploaded_images WHERE id = ?
`);

export const deleteUploadedImage = db.prepare(`
  DELETE FROM uploaded_images WHERE id = ?
`);

// Prepared statements for generated images
export const insertGeneratedImage = db.prepare(`
  INSERT INTO generated_images (id, original_image_id, hairstyle_index, result_url)
  VALUES (?, ?, ?, ?)
`);

export const getGeneratedImages = db.prepare(`
  SELECT gi.*, ui.filename as original_filename, ui.thumbnail_path as original_thumbnail
  FROM generated_images gi
  LEFT JOIN uploaded_images ui ON gi.original_image_id = ui.id
  ORDER BY gi.created_date DESC
`);

export const getGeneratedImageById = db.prepare(`
  SELECT * FROM generated_images WHERE id = ?
`);

export const deleteGeneratedImage = db.prepare(`
  DELETE FROM generated_images WHERE id = ?
`);

export default db;
