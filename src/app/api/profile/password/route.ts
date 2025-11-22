import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { isValidPassword } from '@/lib/validation';
import { deleteCache, CacheKeys } from '@/lib/caching';
import { asyncHandler, AuthenticationError, ValidationError, createSuccessResponse, ErrorMessages, SuccessMessages } from '@/lib/errorHandling';

// PUT - เปลี่ยนรหัสผ่าน
export const PUT = asyncHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new AuthenticationError(ErrorMessages.UNAUTHORIZED);
  }

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  // Validation
  if (!currentPassword || !newPassword) {
    throw new ValidationError(ErrorMessages.REQUIRED_FIELD);
  }

  // Validate password strength
  const passwordValidation = isValidPassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.errors.join(', '), passwordValidation.errors);
  }

  await connectDB();

  // ดึงข้อมูล user พร้อม password
  const user = await User.findById(session.user?.id);
  
  if (!user) {
    throw new AuthenticationError(ErrorMessages.USER_NOT_FOUND);
  }

  // ตรวจสอบรหัสผ่านเดิม
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isCurrentPasswordValid) {
    throw new ValidationError(ErrorMessages.INVALID_CREDENTIALS);
  }

  // เข้ารหัสผ่านใหม่
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // อัปเดตรหัสผ่าน
  await User.findByIdAndUpdate(
    session.user?.id,
    { password: hashedNewPassword }
  );

  // Clear user profile cache when password changes
  const cacheKey = CacheKeys.USER_PROFILE(session.user?.id || '');
  deleteCache(cacheKey);

  return createSuccessResponse(null, SuccessMessages.PASSWORD_CHANGED);
});