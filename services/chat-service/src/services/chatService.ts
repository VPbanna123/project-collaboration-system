import { prisma } from '../lib/prisma';

export class ChatService {
  static async createMessage(content: string, projectId: string, userId: string) {
    return await prisma.message.create({
      data: {
        content,
        projectId,
        userId,
      },
    });
  }

  static async getMessages(projectId: string, limit: number = 50) {
    return await prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
