#!/bin/bash

# Stop the Hackerrank Clone application
# This script is device-agnostic and works on Linux, macOS, and Windows (with Git Bash)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${2}${1}${NC}"
}

# Function to check if a port is in use (cross-platform)
check_port() {
  local port=$1
  # Try different commands based on what's available
  if command -v nc &> /dev/null; then
    nc -z localhost $port &> /dev/null
    return $?
  elif command -v lsof &> /dev/null; then
    lsof -i:$port &> /dev/null
    return $?
  elif command -v netstat &> /dev/null; then
    netstat -tuln | grep -q ":$port "
    return $?
  else
    # If no tools are available, assume port is free
    return 1
  fi
}

# Function to kill process on a port (cross-platform)
kill_port() {
  local port=$1
  print_message "Attempting to free port $port..." "$YELLOW"

  if command -v lsof &> /dev/null; then
    # Linux/macOS
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
  elif command -v netstat &> /dev/null && command -v taskkill &> /dev/null; then
    # Windows
    for /f "tokens=5" %a in ('netstat -aon ^| findstr :$port') do taskkill /F /PID %a 2>NUL || true
  fi
}

print_message "Stopping Hackerrank Clone application..." "$YELLOW"

# Kill processes by PID if the file exists
if [ -f app_pids.txt ]; then
  PIDS=$(cat app_pids.txt)
  print_message "Stopping processes with PIDs: $PIDS" "$YELLOW"
  kill $PIDS 2>/dev/null || true
  rm app_pids.txt
fi

# Try to kill by process name
if command -v pkill &> /dev/null; then
  print_message "Stopping processes by name..." "$YELLOW"
  pkill -f "node server/test-server.js" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
fi

# Try to kill by port
print_message "Stopping processes by port..." "$YELLOW"
if check_port 5002; then
  kill_port 5002
fi

if check_port 5173; then
  kill_port 5173
fi

if check_port 5174; then
  kill_port 5174
fi

# Note: We don't stop Docker or MongoDB here as they might be used by other applications
print_message "Note: Docker and MongoDB are still running as they might be used by other applications." "$YELLOW"
print_message "Application stopped successfully!" "$GREEN"
