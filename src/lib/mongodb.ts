import mongoose from 'mongoose';
import logger from './logger';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

declare global {
  var mongoose: any;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      logger.info('Connected to MongoDB', 'Database');
      return mongoose;
    }).catch((error) => {
      logger.error('MongoDB connection error', error as Error, 'Database');
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Initialize database connection with retry logic
 */
export async function initializeDatabase(): Promise<void> {
  const maxRetries = 5;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      await connectDB();
      logger.info('Database initialized successfully', 'Database');
      return;
    } catch (error) {
      retryCount++;
      console.error(`❌ Database initialization failed (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s, 16s
        const delayMs = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Retrying database connection in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        console.error('💀 Database initialization failed after maximum retries');
        throw error;
      }
    }
  }
}

/**
 * Gracefully close database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    if (cached.conn) {
      await mongoose.connection.close();
      cached.conn = null;
      cached.promise = null;
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
}

/**
 * Check database connection status
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export default connectDB;
