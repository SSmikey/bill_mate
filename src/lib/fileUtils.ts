// src/lib/fileUtils.ts

/**
 * @file Client-safe file utility functions
 * These functions can be safely used in both client and server components
 */

/**
 * Get file info from base64 string
 */
export function parseBase64File(base64String: string): {
  buffer: Buffer;
  contentType: string;
  extension: string;
} | null {
  const match = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = contentType.split('/')[1];

  return { buffer, contentType, extension };
}

/**
 * Validate file type
 */
export function isValidImageType(contentType: string): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  return validTypes.includes(contentType.toLowerCase());
}

/**
 * Get file size from base64 string
 */
export function getBase64FileSize(base64String: string): number {
  const match = base64String.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return 0;
  
  const base64Data = match[2];
  return Math.round(base64Data.length * 0.75); // Base64 is ~33% larger than binary
}