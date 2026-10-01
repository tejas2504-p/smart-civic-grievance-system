import path from 'path';

/**
 * Government Portal - File Upload & Document Security
 */

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

export const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.sh', '.cmd', '.js', '.vbs', '.php', '.phtml',
  '.py', '.rb', '.pl', '.cgi', '.msi', '.dll', '.scr', '.jar', '.com',
]);

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Sanitizes a filename to prevent directory traversal and unsafe characters.
 *
 * @param {string} originalName
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(originalName) {
  if (!originalName || typeof originalName !== 'string') return 'document';
  
  // Strip null bytes and directory traversal
  const baseName = path.basename(originalName).replace(/\0/g, '');
  
  // Replace unsafe characters with hyphens
  return baseName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

/**
 * Validates an uploaded attachment object or metadata against strict civic portal security rules.
 *
 * @param {Object} attachment
 * @param {string} attachment.name - Filename
 * @param {string} [attachment.type] - MIME type
 * @param {number} [attachment.size] - File size in bytes
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') {
    return { isValid: false, message: 'Invalid attachment structure.' };
  }

  const { name, type, size } = attachment;

  if (!name || typeof name !== 'string') {
    return { isValid: false, message: 'Attachment must have a valid file name.' };
  }

  const ext = path.extname(name).toLowerCase();

  // 1. Explicit check against dangerous executable extensions
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      message: `File format "${ext}" is not permitted for security reasons. Executable files are blocked.`,
    };
  }

  // 2. Whitelist allowed document formats
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      message: `File type "${ext}" is not supported. Please upload a PDF, JPG, PNG, or WEBP file.`,
    };
  }

  // 3. MIME type verification if supplied
  if (type && !ALLOWED_MIME_TYPES.has(type.toLowerCase())) {
    return {
      isValid: false,
      message: `MIME type "${type}" is not accepted. Only PDF and standard images are allowed.`,
    };
  }

  // 4. File size check (Max 5MB)
  if (size && typeof size === 'number' && size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      message: `File size exceeds the 5 MB limit. Please compress or select a smaller document.`,
    };
  }

  return { isValid: true };
}

export default {
  sanitizeFilename,
  validateAttachment,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
};
