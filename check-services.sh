#!/bin/bash

# Quick Service Health Check
# Tests if all services are running and responding

echo "🔍 Checking Service Health..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    if curl -s -f -m 3 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name ($url)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name ($url) - NOT RESPONDING${NC}"
        echo "   Make sure service is running on port $port"
        return 1
    fi
}

echo "Testing services..."
echo ""

# Check each service
check_service "API Gateway      " "http://localhost:4000/health" "4000"
check_service "User Service     " "http://localhost:3001/health" "3001"
check_service "Team Service     " "http://localhost:3002/health" "3002"
check_service "Project Service  " "http://localhost:3003/health" "3003"
check_service "Chat Service     " "http://localhost:3004/health" "3004"
check_service "Notification Svc " "http://localhost:3005/health" "3005"
check_service "Frontend         " "http://localhost:3000" "3000"

echo ""
echo "=================================="
echo "Service Ports:"
echo "=================================="
echo "  API Gateway:     :4000 🌐"
echo "  User Service:    :3001 👤"
echo "  Team Service:    :3002 👥"
echo "  Project Service: :3003 📁"
echo "  Chat Service:    :3004 💬"
echo "  Notification:    :3005 🔔"
echo "  Frontend:        :3000 🎨"
echo ""

# Check if ports are in use
echo "Checking which ports are in use..."
echo ""

for port in 3000 3001 3002 3003 3004 3005 4000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Port $port is in use${NC}"
    else
        echo -e "${YELLOW}⚠️  Port $port is FREE (service not running)${NC}"
    fi
done

echo ""
echo "To start all services, run:"
echo "  ./start-all-services.sh"
echo ""
echo "Or manually start each service:"
echo "  cd services/api-gateway && npm run dev       (Terminal 1)"
echo "  cd services/user-service && npm run dev      (Terminal 2)"
echo "  cd services/team-service && npm run dev      (Terminal 3)"
echo "  cd services/project-service && npm run dev   (Terminal 4)"  
echo "  cd services/chat-service && npm run dev      (Terminal 5)"
echo "  cd services/notification-service && npm run dev (Terminal 6)"
echo "  npm run dev                                   (Terminal 7 - Frontend)"
echo ""
