# Admin Dashboard Frontend

This is the administrative interface for the Voter Management System.

## Features

- **Authentication**: Secure login for admin and manager users
- **Role-based Access Control**: Different permissions for admin vs manager roles
- **Responsive Design**: Works on desktop and mobile devices
- **Dashboard**: Overview of system statistics
- **Voter Management**: View and manage voter registrations (to be implemented)
- **Reference Management**: Manage voter references (to be implemented)
- **Settings**: Admin-only settings and user management (to be implemented)

## Technology Stack

- React 19 with TypeScript
- React Router for navigation
- TanStack Query for server state management
- React Hook Form with Zod validation
- Tailwind CSS for styling
- Lucide React for icons
- Axios for API calls

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Update the API URL in `.env` if needed:

   ```
   VITE_API_URL=http://localhost:3000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Header, Sidebar, AdminLayout)
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts (AuthContext)
├── lib/                # Utilities and API configuration
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

## Authentication

The admin dashboard uses JWT-based authentication with role-based access control:

- **Admin**: Full access to all features including user management
- **Manager**: Limited access, cannot manage other users

## Environment Variables

- `VITE_API_URL`: Backend API base URL
- `VITE_NODE_ENV`: Environment (development/production)

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.
