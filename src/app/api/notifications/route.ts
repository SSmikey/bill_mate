import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authOptions } from '@/lib/auth';
import { asyncHandler, AuthenticationError, createSuccessResponse } from '@/lib/errorHandling';

// GET notifications for current user
export const GET = asyncHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError('Unauthorized');
  }

  await connectDB();

  const notifications = await Notification.find({ userId: session.user?.id })
    .populate('billId', 'roomId month year totalAmount')
    .sort({ sentAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    userId: session.user?.id,
    read: false
  });

  return createSuccessResponse({
    notifications,
    unreadCount
  });
});

// POST mark notification as read
export const POST = asyncHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError('Unauthorized');
  }

  const { notificationId } = await req.json();

  if (!notificationId) {
    return NextResponse.json(
      { error: 'notificationId is required' },
      { status: 400 }
    );
  }

  await connectDB();

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId: session.user?.id },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  return createSuccessResponse(notification, 'Notification marked as read');
});
