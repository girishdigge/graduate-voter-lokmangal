# Padhvidhar Matdar Sangh - Public Portal

This is the public-facing frontend application for the Padhvidhar Matdar Sangh voter management system. It provides a user-friendly interface for citizens to register as voters and manage their profiles.

## Features

- **Aadhar Check**: Verify if an Aadhar number is already registered
- **Voter Enrollment**: Complete registration form with document uploads
- **User Dashboard**: View and edit personal information
- **Document Management**: Upload and manage required documents
- **Reference System**: Add references for community verification
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **TanStack Query** for server state management
- **Axios** for API communication

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update the `.env` file with your API URL and other configuration.

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:

```bash
npm run build
```

### Linting

Run ESLint:

```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Input, etc.)
│   ├── auth/           # Authentication-related components
│   └── layout/         # Layout components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and API configuration
├── pages/              # Page components
└── types/              # TypeScript type definitions
```

## Environment Variables

- `VITE_API_URL`: Backend API URL
- `VITE_APP_NAME`: Application name
- `VITE_MAX_FILE_SIZE`: Maximum file upload size
- `VITE_ALLOWED_FILE_TYPES`: Allowed file types for uploads

## Contributing

1. Follow the existing code style
2. Run linting before committing
3. Ensure all builds pass
4. Write meaningful commit messages
