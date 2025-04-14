#!/bin/bash

# Start the Hackerrank Clone application with a clean database
# This script stops any running instances, resets the database, and starts both server and client

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${2}${1}${NC}"
}

# Function to check if a port is in use
is_port_in_use() {
  lsof -i:"$1" >/dev/null 2>&1
  return $?
}

# Stop any running instances
print_message "Stopping any running instances..." "$YELLOW"

# Kill any processes using our ports
if is_port_in_use 5002; then
  print_message "Killing process on port 5002..." "$YELLOW"
  kill -9 $(lsof -t -i:5002) 2>/dev/null || true
fi

if is_port_in_use 5173; then
  print_message "Killing process on port 5173..." "$YELLOW"
  kill -9 $(lsof -t -i:5173) 2>/dev/null || true
fi

if is_port_in_use 5174; then
  print_message "Killing process on port 5174..." "$YELLOW"
  kill -9 $(lsof -t -i:5174) 2>/dev/null || true
fi

# Kill any existing node processes for our application
print_message "Checking for existing node processes..." "$YELLOW"
pkill -f "node server/test-server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Wait a moment to ensure everything is stopped
sleep 2

# Start the server with a clean database
print_message "Starting the server with a clean database..." "$YELLOW"
cd /home/sujal-patel-ubuntu-24/Desktop/Networks/Hackerrank_Clone

# Create a fresh server log file
rm -f server.log
touch server.log

# Start the server in the background
node server/test-server.js > server.log 2>&1 &
SERVER_PID=$!

# Wait for the server to start
print_message "Waiting for server to start..." "$YELLOW"

# Try up to 10 times (20 seconds total) to connect to the server
MAX_TRIES=10
for i in $(seq 1 $MAX_TRIES); do
  print_message "Attempt $i of $MAX_TRIES..." "$YELLOW"
  sleep 2

  # Check if the server process is still running
  if ! ps -p $SERVER_PID > /dev/null; then
    print_message "Server process died. Check server.log for details." "$RED"
    cat server.log
    exit 1
  fi

  # Try to connect to the server
  SERVER_RESPONSE=$(curl -s "http://localhost:5002/api/test" 2>/dev/null)

  if [[ "$SERVER_RESPONSE" == *"Test route is working"* ]]; then
    print_message "Server started successfully!" "$GREEN"
    break
  fi

  # If we've reached the maximum number of tries, exit with an error
  if [ $i -eq $MAX_TRIES ]; then
    print_message "Failed to start the server after $MAX_TRIES attempts." "$RED"
    print_message "Server response: $SERVER_RESPONSE" "$RED"
    print_message "Server log:" "$RED"
    cat server.log
    exit 1
  fi
done

# Start the client
print_message "Starting the client..." "$YELLOW"
cd /home/sujal-patel-ubuntu-24/Desktop/Networks/Hackerrank_Clone/new-client

# Create a fresh client log file
rm -f client.log
touch client.log

# Start the client in the background
npm run dev > client.log 2>&1 &
CLIENT_PID=$!

# Wait for the client to start
print_message "Waiting for client to start..." "$YELLOW"

# Try up to 10 times (20 seconds total) to connect to the client
MAX_TRIES=10
for i in $(seq 1 $MAX_TRIES); do
  print_message "Attempt $i of $MAX_TRIES..." "$YELLOW"
  sleep 2

  # Check if the client process is still running
  if ! ps -p $CLIENT_PID > /dev/null; then
    print_message "Client process died. Check client.log for details." "$RED"
    cat client.log
    exit 1
  fi

  # Check for both possible client ports
  if curl -s "http://localhost:5174" > /dev/null 2>&1; then
    CLIENT_PORT=5174
    print_message "Client started successfully on port 5174!" "$GREEN"
    break
  elif curl -s "http://localhost:5173" > /dev/null 2>&1; then
    CLIENT_PORT=5173
    print_message "Client started successfully on port 5173!" "$GREEN"
    break
  fi

  # If we've reached the maximum number of tries, exit with an error
  if [ $i -eq $MAX_TRIES ]; then
    print_message "Failed to start the client after $MAX_TRIES attempts." "$RED"
    print_message "Client log:" "$RED"
    cat client.log
    exit 1
  fi
done

print_message "\n===== Application Started Successfully! =====" "$GREEN"
print_message "Server running at: http://localhost:5002" "$GREEN"
print_message "Client running at: http://localhost:${CLIENT_PORT}" "$GREEN"
print_message "\nOpen your browser and navigate to http://localhost:${CLIENT_PORT} to use the application." "$GREEN"

# Create a stop script for easy stopping later
cat > stop-app.sh << EOF
#!/bin/bash
echo "Stopping Hackerrank Clone application..."
kill -9 $SERVER_PID $CLIENT_PID 2>/dev/null || true
pkill -f "node server/test-server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
kill -9 \$(lsof -t -i:5002) 2>/dev/null || true
kill -9 \$(lsof -t -i:5173) 2>/dev/null || true
kill -9 \$(lsof -t -i:5174) 2>/dev/null || true
echo "Application stopped."
EOF

chmod +x stop-app.sh

print_message "\nTo stop the application, run: ./stop-app.sh" "$YELLOW"

# Save the PIDs to a file for reference
echo "$SERVER_PID $CLIENT_PID" > app_pids.txt
print_message "PIDs saved to app_pids.txt" "$YELLOW"

# Open the browser automatically
print_message "\nOpening browser..." "$YELLOW"
xdg-open http://localhost:${CLIENT_PORT} 2>/dev/null || open http://localhost:${CLIENT_PORT} 2>/dev/null || echo "Could not open browser automatically. Please open http://localhost:${CLIENT_PORT} manually."
