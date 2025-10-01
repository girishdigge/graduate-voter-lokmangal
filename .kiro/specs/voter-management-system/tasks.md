# Implementation Plan

- [x] 1. Project Setup and Infrastructure Foundation
  - Initialize monorepo structure with separate frontend-public, frontend-admin, and backend directories
  - Configure package.json files with all required dependencies for React, Express, Prisma, and AWS services
  - Set up environment configuration files (.env.example) for all three applications
  - Configure ESLint, Prettier, and TypeScript configurations across all projects
  - Set up Git repository with proper .gitignore files
  - _Requirements: 10.4, 10.5_

- [x] 2. Database Schema and Prisma Setup
  - Create Prisma schema file with all database models (Users, Documents, References, Admins, AuditLogs)

  - Configure database connection and generate Prisma client
  - Create initial database migration with all tables, indexes, and constraints
  - Implement database seeding script with initial admin user and test data
  - _Requirements: 6.2, 9.2, 10.1_

- [x] 3. Backend Core Infrastructure
  - Set up Express.js server with essential middleware (CORS, helmet, compression, rate limiting)
  - Implement Winston logging configuration with proper log levels and formats
  - Create error handling middleware with standardized error response format
  - Set up JWT authentication utilities and middleware functions
  - Configure AWS SDK for S3 and implement basic S3 connection testing
  - _Requirements: 6.1, 6.3, 10.3, 10.4, 10.5, 10.6_

- [x] 4. User Authentication and Aadhar Check API
  - Implement POST /api/aadhar/check endpoint with Aadhar format validation
  - Create user lookup service to check existing Aadhar numbers in database
  - Implement JWT token generation and validation for user sessions
  - Add rate limiting specifically for Aadhar check endpoint to prevent abuse
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. User Enrollment API and Validation
  - Create POST /api/users/enroll endpoint with comprehensive input validation
  - Implement Zod validation schemas for all user input fields
  - Add age calculation logic from date of birth
  - Create user creation service with database transaction handling
  - Implement audit logging for user creation actions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.1_

- [x] 6. Document Upload and Management System
  - Configure Multer with S3 integration for file uploads
  - Implement file validation (size, type, malware scanning)
  - Create document upload service with S3 storage and database metadata
  - Implement signed URL generation for secure document access
  - Add document replacement functionality with old file cleanup
  - Create GET /api/documents/:userId/:documentType and POST /api/documents/:userId/upload endpoints
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.2_

- [x] 7. Reference Management and WhatsApp Integration
  - Implement POST /api/references/:userId endpoint for adding references
  - Create reference validation and database storage logic
  - Set up WhatsApp Business API integration or third-party service
  - Implement WhatsApp message sending with reference notification templates
  - Add reference status tracking and update functionality
  - Create GET /api/references/:userId endpoint for retrieving user references
  - _Requirements: 4.1, 4.4, 4.5_

- [x] 8. User Dashboard and Profile Management
  - Create GET /api/users/:userId endpoint with authentication middleware
  - Implement PUT /api/users/:userId endpoint for profile updates
  - Add document download functionality with signed URLs
  - Implement user session validation and token refresh logic
  - Create audit logging for all user profile changes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Admin Authentication and Authorization System
  - Implement POST /api/admin/login with bcrypt password validation
  - Create admin JWT token generation with role information
  - Add admin authentication middleware with role-based access control
  - Implement POST /api/admin/logout and PUT /api/admin/password endpoints
  - Create session management and token validation for admin routes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Elasticsearch Integration and Search Service
  - Set up Elasticsearch client and connection configuration
  - Create user indexing service to sync user data with Elasticsearch
  - Implement search service with query building for name, Aadhar, and contact searches
  - Add filtering capabilities for verification status, sex, assembly, and polling station
  - Create real-time indexing triggers for user create/update operations
  - Implement GET /api/admin/search/voters and GET /api/admin/search/references endpoints
  - _Requirements: 7.3, 7.4, 8.2_

- [x] 11. Admin Dashboard Statistics and Voter Management
  - Create GET /api/admin/stats endpoint with voter count aggregations
  - Implement GET /api/admin/voters endpoint with pagination, search, and filtering
  - Add GET /api/admin/voters/:userId endpoint for detailed voter information
  - Create PUT /api/admin/voters/:userId/verify endpoint for voter verification
  - Implement PUT /api/admin/voters/:userId endpoint for admin voter updates
  - Add comprehensive audit logging for all admin actions
  - _Requirements: 7.1, 7.2, 7.5, 7.6, 7.7, 10.1_

- [x] 12. Reference Management for Admins
  - Implement GET /api/admin/references endpoint with pagination and filtering
  - Create PUT /api/admin/references/:referenceId endpoint for status updates
  - Add reference search functionality integrated with Elasticsearch
  - Implement audit logging for reference status changes
  - _Requirements: 8.1, 8.3, 8.4, 8.5_

- [x] 13. Manager and Admin User Management
  - Create GET /api/admin/managers endpoint for listing all managers
  - Implement POST /api/admin/managers endpoint for creating new manager accounts
  - Add PUT /api/admin/managers/:managerId endpoint for updating manager details
  - Create DELETE /api/admin/managers/:managerId endpoint for deactivating managers
  - Implement role-based access control ensuring only admins can manage managers
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 14. Public Portal Frontend - Core Components and Routing
  - Set up React application with Vite, React Router, and Tailwind CSS
  - Create main App component with routing configuration
  - Implement common UI components (Button, Input, Select, Modal, LoadingSpinner)
  - Create AuthContext for user session management
  - Set up Axios configuration with interceptors for API calls
  - _Requirements: 1.1, 5.1_

- [x] 15. Aadhar Check and Landing Page Implementation
  - Create LandingPage component with Aadhar check modal
  - Implement AadharCheckModal with 12-digit validation and API integration
  - Add user lookup functionality with existing user detection
  - Create navigation logic for new vs existing users
  - Implement error handling and user feedback for Aadhar check process
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 16. Enrollment Form Implementation
  - Create EnrollmentForm component with multi-section layout
  - Implement PersonalInfoSection with all personal detail fields
  - Add AddressSection with city defaulting to PUNE and proper validation
  - Create ElectorSection with conditional fields for registered electors
  - Implement EducationSection for university and graduation details
  - Add form validation using React Hook Form and Zod schemas
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 17. Document Upload Frontend Components
  - Create DocumentUpload component with drag-and-drop functionality using react-dropzone
  - Implement ImagePreview component with compression and cropping capabilities
  - Add CameraCapture component for mobile photo capture
  - Create ImageCropper component using react-image-crop
  - Implement file validation, progress tracking, and error handling
  - Add document replacement functionality with confirmation dialogs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 18. Contact Picker and Reference Management Frontend
  - Implement ContactPicker component with native Contact Picker API detection
  - Create ManualReferenceModal as fallback for manual reference entry
  - Add CSVImport component for bulk reference import
  - Create ReferenceList component for displaying and managing references
  - Implement WhatsApp notification status display and tracking
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 19. User Dashboard Frontend Implementation
  - Create UserDashboard component with view/edit mode toggle
  - Implement UserProfile component for displaying personal information
  - Add DocumentsList component with secure download links
  - Create ReferencesList component showing reference status
  - Implement edit functionality with form validation and update API calls
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 20. Admin Dashboard Frontend - Authentication and Layout
  - Set up admin React application with separate routing and authentication
  - Create LoginPage component with admin credential validation
  - Implement AdminLayout component with sidebar navigation and header
  - Add AdminAuthContext for admin session management
  - Create role-based navigation and access control
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 21. Admin Dashboard - Statistics and Overview
  - Create DashboardPage component with statistics cards
  - Implement StatsCard component for displaying voter counts and metrics
  - Add recent activity feed showing latest enrollments and verifications
  - Create responsive dashboard layout with proper data visualization
  - _Requirements: 7.1_

- [ ] 22. Admin Voters Management Interface
  - Create VotersPage component with TanStack Table integration
  - Implement VotersTable component with pagination, sorting, and filtering
  - Add SearchBar component with Elasticsearch integration
  - Create FilterPanel component for multi-criteria filtering
  - Implement VoterDetailModal for viewing complete voter information
  - Add VoterEditModal for admin voter updates
  - Create VerifyButton component for voter verification actions
  - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 23. Admin References Management Interface
  - Create ReferencesPage component with reference management table
  - Implement ReferencesTable component with search and filtering
  - Add StatusDropdown component for updating reference status
  - Create ReferenceSearchBar with Elasticsearch integration
  - Implement bulk status update functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 24. Admin Settings and Manager Management
  - Create SettingsPage component with role-based sections
  - Implement PasswordChangeForm for manager password updates
  - Add ManagersTable component for admin user management (admin role only)
  - Create AddManagerModal for creating new manager accounts
  - Implement EditManagerModal for updating manager details
  - Add DeleteConfirmModal for manager deactivation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 25. Security Hardening and Production Optimization
  - Implement comprehensive input sanitization across all API endpoints
  - Add CSRF protection for all form submissions
  - Configure security headers with Helmet.js
  - Implement proper error handling without information leakage
  - Add request logging and monitoring with correlation IDs
  - Configure production-ready CORS policies
  - _Requirements: 10.3, 10.4, 10.5, 10.6_

- [ ]\* 26. Testing Implementation
  - [ ]\* 26.1 Write unit tests for all backend services and middleware
  - [ ]\* 26.2 Create integration tests for API endpoints with test database
  - [ ]\* 26.3 Implement frontend component tests using React Testing Library
  - [ ]\* 26.4 Add end-to-end tests for critical user journeys using Playwright
  - [ ]\* 26.5 Create performance tests for file upload and search functionality
  - _Requirements: All requirements validation_

- [ ] 27. Deployment Configuration and Documentation
  - Create Docker configurations for all applications
  - Set up AWS infrastructure configuration (EC2, RDS, S3, CloudFront)
  - Configure CI/CD pipeline with automated testing and deployment
  - Create comprehensive API documentation with Postman collection
  - Write deployment guide and system administration documentation
  - Set up monitoring and alerting with CloudWatch
  - _Requirements: 10.1, 10.2, 10.3_
