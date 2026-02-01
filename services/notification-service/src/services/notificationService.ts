import { prisma } from '../lib/prisma';
import { NotificationType } from '../../../node_modules/.prisma/notification-client';

export class NotificationService {
  static async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    return await prisma.notification.create({
      data,
    });
  }

  static async getNotifications(userId: string, limit: number = 20) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  static async markAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }
}
