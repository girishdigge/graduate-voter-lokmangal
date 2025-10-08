const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'backend/src/controllers/adminController.ts',
  'backend/src/controllers/referenceController.ts',
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace .error.errors with .error.issues
    content = content.replace(
      /validationResult\.error\.errors/g,
      'validationResult.error.issues'
    );

    // Fix the errorMap issue in referenceController
    if (filePath.includes('referenceController')) {
      content = content.replace(
        /errorMap: \(\) => \(\{/g,
        '// errorMap: () => ({'
      );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Done fixing Zod errors');
