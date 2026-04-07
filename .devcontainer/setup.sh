#!/bin/bash

echo "Updating system..."
sudo apt update

echo "Installing Python & tools..."
sudo apt install -y python3-pip python3-venv libmysqlclient-dev

echo "Installing Node..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

echo "Setup complete!"