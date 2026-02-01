# Chat Service

Express.js + Socket.io microservice for real-time chat.

## Features

- ✅ Real-time messaging with Socket.IO
- ✅ Project-based chat rooms
- ✅ Message persistence
- ✅ Typing indicators

## REST API

**`GET /api/messages/:projectId?limit=50`** - Get message history

**`POST /api/messages`** - Send message
```json
{
  "content": "Hello",
  "projectId": "project_id"
}
```

## Socket.IO Events

### Client → Server

- `join:project` - Join project room
- `leave:project` - Leave project room
- `message:send` - Send message
- `typing:start` - Start typing
- `typing:stop` - Stop typing

### Server → Client

- `message:new` - New message received
- `typing:user` - User typing status

## Run

```bash
cd services/chat-service
npm install
npm run prisma:migrate
npm run dev
```

Port: 3004
