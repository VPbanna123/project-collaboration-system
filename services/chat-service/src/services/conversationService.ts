import { prisma } from '../lib/prisma';
import { AppError } from '@shared/middleware/errorHandler';

export class ConversationService {
  /**
   * Get or create a conversation between two users
   */
  static async getOrCreateConversation(userId1: string, userId2: string) {
    // Sort user IDs to ensure consistent ordering
    const [participant1, participant2] = [userId1, userId2].sort();

    // Try to find existing conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        participant1_participant2: {
          participant1,
          participant2,
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Create if doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1,
          participant2,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    return conversation;
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1: userId },
          { participant2: userId },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.directMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            read: false,
          },
        });

        // Get the other participant's ID
        const otherUserId = conv.participant1 === userId ? conv.participant2 : conv.participant1;

        return {
          ...conv,
          unreadCount,
          otherUserId,
          lastMessage: conv.messages[0] || null,
        };
      })
    );

    return conversationsWithUnread;
  }

  /**
   * Get conversation by ID
   */
  static async getConversationById(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Verify user is a participant
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new AppError('Access denied', 403);
    }

    return conversation;
  }

  /**
   * Get messages in a conversation with pagination
   */
  static async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    // Verify access
    await this.getConversationById(conversationId, userId);

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;

    return {
      messages: items.reverse(), // Return in chronological order
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    };
  }

  /**
   * Send a direct message
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachment?: { fileUrl?: string; fileName?: string; fileType?: string; fileSize?: number }
  ) {
    // Verify conversation exists and user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.participant1 !== senderId && conversation.participant2 !== senderId) {
      throw new AppError('Access denied', 403);
    }

    // Create message and update conversation timestamp
    const [message] = await prisma.$transaction([
      prisma.directMessage.create({
        data: {
          content,
          senderId,
          conversationId,
          fileUrl: attachment?.fileUrl,
          fileName: attachment?.fileName,
          fileType: attachment?.fileType,
          fileSize: attachment?.fileSize,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return message;
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(conversationId: string, userId: string) {
    // Mark all messages from the other user as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string) {
    // Get all conversations for this user
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1: userId },
          { participant2: userId },
        ],
      },
      select: { id: true },
    });

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages in all conversations
    const count = await prisma.directMessage.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        read: false,
      },
    });

    return count;
  }

  /**
   * Delete a conversation (soft delete could be implemented)
   */
  static async deleteConversation(conversationId: string, userId: string) {
    // Verify access
    await this.getConversationById(conversationId, userId);

    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
}
