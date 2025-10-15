#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Icon mapping for lucide-react changes
const iconMappings = {
  User: 'UserIcon',
  Eye: 'EyeIcon',
  MapPin: 'MapPinIcon',
  Phone: 'PhoneIcon',
  Mail: 'MailIcon',
  GraduationCap: 'GraduationCapIcon',
  Edit3: 'Edit3Icon',
  Save: 'SaveIcon',
  Download: 'DownloadIcon',
  Printer: 'PrinterIcon',
  Image: 'ImageIcon',
  AlertCircle: 'AlertCircleIcon',
  Calendar: 'CalendarIcon',
  Check: 'CheckIcon',
  Camera: 'CameraIcon',
  RotateCcw: 'RotateCcwIcon',
  MessageCircle: 'MessageCircleIcon',
  UserCheck: 'UserCheckIcon',
  LogOut: 'LogOutIcon',
  Share: 'Share2Icon',
  HelpCircle: 'HelpCircleIcon',
  Copy: 'CopyIcon',
  ExternalLink: 'ExternalLinkIcon',
  QrCode: 'QrCodeIcon',
  Trash2: 'Trash2Icon',
  Vote: 'VoteIcon',
  Shield: 'ShieldIcon',
};

// React import fixes for React 19
const reactImportFixes = [
  {
    from: /import React, \{ ([^}]*useRef[^}]*) \} from 'react';/g,
    to: "import React, { $1 } from 'react';",
  },
  {
    from: /import React, \{ ([^}]*forwardRef[^}]*) \} from 'react';/g,
    to: "import React, { $1 } from 'react';",
  },
  {
    from: /import React, \{ ([^}]*ReactNode[^}]*) \} from 'react';/g,
    to: "import React, { $1, type ReactNode } from 'react';",
  },
  {
    from: /import React, \{ ([^}]*createContext[^}]*) \} from 'react';/g,
    to: "import React, { $1 } from 'react';",
  },
  {
    from: /import React, \{ ([^}]*useContext[^}]*) \} from 'react';/g,
    to: "import React, { $1 } from 'react';",
  },
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix React imports
  reactImportFixes.forEach(fix => {
    if (fix.from.test(content)) {
      content = content.replace(fix.from, fix.to);
      changed = true;
    }
  });

  // Fix lucide-react imports
  Object.entries(iconMappings).forEach(([oldIcon, newIcon]) => {
    const importRegex = new RegExp(
      `import \\{([^}]*?)\\b${oldIcon}\\b([^}]*?)\\} from 'lucide-react';`,
      'g'
    );
    if (importRegex.test(content)) {
      content = content.replace(importRegex, (match, before, after) => {
        const newImport = `import {${before}${newIcon}${after}} from 'lucide-react';`;
        return newImport;
      });

      // Replace usage in JSX
      const usageRegex = new RegExp(`<${oldIcon}\\b`, 'g');
      content = content.replace(usageRegex, `<${newIcon}`);
      changed = true;
    }
  });

  // Fix specific issues
  if (filePath.includes('ImageCropper.tsx')) {
    content = content.replace(
      'const [crop, setCrop] = useState<Crop>();',
      'const [crop, setCrop] = useState<Crop>({} as Crop);'
    );
    content = content.replace(
      'const [completedCrop, setCompletedCrop] = useState<PixelCrop>();',
      'const [completedCrop, setCompletedCrop] = useState<PixelCrop>({} as PixelCrop);'
    );
    changed = true;
  }

  // Fix CSS import
  if (filePath.includes('main.tsx')) {
    content = content.replace(
      "import './index.css';",
      "// import './index.css';"
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
}

// Find and fix all TypeScript/TSX files
function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.includes('node_modules') &&
      !file.includes('.git')
    ) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(filePath);
    }
  });
}

// Run fixes
console.log('Fixing TypeScript errors...');
walkDir('./frontend-public/src');
walkDir('./frontend-admin/src');
walkDir('./backend/src');

console.log('TypeScript fixes completed!');
