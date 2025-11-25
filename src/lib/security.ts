// Security utilities for enhanced application security
import crypto from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a secure random string for passwords or tokens
 */
export function generateSecureRandomString(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    result += charset[randomIndex];
  }
  
  return result;
}

/**
 * Hash a string using SHA-256
 */
export function hashString(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  // In a real implementation, you would verify the token against the session
  // For now, we'll just check if the token exists and has the right format
  return Boolean(token && token.length === 64 && sessionToken);
}

/**
 * Sanitize HTML input to prevent XSS
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize SQL input to prevent SQL injection
 */
export function sanitizeSQL(input: string): string {
  if (!input) return '';
  
  return input.replace(/['"\\;]/g, '');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  try {
    const parsedURL = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedURL.protocol)) {
      return '';
    }
    
    // Remove potentially dangerous parts
    parsedURL.hash = '';
    parsedURL.username = '';
    parsedURL.password = '';
    
    return parsedURL.toString();
  } catch {
    return '';
  }
}

/**
 * Check if a password is strong
 */
export function isStrongPassword(password: string): {
  isStrong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร');
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('รหัสผ่านควรมีตัวอักษรพิมพ์เล็ก');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('รหัสผ่านควรมีตัวอักษรพิมพ์ใหญ่');
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('รหัสผ่านควรมีตัวเลข');
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('รหัสผ่านควรมีอักขระพิเศษ');
  }
  
  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('รหัสผ่านไม่ควรมีตัวอักษรซ้ำกันมากกว่า 2 ตัว');
  }
  
  // Common passwords check (simplified)
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score -= 2;
    feedback.push('รหัสผ่านไม่ควรมีคำศัพท์ที่พบบ่อย');
  }
  
  const isStrong = score >= 4;
  
  return { isStrong, score, feedback };
}

/**
 * Generate a secure session ID
 */
export function generateSessionID(): string {
  return generateSecureToken(64);
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

/**
 * In-memory rate limiter
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  isAllowed(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Clean up expired entries
    for (const [key, value] of this.requests.entries()) {
      if (value.resetTime < now) {
        this.requests.delete(key);
      }
    }
    
    // Get or create entry for this identifier
    let entry = this.requests.get(identifier);
    
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + this.config.windowMs };
      this.requests.set(identifier, entry);
    }
    
    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return { allowed: false, resetTime: entry.resetTime };
    }
    
    // Increment count
    entry.count++;
    
    return { allowed: true };
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * Create rate limiters for different use cases
 */
export const RateLimiters = {
  // General API rate limiter: 100 requests per minute
  API: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'Too many requests, please try again later'
  }),
  
  // Authentication rate limiter: 5 attempts per 15 minutes
  AUTH: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later'
  }),
  
  // Password reset rate limiter: 3 attempts per hour
  PASSWORD_RESET: new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later'
  }),
  
  // File upload rate limiter: 10 uploads per minute
  FILE_UPLOAD: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Too many file uploads, please try again later'
  })
};

/**
 * Security headers for API responses
 */
export const SecurityHeaders = {
  // Prevent clickjacking
  X_FRAME_OPTIONS: 'DENY',
  
  // Prevent MIME type sniffing
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  
  // Enable XSS protection
  X_XSS_PROTECTION: '1; mode=block',
  
  // Referrer policy
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
  
  // Content Security Policy
  CONTENT_SECURITY_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'",
  
  // Strict Transport Security (HTTPS only)
  STRICT_TRANSPORT_SECURITY: 'max-age=31536000; includeSubDomains',
  
  // Permissions Policy
  PERMISSIONS_POLICY: 'geolocation=(), microphone=(), camera=()'
};

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: Response | NextResponse): Response | NextResponse {
  const headers = new Headers(response.headers);
  
  headers.set('X-Frame-Options', SecurityHeaders.X_FRAME_OPTIONS);
  headers.set('X-Content-Type-Options', SecurityHeaders.X_CONTENT_TYPE_OPTIONS);
  headers.set('X-XSS-Protection', SecurityHeaders.X_XSS_PROTECTION);
  headers.set('Referrer-Policy', SecurityHeaders.REFERRER_POLICY);
  headers.set('Content-Security-Policy', SecurityHeaders.CONTENT_SECURITY_POLICY);
  headers.set('Permissions-Policy', SecurityHeaders.PERMISSIONS_POLICY);
  
  // Only add HSTS in production and over HTTPS
  if (process.env.NODE_ENV === 'production' && process.env.PROTOCOL === 'https') {
    headers.set('Strict-Transport-Security', SecurityHeaders.STRICT_TRANSPORT_SECURITY);
  }
  
  // For NextResponse, we need to set headers directly
  if ('headers' in response && typeof response.headers.set === 'function') {
    response.headers.set('X-Frame-Options', SecurityHeaders.X_FRAME_OPTIONS);
    response.headers.set('X-Content-Type-Options', SecurityHeaders.X_CONTENT_TYPE_OPTIONS);
    response.headers.set('X-XSS-Protection', SecurityHeaders.X_XSS_PROTECTION);
    response.headers.set('Referrer-Policy', SecurityHeaders.REFERRER_POLICY);
    response.headers.set('Content-Security-Policy', SecurityHeaders.CONTENT_SECURITY_POLICY);
    response.headers.set('Permissions-Policy', SecurityHeaders.PERMISSIONS_POLICY);
    
    if (process.env.NODE_ENV === 'production' && process.env.PROTOCOL === 'https') {
      response.headers.set('Strict-Transport-Security', SecurityHeaders.STRICT_TRANSPORT_SECURITY);
    }
    
    return response;
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Validate file upload for security
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
): { isValid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'ประเภทไฟล์ไม่ได้รับอนุญาต'
    };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'ขนาดไฟล์ใหญ่เกินไป'
    };
  }
  
  // Check file name for suspicious patterns
  const fileName = file.name.toLowerCase();
  const suspiciousPatterns = [
    /\.exe$/, /\.bat$/, /\.cmd$/, /\.scr$/, /\.pif$/,
    /\.com$/, /\.vbs$/, /\.js$/, /\.jar$/, /\.app$/,
    /\.\./, /\/\//, /[<>:"|?*]/
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
    return {
      isValid: false,
      error: 'ชื่อไฟล์มีลักษณะน่าสงสัย'
    };
  }
  
  return { isValid: true };
}

/**
 * Generate a secure filename for uploaded files
 */
export function generateSecureFilename(originalName: string): string {
  const extension = originalName.split('.').pop() || '';
  const timestamp = Date.now();
  const randomString = generateSecureToken(8);
  
  return `${timestamp}_${randomString}.${extension}`;
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedData = textParts.join(':');
  const decipher = crypto.createDecipher(algorithm, key);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}