# TeamManager - Microservices Collaboration Platform

A production-ready team collaboration platform built with **microservices architecture**, featuring real-time chat, project management, document sharing, and team coordination.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                     │
│                    http://localhost:3000                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST + Auth (Clerk JWT)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 4000)                   │
│          • Clerk Token Verification                          │
│          • Internal JWT Generation                           │
│          • Request Routing                                   │
│          • Rate Limiting & CORS                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ Internal JWT (HTTP/REST)
         ┌─────────────┼─────────────┬──────────────┬─────────┐
         ▼             ▼             ▼              ▼         ▼
┌────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐
│   User     │ │   Team     │ │  Project  │ │  Chat    │ │ Notif.   │
│  Service   │ │  Service   │ │  Service  │ │ Service  │ │ Service  │
│  :3001     │ │  :3002     │ │  :3003    │ │ :3004    │ │ :3005    │
│  :50001    │ │  :50002    │ │  :50003   │ │ :50004   │ │ :50005   │
└─────┬──────┘ └─────┬──────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘
      │              │              │             │            │
      └──────────────┴──────────────┴─────────────┴────────────┘
                              │ gRPC (Internal)
                              ▼
                    Service-to-Service Communication
```

### Communication Patterns

1. **External (Public)**:
   - Browser → Next.js (Port 3000)
   - Next.js → API Gateway (Port 4000) with Clerk JWT

2. **Internal (Private)**:
   - API Gateway → Services (Ports 3001-3005) with Internal JWT
   - Service → Service (Ports 50001-50005) with gRPC

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Clerk Authentication
- Socket.io Client
- React Query

**Backend Services:**
- Node.js + Express (HTTP/REST)
- TypeScript
- gRPC (@grpc/grpc-js)
- Prisma ORM
- PostgreSQL (separate DB per service)
- Redis (caching & sessions)

**DevOps:**
- Docker & Docker Compose
- Kubernetes-ready
- Multi-stage builds
- Environment-based configuration

## 📦 Services

### 1. API Gateway (Port 4000)
**Purpose:** Entry point for all client requests
- ✅ Clerk token verification
- ✅ Internal JWT generation
- ✅ Request proxying to microservices
- ✅ CORS handling
- ✅ Rate limiting
- ✅ Health checks

### 2. User Service (Port 3001 | gRPC: 50001)
**Database:** `user_db` (Port 5432)
- User profile management
- Clerk user synchronization
- User search and lookup
- Profile updates

### 3. Team Service (Port 3002 | gRPC: 50002)
**Database:** `team_db` (Port 5433)
- Team CRUD operations
- Member management (ADMIN/MEMBER roles)
- Team invitations via email
- Admin/member verification (gRPC)

### 4. Project Service (Port 3003 | gRPC: 50003)
**Database:** `project_db` (Port 5434)
- Project management
- Document creation & editing
- **Document merging** (admin-only)
- Document download
- Task management
- Edit history tracking

### 5. Chat Service (Port 3004 | gRPC: 50004)
**Database:** `chat_db` (Port 5435)
- Direct messaging
- Team chat rooms
- Real-time messaging (Socket.io)
- Message history
- Typing indicators

### 6. Notification Service (Port 3005 | gRPC: 50005)
**Database:** `notification_db` (Port 5436)
- User notifications
- Read/unread status
- Real-time updates
- Notification aggregation

## 🚀 Quick Start

### Prerequisites
```bash
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Clerk account (https://clerk.com)
```

### 1. Clone & Install
```bash
git clone <repository-url>
cd latest_tech
npm install
```

### 2. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp services/api-gateway/.env.example services/api-gateway/.env
cp services/user-service/.env.example services/user-service/.env
cp services/team-service/.env.example services/team-service/.env
cp services/project-service/.env.example services/project-service/.env
cp services/chat-service/.env.example services/chat-service/.env
cp services/notification-service/.env.example services/notification-service/.env

# Configure Clerk keys in root .env and services/api-gateway/.env
# CLERK_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 3. Start Databases (Docker)
```bash
docker-compose up -d postgres-user postgres-team postgres-project postgres-chat postgres-notification redis
```

### 4. Run Migrations
```bash
cd services/user-service && npx prisma migrate dev
cd ../team-service && npx prisma migrate dev
cd ../project-service && npx prisma migrate dev
cd ../chat-service && npx prisma migrate dev
cd ../notification-service && npx prisma migrate dev
cd ../..
```

### 5. Start Services
```bash
# All at once
npm run dev  # Starts all services + frontend

# Or individually
cd services/api-gateway && npm run dev    # Terminal 1
cd services/user-service && npm run dev    # Terminal 2
cd services/team-service && npm run dev    # Terminal 3
cd services/project-service && npm run dev # Terminal 4
cd services/chat-service && npm run dev    # Terminal 5
cd services/notification-service && npm run dev # Terminal 6
npm run dev  # Frontend (Terminal 7)
```

### 6. Access Application
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Login**: http://localhost:3000/login

## 🐳 Docker Deployment

### Build All Images
```bash
# Frontend
docker build -t teammanager-frontend:latest -f Dockerfile .

# API Gateway
docker build -t teammanager-api-gateway:latest -f services/api-gateway/Dockerfile .

# Microservices
docker build -t teammanager-user-service:latest -f services/user-service/Dockerfile .
docker build -t teammanager-team-service:latest -f services/team-service/Dockerfile .
docker build -t teammanager-project-service:latest -f services/project-service/Dockerfile .
docker build -t teammanager-chat-service:latest -f services/chat-service/Dockerfile .
docker build -t teammanager-notification-service:latest -f services/notification-service/Dockerfile .
```

### Push to Docker Hub
```bash
# Tag for Docker Hub
docker tag teammanager-frontend:latest <your-dockerhub-username>/teammanager-frontend:latest
docker tag teammanager-api-gateway:latest <your-dockerhub-username>/teammanager-api-gateway:latest
docker tag teammanager-user-service:latest <your-dockerhub-username>/teammanager-user-service:latest
docker tag teammanager-team-service:latest <your-dockerhub-username>/teammanager-team-service:latest
docker tag teammanager-project-service:latest <your-dockerhub-username>/teammanager-project-service:latest
docker tag teammanager-chat-service:latest <your-dockerhub-username>/teammanager-chat-service:latest
docker tag teammanager-notification-service:latest <your-dockerhub-username>/teammanager-notification-service:latest

# Push to Docker Hub
docker push <your-dockerhub-username>/teammanager-frontend:latest
docker push <your-dockerhub-username>/teammanager-api-gateway:latest
docker push <your-dockerhub-username>/teammanager-user-service:latest
docker push <your-dockerhub-username>/teammanager-team-service:latest
docker push <your-dockerhub-username>/teammanager-project-service:latest
docker push <your-dockerhub-username>/teammanager-chat-service:latest
docker push <your-dockerhub-username>/teammanager-notification-service:latest
```

### Run with Docker Compose
```bash
docker-compose up -d
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, k3s, GKE, EKS, AKS)
- kubectl configured
- Docker images pushed to registry

### Deploy to Kubernetes
```bash
# Create namespace
kubectl create namespace teammanager

# Create secrets (update with your values)
kubectl create secret generic clerk-secrets \
  --from-literal=clerk-secret-key=<your-clerk-secret> \
  --namespace=teammanager

# Apply Kubernetes manifests (create in k8s/ directory)
kubectl apply -f k8s/postgres-pv.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/user-service-deployment.yaml
kubectl apply -f k8s/team-service-deployment.yaml
kubectl apply -f k8s/project-service-deployment.yaml
kubectl apply -f k8s/chat-service-deployment.yaml
kubectl apply -f k8s/notification-service-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n teammanager
kubectl get services -n teammanager
```

## 📁 Project Structure

```
.
├── src/                          # Next.js frontend
│   ├── app/
│   │   ├── (auth)/              # Auth pages (login, register)
│   │   ├── api/                 # Next.js API routes (proxy)
│   │   ├── chat/                # Chat UI
│   │   ├── projects/            # Projects & documents UI
│   │   ├── teams/               # Teams management UI
│   │   └── notifications/       # Notifications UI
│   ├── components/              # React components
│   ├── lib/                     # Utilities
│   └── types/                   # TypeScript types
├── services/
│   ├── shared/                  # Shared code
│   │   ├── proto/               # gRPC protocol buffers
│   │   ├── middleware/          # Shared middleware
│   │   ├── types/               # Shared types
│   │   └── utils/               # Shared utilities
│   ├── api-gateway/             # API Gateway service
│   │   ├── src/
│   │   │   ├── grpc/           # gRPC clients
│   │   │   └── index.ts        # Express server
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── user-service/            # User microservice
│   │   ├── src/
│   │   │   ├── grpc/           # gRPC server & implementation
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── routes/
│   │   ├── prisma/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── team-service/            # Team microservice
│   ├── project-service/         # Project microservice
│   ├── chat-service/            # Chat microservice
│   └── notification-service/    # Notification microservice
├── prisma/                      # Root Prisma (frontend)
├── docker-compose.yml
├── Dockerfile                   # Frontend Dockerfile
└── README.md
```

## 🔐 Security Features

- ✅ Clerk authentication (OAuth, MFA)
- ✅ JWT-based internal communication
- ✅ gRPC for secure service-to-service calls
- ✅ Environment-based secrets
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection protection (Prisma)
- ✅ Rate limiting (API Gateway)
- ✅ Network isolation (Docker networks)

## 🧪 Testing

```bash
# Unit tests (add test framework)
npm test

# E2E tests (add Playwright/Cypress)
npm run test:e2e

# Load testing (add k6 or artillery)
npm run test:load
```

## 📊 Monitoring & Observability

### Health Checks
- API Gateway: `GET http://localhost:4000/health`
- Each service: `GET http://localhost:300X/health`

### Logging
- Structured logging with Winston/Pino
- Log aggregation ready (ELK, Datadog, etc.)

### Metrics
- Ready for Prometheus/Grafana integration
- Custom metrics endpoints available

## 🎯 Roadmap

### Phase 1: ✅ Core Features (Completed)
- [x] Microservices architecture
- [x] gRPC internal communication
- [x] Authentication & authorization
- [x] Teams & projects
- [x] Real-time chat
- [x] Document management
- [x] Document merging (admin-only)
- [x] Custom login/register UI

### Phase 2: 🚀 Production Ready (In Progress)
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Logging (ELK stack)
- [ ] API documentation (Swagger)
- [ ] Unit & integration tests
- [ ] Load balancing
- [ ] Database backups

### Phase 3: 🎨 Enhanced Features (Planned)
- [ ] File attachments
- [ ] Video calls (WebRTC)
- [ ] Advanced search
- [ ] Activity feeds
- [ ] Email notifications
- [ ] Mobile apps (React Native)
- [ ] Desktop apps (Electron)
- [ ] Calendar integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Built with ❤️ by the TeamManager team

## 📞 Support

- Documentation: [docs/](./docs)
- Issues: [GitHub Issues](https://github.com/yourusername/teammanager/issues)
- Discord: [Join our community](#)

---

**Star ⭐ this repo if you find it useful!**
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
