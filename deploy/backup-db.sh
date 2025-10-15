#!/bin/bash

# Database backup script for Voter Management System
# Add this to crontab for automated backups

set -e

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="voter_management"
DB_USER="voter_app"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[BACKUP]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    print_status "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Read database password from environment or prompt
if [ -z "$DB_PASS" ]; then
    if [ -f "/home/ubuntu/voter-management-system/backend/.env" ]; then
        # Extract password from DATABASE_URL
        DB_PASS=$(grep DATABASE_URL /home/ubuntu/voter-management-system/backend/.env | cut -d':' -f3 | cut -d'@' -f1)
    fi
    
    if [ -z "$DB_PASS" ]; then
        print_error "Database password not found. Please set DB_PASS environment variable or ensure .env file exists."
        exit 1
    fi
fi

# Create database backup
print_status "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/voter_management_$DATE.sql"

if mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"; then
    print_status "Database backup created: $BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    print_status "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    print_status "Backup size: $BACKUP_SIZE"
else
    print_error "Database backup failed!"
    exit 1
fi

# Clean up old backups (keep last 7 days)
print_status "Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "voter_management_*.sql.gz" -mtime +7 -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "voter_management_*.sql.gz" | wc -l)
print_status "Total backups retained: $BACKUP_COUNT"

# Log backup completion
echo "$(date): Database backup completed successfully - ${BACKUP_FILE}.gz ($BACKUP_SIZE)" >> "$BACKUP_DIR/backup.log"

print_status "✅ Backup process completed successfully!"