import { supabase } from '../lib/supabase';
import { sanitizeFilename } from '../lib/utils';

const BUCKET = 'pustaka';

/**
 * Upload file to Supabase storage
 */
export async function uploadToPustaka(userId, blob, filename) {
  const sanitized = sanitizeFilename(filename);
  const filePath = `${userId}/${Date.now()}_${sanitized}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading to pustaka:', error);
    throw error;
  }

  return data;
}

/**
 * List files from pustaka bucket for user
 */
export async function listPustakaFiles(userId) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(userId, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Error listing pustaka files:', error);
    return [];
  }

  return data || [];
}

/**
 * Download file from pustaka
 */
export async function downloadPustakaFile(userId, filename) {
  const filePath = `${userId}/${filename}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(filePath);

  if (error) {
    console.error('Error downloading pustaka file:', error);
    throw error;
  }

  return data;
}

/**
 * Delete file from pustaka
 */
export async function deletePustakaFile(userId, filename) {
  const filePath = `${userId}/${filename}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting pustaka file:', error);
    throw error;
  }
}

/**
 * Check if file is image based on metadata
 */
export function isImageFile(file) {
  const mimeType = file.metadata?.mimetype || '';
  const name = file.name || '';
  return mimeType.startsWith('image/') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.gif') ||
    name.endsWith('.webp');
}

/**
 * Save a base64 image (data URL) to Pustaka.
 * Dipakai saat AI menghasilkan gambar (editedImage dari backend).
 * @param {string} userId
 * @param {string} dataUrl   - base64 data URL (e.g. "data:image/png;base64,...")
 * @param {string} label     - nama label untuk file (e.g. "ai-image")
 * @returns {string|null}    - public URL jika berhasil, null jika gagal
 */
export async function saveBase64ImageToPustaka(userId, dataUrl, label = 'ai-image') {
  if (!userId || !dataUrl) return null;

  try {
    // Parse data URL
    const [header, base64] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    const ext = mimeType.split('/')[1] || 'png';

    // Convert base64 to Blob
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });

    // Build filename
    const timestamp = Date.now();
    const safeLabel = label.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40);
    const filename = `${timestamp}_${safeLabel}.${ext}`;
    const filePath = `${userId}/${filename}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error saving AI image to pustaka:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('saveBase64ImageToPustaka error:', err);
    return null;
  }
}

