#!/bin/bash

echo "Installing MongoDB Compass..."

# Download MongoDB Compass
wget https://downloads.mongodb.com/compass/mongodb-compass_1.40.4_amd64.deb

# Install the package
sudo dpkg -i mongodb-compass_1.40.4_amd64.deb

# Fix any dependency issues
sudo apt-get install -f

# Clean up
rm mongodb-compass_1.40.4_amd64.deb

echo "MongoDB Compass installed. You can run it by typing 'mongodb-compass' in the terminal."
echo "When it opens, connect to: mongodb://localhost:27017/hackerrank_clone"
