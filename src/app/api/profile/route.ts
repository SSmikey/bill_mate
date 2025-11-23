import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Room from '@/models/Room';
import { authOptions } from '@/lib/auth';
import { asyncHandler, createSuccessResponse, NotFoundError, ValidationError } from '@/lib/errorHandling';
import logger from '@/lib/logger';

// GET user profile
export const GET = asyncHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  await connectDB();
  
  const user = await User.findById(session.user?.id)
    .select('-password')
    .populate('roomId', 'roomNumber');

  if (!user) {
    throw new NotFoundError('User');
  }

  const profileData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    roomId: user.roomId,
    roomNumber: (user.roomId as any)?.roomNumber || null,
  };

  logger.apiRequest('GET', '/api/profile', session.user?.id, 200);
  return createSuccessResponse(profileData, 'Profile loaded successfully');
});

// PUT update user profile
export const PUT = asyncHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { name, phone } = body;

  // Validation
  if (!name || name.trim().length < 2) {
    throw new ValidationError('Name must be at least 2 characters long');
  }

  if (phone && !/^[0-9]{10}$/.test(phone)) {
    throw new ValidationError('Invalid phone number format');
  }

  await connectDB();

  const user = await User.findById(session.user?.id);
  
  if (!user) {
    throw new NotFoundError('User');
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    session.user?.id,
    {
      name: name.trim(),
      phone: phone || user.phone,
    },
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    throw new Error('Failed to update user');
  }

  const profileData = {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    role: updatedUser.role,
    roomId: updatedUser.roomId,
  };

  logger.apiRequest('PUT', '/api/profile', session.user?.id, 200);
  logger.info('Profile updated', 'Profile', { userId: session.user?.id, changes: { name, phone } });
  
  return createSuccessResponse(profileData, 'Profile updated successfully');
});