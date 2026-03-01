// ============================================
// gRPC SERVICE IMPLEMENTATION - Notification Service
// ============================================
// This implements the gRPC NotificationService interface
// Uses existing NotificationService business logic from REST API

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import { NotificationService } from '../../services/notificationService';
import { handleGrpcError } from '@shared/grpc/errors';

// gRPC service implementation
export const notificationServiceImplementation = {
  // SendNotification - Create and send a notification
  SendNotification: async (call: any, callback: any) => {
    try {
      const { user_id, type, title, message, link } = call.request;

      if (!user_id || !type || !title || !message) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User ID, type, title, and message are required',
        });
      }

      const notification = await NotificationService.createNotification({
        userId: user_id,
        type,
        title,
        message,
        link,
      });

      callback(null, {
        success: true,
        notification: {
          id: notification.id,
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link || '',
          is_read: notification.read,
          created_at: notification.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[gRPC NotificationService] SendNotification error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // GetUserNotifications - Get all notifications for a user
  GetUserNotifications: async (call: any, callback: any) => {
    try {
      const { user_id, limit } = call.request;

      if (!user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User ID is required',
        });
      }

      const notifications = await NotificationService.getNotifications(
        user_id,
        limit || 20
      );
      const unreadCount = await NotificationService.getUnreadCount(user_id);

      callback(null, {
        success: true,
        notifications: notifications.map((notif) => ({
          id: notif.id,
          user_id: notif.userId,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: notif.link || '',
          is_read: notif.read,
          created_at: notif.createdAt.toISOString(),
        })),
        unread_count: unreadCount,
      });
    } catch (error) {
      console.error('[gRPC NotificationService] GetUserNotifications error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // MarkAsRead - Mark a notification as read
  MarkAsRead: async (call: any, callback: any) => {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Notification ID is required',
        });
      }

      await NotificationService.markAsRead(id);

      callback(null, {
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      console.error('[gRPC NotificationService] MarkAsRead error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },

  // MarkAllAsRead - Mark all notifications as read for a user
  MarkAllAsRead: async (call: any, callback: any) => {
    try {
      const { user_id } = call.request;

      if (!user_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'User ID is required',
        });
      }

      await NotificationService.markAllAsRead(user_id);

      callback(null, {
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('[gRPC NotificationService] MarkAllAsRead error:', error);
      const grpcError = handleGrpcError(error);
      callback(grpcError);
    }
  },
};
