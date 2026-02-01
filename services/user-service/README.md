# User Service

Express.js microservice for user management with Clerk authentication.

## Features

- ✅ Clerk webhook integration
- ✅ User profile management  
- ✅ User search
- ✅ Redis caching

## API Endpoints

### Authentication
All routes require `Authorization: Bearer <token>` header

### `GET /api/users/sync`
Sync current user from Clerk

### `GET /api/users/profile`
Get current user profile

### `PUT /api/users/profile`
Update profile
```json
{
  "name": "John Doe",
  "imageUrl": "https://..."
}
```

### `GET /api/users/:id`
Get user by ID

### `GET /api/users/search?q=query&limit=10`
Search users

### `POST /api/webhook/clerk`
Clerk webhook endpoint (no auth)

## Setup

```bash
cd services/user-service
npm install
npm run prisma:migrate
npm run dev
```

Runs on port 3001.
