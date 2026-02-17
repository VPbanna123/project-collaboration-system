# Project Collaboration Platform

A microservices-based team collaboration platform built with Next.js, TypeScript, and modern web technologies.

## 🚀 What We've Built

### Architecture
- **Microservices Architecture**: Implemented a full microservices architecture with separate services for different domains
- **API Gateway**: Centralized authentication and routing layer using Clerk for token verification
- **Service Communication**: Internal JWT-based communication between services with API key protection
- **Database**: PostgreSQL with Prisma ORM for each microservice

### Services Implemented

1. **API Gateway** (Port 4000)
   - Clerk authentication verification
   - Internal JWT token generation
   - Request routing to appropriate microservices
   - Centralized security layer

2. **User Service** (Port 3001)
   - User management and profiles
   - Clerk integration for identity sync
   - User lookup and authentication

3. **Team Service** (Port 3002)
   - Team creation and management
   - Member management
   - Team invitations

4. **Project Service** (Port 3003)
   - Project CRUD operations
   - Document management
   - Task management
   - Document sharing and editing

5. **Chat Service** (Port 3004)
   - Direct conversations
   - Team chat
   - Real-time messaging
   - Message history

6. **Notification Service** (Port 3005)
   - User notifications
   - Read/unread status tracking
   - Notification aggregation

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Clerk** for authentication UI
- **React Components** for Teams, Projects, Chat, and Notifications

### DevOps & Infrastructure
- **Docker**: Containerized microservices with Docker Compose
- **Environment Configuration**: Separate .env files for each service
- **Network Isolation**: Custom Docker networks for service communication
- **Service Scripts**: Automated setup and startup scripts

### Recent Improvements
- ✅ Fixed TypeScript type safety issues (removed `any` types)
- ✅ Added proper type definitions for Clerk JWT payload
- ✅ Configured comprehensive .gitignore for security
- ✅ Successfully pushed to GitHub repository

## 🎯 What We Want to Do

### Upcoming Features
- [ ] Real-time updates with WebSockets/Socket.io
- [ ] File upload and storage system
- [ ] Advanced permission system (RBAC)
- [ ] Document version control
- [ ] Activity tracking and audit logs
- [ ] Email notifications
- [ ] Team analytics dashboard
- [ ] Search functionality across all services
- [ ] API documentation with Swagger/OpenAPI

### Technical Improvements
- [ ] Add comprehensive unit and integration tests
- [ ] Implement rate limiting
- [ ] Add Redis caching layer
- [ ] Set up CI/CD pipeline
- [ ] Add logging and monitoring (ELK stack or similar)
- [ ] Implement service health checks
- [ ] Add load balancing
- [ ] Database replication and backup strategy
- [ ] API response pagination
- [ ] Error tracking (Sentry or similar)

### UI/UX Enhancements
- [ ] Responsive mobile design
- [ ] Dark/light theme support (already partially implemented)
- [ ] User preferences and settings page
- [ ] Rich text editor for documents
- [ ] Drag-and-drop file uploads
- [ ] Advanced filtering and sorting
- [ ] Keyboard shortcuts

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14
- TypeScript
- Tailwind CSS
- Clerk Authentication
- Axios for API calls

**Backend:**
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

**DevOps:**
- Docker & Docker Compose
- Git & GitHub

**Authentication & Security:**
- Clerk (external auth)
- JWT (internal service communication)
- API Key protection
- DevSecOps scanning

## 🚦 Getting Started

### Prerequisites
- Node.js v18+
- Docker and Docker Compose
- PostgreSQL
- Clerk account (for authentication)

### Environment Setup
1. Copy `.env.example` to `.env` in root and all service directories
2. Configure Clerk keys in root `.env`
3. Set database URLs for each service
4. Configure internal API keys and JWT secrets

### Running the Project

**Option 1: Using Docker Compose**
```bash
docker-compose up
```

**Option 2: Running Services Individually**
```bash
# Start all services
./start-all-services.sh
```

**Option 3: Manual Service Startup**
```bash
# Terminal 1 - API Gateway
cd services/api-gateway && npm install && npm run dev

# Terminal 2 - User Service
cd services/user-service && npm install && npm run dev

# Terminal 3 - Team Service
cd services/team-service && npm install && npm run dev

# Terminal 4 - Project Service
cd services/project-service && npm install && npm run dev

# Terminal 5 - Chat Service
cd services/chat-service && npm install && npm run dev

# Terminal 6 - Notification Service
cd services/notification-service && npm install && npm run dev

# Terminal 7 - Frontend
npm install && npm run dev
```

### Database Migrations
```bash
# Run migrations for each service
cd services/user-service && npx prisma migrate dev
cd services/team-service && npx prisma migrate dev
cd services/project-service && npx prisma migrate dev
cd services/chat-service && npx prisma migrate dev
cd services/notification-service && npx prisma migrate dev
```

## 📝 API Documentation

All API requests go through the API Gateway at `http://localhost:4000`

- **Users**: `/api/users/*`
- **Teams**: `/api/teams/*`
- **Projects**: `/api/projects/*`
- **Chat**: `/api/chat/*`
- **Notifications**: `/api/notifications/*`

Authentication: Bearer token (Clerk JWT) in Authorization header

## 🤝 Contributing

This is a collaborative project. When contributing:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit with descriptive messages
5. Push and create a pull request

## 📄 License

This project is part of an academic/capstone project.

---

**Last Updated**: February 17, 2026
