# Project & Task Service

Express.js microservice for project and task management.

## Features

- ✅ Project CRUD
- ✅ Task management with status & priority
- ✅ Task comments
- ✅ Task assignment

## API Endpoints

### Projects

**`GET /api/projects?teamId=xxx`** - Get projects by team

**`POST /api/projects`** - Create project
```json
{
  "name": "Project Name",
  "description": "Description",
  "teamId": "team_id"
}
```

**`GET /api/projects/:id`** - Get project details

**`PUT /api/projects/:id`** - Update project

**`DELETE /api/projects/:id`** - Delete project

**`GET /api/projects/:id/tasks`** - Get project tasks

### Tasks

**`POST /api/tasks`** - Create task
```json
{
  "title": "Task title",
  "projectId": "project_id",
  "assignedTo": "user_id",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2026-01-20"
}
```

**`GET /api/tasks/:id`** - Get task

**`PUT /api/tasks/:id`** - Update task

**`DELETE /api/tasks/:id`** - Delete task

**`POST /api/tasks/:id/comments`** - Add comment

**`GET /api/tasks/:id/comments`** - Get comments

## Run

```bash
cd services/project-service
npm install
npm run prisma:migrate
npm run dev
```

Port: 3003
