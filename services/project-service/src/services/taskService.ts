import { prisma } from '../lib/prisma';
import { TaskStatus, Priority } from '../../../node_modules/.prisma/project-client';

export class TaskService {
  static async createTask(data: {
    title: string;
    description?: string;
    projectId: string;
    assignedTo?: string;
    createdBy: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: Date;
  }) {
    return await prisma.task.create({
      data,
      include: {
        project: true,
      },
    });
  }

  static async getTaskById(id: string) {
    return await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        comments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async updateTask(id: string, data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    assignedTo?: string;
    dueDate?: Date;
  }) {
    return await prisma.task.update({
      where: { id },
      data,
    });
  }

  static async deleteTask(id: string) {
    await prisma.task.delete({
      where: { id },
    });
  }

  static async addComment(taskId: string, userId: string, content: string) {
    return await prisma.comment.create({
      data: {
        taskId,
        userId,
        content,
      },
    });
  }

  static async getComments(taskId: string) {
    return await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
