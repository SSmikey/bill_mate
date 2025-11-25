import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcryptjs from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { asyncHandler, createSuccessResponse, AuthenticationError, ValidationError } from '@/lib/errorHandling';
import logger from '@/lib/logger';

// PUT change password
export const PUT = asyncHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  // Validation
  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    throw new ValidationError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  await connectDB();

  const user = await User.findById(session.user?.id);
  
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
  
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const salt = await bcryptjs.genSalt(10);
  const hashedNewPassword = await bcryptjs.hash(newPassword, salt);

  // Update password
  await User.findByIdAndUpdate(
    session.user?.id,
    { password: hashedNewPassword },
    { new: true }
  );

  logger.apiRequest('PUT', '/api/profile/password', session.user?.id, 200);
  logger.info('Password changed successfully', 'Profile', { userId: session.user?.id });
  
  return createSuccessResponse(null, 'Password changed successfully');
});