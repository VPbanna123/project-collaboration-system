import { prisma } from '../lib/prisma';
import { CacheService } from '@shared/utils/cache';

export class ProjectService {
  static async getProjects(teamId?: string) {
    console.log('[ProjectService] getProjects - teamId type:', typeof teamId, 'value:', teamId);
    
    // Handle case where teamId might be an array (query param duplication)
    const singleTeamId = Array.isArray(teamId) ? teamId[0] : teamId;
    const where = singleTeamId ? { teamId: singleTeamId } : {};
    
    console.log('[ProjectService] getProjects - where clause:', JSON.stringify(where));
    
    return await prisma.project.findMany({
      where,
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
