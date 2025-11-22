// Database optimization utilities for better performance

import connectDB from '@/lib/mongodb';
import { getCache, setCache, deleteCache, CacheKeys, CacheTTL } from '@/lib/caching';

/**
 * Database query optimization options
 */
export interface QueryOptions {
  lean?: boolean; // Return plain JavaScript objects instead of Mongoose documents
  select?: string; // Select specific fields
  sort?: any; // Sort options
  limit?: number; // Limit number of results
  skip?: number; // Skip number of results
  populate?: string | any; // Populate referenced documents
}

/**
 * Optimized find query with caching
 */
export async function optimizedFind(
  model: any,
  filter: any = {},
  options: QueryOptions = {},
  cacheKey?: string,
  cacheTTL: number = CacheTTL.MEDIUM
) {
  // Try to get from cache first
  if (cacheKey) {
    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }
  }

  await connectDB();

  // Build query
  let query = model.find(filter);

  // Apply options
  if (options.lean) {
    query = query.lean();
  }

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.skip) {
    query = query.skip(options.skip);
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  // Execute query
  const result = await query.exec();

  // Cache result
  if (cacheKey) {
    setCache(cacheKey, result, cacheTTL);
  }

  return result;
}

/**
 * Optimized findOne query with caching
 */
export async function optimizedFindOne(
  model: any,
  filter: any = {},
  options: QueryOptions = {},
  cacheKey?: string,
  cacheTTL: number = CacheTTL.MEDIUM
) {
  // Try to get from cache first
  if (cacheKey) {
    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }
  }

  await connectDB();

  // Build query
  let query = model.findOne(filter);

  // Apply options
  if (options.lean) {
    query = query.lean();
  }

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  // Execute query
  const result = await query.exec();

  // Cache result
  if (cacheKey) {
    setCache(cacheKey, result, cacheTTL);
  }

  return result;
}

/**
 * Optimized findById query with caching
 */
export async function optimizedFindById(
  model: any,
  id: string,
  options: QueryOptions = {},
  cacheKey?: string,
  cacheTTL: number = CacheTTL.MEDIUM
) {
  // Try to get from cache first
  if (cacheKey) {
    const cached = getCache(cacheKey);
    if (cached) {
      return cached;
    }
  }

  await connectDB();

  // Build query
  let query = model.findById(id);

  // Apply options
  if (options.lean) {
    query = query.lean();
  }

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  // Execute query
  const result = await query.exec();

  // Cache result
  if (cacheKey) {
    setCache(cacheKey, result, cacheTTL);
  }

  return result;
}

/**
 * Optimized count query with caching
 */
export async function optimizedCount(
  model: any,
  filter: any = {},
  cacheKey?: string,
  cacheTTL: number = CacheTTL.MEDIUM
) {
  // Try to get from cache first
  if (cacheKey) {
    const cached = getCache(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  await connectDB();

  // Execute query
  const result = await model.countDocuments(filter);

  // Cache result
  if (cacheKey) {
    setCache(cacheKey, result, cacheTTL);
  }

  return result;
}

/**
 * Optimized create operation with cache invalidation
 */
export async function optimizedCreate(
  model: any,
  data: any,
  invalidateCacheKeys: string[] = []
) {
  await connectDB();

  // Create document
  const result = await model.create(data);

  // Invalidate related cache
  invalidateCacheKeys.forEach(key => deleteCache(key));

  return result;
}

/**
 * Optimized update operation with cache invalidation
 */
export async function optimizedUpdate(
  model: any,
  filter: any,
  update: any,
  options: any = {},
  invalidateCacheKeys: string[] = []
) {
  await connectDB();

  // Update document
  const result = await model.updateMany(filter, update, options);

  // Invalidate related cache
  invalidateCacheKeys.forEach(key => deleteCache(key));

  return result;
}

/**
 * Optimized updateOne operation with cache invalidation
 */
export async function optimizedUpdateOne(
  model: any,
  filter: any,
  update: any,
  options: any = {},
  invalidateCacheKeys: string[] = []
) {
  await connectDB();

  // Update document
  const result = await model.updateOne(filter, update, options);

  // Invalidate related cache
  invalidateCacheKeys.forEach(key => deleteCache(key));

  return result;
}

/**
 * Optimized findByIdAndUpdate operation with cache invalidation
 */
export async function optimizedFindByIdAndUpdate(
  model: any,
  id: string,
  update: any,
  options: any = {},
  invalidateCacheKeys: string[] = []
) {
  await connectDB();

  // Update document
  const result = await model.findByIdAndUpdate(id, update, options);

  // Invalidate related cache
  invalidateCacheKeys.forEach(key => deleteCache(key));

  return result;
}

/**
 * Optimized delete operation with cache invalidation
 */
export async function optimizedDelete(
  model: any,
  filter: any,
  invalidateCacheKeys: string[] = []
) {
  await connectDB();

  // Delete documents
  const result = await model.deleteMany(filter);

  // Invalidate related cache
  invalidateCacheKeys.forEach(key => deleteCache(key));

  return result;
}

/**
 * Optimized deleteOne operation with cache invalidation
 */
export async function optimizedDeleteOne(
  model: any,
  filter: any,
  invalidateCacheKeys: string[] = []
) {
  await connectDB();

  // Delete document
  const result = await model.deleteOne(filter);

  // Invalidate related cache
  invalidateCacheKeys.forEach(key => deleteCache(key));

  return result;
}

/**
 * Optimized findByIdAndDelete operation with cache invalidation
 */
export async function optimizedFindByIdAndDelete(
  model: any,
  id: string,
  invalidateCacheKeys: string[] = []
) {
  await connectDB();

  // Delete document
  const result = await model.findByIdAndDelete(id);

  // Invalidate related cache
  invalidateCacheKeys.forEach(key => deleteCache(key));

  return result;
}

/**
 * Pagination helper
 */
export function getPaginationOptions(
  page: number = 1,
  limit: number = 10
): { skip: number; limit: number; page: number } {
  const skip = (page - 1) * limit;
  return { skip, limit, page };
}

/**
 * Paginated find query
 */
export async function paginatedFind(
  model: any,
  filter: any = {},
  options: QueryOptions = {},
  page: number = 1,
  limit: number = 10,
  cacheKeyPrefix?: string
) {
  const { skip } = getPaginationOptions(page, limit);

  // Get total count
  const countCacheKey = cacheKeyPrefix 
    ? `${cacheKeyPrefix}:count:${JSON.stringify(filter)}`
    : undefined;
  
  const total = await optimizedCount(model, filter, countCacheKey);

  // Get data
  const dataCacheKey = cacheKeyPrefix
    ? `${cacheKeyPrefix}:data:${JSON.stringify(filter)}:${page}:${limit}`
    : undefined;

  const data = await optimizedFind(
    model,
    filter,
    { ...options, skip, limit },
    dataCacheKey
  );

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  };
}

/**
 * Database index suggestions for common queries
 */
export const DatabaseIndexes = {
  // User indexes
  USER_EMAIL: { email: 1 },
  USER_ROLE: { role: 1 },
  USER_PHONE: { phone: 1 },
  
  // Room indexes
  ROOM_NUMBER: { roomNumber: 1 },
  ROOM_STATUS: { status: 1 },
  ROOM_TYPE: { type: 1 },
  
  // Bill indexes
  BILL_ROOM: { roomId: 1 },
  BILL_TENANT: { tenantId: 1 },
  BILL_DUE_DATE: { dueDate: 1 },
  BILL_STATUS: { status: 1 },
  BILL_TYPE: { type: 1 },
  
  // Payment indexes
  PAYMENT_BILL: { billId: 1 },
  PAYMENT_TENANT: { tenantId: 1 },
  PAYMENT_DATE: { paymentDate: 1 },
  PAYMENT_STATUS: { status: 1 },
  
  // Notification indexes
  NOTIFICATION_USER: { userId: 1 },
  NOTIFICATION_READ: { read: 1 },
  NOTIFICATION_CREATED: { createdAt: 1 },
};

/**
 * Create database indexes for better performance
 */
export async function createDatabaseIndexes() {
  await connectDB();
  
  // Note: This would typically be run once during setup
  // or as part of a migration script
  
  console.log('Database indexes should be created during initial setup');
  
  // Example implementation:
  // await User.createIndexes([
  //   { key: DatabaseIndexes.USER_EMAIL, unique: true },
  //   { key: DatabaseIndexes.USER_ROLE },
  //   { key: DatabaseIndexes.USER_PHONE, sparse: true }
  // ]);
  
  // await Room.createIndexes([
  //   { key: DatabaseIndexes.ROOM_NUMBER, unique: true },
  //   { key: DatabaseIndexes.ROOM_STATUS },
  //   { key: DatabaseIndexes.ROOM_TYPE }
  // ]);
  
  // ... and so on for other models
}