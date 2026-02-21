import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { asyncHandler } from '@shared/middleware/errorHandler';
import { ApiResponse } from '@shared/types';

export class UserController {
  /**
   * POST /api/users/sync
   * Sync user from frontend with provided data
   */
  static syncUserFromFrontend = asyncHandler(async (req: Request, res: Response) => {
    const { clerkId, email, name, imageUrl } = req.body;
    
    // Validate required fields
    if (!clerkId || !email) {
      return res.status(400).json({
        success: false,
        error: 'clerkId and email are required',
      });
    }
    
    const user = await UserService.syncUserWithData({
      clerkId,
      email,
      name,
      imageUrl,
    });

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
    };

    res.json(response);
  });

  /**
   * GET /api/users/sync
   * Sync current user from Clerk
   */
  static syncUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const user = await UserService.syncUser(userId);

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
    };

    res.json(response);
  });

  /**
   * GET /api/users/profile
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const user = await UserService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  });

  /**
   * PUT /api/users/profile
   * Update current user profile
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clerkId = req.user!.clerkId;
    const { name, imageUrl } = req.body;

    const user = await UserService.updateUser(clerkId, { name, imageUrl });

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  });

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  });

  /**
   * GET /api/users/clerk/:clerkId
   * Get user by Clerk ID (internal endpoint for API Gateway)
   */
  static getUserByClerkIdRoute = asyncHandler(async (req: Request, res: Response) => {
    const { clerkId } = req.params;
    const user = await UserService.getUserByClerkId(clerkId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  });

  /**
   * GET /api/users/search?q=query&limit=10&email=user@example.com&excludeUserId=userId
   * Search users by name/email or get user by exact email
   */
  static searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const email = req.query.email as string;
    const query = (req.query.q as string) || '';
    const limit = parseInt((req.query.limit as string) || '10');
    const excludeUserId = req.query.excludeUserId as string;

    // If email param is provided, do exact email lookup
    if (email) {
      const user = await UserService.getUserByEmail(email);
      return res.json({
        success: true,
        data: user,
      });
    }

    // Otherwise, do a search
    const users = await UserService.searchUsers(query, limit, excludeUserId);

    res.json({
      success: true,
      data: users,
    });
  });
}
