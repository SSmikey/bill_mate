// Caching utilities for performance optimization

// Simple in-memory cache for server-side
const memoryCache = new Map<string, { data: any; expiry: number }>();

/**
 * Set data in cache with expiry time
 */
export function setCache(key: string, data: any, ttlSeconds: number = 300): void {
  const expiry = Date.now() + ttlSeconds * 1000;
  memoryCache.set(key, { data, expiry });
}

/**
 * Get data from cache
 */
export function getCache(key: string): any | null {
  const cached = memoryCache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache has expired
  if (Date.now() > cached.expiry) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Delete data from cache
 */
export function deleteCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  memoryCache.clear();
}

/**
 * Cache decorator for functions
 */
export function withCache(ttlSeconds: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Generate cache key based on function name and arguments
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cached = getCache(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      // Execute function and cache result
      const result = await method.apply(this, args);
      setCache(cacheKey, result, ttlSeconds);
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Cache wrapper for async functions
 */
export async function cachedFunction<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = getCache(key);
  if (cached !== null) {
    return cached;
  }
  
  // Execute function and cache result
  const result = await fn();
  setCache(key, result, ttlSeconds);
  
  return result;
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  
  for (const [key, value] of memoryCache.entries()) {
    if (now > value.expiry) {
      memoryCache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}

/**
 * Cache keys for different data types
 */
export const CacheKeys = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_NOTIFICATIONS: (userId: string) => `user:notifications:${userId}`,
  ROOM_LIST: 'rooms:list',
  ROOM_DETAILS: (roomId: string) => `room:${roomId}`,
  BILL_LIST: (userId?: string) => userId ? `bills:user:${userId}` : 'bills:list',
  BILL_DETAILS: (billId: string) => `bill:${billId}`,
  PAYMENT_LIST: (userId?: string) => userId ? `payments:user:${userId}` : 'payments:list',
  PAYMENT_DETAILS: (paymentId: string) => `payment:${paymentId}`,
  DASHBOARD_STATS: (userId: string, role: string) => `dashboard:${userId}:${role}`,
};

/**
 * Default TTL values in seconds
 */
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600,  // 1 hour
};