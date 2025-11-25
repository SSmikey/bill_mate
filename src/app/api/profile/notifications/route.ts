import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { asyncHandler, createSuccessResponse, ValidationError } from '@/lib/errorHandling';
import logger from '@/lib/logger';

// GET notification preferences
export const GET = asyncHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  await connectDB();
  
  const user = await User.findById(session.user?.id);
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  // Return default preferences if not set
  const preferences = user.notificationPreferences || {
    email: {
      enabled: true,
      paymentReminder: true,
      paymentVerified: true,
      paymentRejected: true,
      overdue: true,
      billGenerated: true
    },
    inApp: {
      enabled: true,
      paymentReminder: true,
      paymentVerified: true,
      paymentRejected: true,
      overdue: true,
      billGenerated: true
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  };

  logger.apiRequest('GET', '/api/profile/notifications', session.user?.id, 200);
  return createSuccessResponse(preferences, 'Notification preferences loaded');
});

// PUT update notification preferences
export const PUT = asyncHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { email, inApp, quietHours } = body;

  // Validation
  if (!email || !inApp || !quietHours) {
    throw new ValidationError('Email, inApp, and quietHours preferences are required');
  }

  // Validate quiet hours
  if (quietHours.enabled) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(quietHours.startTime) || !timeRegex.test(quietHours.endTime)) {
      throw new ValidationError('Invalid time format. Use HH:MM format');
    }
  }

  await connectDB();

  const user = await User.findById(session.user?.id);
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  // Update notification preferences
  const updatedUser = await User.findByIdAndUpdate(
    session.user?.id,
    {
      notificationPreferences: {
        email: {
          enabled: email.enabled,
          paymentReminder: email.paymentReminder,
          paymentVerified: email.paymentVerified,
          paymentRejected: email.paymentRejected,
          overdue: email.overdue,
          billGenerated: email.billGenerated
        },
        inApp: {
          enabled: inApp.enabled,
          paymentReminder: inApp.paymentReminder,
          paymentVerified: inApp.paymentVerified,
          paymentRejected: inApp.paymentRejected,
          overdue: inApp.overdue,
          billGenerated: inApp.billGenerated
        },
        quietHours: {
          enabled: quietHours.enabled,
          startTime: quietHours.startTime,
          endTime: quietHours.endTime
        }
      }
    },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new Error('Failed to update notification preferences');
  }

  logger.apiRequest('PUT', '/api/profile/notifications', session.user?.id, 200);
  logger.info('Notification preferences updated', 'Profile', { 
    userId: session.user?.id,
    preferences: { email, inApp, quietHours }
  });
  
  return createSuccessResponse(
    updatedUser.notificationPreferences,
    'Notification preferences updated successfully'
  );
});