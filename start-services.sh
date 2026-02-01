#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Starting TeamManager Microservices${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${YELLOW}tmux is not installed. Please install it to use this script.${NC}"
    echo -e "Ubuntu/Debian: sudo apt-get install tmux"
    echo -e "macOS: brew install tmux"
    exit 1
fi

# Create a new tmux session
SESSION_NAME="teammanager"

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null

# Create new session with first window for user-service
tmux new-session -d -s $SESSION_NAME -n "user-service"
tmux send-keys -t $SESSION_NAME:0 "cd services/user-service && npm run dev" C-m

# Create window for team-service
tmux new-window -t $SESSION_NAME:1 -n "team-service"
tmux send-keys -t $SESSION_NAME:1 "cd services/team-service && npm run dev" C-m

# Create window for project-service
tmux new-window -t $SESSION_NAME:2 -n "project-service"
tmux send-keys -t $SESSION_NAME:2 "cd services/project-service && npm run dev" C-m

# Create window for chat-service
tmux new-window -t $SESSION_NAME:3 -n "chat-service"
tmux send-keys -t $SESSION_NAME:3 "cd services/chat-service && npm run dev" C-m

# Create window for notification-service
tmux new-window -t $SESSION_NAME:4 -n "notification-service"
tmux send-keys -t $SESSION_NAME:4 "cd services/notification-service && npm run dev" C-m

# Create window for Next.js frontend
tmux new-window -t $SESSION_NAME:5 -n "nextjs"
tmux send-keys -t $SESSION_NAME:5 "npm run dev" C-m

# Create window for logs/commands
tmux new-window -t $SESSION_NAME:6 -n "terminal"

echo -e "${GREEN}✓ All services started in tmux session '${SESSION_NAME}'${NC}\n"
echo -e "${BLUE}Services:${NC}"
echo -e "  ${GREEN}•${NC} User Service      → http://localhost:3001"
echo -e "  ${GREEN}•${NC} Team Service      → http://localhost:3002"
echo -e "  ${GREEN}•${NC} Project Service   → http://localhost:3003"
echo -e "  ${GREEN}•${NC} Chat Service      → http://localhost:3004"
echo -e "  ${GREEN}•${NC} Notification Svc  → http://localhost:3005"
echo -e "  ${GREEN}•${NC} Next.js Frontend  → http://localhost:3000"
echo -e ""
echo -e "${BLUE}Tmux Commands:${NC}"
echo -e "  ${YELLOW}tmux attach -t ${SESSION_NAME}${NC}  → Attach to session"
echo -e "  ${YELLOW}Ctrl+B, D${NC}                → Detach from session"
echo -e "  ${YELLOW}Ctrl+B, N/P${NC}              → Next/Previous window"
echo -e "  ${YELLOW}Ctrl+B, [0-6]${NC}            → Go to specific window"
echo -e "  ${YELLOW}tmux kill-session -t ${SESSION_NAME}${NC}  → Stop all services"
echo -e ""

# Attach to the session
tmux attach -t $SESSION_NAME
