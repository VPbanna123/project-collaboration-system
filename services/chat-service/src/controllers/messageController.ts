import { Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { asyncHandler } from '@shared/middleware/errorHandler';
import { prisma } from '../lib/prisma';

// Helper to get database user ID from Clerk ID
async function getUserIdFromClerkId(clerkId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(`User not found for Clerk ID: ${clerkId}`);
  }
  
  return user.id;
}

export class MessageController {
  static getMessages = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const limit = parseInt((req.query.limit as string) || '50');
    
    const messages = await ChatService.getMessages(projectId, limit);
    res.json({ success: true, data: messages });
  });

  static sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const userId = await getUserIdFromClerkId(clerkId);
    const { content, projectId } = req.body;

    if (!content || !projectId) {
      return res.status(400).json({
        success: false,
        error: 'Content and projectId are required',
      });
    }

    const message = await ChatService.createMessage(content, projectId, userId);
    res.status(201).json({ success: true, data: message });
  });
}
