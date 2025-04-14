#!/bin/bash

# Reset Database Script for Hackerrank Clone
# This script stops the server, resets the database, and restarts the server

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${2}${1}${NC}"
}

# Stop the server if it's running
print_message "Stopping the server..." "$YELLOW"
kill -9 $(lsof -t -i:5002) 2>/dev/null || true

# Wait a moment to ensure the server is fully stopped
sleep 2

# Start the server with a clean database
print_message "Starting the server with a clean database..." "$YELLOW"
cd /home/sujal-patel-ubuntu-24/Desktop/Networks/Hackerrank_Clone
node server/test-server.js > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for the server to start
sleep 3

# Check if the server is running
if curl -s "http://localhost:5002/api/test" > /dev/null; then
  print_message "Server restarted with a clean database!" "$GREEN"
  print_message "The database has been reset. All users and data have been cleared." "$GREEN"
  print_message "You can now register new users and start fresh." "$GREEN"
else
  print_message "Failed to restart the server." "$RED"
  exit 1
fi
