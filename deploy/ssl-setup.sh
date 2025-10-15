#!/bin/bash

# SSL Certificate Setup Script using Let's Encrypt
# Run this script after configuring your domain DNS

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[SSL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <domain.com>"
    print_error "Example: $0 myvoterapp.com"
    exit 1
fi

DOMAIN=$1
WWW_DOMAIN="www.$DOMAIN"

print_status "Setting up SSL certificate for $DOMAIN and $WWW_DOMAIN"

# Install Certbot
print_status "Installing Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    print_error "Nginx is not running. Please start Nginx first."
    exit 1
fi

# Update Nginx configuration with the domain
print_status "Updating Nginx configuration with domain..."
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/voter-management

# Test Nginx configuration
if ! sudo nginx -t; then
    print_error "Nginx configuration test failed. Please check your configuration."
    exit 1
fi

# Reload Nginx
sudo systemctl reload nginx

# Obtain SSL certificate
print_status "Obtaining SSL certificate from Let's Encrypt..."
if sudo certbot --nginx -d "$DOMAIN" -d "$WWW_DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"; then
    print_status "✅ SSL certificate obtained successfully!"
else
    print_error "Failed to obtain SSL certificate. Please check:"
    echo "1. Domain DNS is pointing to this server"
    echo "2. Ports 80 and 443 are open"
    echo "3. Domain is accessible from the internet"
    exit 1
fi

# Test automatic renewal
print_status "Testing automatic certificate renewal..."
if sudo certbot renew --dry-run; then
    print_status "✅ Automatic renewal test passed!"
else
    print_warning "Automatic renewal test failed. You may need to renew certificates manually."
fi

# Setup automatic renewal cron job
print_status "Setting up automatic renewal cron job..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

print_status "✅ SSL setup completed successfully!"
print_status "Your site is now available at:"
echo "  - https://$DOMAIN"
echo "  - https://$WWW_DOMAIN"
echo "  - Admin: https://$DOMAIN/admin"
echo "  - API: https://$DOMAIN/api"

print_warning "Certificate will auto-renew. Check renewal status with:"
echo "  sudo certbot certificates"