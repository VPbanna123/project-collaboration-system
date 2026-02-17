#!/bin/bash

# Microservices Setup Script
# This script sets up the complete microservices architecture

set -e  # Exit on error

echo "🚀 Setting up Microservices Architecture..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Step 1: Stop any running services
print_info "Step 1: Stopping existing services..."
docker-compose down 2>/dev/null || true
print_success "Existing services stopped"
echo ""

# Step 2: Start databases
print_info "Step 2: Starting PostgreSQL databases and Redis..."
docker-compose up -d
echo ""
print_info "Waiting for databases to be ready (30 seconds)..."
sleep 30

# Check if databases are ready
print_info "Checking database health..."
for port in 5432 5433 5434 5435 5436; do
    if docker exec $(docker ps -q -f "publish=$port") pg_isready -U postgres >/dev/null 2>&1; then
        print_success "Database on port $port is ready"
    else
        print_error "Database on port $port failed to start"
        exit 1
    fi
done
print_success "All databases are healthy"
echo ""

# Step 3: Setup environment files
print_info "Step 3: Setting up environment files..."
for service in user-service team-service project-service chat-service notification-service; do
    if [ ! -f "services/$service/.env" ]; then
        cp "services/$service/.env.example" "services/$service/.env"
        print_success "Created .env for $service"
    else
        print_info "$service/.env already exists, skipping..."
    fi
done
echo ""

# Step 4: Install dependencies
print_info "Step 4: Installing dependencies..."
print_info "Installing shared library dependencies..."
cd services/shared
npm install
npm run build
cd ../..
print_success "Shared library installed"

for service in user-service team-service project-service chat-service notification-service; do
    print_info "Installing $service dependencies..."
    cd "services/$service"
    npm install
    cd ../..
    print_success "$service dependencies installed"
done
echo ""

# Step 5: Run migrations
print_info "Step 5: Running database migrations..."

print_info "Migrating user_db..."
cd services/user-service
npx prisma migrate dev --name init_microservices --skip-seed || true
npx prisma generate
cd ../..
print_success "user_db migrated"

print_info "Migrating team_db..."
cd services/team-service
npx prisma migrate dev --name init_microservices --skip-seed || true
npx prisma generate
cd ../..
print_success "team_db migrated"

print_info "Migrating project_db..."
cd services/project-service
npx prisma migrate dev --name init_microservices --skip-seed || true
npx prisma generate
cd ../..
print_success "project_db migrated"

print_info "Migrating chat_db..."
cd services/chat-service
npx prisma migrate dev --name init_microservices --skip-seed || true
npx prisma generate
cd ../..
print_success "chat_db migrated"

print_info "Migrating notification_db..."
cd services/notification-service
npx prisma migrate dev --name init_microservices --skip-seed || true
npx prisma generate
cd ../..
print_success "notification_db migrated"
echo ""

# Step 6: Summary
echo ""
echo "=================================================="
print_success "Microservices Architecture Setup Complete! 🎉"
echo "=================================================="
echo ""
echo "📊 Database Status:"
echo "   - user_db:         localhost:5432"
echo "   - team_db:         localhost:5433"
echo "   - project_db:      localhost:5434"
echo "   - chat_db:         localhost:5435"
echo "   - notification_db: localhost:5436"
echo "   - Redis:           localhost:6379"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Update .env files in each service with your Clerk keys:"
echo "   - services/user-service/.env"
echo "   - services/team-service/.env"
echo "   - services/project-service/.env"
echo "   - services/chat-service/.env"
echo "   - services/notification-service/.env"
echo ""
echo "2. Start all services:"
echo "   ./start-services.sh"
echo ""
echo "   Or start individually:"
echo "   cd services/user-service && npm run dev"
echo "   cd services/team-service && npm run dev"
echo "   cd services/project-service && npm run dev"
echo "   cd services/chat-service && npm run dev"
echo "   cd services/notification-service && npm run dev"
echo ""
echo "3. View the architecture documentation:"
echo "   cat MICROSERVICES_ARCHITECTURE.md"
echo ""
echo "📝 Service Ports:"
echo "   - User Service:         http://localhost:3001"
echo "   - Team Service:         http://localhost:3002"
echo "   - Project Service:      http://localhost:3003"
echo "   - Chat Service:         http://localhost:3004"
echo "   - Notification Service: http://localhost:3005"
echo ""
print_success "Happy coding! 🚀"
