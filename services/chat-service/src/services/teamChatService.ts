import { prisma } from '../lib/prisma';
import { AppError } from '@shared/middleware/errorHandler';

interface MessageAttachment {
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  documentId?: string;
}

export class TeamChatService {
  /**
   * Get or create team chat
   */
  static async getOrCreateTeamChat(teamId: string) {
    let teamChat = await prisma.teamChat.findUnique({
      where: { teamId },
    });

    if (!teamChat) {
      teamChat = await prisma.teamChat.create({
        data: { teamId },
      });
    }

    return teamChat;
  }

  /**
   * Get team chat messages with pagination
   */
  static async getMessages(teamId: string, cursor?: string, limit = 50) {
    const teamChat = await this.getOrCreateTeamChat(teamId);

    const messages = await prisma.teamMessage.findMany({
      where: { chatId: teamChat.id },
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
   * Send a message in team chat
   */
  static async sendMessage(
    teamId: string,
    senderId: string,
    content: string,
    attachment?: MessageAttachment
  ) {
    // Get or create team chat
    const teamChat = await this.getOrCreateTeamChat(teamId);

    // Create message
    const message = await prisma.teamMessage.create({
      data: {
        chatId: teamChat.id,
        senderId,
        content,
        fileUrl: attachment?.fileUrl,
        fileName: attachment?.fileName,
        fileType: attachment?.fileType,
        fileSize: attachment?.fileSize,
        documentId: attachment?.documentId,
      },
    });

    // Update team chat timestamp
    await prisma.teamChat.update({
      where: { id: teamChat.id },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * Get shared documents in team chat
   */
  static async getSharedDocuments(teamId: string) {
    const teamChat = await this.getOrCreateTeamChat(teamId);

    const messages = await prisma.teamMessage.findMany({
      where: {
        chatId: teamChat.id,
        documentId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    return messages;
  }
}
