# Database Setup Guide

This guide explains how to set up the MySQL database for the Voter Management System.

## Prerequisites

1. **MySQL Server**: Install MySQL 8.0 or higher
2. **Node.js**: Ensure Node.js and npm are installed
3. **Environment Variables**: Configure the `.env` file

## Installation Steps

### 1. Install MySQL

#### Ubuntu/Debian:

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### macOS (using Homebrew):

```bash
brew install mysql
brew services start mysql
```

#### Windows:

Download and install MySQL from [official website](https://dev.mysql.com/downloads/mysql/)

### 2. Create Database and User

Connect to MySQL as root:

```bash
sudo mysql -u root -p
```

Create the database and user:

```sql
-- Create database
CREATE DATABASE voter_management_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'password' with a secure password)
CREATE USER 'voter_admin'@'localhost' IDENTIFIED BY 'secure_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON voter_management_dev.* TO 'voter_admin'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 3. Configure Environment Variables

Update the `backend/.env` file with your database credentials:

```env
DATABASE_URL="mysql://voter_admin:secure_password_123@localhost:3306/voter_management_dev"
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Generate Prisma Client

```bash
npm run db:generate
```

### 6. Run Database Migrations

```bash
npm run db:migrate
```

This will:

- Create all database tables
- Set up indexes and constraints
- Apply the initial schema

### 7. Seed the Database (Optional)

```bash
npm run db:seed
```

This will create:

- Default admin user (username: `admin`, password: `Admin@123`)
- Test manager user (username: `manager`, password: `Manager@123`)
- Sample test users with references
- Initial audit log entries

### 8. Verify Setup

```bash
npm run db:setup
```

This script will test the database connection and verify that all tables are accessible.

## Database Schema Overview

The database includes the following main tables:

- **users**: Voter information and personal details
- **documents**: File metadata for uploaded documents (stored in S3)
- **references**: Voter references with WhatsApp notification tracking
- **admins**: Administrative users with role-based access
- **audit_logs**: Comprehensive action logging for security and compliance

## Useful Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply new migration
npm run db:migrate

# Push schema changes without migration (development only)
npm run db:push

# Reset database (WARNING: This will delete all data)
npm run db:reset

# Seed database with test data
npm run db:seed

# Test database connection
npm run db:setup
```

## Production Setup

For production deployment:

1. Use a managed MySQL service (AWS RDS, Google Cloud SQL, etc.)
2. Update the `DATABASE_URL` with production credentials
3. Ensure SSL connections are enabled
4. Set up proper backup and monitoring
5. Use environment-specific database names

## Troubleshooting

### Connection Issues

1. **Access Denied**: Check username and password in `DATABASE_URL`
2. **Database Not Found**: Ensure the database exists and user has access
3. **Connection Timeout**: Check if MySQL service is running
4. **SSL Issues**: Add `?sslmode=disable` to `DATABASE_URL` for local development

### Migration Issues

1. **Schema Drift**: Use `npm run db:push` to sync schema without migrations
2. **Migration Conflicts**: Reset migrations with `npm run db:reset` (development only)
3. **Prisma Client Issues**: Regenerate client with `npm run db:generate`

### Performance

1. **Slow Queries**: Check if indexes are properly created
2. **Connection Pool**: Adjust Prisma connection pool settings if needed
3. **Query Optimization**: Use Prisma query logging to identify slow queries

## Security Considerations

1. **Strong Passwords**: Use complex passwords for database users
2. **Limited Privileges**: Grant only necessary permissions to application users
3. **Network Security**: Restrict database access to application servers only
4. **Regular Updates**: Keep MySQL server updated with security patches
5. **Backup Strategy**: Implement regular automated backups
