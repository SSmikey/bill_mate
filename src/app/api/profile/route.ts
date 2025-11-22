import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
// import bcrypt from 'bcryptjs'; // Not used in this file
import { validateProfileInput } from '@/lib/validation';
import { getCache, setCache, CacheKeys, CacheTTL } from '@/lib/caching';
import { asyncHandler, AuthenticationError, NotFoundError, ValidationError, createSuccessResponse, ErrorMessages, SuccessMessages } from '@/lib/errorHandling';

// GET - ดึงข้อมูลโปรไฟล์
export const GET = asyncHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new AuthenticationError(ErrorMessages.UNAUTHORIZED);
  }

  await connectDB();

  // Try to get from cache first
  const cacheKey = CacheKeys.USER_PROFILE(session.user?.id || '');
  let user = getCache(cacheKey);
  
  if (!user) {
    user = await User.findById(session.user?.id).select('-password');
    
    if (!user) {
      throw new NotFoundError('User');
    }
    
    // Cache the user data
    setCache(cacheKey, user, CacheTTL.MEDIUM);
  }

  return createSuccessResponse({
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  });
});

// PUT - อัปเดตข้อมูลโปรไฟล์
export const PUT = asyncHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new AuthenticationError(ErrorMessages.UNAUTHORIZED);
  }

  const body = await req.json();
  const { name, phone } = body;

  // Validate input using validation utilities
  const validation = validateProfileInput({ name, phone });
  
  if (!validation.isValid) {
    throw new ValidationError(validation.errors.join(', '), validation.errors);
  }

  await connectDB();

  const updateData: any = {};
  if (validation.sanitizedData.name) updateData.name = validation.sanitizedData.name;
  if (validation.sanitizedData.phone !== undefined) updateData.phone = validation.sanitizedData.phone;

  const user = await User.findByIdAndUpdate(
    session.user?.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new NotFoundError('User');
  }

  // Update cache
  const cacheKey = CacheKeys.USER_PROFILE(session.user?.id || '');
  setCache(cacheKey, user, CacheTTL.MEDIUM);

  return createSuccessResponse({
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  }, SuccessMessages.PROFILE_UPDATED);
});