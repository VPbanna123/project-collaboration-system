import { prisma } from '../lib/prisma';
import { CacheService } from '@shared/utils/cache';

export class ProjectService {
  static async getProjects(teamId: string) {
    return await prisma.project.findMany({
      where: { teamId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createProject(data: { name: string; description?: string; teamId: string }) {
    return await prisma.project.create({
      data,
    });
  }

  static async getProjectById(id: string) {
    return await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async updateProject(id: string, data: { name?: string; description?: string }) {
    return await prisma.project.update({
      where: { id },
      data,
    });
  }

  static async deleteProject(id: string) {
    await prisma.project.delete({
      where: { id },
    });
  }

  static async getProjectTasks(projectId: string) {
    return await prisma.task.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
