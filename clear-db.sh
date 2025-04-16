#!/bin/bash

# Script to clear all collections in the MongoDB database

# Stop the application first
echo "Stopping the application..."
./stop-app.sh

# Clear the database
echo "Clearing the database..."
cd server
node ../clear-db.js
cd ..

# Restart the application
echo "Restarting the application..."
./start-app.sh
