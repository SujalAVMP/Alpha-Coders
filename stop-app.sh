#!/bin/bash

# Stop the Hackerrank Clone application
# This script stops the server and client processes

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${2}${1}${NC}"
}

# Check if the PID file exists
if [ -f "app_pids.txt" ]; then
  # Read the PIDs from the file
  PIDS=$(cat app_pids.txt)
  print_message "Stopping processes with PIDs: $PIDS" "$YELLOW"
  
  # Kill the processes
  kill -9 $PIDS 2>/dev/null || true
  
  # Remove the PID file
  rm app_pids.txt
  
  print_message "Application stopped successfully!" "$GREEN"
else
  # If the PID file doesn't exist, try to find and kill the processes by port
  print_message "PID file not found. Trying to stop processes by port..." "$YELLOW"
  
  # Stop the server
  SERVER_PID=$(lsof -t -i:5002 2>/dev/null)
  if [ -n "$SERVER_PID" ]; then
    print_message "Stopping server with PID: $SERVER_PID" "$YELLOW"
    kill -9 $SERVER_PID 2>/dev/null || true
  else
    print_message "Server not running" "$YELLOW"
  fi
  
  # Stop the client
  CLIENT_PID=$(lsof -t -i:5174 2>/dev/null || lsof -t -i:5173 2>/dev/null)
  if [ -n "$CLIENT_PID" ]; then
    print_message "Stopping client with PID: $CLIENT_PID" "$YELLOW"
    kill -9 $CLIENT_PID 2>/dev/null || true
  else
    print_message "Client not running" "$YELLOW"
  fi
  
  print_message "Application stopped successfully!" "$GREEN"
fi
