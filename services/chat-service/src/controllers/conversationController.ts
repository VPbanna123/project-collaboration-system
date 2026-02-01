import { Request, Response } from 'express';
import { ConversationService } from '../services/conversationService';
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

export class ConversationController {
  /**
   * GET /api/conversations
   * Get all conversations for the current user
   */
  static getUserConversations = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const userId = await getUserIdFromClerkId(clerkId);
    
    const conversations = await ConversationService.getUserConversations(userId);
    
    res.json({
      success: true,
      data: conversations,
    });
  });

  /**
   * GET /api/conversations/unread
   * Get unread message count
   */
  static getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const userId = await getUserIdFromClerkId(clerkId);
    
    const count = await ConversationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { count },
    });
  });

  /**
   * POST /api/conversations/start
   * Start or get existing conversation with a user
   */
  static startConversation = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const userId = await getUserIdFromClerkId(clerkId);
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'Other user ID is required',
      });
    }

    // Convert other user's Clerk ID to Database ID
    const otherUserDbId = await getUserIdFromClerkId(otherUserId);

    if (userId === otherUserDbId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot start conversation with yourself',
      });
    }

    const conversation = await ConversationService.getOrCreateConversation(userId, otherUserDbId);
    
    res.json({
      success: true,
      data: conversation,
    });
  });

  /**
   * GET /api/conversations/:conversationId/messages
   * Get messages in a conversation
   */
  static getMessages = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const userId = await getUserIdFromClerkId(clerkId);
    const { conversationId } = req.params;
    const { cursor, limit } = req.query;

    const result = await ConversationService.getMessages(
      conversationId,
      userId,
      cursor as string,
      limit ? parseInt(limit as string) : undefined
    );
    
    res.json({
      success: true,
      data: result,
    });
  });

  /**
   * POST /api/conversations/:conversationId/messages
   * Send a message in a conversation
   */
  static sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const userId = await getUserIdFromClerkId(clerkId);
    const { conversationId } = req.params;
    const { content, fileUrl, fileName, fileType, fileSize } = req.body;

    if (!content?.trim() && !fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'Message content or file is required',
      });
    }

    const message = await ConversationService.sendMessage(
      conversationId,
      userId,
      content?.trim() || '',
      { fileUrl, fileName, fileType, fileSize }
    );
    
    res.status(201).json({
      success: true,
      data: message,
    });
  });

  /**
   * POST /api/conversations/:conversationId/read
   * Mark messages as read
   */
  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const clerkId = req.userId!;
    const userId = await getUserIdFromClerkId(clerkId);
    const { conversationId } = req.params;

    await ConversationService.markAsRead(conversationId, userId);
    
    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  });

  /**
   * DELETE /api/conversations/:conversationId
   * Delete a conversation
   */
  static deleteConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { conversationId } = req.params;

    await ConversationService.deleteConversation(conversationId, userId);
    
    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  });
}
