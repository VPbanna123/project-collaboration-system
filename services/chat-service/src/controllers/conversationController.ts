import { Request, Response } from 'express';
import { ConversationService } from '../services/conversationService';
import { asyncHandler } from '@shared/middleware/errorHandler';
import { io } from '../index';

export class ConversationController {
  /**
   * GET /api/conversations
   * Get all conversations for the current user
   */
  static getUserConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id; // Already database user ID from API Gateway
    
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
    const userId = req.user!.id; // Already database user ID from API Gateway
    
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
    const userId = req.user!.id; // Already database user ID from API Gateway
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'Other user ID is required',
      });
    }

    // otherUserId is also already a database ID (not Clerk ID)
    if (userId === otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot start conversation with yourself',
      });
    }

    const conversation = await ConversationService.getOrCreateConversation(userId, otherUserId);
    
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
    const userId = req.user!.id; // Already database user ID from API Gateway
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
    const userId = req.user!.id; // Already database user ID from API Gateway
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
    
    // Emit socket event for real-time updates
    // Send to conversation room (for active participants)
    io.to(`conversation:${conversationId}`).emit('dm:new', { message });
    
    // TODO: Fix personal room notification - receiverId is database ID but socket rooms use Clerk IDs
    // Need to either:
    // 1. Store Clerk IDs in conversation table, OR
    // 2. Look up Clerk ID from database ID before emitting
    // const conversation = await ConversationService.getConversationById(conversationId, userId);
    // const receiverId = conversation.participant1 === userId ? conversation.participant2 : conversation.participant1;
    // io.to(`user:${receiverId}`).emit('dm:notification', { message, conversation });
    
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
    const userId = req.user!.id; // Already database user ID from API Gateway
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
    const userId = req.user!.id;
    const { conversationId } = req.params;

    await ConversationService.deleteConversation(conversationId, userId);
    
    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  });
}
