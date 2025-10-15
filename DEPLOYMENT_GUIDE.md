# AWS EC2 Deployment Guide

This guide will help you deploy the Voter Management System on AWS EC2 with a self-hosted MySQL database.

## Prerequisites

1. AWS Account with EC2 access
2. Domain name (optional, but recommended)
3. Basic knowledge of Linux/Ubuntu server administration

## Step 1: Launch EC2 Instance

### Instance Configuration

- **AMI**: Ubuntu Server 24.04 LTS
- **Instance Type**: t3.medium (minimum) or t3.large (recommended)
- **Storage**: 30GB GP3 SSD (minimum)
- **Security Group**: Configure ports as described below

### Security Group Rules

```
Type            Protocol    Port Range    Source
SSH             TCP         22           Your IP/0.0.0.0/0
HTTP            TCP         80           0.0.0.0/0
HTTPS           TCP         443          0.0.0.0/0
MySQL/Aurora    TCP         3306         Security Group ID (self-reference)
Custom TCP      TCP         3000         0.0.0.0/0 (API)
Custom TCP      TCP         5173         0.0.0.0/0 (Dev - optional)
```

## Step 2: Connect to Your Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 3: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version
npm --version
```

## Step 4: Install and Configure MySQL

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Configure MySQL
sudo mysql -u root -p
```

In MySQL console:

```sql
-- Create database
CREATE DATABASE voter_management;

-- Create user for the application
CREATE USER 'voter_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON voter_management.* TO 'voter_app'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

## Step 5: Install PM2 Process Manager

```bash
sudo npm install -g pm2
```

## Step 6: Clone and Setup Application

```bash
# Clone your repository
git clone https://github.com/your-username/voter-management-system.git
cd voter-management-system

# Install dependencies
npm install

# Build the application
npm run build
```

## Step 7: Environment Configuration

Create production environment files:

### Backend Environment (.env)

```bash
cd backend
cp .env.example .env
nano .env
```

Configure the following variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://voter_app:your_secure_password@localhost:3306/voter_management"

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# AWS S3 Configuration
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-s3-bucket-name

# WhatsApp API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# CORS Configuration
CORS_ORIGIN=http://your-domain.com,https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=3

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password
```

## Step 8: Database Setup

```bash
# Generate Prisma client
cd backend
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional)
npm run db:seed
```

## Step 9: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/voter-management
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Admin Frontend
    location /admin {
        alias /home/ubuntu/voter-management-system/frontend-admin/dist;
        try_files $uri $uri/ /admin/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Public Frontend (default)
    location / {
        root /home/ubuntu/voter-management-system/frontend-public/dist;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

Enable the site:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/voter-management /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 10: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Step 11: Start Application with PM2

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'voter-management-api',
      script: './backend/dist/index.js',
      cwd: '/home/ubuntu/voter-management-system',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
    },
  ],
};
```

Start the application:

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 12: Setup Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow API port (if needed for direct access)
sudo ufw allow 3000

# Check status
sudo ufw status
```

## Step 13: Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/voter-management
```

```
/home/ubuntu/voter-management-system/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Step 14: Setup Monitoring and Backups

### Database Backup Script

```bash
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="voter_management"
DB_USER="voter_app"
DB_PASS="your_secure_password"

mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/voter_management_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "voter_management_*.sql" -mtime +7 -delete

echo "Database backup completed: voter_management_$DATE.sql"
```

Make it executable and add to crontab:

```bash
chmod +x ~/backup-db.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add this line:
# 0 2 * * * /home/ubuntu/backup-db.sh >> /home/ubuntu/backup.log 2>&1
```

## Step 15: Application Updates

Create update script:

```bash
nano ~/update-app.sh
```

```bash
#!/bin/bash
cd /home/ubuntu/voter-management-system

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Restarting API..."
pm2 restart voter-management-api

echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "Update completed!"
```

Make it executable:

```bash
chmod +x ~/update-app.sh
```

## Monitoring and Maintenance

### Check Application Status

```bash
# PM2 status
pm2 status
pm2 logs voter-management-api

# Nginx status
sudo systemctl status nginx

# MySQL status
sudo systemctl status mysql

# System resources
htop
df -h
free -h
```

### Common Troubleshooting

```bash
# Restart services
pm2 restart voter-management-api
sudo systemctl restart nginx
sudo systemctl restart mysql

# Check logs
pm2 logs voter-management-api --lines 100
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/mysql/error.log

# Check ports
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3306
```

## Security Best Practices

1. **Regular Updates**: Keep system and packages updated
2. **Strong Passwords**: Use complex passwords for all accounts
3. **SSH Key Authentication**: Disable password authentication
4. **Firewall**: Keep UFW enabled with minimal required ports
5. **SSL/TLS**: Always use HTTPS in production
6. **Database Security**: Restrict MySQL access to localhost only
7. **File Permissions**: Ensure proper file permissions
8. **Regular Backups**: Automate database and file backups
9. **Monitoring**: Set up monitoring and alerting
10. **Log Management**: Regularly review and rotate logs

## Performance Optimization

1. **Enable Gzip**: Already configured in Nginx
2. **Static File Caching**: Configure browser caching
3. **Database Optimization**: Regular maintenance and indexing
4. **PM2 Clustering**: Use multiple instances for high load
5. **CDN**: Consider using CloudFront for static assets
6. **Database Connection Pooling**: Already implemented in Prisma

Your Voter Management System should now be successfully deployed on AWS EC2!

Access your application at:

- Public Frontend: http://your-domain.com
- Admin Frontend: http://your-domain.com/admin
- API: http://your-domain.com/api
