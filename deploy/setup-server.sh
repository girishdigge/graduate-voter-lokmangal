#!/bin/bash

# AWS EC2 Ubuntu Server Setup Script for Voter Management System
# Run this script as ubuntu user after connecting to your EC2 instance

set -e

echo "🚀 Starting server setup for Voter Management System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common htop ufw

# Install Node.js 20.x
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js version: $NODE_VERSION"
print_status "NPM version: $NPM_VERSION"

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install MySQL Server
print_status "Installing MySQL Server..."
sudo apt install -y mysql-server

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Setup firewall
print_status "Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000

print_status "UFW status:"
sudo ufw status

# Create application directory
print_status "Creating application directory..."
mkdir -p /home/ubuntu/voter-management-system
mkdir -p /home/ubuntu/backups
mkdir -p /home/ubuntu/logs

# Set proper permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/voter-management-system
sudo chown -R ubuntu:ubuntu /home/ubuntu/backups
sudo chown -R ubuntu:ubuntu /home/ubuntu/logs

print_status "✅ Server setup completed!"
print_warning "Next steps:"
echo "1. Secure MySQL installation: sudo mysql_secure_installation"
echo "2. Configure MySQL database and user"
echo "3. Clone your application repository"
echo "4. Configure environment variables"
echo "5. Setup Nginx configuration"
echo "6. Deploy your application"

print_status "MySQL secure installation will start in 5 seconds..."
sleep 5
sudo mysql_secure_installation