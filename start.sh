#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SlideStorm - Ngrok + Server Startup  ${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Use Node.js 24 via nvm
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo -e "${YELLOW}Loading nvm and switching to Node 24...${NC}"
    . "$HOME/.nvm/nvm.sh"
    nvm use 24
    echo ""
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}Error: ngrok is not installed${NC}"
    echo -e "${YELLOW}Install it from: https://ngrok.com/download${NC}"
    exit 1
fi

# Check if authtoken is configured
if ! ngrok config check &> /dev/null; then
    echo -e "${YELLOW}Warning: ngrok authtoken may not be configured${NC}"
    echo -e "${YELLOW}Run: ngrok config add-authtoken YOUR_TOKEN${NC}\n"
fi

# Kill any existing ngrok processes
echo -e "${YELLOW}Checking for existing ngrok processes...${NC}"
pkill -f ngrok
sleep 1

# Start ngrok in the background with your fixed domain
echo -e "${GREEN}Starting ngrok tunnel...${NC}"
ngrok http 3000 --domain=pottier-kieth-zestfully.ngrok-free.dev > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
echo -e "${YELLOW}Waiting for ngrok to initialize...${NC}"
sleep 3

# Check if ngrok started successfully
if ! ps -p $NGROK_PID > /dev/null; then
    echo -e "${RED}Error: ngrok failed to start${NC}"
    exit 1
fi

# Get the ngrok URL from API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}Error: Could not get ngrok URL${NC}"
    echo -e "${YELLOW}Check ngrok status at: http://localhost:4040${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Ngrok tunnel active${NC}"
echo -e "${GREEN}  URL: ${NGROK_URL}${NC}"
echo -e "${GREEN}  Dashboard: http://localhost:4040${NC}\n"

# Start the development server
echo -e "${GREEN}Starting development server...${NC}"
npm run dev

# Cleanup on exit
trap "echo -e '\n${YELLOW}Shutting down...${NC}'; kill $NGROK_PID 2>/dev/null; exit" INT TERM
