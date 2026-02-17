#!/bin/bash

# ============================================
# Microservices Setup with Network Isolation
# ============================================

set -e  # Exit on error

echo "🚀 Setting up microservices with network isolation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. Check prerequisites
echo ""
print_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
print_success "Node.js is installed ($(node --version))"

# 2. Generate secure secrets if not exists
echo ""
print_info "Checking environment files..."

generate_secret() {
    node -p "require('crypto').randomBytes(64).toString('hex')"
}

generate_api_key() {
    node -p "require('crypto').randomBytes(32).toString('hex')"
}

# API Gateway .env
if [ ! -f "services/api-gateway/.env" ]; then
    print_warning "Creating services/api-gateway/.env from .env.example..."
    cp services/api-gateway/.env.example services/api-gateway/.env
    
    # Generate secure secrets
    INTERNAL_JWT_SECRET=$(generate_secret)
    INTERNAL_API_KEY=$(generate_api_key)
    
    # Replace placeholders
    sed -i.bak "s/INTERNAL_JWT_SECRET=.*/INTERNAL_JWT_SECRET=${INTERNAL_JWT_SECRET}/" services/api-gateway/.env
    sed -i.bak "s/INTERNAL_API_KEY=.*/INTERNAL_API_KEY=${INTERNAL_API_KEY}/" services/api-gateway/.env
    rm services/api-gateway/.env.bak
    
    print_success "Generated secure secrets for API Gateway"
    print_warning "⚠️  You MUST add your CLERK_SECRET_KEY to services/api-gateway/.env"
else
    print_success "API Gateway .env already exists"
fi

# Copy same secrets to all services
for service in user-service team-service project-service chat-service notification-service; do
    if [ ! -f "services/$service/.env" ]; then
        if [ -f "services/$service/.env.example" ]; then
            cp services/$service/.env.example services/$service/.env
            
            # Use same secrets as API Gateway
            if [ -f "services/api-gateway/.env" ]; then
                JWT_SECRET=$(grep INTERNAL_JWT_SECRET services/api-gateway/.env | cut -d '=' -f2)
                API_KEY=$(grep INTERNAL_API_KEY services/api-gateway/.env | cut -d '=' -f2)
                
                sed -i.bak "s/INTERNAL_JWT_SECRET=.*/INTERNAL_JWT_SECRET=${JWT_SECRET}/" services/$service/.env
                sed -i.bak "s/INTERNAL_API_KEY=.*/INTERNAL_API_KEY=${API_KEY}/" services/$service/.env
                rm services/$service/.env.bak
            fi
            
            print_success "Created .env for $service"
        fi
    fi
done

# 3. Install dependencies
echo ""
print_info "Installing dependencies..."

# API Gateway
if [ -f "services/api-gateway/package.json" ]; then
    print_info "Installing API Gateway dependencies..."
    cd services/api-gateway
    npm install
    cd ../..
    print_success "API Gateway dependencies installed"
fi

# Shared library
if [ -f "services/shared/package.json" ]; then
    print_info "Installing shared library dependencies..."
    cd services/shared
    npm install
    cd ../..
    print_success "Shared library dependencies installed"
fi

# Each service
for service in user-service team-service project-service chat-service notification-service; do
    if [ -f "services/$service/package.json" ]; then
        print_info "Installing $service dependencies..."
        cd services/$service
        npm install
        cd ../..
        print_success "$service dependencies installed"
    fi
done

# 4. Start Docker containers
echo ""
print_info "Starting Docker containers with network isolation..."

# Stop existing containers
if docker ps -a | grep -q postgres-user; then
    print_info "Stopping existing containers..."
    docker-compose down
fi

# Start databases and Redis first
print_info "Starting databases and Redis..."
docker-compose up -d postgres-user postgres-team postgres-project postgres-chat postgres-notification redis

# Wait for health checks
print_info "Waiting for databases to be ready..."
sleep 10

# Check health
for i in {1..30}; do
    if docker exec user_db pg_isready -U postgres &> /dev/null; then
        print_success "Databases are ready"
        break
    fi
    echo -n "."
    sleep 1
done

# 5. Run Prisma migrations
echo ""
print_info "Running database migrations..."

for service in user-service team-service project-service chat-service notification-service; do
    if [ -f "services/$service/prisma/schema.prisma" ]; then
        print_info "Migrating $service database..."
        cd services/$service
        npx prisma migrate deploy
        npx prisma generate
        cd ../..
        print_success "$service database migrated"
    fi
done

# 6. Build and start API Gateway
echo ""
print_info "Building API Gateway..."
cd services/api-gateway
npm run build
cd ../..
print_success "API Gateway built"

# Start API Gateway container
print_info "Starting API Gateway..."
docker-compose up -d api-gateway

# Wait for API Gateway to be ready
sleep 5
if curl -s http://localhost:4000/health > /dev/null; then
    print_success "API Gateway is running on http://localhost:4000"
else
    print_warning "API Gateway may not be ready yet. Check logs: docker logs api_gateway"
fi

# 7. Display status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_success "✨ Microservices setup complete!"
echo ""
echo "📊 Service Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker-compose ps

echo ""
echo "📡 Access Points:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  API Gateway:       http://localhost:4000"
echo "  Redis Commander:   http://localhost:8081"
echo ""

echo "🔒 Network Security:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ API Gateway is on PUBLIC network (exposed to internet)"
echo "  ✅ All services are on INTERNAL network (isolated)"
echo "  ✅ Services can ONLY be accessed through API Gateway"
echo ""

echo "⚡ Redis Cache:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Max Memory: 512MB"
echo "  Eviction:   LRU (Least Recently Used)"
echo "  AOF:        Enabled (data persistence)"
echo ""

echo "⚠️  Important Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Add your CLERK_SECRET_KEY to services/api-gateway/.env"
echo "  2. Add your CLERK_WEBHOOK_SECRET to services/user-service/.env"
echo "  3. Restart API Gateway: docker-compose restart api-gateway"
echo "  4. Test the gateway: curl http://localhost:4000/health"
echo ""

echo "📚 Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Read: NETWORK_ISOLATION_GUIDE.md"
echo "  Read: MICROSERVICES_COMPLETE.md"
echo ""

echo "🔧 Useful Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  View logs:         docker-compose logs -f api-gateway"
echo "  Stop services:     docker-compose down"
echo "  Restart:           docker-compose restart"
echo "  View Redis cache:  docker exec teamapp_redis redis-cli KEYS '*'"
echo "  Test network:      docker exec api_gateway curl http://user-service:3001/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for CLERK_SECRET_KEY
if ! grep -q "CLERK_SECRET_KEY=sk_" services/api-gateway/.env 2>/dev/null; then
    echo ""
    print_warning "⚠️  WARNING: CLERK_SECRET_KEY not configured!"
    print_warning "   API Gateway will NOT work until you add it to services/api-gateway/.env"
    echo ""
fi

print_success "Setup complete! 🎉"
