// Image optimization utilities for better performance

/**
 * Image dimensions for different use cases
 */
export const ImageDimensions = {
  THUMBNAIL: { width: 150, height: 150 },
  SMALL: { width: 300, height: 300 },
  MEDIUM: { width: 600, height: 600 },
  LARGE: { width: 1200, height: 1200 },
  PROFILE: { width: 200, height: 200 },
  PAYMENT_SLIP: { width: 800, height: 600 },
};

/**
 * Allowed image formats
 */
export const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  PAYMENT_SLIP: 5 * 1024 * 1024, // 5MB
  GENERAL: 3 * 1024 * 1024, // 3MB
};

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  maxSize: number = MAX_FILE_SIZES.GENERAL
): { isValid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return {
      isValid: false,
      error: 'รูปแบบไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์ JPEG, PNG หรือ WebP เท่านั้น'
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const sizeInMB = maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดไฟล์ไม่เกิน ${sizeInMB}MB`
    };
  }

  return { isValid: true };
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      reject(new Error('ไม่สามารถอ่านข้อมูลรูปภาพได้'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize image using canvas
 */
export function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and resize image
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('ไม่สามารถปรับขนาดรูปภาพได้'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Optimize image for specific use case
 */
export async function optimizeImageForUseCase(
  file: File,
  useCase: keyof typeof ImageDimensions
): Promise<{ blob: Blob; dimensions: { width: number; height: number } }> {
  const dimensions = ImageDimensions[useCase];
  const maxSize = useCase === 'PAYMENT_SLIP'
    ? MAX_FILE_SIZES.PAYMENT_SLIP
    : useCase === 'PROFILE'
    ? MAX_FILE_SIZES.AVATAR
    : MAX_FILE_SIZES.GENERAL;
  
  // Validate file
  const validation = validateImageFile(file, maxSize);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // Get original dimensions
  const originalDimensions = await getImageDimensions(file);
  
  // If image is already within limits, return as is
  if (
    originalDimensions.width <= dimensions.width &&
    originalDimensions.height <= dimensions.height &&
    file.size <= maxSize
  ) {
    return {
      blob: file,
      dimensions: originalDimensions
    };
  }
  
  // Resize image
  const blob = await resizeImage(file, dimensions.width, dimensions.height);
  
  return {
    blob,
    dimensions
  };
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new Error('ไม่สามารถแปลงไฟล์เป็น Base64 ได้'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 to blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Generate optimized image URL with Next.js Image optimization
 */
export function getOptimizedImageUrl(
  src: string,
  width: number,
  height: number,
  quality: number = 80
): string {
  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    q: quality.toString(),
    fit: 'cover'
  });
  
  return `${src}?${params.toString()}`;
}

/**
 * Generate responsive image sources
 */
export function generateResponsiveSources(
  src: string,
  baseWidth: number,
  baseHeight: number,
  breakpoints: number[] = [320, 640, 768, 1024, 1280]
): Array<{ srcSet: string; media: string }> {
  return breakpoints.map((breakpoint) => {
    const scaleFactor = breakpoint / baseWidth;
    const width = Math.min(baseWidth * scaleFactor, baseWidth * 2);
    const height = Math.min(baseHeight * scaleFactor, baseHeight * 2);
    
    return {
      srcSet: `${src} ${width}w`,
      media: `(max-width: ${breakpoint}px)`
    };
  });
}

/**
 * Create image placeholder (blurry version)
 */
export function createImagePlaceholder(
  file: File,
  width: number = 20,
  height: number = 20
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      
      // Draw small version
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Apply blur effect
      if (ctx) {
        ctx.filter = 'blur(10px)';
        ctx.drawImage(canvas, 0, 0);
      }
      
      // Convert to base64
      const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('ไม่สามารถสร้างรูปภาพตัวอย่างได้'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Image compression settings for different use cases
 */
export const CompressionSettings = {
  AVATAR: {
    quality: 0.8,
    maxWidth: ImageDimensions.PROFILE.width,
    maxHeight: ImageDimensions.PROFILE.height,
    format: 'image/jpeg'
  },
  PAYMENT_SLIP: {
    quality: 0.9,
    maxWidth: ImageDimensions.PAYMENT_SLIP.width,
    maxHeight: ImageDimensions.PAYMENT_SLIP.height,
    format: 'image/jpeg'
  },
  THUMBNAIL: {
    quality: 0.7,
    maxWidth: ImageDimensions.THUMBNAIL.width,
    maxHeight: ImageDimensions.THUMBNAIL.height,
    format: 'image/webp'
  },
  GENERAL: {
    quality: 0.8,
    maxWidth: ImageDimensions.MEDIUM.width,
    maxHeight: ImageDimensions.MEDIUM.height,
    format: 'image/webp'
  }
};