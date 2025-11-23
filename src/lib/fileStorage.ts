// src/lib/fileStorage.ts

/**
 * @file File storage service for handling file uploads
 * This service provides a unified interface for file storage operations
 * supporting both local development and cloud storage (AWS S3)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import logger from './logger';

// Configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const useCloudStorage = process.env.USE_CLOUD_STORAGE === 'true' || !isDevelopment;

// S3 Client (only initialized if needed)
let s3Client: S3Client | null = null;

if (useCloudStorage && process.env.AWS_S3_BUCKET_NAME) {
  s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * File upload result interface
 */
export interface FileUploadResult {
  url: string;
  key?: string;
  size?: number;
  contentType?: string;
}

/**
 * Upload a file to storage (cloud or local)
 */
export async function uploadFile(
  file: Buffer | string,
  options: {
    fileName?: string;
    contentType?: string;
    folder?: string;
    maxSize?: number; // in bytes
  } = {}
): Promise<FileUploadResult> {
  const {
    fileName = generateFileName(),
    contentType = 'application/octet-stream',
    folder = 'uploads',
    maxSize = 10 * 1024 * 1024, // 10MB default
  } = options;

  // Convert base64 to buffer if needed
  let buffer: Buffer;
  let detectedContentType = contentType;
  
  if (typeof file === 'string') {
    // Handle base64 data URL
    const base64Match = file.match(/^data:(.+?);base64,(.+)$/);
    if (base64Match) {
      detectedContentType = base64Match[1];
      buffer = Buffer.from(base64Match[2], 'base64');
    } else {
      // Plain base64 string
      buffer = Buffer.from(file, 'base64');
    }
  } else {
    buffer = file;
  }

  // Check file size
  if (buffer.length > maxSize) {
    throw new Error(`File size (${buffer.length} bytes) exceeds maximum allowed size (${maxSize} bytes)`);
  }

  try {
    if (useCloudStorage && s3Client) {
      return await uploadToS3(buffer, fileName, detectedContentType, folder);
    } else {
      return await uploadToLocal(buffer, fileName, detectedContentType, folder);
    }
  } catch (error) {
    logger.error('File upload failed', error as Error, 'FileStorage', {
      fileName,
      contentType,
      folder,
      size: buffer.length
    });
    throw error;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileKeyOrUrl: string): Promise<void> {
  try {
    if (useCloudStorage && s3Client) {
      // Extract key from URL if needed
      const key = extractKeyFromUrl(fileKeyOrUrl);
      if (key) {
        await deleteFromS3(key);
      }
    } else {
      // Local file deletion
      const filePath = path.join(process.cwd(), 'public', fileKeyOrUrl);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // File might not exist, which is fine
        logger.debug('File not found for deletion', 'FileStorage', { filePath });
      }
    }
  } catch (error) {
    logger.error('File deletion failed', error as Error, 'FileStorage', {
      fileKeyOrUrl
    });
    throw error;
  }
}

/**
 * Upload file to AWS S3
 */
async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string
): Promise<FileUploadResult> {
  if (!s3Client || !process.env.AWS_S3_BUCKET_NAME) {
    throw new Error('S3 client not configured');
  }

  const key = `${folder}/${fileName}`;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // Add cache control for images
    CacheControl: contentType.startsWith('image/') ? 'max-age=31536000' : undefined,
    // Make files public by default (adjust as needed)
    ACL: 'public-read',
  });

  await s3Client.send(command);

  const url = `https://${bucketName}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;

  logger.info('File uploaded to S3', 'FileStorage', {
    key,
    size: buffer.length,
    contentType
  });

  return {
    url,
    key,
    size: buffer.length,
    contentType
  };
}

/**
 * Upload file to local storage
 */
async function uploadToLocal(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string
): Promise<FileUploadResult> {
  const uploadDir = path.join(process.cwd(), 'public', folder);
  
  // Ensure upload directory exists
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);

  const url = `/${folder}/${fileName}`;

  logger.info('File uploaded locally', 'FileStorage', {
    filePath,
    size: buffer.length,
    contentType
  });

  return {
    url,
    size: buffer.length,
    contentType
  };
}

/**
 * Delete file from S3
 */
async function deleteFromS3(key: string): Promise<void> {
  if (!s3Client || !process.env.AWS_S3_BUCKET_NAME) {
    throw new Error('S3 client not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);

  logger.info('File deleted from S3', 'FileStorage', { key });
}

/**
 * Extract S3 key from URL
 */
function extractKeyFromUrl(url: string): string | null {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_S3_REGION;
  
  if (!bucketName || !region) return null;
  
  const pattern = new RegExp(`https://${bucketName}.s3.${region}.amazonaws.com/(.+)`);
  const match = url.match(pattern);
  
  return match ? match[1] : null;
}

/**
 * Generate a unique filename
 */
function generateFileName(): string {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  return `${timestamp}-${random}`;
}

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