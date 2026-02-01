# Notification Service

Express.js microservice for managing user notifications.

## Features

- ✅ Create notifications
- ✅ Mark as read
- ✅ Get unread count
- ✅ Notification types

## API Endpoints

**`GET /api/notifications?limit=20`** - Get user notifications

**`GET /api/notifications/unread`** - Get unread count

**`PUT /api/notifications/:id/read`** - Mark as read

**`PUT /api/notifications/read-all`** - Mark all as read

**`POST /api/notifications/send`** - Send notification
```json
{
  "userId": "user_id",
  "type": "TASK_ASSIGNED",
  "title": "New Task",
  "message": "You have been assigned a task",
  "link": "/tasks/123"
}
```

## Run

```bash
cd services/notification-service
npm install
npm run prisma:migrate
npm run dev
```

Port: 3005
