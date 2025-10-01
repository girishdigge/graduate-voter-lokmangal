# Testing Documentation

This document outlines the testing strategy and implementation for the Voter Management System.

## Testing Strategy

The project follows a comprehensive testing pyramid approach:

- **Unit Tests (70%)**: Test individual functions, components, and services
- **Integration Tests (20%)**: Test API endpoints and component interactions
- **End-to-End Tests (10%)**: Test complete user workflows

## Test Structure

```
├── backend/
│   ├── src/__tests__/
│   │   ├── setup.ts                    # Test configuration and mocks
│   │   ├── services/                   # Service layer unit tests
│   │   ├── middleware/                 # Middleware unit tests
│   │   ├── utils/                      # Utility function tests
│   │   └── integration/                # API integration tests
│   └── jest.config.js                  # Jest configuration
├── frontend-public/
│   ├── src/__tests__/
│   │   ├── setup.ts                    # Test configuration
│   │   ├── components/                 # Component unit tests
│   │   └── hooks/                      # Custom hook tests
│   └── vitest.config.ts                # Vitest configuration
├── frontend-admin/
│   ├── src/__tests__/
│   │   ├── setup.ts                    # Test configuration
│   │   └── components/                 # Admin component tests
│   └── vitest.config.ts                # Vitest configuration
└── e2e/
    ├── tests/                          # End-to-end test scenarios
    └── playwright.config.ts            # Playwright configuration
```

## Running Tests

### All Tests

```bash
npm run test                    # Run all unit and integration tests
npm run test:coverage          # Run tests with coverage report
npm run test:e2e               # Run end-to-end tests
npm run test:e2e:ui            # Run E2E tests with UI
```

### Backend Tests

```bash
cd backend
npm test                       # Run all backend tests
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Generate coverage report
```

### Frontend Tests

```bash
cd frontend-public
npm test                       # Run public frontend tests
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Generate coverage report

cd frontend-admin
npm test                       # Run admin frontend tests
```

## Test Categories

### Backend Unit Tests

#### Service Layer Tests

- **UserService**: User creation, validation, and retrieval
- **DocumentService**: File upload and management
- **ReferenceService**: Reference management and WhatsApp integration
- **AdminService**: Admin authentication and management
- **SearchService**: Elasticsearch integration

#### Middleware Tests

- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **Error Handling**: Error response formatting
- **Rate Limiting**: Request throttling

#### Utility Tests

- **JWT Utils**: Token generation and verification
- **Validation**: Input sanitization and validation
- **Security**: CSRF protection and input sanitization

### Frontend Unit Tests

#### Component Tests

- **UI Components**: Button, Input, Modal, etc.
- **Form Components**: Enrollment form sections
- **Authentication**: Login and Aadhar check components
- **Dashboard**: User and admin dashboard components

#### Hook Tests

- **useAuth**: Authentication state management
- **useApi**: API interaction hooks
- **useForm**: Form state and validation

### Integration Tests

#### API Endpoint Tests

- **Aadhar Check**: Format validation and user lookup
- **User Enrollment**: Complete registration flow
- **Document Upload**: File upload and validation
- **Admin Operations**: Voter management and verification

#### Database Integration

- **User Operations**: CRUD operations with Prisma
- **Document Storage**: S3 integration testing
- **Search Integration**: Elasticsearch indexing and querying

### End-to-End Tests

#### Critical User Journeys

- **Voter Enrollment**: Complete registration process
- **Document Upload**: File upload and preview
- **Admin Login**: Authentication and dashboard access
- **Voter Management**: Search, filter, and verification
- **Reference Management**: Adding and tracking references

## Test Data and Mocking

### Backend Mocks

- **Database**: Prisma Client mocked for unit tests
- **AWS S3**: S3 operations mocked with jest
- **Elasticsearch**: Search operations mocked
- **External APIs**: WhatsApp API mocked

### Frontend Mocks

- **API Calls**: Axios requests mocked with MSW or Vitest
- **Browser APIs**: Contact Picker, MediaDevices mocked
- **Local Storage**: Browser storage mocked
- **File Operations**: File upload and preview mocked

### Test Database

- Separate test database for integration tests
- Automated seeding and cleanup
- Transaction rollback for test isolation

## Coverage Requirements

### Minimum Coverage Targets

- **Overall**: 80% line coverage
- **Services**: 90% line coverage
- **Controllers**: 85% line coverage
- **Components**: 80% line coverage
- **Utilities**: 95% line coverage

### Coverage Reports

- HTML reports generated in `coverage/` directories
- LCOV format for CI/CD integration
- Coverage badges for documentation

## Continuous Integration

### Pre-commit Hooks

- Lint and format checking
- Unit test execution
- Type checking
- Security vulnerability scanning

### CI/CD Pipeline

- Automated test execution on pull requests
- Integration tests in staging environment
- E2E tests on deployment
- Coverage reporting and tracking

## Test Best Practices

### Unit Tests

- Test one thing at a time
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test both success and error scenarios

### Integration Tests

- Test realistic scenarios
- Use test database with proper cleanup
- Test API contracts and responses
- Verify error handling and edge cases

### E2E Tests

- Focus on critical user journeys
- Use page object pattern for maintainability
- Test across different browsers and devices
- Include accessibility testing

### Component Tests

- Test user interactions, not implementation
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility and keyboard navigation
- Mock external dependencies and APIs

## Debugging Tests

### Backend Tests

```bash
# Debug with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test file
npm test -- userService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create user"
```

### Frontend Tests

```bash
# Debug with Vitest UI
npm run test:watch

# Run specific test file
npm test -- Button.test.tsx

# Debug with browser
npm test -- --reporter=verbose
```

### E2E Tests

```bash
# Run with headed browser
npx playwright test --headed

# Debug specific test
npx playwright test --debug voter-enrollment.spec.ts

# Generate test report
npx playwright show-report
```

## Performance Testing

### Load Testing

- API endpoint performance under load
- Database query optimization
- File upload performance
- Search query performance

### Frontend Performance

- Component rendering performance
- Bundle size optimization
- Image loading and optimization
- Network request optimization

## Security Testing

### Backend Security

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Authentication and authorization

### Frontend Security

- Input sanitization
- Secure file upload
- XSS prevention
- Content Security Policy compliance

## Accessibility Testing

### Automated Testing

- axe-core integration in component tests
- Lighthouse accessibility audits
- WAVE tool integration

### Manual Testing

- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- Focus management testing

## Maintenance

### Test Maintenance

- Regular test review and cleanup
- Update tests when requirements change
- Remove obsolete tests
- Refactor test utilities and helpers

### Documentation

- Keep test documentation updated
- Document test patterns and conventions
- Maintain test data and fixtures
- Update CI/CD configurations
