#!/bin/bash

# Start All Services Script
# This script starts all microservices and the API Gateway

echo "🚀 Starting All Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env files exist
check_env_file() {
    local service=$1
    local path=$2
    
    if [ ! -f "$path/.env" ]; then
        echo -e "${YELLOW}⚠️  Warning: $service .env file not found${NC}"
        echo "   Creating from .env.example..."
        if [ -f "$path/.env.example" ]; then
            cp "$path/.env.example" "$path/.env"
            echo -e "${GREEN}   ✅ Created $path/.env${NC}"
        else
            echo -e "${RED}   ❌ No .env.example found in $path${NC}"
        fi
    else
        echo -e "${GREEN}✅ $service .env exists${NC}"
    fi
}

echo "Checking environment files..."
check_env_file "API Gateway" "services/api-gateway"
check_env_file "User Service" "services/user-service"
check_env_file "Team Service" "services/team-service"
check_env_file "Project Service" "services/project-service"
check_env_file "Chat Service" "services/chat-service"
check_env_file "Notification Service" "services/notification-service"
check_env_file "Frontend" "."

echo ""
echo "=================================="
echo "Starting services in new terminals..."
echo "=================================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect terminal emulator
if command_exists gnome-terminal; then
    TERMINAL="gnome-terminal"
elif command_exists konsole; then
    TERMINAL="konsole"
elif command_exists xterm; then
    TERMINAL="xterm"
else
    echo -e "${RED}❌ No suitable terminal emulator found${NC}"
    echo "Please install gnome-terminal, konsole, or xterm"
    echo ""
    echo "Alternative: Run services manually:"
    echo ""
    echo "Terminal 1: cd services/api-gateway && npm run dev"
    echo "Terminal 2: cd services/user-service && npm run dev"
    echo "Terminal 3: cd services/team-service && npm run dev"
    echo "Terminal 4: cd services/project-service && npm run dev"
    echo "Terminal 5: cd services/chat-service && npm run dev"
    echo "Terminal 6: cd services/notification-service && npm run dev"
    echo "Terminal 7: npm run dev  # Frontend"
    exit 1
fi

echo "Using terminal: $TERMINAL"
echo ""

# Start API Gateway
echo "🌐 Starting API Gateway (Port 4000)..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal --tab --title="API Gateway :4000" -- bash -c "cd services/api-gateway && echo '🌐 API Gateway' && npm run dev; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole --new-tab -e bash -c "cd services/api-gateway && echo '🌐 API Gateway' && npm run dev; exec bash" &
else
    xterm -title "API Gateway :4000" -e "cd services/api-gateway && npm run dev" &
fi
sleep 2

# Start User Service
echo "👤 Starting User Service (Port 3001)..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal --tab --title="User Service :3001" -- bash -c "cd services/user-service && echo '👤 User Service' && npm run dev; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole --new-tab -e bash -c "cd services/user-service && echo '👤 User Service' && npm run dev; exec bash" &
else
    xterm -title "User Service :3001" -e "cd services/user-service && npm run dev" &
fi
sleep 2

# Start Team Service
echo "👥 Starting Team Service (Port 3002)..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal --tab --title="Team Service :3002" -- bash -c "cd services/team-service && echo '👥 Team Service' && npm run dev; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole --new-tab -e bash -c "cd services/team-service && echo '👥 Team Service' && npm run dev; exec bash" &
else
    xterm -title "Team Service :3002" -e "cd services/team-service && npm run dev" &
fi
sleep 2

# Start Project Service
echo "📁 Starting Project Service (Port 3003)..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal --tab --title="Project Service :3003" -- bash -c "cd services/project-service && echo '📁 Project Service' && npm run dev; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole --new-tab -e bash -c "cd services/project-service && echo '📁 Project Service' && npm run dev; exec bash" &
else
    xterm -title "Project Service :3003" -e "cd services/project-service && npm run dev" &
fi
sleep 2

# Start Chat Service
echo "💬 Starting Chat Service (Port 3004)..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal --tab --title="Chat Service :3004" -- bash -c "cd services/chat-service && echo '💬 Chat Service' && npm run dev; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole --new-tab -e bash -c "cd services/chat-service && echo '💬 Chat Service' && npm run dev; exec bash" &
else
    xterm -title "Chat Service :3004" -e "cd services/chat-service && npm run dev" &
fi
sleep 2

# Start Notification Service
echo "🔔 Starting Notification Service (Port 3005)..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal --tab --title="Notification Service :3005" -- bash -c "cd services/notification-service && echo '🔔 Notification Service' && npm run dev; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole --new-tab -e bash -c "cd services/notification-service && echo '🔔 Notification Service' && npm run dev; exec bash" &
else
    xterm -title "Notification Service :3005" -e "cd services/notification-service && npm run dev" &
fi
sleep 2

# Start Frontend
echo "🎨 Starting Frontend (Port 3000)..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal --tab --title="Frontend :3000" -- bash -c "echo '🎨 Frontend' && npm run dev; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole --new-tab -e bash -c "echo '🎨 Frontend' && npm run dev; exec bash" &
else
    xterm -title "Frontend :3000" -e "npm run dev" &
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ All services starting!${NC}"
echo "=================================="
echo ""
echo "Services:"
echo "  🌐 API Gateway:        http://localhost:4000"
echo "  👤 User Service:       http://localhost:3001"
echo "  👥 Team Service:       http://localhost:3002"
echo "  📁 Project Service:    http://localhost:3003"
echo "  💬 Chat Service:       http://localhost:3004"
echo "  🔔 Notification:       http://localhost:3005"
echo "  🎨 Frontend:           http://localhost:3000"
echo ""
echo "Check health:"
echo "  curl http://localhost:4000/health"
echo ""
echo -e "${YELLOW}Note: Each service is running in a separate terminal tab.${NC}"
echo "      Close the tabs or press Ctrl+C in each to stop."
echo ""
