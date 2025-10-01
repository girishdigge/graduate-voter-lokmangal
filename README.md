# Padhvidhar Matdar Sangh - Voter Management System

A comprehensive voter management system designed to streamline voter enrollment and administrative oversight for Padhvidhar Matdar Sangh.

## Project Structure

This is a monorepo containing three main applications:

- **frontend-public**: Public-facing voter enrollment portal (React + Vite)
- **frontend-admin**: Administrative dashboard for voter management (React + Vite)
- **backend**: REST API server (Node.js + Express + Prisma)

## Features

### Public Portal

- Aadhar number validation and user lookup
- Comprehensive voter enrollment form
- Document upload (Aadhar, degree certificate, photo)
- Contact picker integration for references
- WhatsApp notifications for references
- User dashboard for profile management

### Admin Dashboard

- Secure admin authentication
- Voter statistics and overview
- Advanced search and filtering with Elasticsearch
- Voter verification and management
- Reference status tracking
- Manager and admin user management
- Comprehensive audit logging

## Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for routing
- **React Hook Form** with Zod validation
- **TanStack Query** for server state management
- **TanStack Table** for data grids (admin)
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend

- **Node.js** with Express.js
- **Prisma ORM** with MySQL database
- **JWT** for authentication
- **AWS S3** for document storage
- **Elasticsearch** for search functionality
- **Winston** for logging
- **Multer** for file uploads

### Infrastructure

- **MySQL 8.0** on AWS RDS
- **AWS S3** for file storage
- **AWS OpenSearch** for managed Elasticsearch
- **AWS EC2** for application hosting

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- MySQL 8.0 database
- AWS account with S3 and OpenSearch services
- WhatsApp Business API access (optional)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd voter-management-system
```

2. Install dependencies for all applications:

```bash
npm run install:all
```

3. Set up environment variables:

```bash
# Copy environment files and configure them
cp backend/.env.example backend/.env
cp frontend-public/.env.example frontend-public/.env
cp frontend-admin/.env.example frontend-admin/.env
```

4. Configure the database:

```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Development

Start all applications in development mode:

```bash
npm run dev
```

Or start individual applications:

```bash
npm run dev:backend    # Backend API (port 3000)
npm run dev:public     # Public portal (port 5173)
npm run dev:admin      # Admin dashboard (port 5174)
```

### Building for Production

Build all applications:

```bash
npm run build
```

### Code Quality

Run linting across all projects:

```bash
npm run lint
```

Run type checking:

```bash
npm run type-check
```

## Environment Configuration

### Backend (.env)

- Database connection string
- JWT secrets and expiration times
- AWS credentials and S3 configuration
- Elasticsearch connection details
- WhatsApp Business API credentials
- Security and rate limiting settings

### Frontend Public (.env)

- API base URL
- File upload configuration
- Contact picker settings
- Image processing options

### Frontend Admin (.env)

- API base URL
- Session timeout configuration
- Table pagination settings
- Search and export options

## Security Features

- JWT-based authentication with role-based access control
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload with type and size validation
- CORS configuration
- Security headers with Helmet.js
- Comprehensive audit logging
- Encrypted password storage with bcrypt

## API Documentation

The backend provides RESTful APIs for:

- User enrollment and management
- Document upload and retrieval
- Reference management with WhatsApp integration
- Admin authentication and user management
- Advanced search with Elasticsearch
- Audit logging and statistics

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write TypeScript with strict type checking
3. Add appropriate error handling and logging
4. Update documentation for new features
5. Test thoroughly before submitting changes

## License

This project is proprietary software for Padhvidhar Matdar Sangh.

## Support

For technical support or questions, please contact the development team.
