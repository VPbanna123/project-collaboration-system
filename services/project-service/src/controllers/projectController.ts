import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { asyncHandler } from '@shared/middleware/errorHandler';

export class ProjectController {
  static getProjects = asyncHandler(async (req: Request, res: Response) => {
    // Handle case where teamId might be an array (duplicate query params)
    const teamIdRaw = req.query.teamId;
    const teamId = Array.isArray(teamIdRaw) ? teamIdRaw[0] as string : teamIdRaw as string | undefined;
    console.log('[ProjectController] getProjects - teamId:', teamId);
    const projects = await ProjectService.getProjects(teamId);
    res.json({ success: true, data: projects });
  });

  static createProject = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, teamId } = req.body;
    if (!name || !teamId) {
      return res.status(400).json({ success: false, error: 'Name and teamId required' });
    }
    const project = await ProjectService.createProject({ name, description, teamId });
    res.status(201).json({ success: true, data: project });
  });

  static getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: project });
  });

  static updateProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const project = await ProjectService.updateProject(id, { name, description });
    res.json({ success: true, data: project });
  });

  static deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ProjectService.deleteProject(id);
    res.json({ success: true, message: 'Project deleted' });
  });

  static getProjectTasks = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tasks = await ProjectService.getProjectTasks(id);
    res.json({ success: true, data: tasks });
  });
}
