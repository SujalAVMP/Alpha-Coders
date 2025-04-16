#!/bin/bash
echo "Stopping Hackerrank Clone application..."

# Kill processes by PID if the file exists
if [ -f app_pids.txt ]; then
  PIDS=$(cat app_pids.txt)
  kill $PIDS 2>/dev/null || true
  rm app_pids.txt
fi

# Try to kill by process name
if command -v pkill &> /dev/null; then
  pkill -f "node server/test-server.js" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
fi

# Try to kill by port
if command -v lsof &> /dev/null; then
  lsof -ti:5002 | xargs kill 2>/dev/null || true
  lsof -ti:5173 | xargs kill 2>/dev/null || true
  lsof -ti:5174 | xargs kill 2>/dev/null || true
fi

echo "Application stopped."
