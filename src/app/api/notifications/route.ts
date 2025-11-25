import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authOptions } from '@/lib/auth';
import { asyncHandler, AuthenticationError, createSuccessResponse } from '@/lib/errorHandling';

// GET notifications for current user
export const GET = asyncHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError('Unauthorized');
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || session.user?.id;
  const limit = parseInt(searchParams.get('limit') || '50');
  const includeRead = searchParams.get('includeRead') === 'true';

  // Only allow users to access their own notifications or admins to access any
  if (userId !== session.user?.id && session.user?.role !== 'admin') {
    throw new AuthenticationError('Unauthorized');
  }

  // Build query
  const query: any = { userId };
  if (!includeRead) {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .populate('billId', 'roomId month year totalAmount')
    .sort({ createdAt: -1 }) // Changed from sentAt to createdAt to match schema
    .limit(limit);

  // Get stats
  const totalCount = await Notification.countDocuments({ userId });
  const unreadCount = await Notification.countDocuments({
    userId,
    read: false
  });
  const readCount = totalCount - unreadCount;

  return createSuccessResponse({
    notifications,
    stats: {
      total: totalCount,
      unread: unreadCount,
      read: readCount
    }
  });
});

// POST mark notification as read
export const POST = asyncHandler(async (req: Request) => {
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
