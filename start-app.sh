#!/bin/bash

# Start the Alpha Coders application
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
    # Windows - this is a special case that will only work in CMD, not Bash
    # So we'll just log a message for Windows users
    print_message "On Windows, please manually ensure port $port is free" "$YELLOW"
  fi
}

# Get the script directory in a cross-platform way
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Stop any running instances
print_message "Stopping any running instances..." "$YELLOW"

# Check and kill processes on our ports
if check_port 5002; then
  kill_port 5002
fi

if check_port 5173; then
  kill_port 5173
fi

if check_port 5174; then
  kill_port 5174
fi

# Create log files
print_message "Creating log files..." "$YELLOW"
rm -f server.log client.log
touch server.log client.log

# Start Docker if needed
print_message "Checking Docker status..." "$YELLOW"
if command -v docker &> /dev/null; then
  # Check if Docker is running
  if ! docker info &>/dev/null; then
    print_message "Starting Docker..." "$YELLOW"
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      open -a Docker &>/dev/null
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux
      if command -v systemctl &> /dev/null; then
        sudo systemctl start docker &>/dev/null
      elif command -v service &> /dev/null; then
        sudo service docker start &>/dev/null
      fi
    elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "cygwin"* ]]; then
      # Windows
      # Just try to start Docker Desktop if it's not running
      print_message "On Windows, please start Docker Desktop manually if it's not running" "$YELLOW"
    fi

    # Wait for Docker to start
    print_message "Waiting for Docker to start..." "$YELLOW"
    MAX_TRIES=40
    for i in $(seq 1 $MAX_TRIES); do
      sleep 2
      if docker info &>/dev/null; then
        print_message "Docker started successfully!" "$GREEN"
        break
      fi

      print_message "Waiting for Docker... ($i/$MAX_TRIES)" "$YELLOW"

      if [ $i -eq $MAX_TRIES ]; then
        print_message "Docker failed to start in time. The application may not work correctly." "$RED"
      fi
    done
  else
    print_message "Docker is already running" "$GREEN"
  fi
else
  print_message "Docker command not found. Please ensure Docker is installed and running." "$RED"
  print_message "The application may not work correctly without Docker." "$RED"
fi

# Start MongoDB if needed
print_message "Checking MongoDB status..." "$YELLOW"
# Check if MongoDB is running
if ! check_port 27017; then
  print_message "MongoDB is not running. Attempting to start..." "$YELLOW"
  if command -v mongod &> /dev/null; then
    # MongoDB command exists
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      brew services start mongodb-community &>/dev/null || mongod --fork --logpath /tmp/mongodb.log &>/dev/null || true
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux
      if command -v systemctl &> /dev/null; then
        sudo systemctl start mongod &>/dev/null || true
      elif command -v service &> /dev/null; then
        sudo service mongod start &>/dev/null || true
      else
        mongod --fork --logpath /tmp/mongodb.log &>/dev/null || true
      fi
    elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "cygwin"* ]]; then
      # Windows
      print_message "On Windows, please start MongoDB manually if it's not running" "$YELLOW"
    fi

    # Wait for MongoDB to start
    print_message "Waiting for MongoDB to start..." "$YELLOW"
    MAX_TRIES=5
    for i in $(seq 1 $MAX_TRIES); do
      sleep 2
      if check_port 27017; then
        print_message "MongoDB started successfully!" "$GREEN"
        break
      fi

      print_message "Waiting for MongoDB... ($i/$MAX_TRIES)" "$YELLOW"

      if [ $i -eq $MAX_TRIES ]; then
        print_message "MongoDB failed to start. The application may not work correctly." "$RED"
      fi
    done
  else
    print_message "MongoDB command not found. Please ensure MongoDB is installed and running." "$YELLOW"
    print_message "The application requires MongoDB to function correctly." "$YELLOW"
  fi
else
  print_message "MongoDB is already running" "$GREEN"
fi

# Start the server
print_message "Starting the server..." "$YELLOW"

# Make sure we're in the correct directory
cd "$SCRIPT_DIR"

# Start the server
node server/test-server.js > server.log 2>&1 &
SERVER_PID=$!

# Wait for the server to start
print_message "Waiting for server to start..." "$YELLOW"
MAX_TRIES=15
for i in $(seq 1 $MAX_TRIES); do
  sleep 2
  # Check if server is running
  if ! ps -p $SERVER_PID &>/dev/null; then
    print_message "Server process died. Check server.log for details." "$RED"
    cat server.log
    exit 1
  fi

  # Try to connect to the server
  if curl -s "http://localhost:5002/api/test" &>/dev/null; then
    print_message "Server started successfully!" "$GREEN"
    break
  fi

  print_message "Waiting for server... ($i/$MAX_TRIES)" "$YELLOW"

  if [ $i -eq $MAX_TRIES ]; then
    print_message "Server failed to start in time. Check server.log for details." "$RED"
    cat server.log
    exit 1
  fi
done

# Start the client
print_message "Starting the client..." "$YELLOW"

# Make sure we're in the correct directory
cd "$SCRIPT_DIR/new-client"

# Start the client
npm run dev > "$SCRIPT_DIR/client.log" 2>&1 &
CLIENT_PID=$!

# Return to the script directory
cd "$SCRIPT_DIR"

# Wait for the client to start
print_message "Waiting for client to start..." "$YELLOW"
MAX_TRIES=15
CLIENT_PORT=""
for i in $(seq 1 $MAX_TRIES); do
  sleep 2
  # Check if client is running
  if ! ps -p $CLIENT_PID &>/dev/null; then
    print_message "Client process died. Check client.log for details." "$RED"
    cat client.log
    exit 1
  fi

  # Check both possible ports
  if curl -s "http://localhost:5173" &>/dev/null; then
    CLIENT_PORT=5173
    print_message "Client started on port 5173!" "$GREEN"
    break
  elif curl -s "http://localhost:5174" &>/dev/null; then
    CLIENT_PORT=5174
    print_message "Client started on port 5174!" "$GREEN"
    break
  fi

  print_message "Waiting for client... ($i/$MAX_TRIES)" "$YELLOW"

  if [ $i -eq $MAX_TRIES ]; then
    print_message "Client failed to start in time. Check client.log for details." "$RED"
    cat client.log
    exit 1
  fi
done

# Create a stop script
cat > stop-app.sh << 'EOF'
#!/bin/bash
echo "Stopping Alpha Coders application..."

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
EOF

chmod +x stop-app.sh

# Save PIDs
echo "$SERVER_PID $CLIENT_PID" > app_pids.txt

print_message "\n===== Application Started Successfully! =====" "$GREEN"
print_message "Server running at: http://localhost:5002" "$GREEN"
print_message "Client running at: http://localhost:${CLIENT_PORT}" "$GREEN"
print_message "\nTo stop the application, run: ./stop-app.sh" "$YELLOW"

# Try to open browser
print_message "\nAttempting to open browser..." "$YELLOW"
if [[ -n "$CLIENT_PORT" ]]; then
  if command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://localhost:${CLIENT_PORT}" &>/dev/null || true
  elif command -v open &> /dev/null; then
    # macOS
    open "http://localhost:${CLIENT_PORT}" &>/dev/null || true
  elif command -v start &> /dev/null; then
    # Windows
    start "" "http://localhost:${CLIENT_PORT}" &>/dev/null || true
  fi
  print_message "If the browser doesn't open automatically, please visit:" "$YELLOW"
  print_message "http://localhost:${CLIENT_PORT}" "$GREEN"
else
  print_message "Client port could not be determined. Please check client.log for details." "$RED"
fi
