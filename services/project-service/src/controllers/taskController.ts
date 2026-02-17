import { Request, Response } from 'express';
import { TaskService } from '../services/taskService';
import { asyncHandler } from '@shared/middleware/errorHandler';
import { TaskStatus, Priority } from '../../../node_modules/.prisma/project-client';

export class TaskController {
  static createTask = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id; // Already database user ID from API Gateway
    const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;
    
    if (!title || !projectId) {
      return res.status(400).json({ success: false, error: 'Title and projectId required' });
    }

    const task = await TaskService.createTask({
      title,
      description,
      projectId,
      assignedTo,
      createdBy: userId,
      status: status as TaskStatus,
      priority: priority as Priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    res.status(201).json({ success: true, data: task });
  });

  static getTaskById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const task = await TaskService.getTaskById(id);
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    res.json({ success: true, data: task });
  });

  static updateTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const task = await TaskService.updateTask(id, updateData);
    res.json({ success: true, data: task });
  });

  static deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await TaskService.deleteTask(id);
    res.json({ success: true, message: 'Task deleted' });
  });

  static addComment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id; // Already database user ID from API Gateway
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const comment = await TaskService.addComment(id, userId, content);
    res.status(201).json({ success: true, data: comment });
  });

  static getComments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const comments = await TaskService.getComments(id);
    res.json({ success: true, data: comments });
  });
}
