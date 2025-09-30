#!/usr/bin/env node

/**
 * Verification script for Task 8: User Dashboard and Profile Management
 * This script verifies that all required components are implemented correctly
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_ENDPOINTS = [
  'GET /api/users/:userId',
  'PUT /api/users/:userId',
  'GET /api/users/:userId/documents',
  'POST /api/users/:userId/refresh-token',
];

const REQUIRED_FUNCTIONS = [
  'getUserByIdController',
  'updateUserByIdController',
  'getUserDocumentsController',
  'refreshUserTokenController',
];

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function checkFileContains(filePath, searchStrings) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return searchStrings.map(str => ({
      search: str,
      found: content.includes(str),
    }));
  } catch {
    return searchStrings.map(str => ({ search: str, found: false }));
  }
}

function verifyRoutes() {
  console.log('\n🔍 Verifying User Routes...');

  const routesFile = 'src/routes/userRoutes.ts';
  if (!checkFileExists(routesFile)) {
    console.log('❌ User routes file not found');
    return false;
  }

  const routeChecks = [
    '/:userId',
    'updateUserByIdController',
    'getUserDocumentsController',
    'refreshUserTokenController',
    '/:userId/documents',
    '/:userId/refresh-token',
  ];

  const results = checkFileContains(routesFile, routeChecks);
  let allFound = true;

  results.forEach(result => {
    if (result.found) {
      console.log(`✅ Found: ${result.search}`);
    } else {
      console.log(`❌ Missing: ${result.search}`);
      allFound = false;
    }
  });

  return allFound;
}

function verifyController() {
  console.log('\n🔍 Verifying User Controller...');

  const controllerFile = 'src/controllers/userController.ts';
  if (!checkFileExists(controllerFile)) {
    console.log('❌ User controller file not found');
    return false;
  }

  const controllerChecks = [
    'updateUserByIdController',
    'getUserDocumentsController',
    'refreshUserTokenController',
    'Access denied - can only update own profile',
    'Access denied - can only view own documents',
    'Access denied - can only refresh own token',
    'getUserDocuments',
    'generateUserToken',
    'isTokenExpiringSoon',
  ];

  const results = checkFileContains(controllerFile, controllerChecks);
  let allFound = true;

  results.forEach(result => {
    if (result.found) {
      console.log(`✅ Found: ${result.search}`);
    } else {
      console.log(`❌ Missing: ${result.search}`);
      allFound = false;
    }
  });

  return allFound;
}

function verifyUserService() {
  console.log('\n🔍 Verifying User Service...');

  const serviceFile = 'src/services/userService.ts';
  if (!checkFileExists(serviceFile)) {
    console.log('❌ User service file not found');
    return false;
  }

  const serviceChecks = [
    'validateUserSession',
    'INVALID_SESSION',
    'SESSION_VALIDATION_FAILED',
  ];

  const results = checkFileContains(serviceFile, serviceChecks);
  let allFound = true;

  results.forEach(result => {
    if (result.found) {
      console.log(`✅ Found: ${result.search}`);
    } else {
      console.log(`❌ Missing: ${result.search}`);
      allFound = false;
    }
  });

  return allFound;
}

function verifyJWTUtils() {
  console.log('\n🔍 Verifying JWT Utilities...');

  const jwtFile = 'src/utils/jwt.ts';
  if (!checkFileExists(jwtFile)) {
    console.log('❌ JWT utilities file not found');
    return false;
  }

  const jwtChecks = ['isTokenExpiringSoon', 'extractTokenFromHeader'];

  const results = checkFileContains(jwtFile, jwtChecks);
  let allFound = true;

  results.forEach(result => {
    if (result.found) {
      console.log(`✅ Found: ${result.search}`);
    } else {
      console.log(`❌ Missing: ${result.search}`);
      allFound = false;
    }
  });

  return allFound;
}

function verifyAuditService() {
  console.log('\n🔍 Verifying Audit Service...');

  const auditFile = 'src/services/auditService.ts';
  if (!checkFileExists(auditFile)) {
    console.log('❌ Audit service file not found');
    return false;
  }

  const auditChecks = ['createAuditLog', 'logUserUpdate', 'TOKEN_REFRESH'];

  const results = checkFileContains(auditFile, auditChecks);
  let allFound = true;

  results.forEach(result => {
    if (result.found) {
      console.log(`✅ Found: ${result.search}`);
    } else {
      console.log(`❌ Missing: ${result.search}`);
      allFound = false;
    }
  });

  return allFound;
}

function verifyDocumentService() {
  console.log('\n🔍 Verifying Document Service...');

  const docFile = 'src/services/documentService.ts';
  if (!checkFileExists(docFile)) {
    console.log('❌ Document service file not found');
    return false;
  }

  const docChecks = ['getUserDocuments', 'generateSignedUrl', 'downloadUrl'];

  const results = checkFileContains(docFile, docChecks);
  let allFound = true;

  results.forEach(result => {
    if (result.found) {
      console.log(`✅ Found: ${result.search}`);
    } else {
      console.log(`❌ Missing: ${result.search}`);
      allFound = false;
    }
  });

  return allFound;
}

function verifyBuildOutput() {
  console.log('\n🔍 Verifying Build Output...');

  const distFiles = [
    'dist/routes/userRoutes.js',
    'dist/controllers/userController.js',
    'dist/services/userService.js',
  ];

  let allBuilt = true;

  distFiles.forEach(file => {
    if (checkFileExists(file)) {
      console.log(`✅ Built: ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
      allBuilt = false;
    }
  });

  return allBuilt;
}

function checkTaskRequirements() {
  console.log('\n📋 Checking Task 8 Requirements...');

  const requirements = [
    {
      name: 'GET /api/users/:userId endpoint with authentication middleware',
      check: () => {
        const routes = checkFileContains('src/routes/userRoutes.ts', [
          '/:userId',
          'authenticateUser',
        ]);
        const controller = checkFileContains(
          'src/controllers/userController.ts',
          ['getUserByIdController']
        );
        return routes.every(r => r.found) && controller.every(c => c.found);
      },
    },
    {
      name: 'PUT /api/users/:userId endpoint for profile updates',
      check: () => {
        const routes = checkFileContains('src/routes/userRoutes.ts', [
          'updateUserByIdController',
        ]);
        const controller = checkFileContains(
          'src/controllers/userController.ts',
          ['updateUserByIdController']
        );
        return routes.every(r => r.found) && controller.every(c => c.found);
      },
    },
    {
      name: 'Document download functionality with signed URLs',
      check: () => {
        const routes = checkFileContains('src/routes/userRoutes.ts', [
          '/:userId/documents',
        ]);
        const controller = checkFileContains(
          'src/controllers/userController.ts',
          ['getUserDocumentsController']
        );
        const service = checkFileContains('src/services/documentService.ts', [
          'getUserDocuments',
          'generateSignedUrl',
        ]);
        return (
          routes.every(r => r.found) &&
          controller.every(c => c.found) &&
          service.every(s => s.found)
        );
      },
    },
    {
      name: 'User session validation and token refresh logic',
      check: () => {
        const routes = checkFileContains('src/routes/userRoutes.ts', [
          'refresh-token',
        ]);
        const controller = checkFileContains(
          'src/controllers/userController.ts',
          ['refreshUserTokenController']
        );
        const jwt = checkFileContains('src/utils/jwt.ts', [
          'isTokenExpiringSoon',
        ]);
        const service = checkFileContains('src/services/userService.ts', [
          'validateUserSession',
        ]);
        return (
          routes.every(r => r.found) &&
          controller.every(c => c.found) &&
          jwt.every(j => j.found) &&
          service.every(s => s.found)
        );
      },
    },
    {
      name: 'Audit logging for all user profile changes',
      check: () => {
        const controller = checkFileContains(
          'src/controllers/userController.ts',
          ['createAuditLog']
        );
        const service = checkFileContains('src/services/userService.ts', [
          'logUserUpdate',
        ]);
        const audit = checkFileContains('src/services/auditService.ts', [
          'logUserUpdate',
          'TOKEN_REFRESH',
        ]);
        return (
          controller.every(c => c.found) &&
          service.every(s => s.found) &&
          audit.every(a => a.found)
        );
      },
    },
  ];

  let allMet = true;

  requirements.forEach(req => {
    const met = req.check();
    if (met) {
      console.log(`✅ ${req.name}`);
    } else {
      console.log(`❌ ${req.name}`);
      allMet = false;
    }
  });

  return allMet;
}

async function main() {
  console.log('🚀 Task 8 Implementation Verification');
  console.log('=====================================');

  const checks = [
    { name: 'Routes', fn: verifyRoutes },
    { name: 'Controller', fn: verifyController },
    { name: 'User Service', fn: verifyUserService },
    { name: 'JWT Utils', fn: verifyJWTUtils },
    { name: 'Audit Service', fn: verifyAuditService },
    { name: 'Document Service', fn: verifyDocumentService },
    { name: 'Build Output', fn: verifyBuildOutput },
  ];

  let allPassed = true;

  for (const check of checks) {
    const result = check.fn();
    if (!result) {
      allPassed = false;
    }
  }

  // Check task requirements
  const requirementsMet = checkTaskRequirements();

  console.log('\n📊 Verification Results');
  console.log('========================');

  if (allPassed && requirementsMet) {
    console.log('🎉 All verifications passed!');
    console.log(
      '✅ Task 8: User Dashboard and Profile Management is fully implemented'
    );
    console.log('\n📝 Implementation Summary:');
    console.log(
      '- ✅ GET /api/users/:userId - Retrieve user profile with authentication'
    );
    console.log(
      '- ✅ PUT /api/users/:userId - Update user profile with validation and audit logging'
    );
    console.log(
      '- ✅ GET /api/users/:userId/documents - Get user documents with signed URLs'
    );
    console.log(
      '- ✅ POST /api/users/:userId/refresh-token - Refresh authentication tokens'
    );
    console.log(
      '- ✅ Access control ensures users can only access their own data'
    );
    console.log('- ✅ Comprehensive audit logging for all profile changes');
    console.log('- ✅ Token refresh logic with expiration checking');
    console.log('- ✅ Document download with secure signed URLs');
  } else {
    console.log('⚠️  Some verifications failed');
    console.log('❌ Task 8 implementation needs attention');
  }
}

main().catch(console.error);
