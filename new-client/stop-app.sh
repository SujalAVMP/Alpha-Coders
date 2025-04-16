#!/bin/bash
echo "Stopping Hackerrank Clone application..."
kill -9 2295629 2295830 2>/dev/null || true
pkill -f "node server/test-server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
kill -9 $(lsof -t -i:5002) 2>/dev/null || true
kill -9 $(lsof -t -i:5173) 2>/dev/null || true
kill -9 $(lsof -t -i:5174) 2>/dev/null || true
echo "Application stopped."
