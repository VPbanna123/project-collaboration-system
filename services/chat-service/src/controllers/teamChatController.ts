import { Request, Response } from 'express';
// import { TeamChatService } from '../services/teamChatService';
import { TeamChatService } from '../services/teamChatService';
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

export class TeamChatController {
  /**
   * GET /api/teams/:teamId/chat/messages
   * Get team chat messages
   */
  static getTeamMessages = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const { cursor, limit } = req.query;

    const result = await TeamChatService.getMessages(
      teamId,
      cursor as string,
      limit ? parseInt(limit as string) : undefined
    );
    
    res.json({
      success: true,
      data: result,
    });
  });

  /**
   * POST /api/teams/:teamId/chat/messages
   * Send a message in team chat
   */
  static sendTeamMessage = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const userId = await getUserIdFromClerkId(clerkId);
    const { teamId } = req.params;
    const { content, fileUrl, fileName, fileType, fileSize, documentId } = req.body;

    if (!content && !fileUrl && !documentId) {
      return res.status(400).json({
        success: false,
        error: 'Message content, file, or document is required',
      });
    }

    const message = await TeamChatService.sendMessage(
      teamId,
      userId,
      content || '',
      { fileUrl, fileName, fileType, fileSize, documentId }
    );
    
    res.status(201).json({
      success: true,
      data: message,
    });
  });

  /**
   * GET /api/teams/:teamId/chat/documents
   * Get shared documents in team chat
   */
  static getSharedDocuments = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;

    const documents = await TeamChatService.getSharedDocuments(teamId);
    
    res.json({
      success: true,
      data: documents,
    });
  });
}
