/**
 * Utility functions ported from the original HTML
 */

import { EXT_MAP } from './constants';

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
 * Clean text for history storage - remove display markup
 */
export function cleanText(text) {
  if (!text) return '';
  // Remove <br> tags
  let cleaned = text.replace(/<br\s*\/?>/gi, '\n');
  // Remove [FILE TERLAMPIR] placeholder
  cleaned = cleaned.replace(/\[FILE TERLAMPIR\]/gi, '');
  // Remove <img> tags
  cleaned = cleaned.replace(/<img[^>]*>/gi, '');
  return cleaned.trim();
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date for display (Indonesian locale)
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format file size in KB
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const kb = Math.round(bytes / 1024);
  return `${kb} KB`;
}

/**
 * Get file extension from name
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Get language from file extension for code blocks
 */
export function getLanguageFromExtension(ext) {
  if (!ext) return 'text';
  const extLower = ext.toLowerCase();
  const reverseMap = Object.entries(EXT_MAP).reduce((acc, [lang, ext]) => {
    acc[ext] = lang;
    return acc;
  }, {});
  return reverseMap[extLower] || extLower;
}

/**
 * Get extension from language for code download
 */
export function getExtensionFromLanguage(lang) {
  return EXT_MAP[lang?.toLowerCase()] || lang || 'txt';
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename) {
  if (!filename) return '';
  // Remove path and special characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 200);
}

/**
 * Extract domain from URL for favicon
 */
export function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * Check if MIME type is image
 */
export function isImageMimeType(mimeType) {
  return mimeType?.startsWith('image/');
}

/**
 * Check if file is text-like (can be displayed as text)
 */
export const TEXT_LIKE_EXTENSIONS = new Set([
  'txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml', 'py', 'js', 'ts',
  'html', 'css', 'sql', 'log', 'tsv', 'sh', 'php', 'java', 'cpp',
  'c', 'cs', 'go', 'rb', 'rs', 'js', 'tsx', 'jsx'
]);

export function isTextLikeFile(filename, mimeType) {
  const ext = getFileExtension(filename).toLowerCase();
  if (TEXT_LIKE_EXTENSIONS.has(ext)) return true;
  if (mimeType?.startsWith('text/')) return true;
  return false;
}

/**
 * Generate a unique ID (replacement for crypto.randomUUID)
 */
export function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36);
}
