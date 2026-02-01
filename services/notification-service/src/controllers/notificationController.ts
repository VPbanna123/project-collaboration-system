import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { asyncHandler } from '@shared/middleware/errorHandler';
import { NotificationType } from '../../../node_modules/.prisma/notification-client';
import { prisma } from '../lib/prisma';

// Helper function to get database user ID from Clerk ID
async function getUserIdFromClerkId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true }
  });
  return user?.id || null;
}

export class NotificationController {
  static getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const limit = parseInt((req.query.limit as string) || '20');
    
    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.json({ success: true, data: [] });
    }
    
    const notifications = await NotificationService.getNotifications(userId, limit);
    res.json({ success: true, data: notifications });
  });

  static getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    
    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.json({ success: true, data: { count: 0 } });
    }
    
    const count = await NotificationService.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  });

  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await NotificationService.markAsRead(id);
    res.json({ success: true, message: 'Notification marked as read' });
  });

  static markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    
    const userId = await getUserIdFromClerkId(clerkId);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    await NotificationService.markAllAsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  });

  static sendNotification = asyncHandler(async (req: Request, res: Response) => {
    const { userId, type, title, message, link } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId, type, title, and message are required',
      });
    }

    const notification = await NotificationService.createNotification({
      userId,
      type: type as NotificationType,
      title,
      message,
      link,
    });

    res.status(201).json({ success: true, data: notification });
  });
}
