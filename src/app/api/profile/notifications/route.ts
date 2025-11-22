import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCache, setCache, deleteCache, CacheKeys, CacheTTL } from '@/lib/caching';
import { asyncHandler, AuthenticationError, NotFoundError, createSuccessResponse, SuccessMessages } from '@/lib/errorHandling';

// GET - ดึงข้อมูล notification preferences
export const GET = asyncHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new AuthenticationError('Unauthorized');
  }

  await connectDB();

  // Try to get from cache first
  const cacheKey = CacheKeys.USER_NOTIFICATIONS(session.user?.id || '');
  let user = getCache(cacheKey);
  
  if (!user) {
    user = await User.findById(session.user?.id).select('notificationPreferences');
    
    if (!user) {
      throw new NotFoundError('User');
    }
    
    // Cache the user notification preferences
    setCache(cacheKey, user, CacheTTL.MEDIUM);
  }

  // Default preferences if not set
  const defaultPreferences = {
    emailNotifications: true,
    reminder5Days: true,
    reminder1Day: true,
    overdueNotifications: true
  };

  return createSuccessResponse(user.notificationPreferences || defaultPreferences);
});

// PUT - อัปเดต notification preferences
export const PUT = asyncHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new AuthenticationError('Unauthorized');
  }

  const body = await req.json();
  const {
    emailNotifications,
    reminder5Days,
    reminder1Day,
    overdueNotifications
  } = body;

  // Validation
  const preferences = {
    emailNotifications: Boolean(emailNotifications),
    reminder5Days: Boolean(reminder5Days),
    reminder1Day: Boolean(reminder1Day),
    overdueNotifications: Boolean(overdueNotifications)
  };

  await connectDB();

  const user = await User.findByIdAndUpdate(
    session.user?.id,
    { notificationPreferences: preferences },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new NotFoundError('User');
  }

  // Update cache
  const cacheKey = CacheKeys.USER_NOTIFICATIONS(session.user?.id || '');
  setCache(cacheKey, { notificationPreferences: preferences }, CacheTTL.MEDIUM);

  return createSuccessResponse(preferences, SuccessMessages.NOTIFICATION_PREFERENCES_UPDATED);
});