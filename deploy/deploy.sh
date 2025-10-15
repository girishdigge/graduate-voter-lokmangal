#!/bin/bash

# Deployment script for Voter Management System
# Run this script from the project root directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_header "🚀 Starting deployment process..."

# Pull latest changes
print_status "Pulling latest changes from git..."
git pull origin main

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the application
print_status "Building application..."
npm run build

# Check if build was successful
if [ ! -d "frontend-public/dist" ] || [ ! -d "frontend-admin/dist" ] || [ ! -d "backend/dist" ]; then
    print_error "Build failed! Please check the build output above."
    exit 1
fi

print_status "✅ Build completed successfully!"

# Backend setup
print_status "Setting up backend..."
cd backend

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migrations
print_status "Running database migrations..."
npx prisma db push

cd ..

# Copy PM2 ecosystem file
if [ -f "deploy/ecosystem.config.js" ]; then
    print_status "Copying PM2 configuration..."
    cp deploy/ecosystem.config.js .
fi

# Create logs directory
mkdir -p logs

# Restart PM2 application
print_status "Restarting application with PM2..."
if pm2 describe voter-management-api > /dev/null 2>&1; then
    pm2 restart voter-management-api
else
    pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save

# Reload Nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx

# Check application status
print_status "Checking application status..."
pm2 status

print_header "✅ Deployment completed successfully!"
print_status "Application is running at:"
echo "  - Public Frontend: http://$(curl -s ifconfig.me)"
echo "  - Admin Frontend: http://$(curl -s ifconfig.me)/admin"
echo "  - API: http://$(curl -s ifconfig.me)/api"

print_warning "Don't forget to:"
echo "1. Configure your domain DNS if using a custom domain"
echo "2. Setup SSL certificate with Let's Encrypt"
echo "3. Configure environment variables properly"
echo "4. Test all functionality"