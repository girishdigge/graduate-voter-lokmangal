// Contact utilities for mobile web app integration

export interface Contact {
  name: string;
  tel: string;
}

export interface ContactCapabilities {
  supportsContactPicker: boolean;
  supportsWebShare: boolean;
  supportsFileAPI: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
}

/**
 * Detect device and browser capabilities for contact handling
 */
export const detectContactCapabilities = (): ContactCapabilities => {
  const userAgent = navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);

  // Check if running as PWA
  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  return {
    supportsContactPicker:
      'contacts' in navigator && 'ContactsManager' in window,
    supportsWebShare: 'share' in navigator,
    supportsFileAPI: 'File' in window && 'FileReader' in window,
    isMobile,
    isIOS,
    isAndroid,
    isPWA,
  };
};

/**
 * Attempt to access device contacts using the Contact Picker API
 */
export const pickContacts = async (
  maxContacts: number = 10
): Promise<Contact[]> => {
  if (!('contacts' in navigator)) {
    throw new Error('Contact Picker API not supported');
  }

  try {
    const contacts = await (navigator as any).contacts.select(['name', 'tel'], {
      multiple: true,
    });

    return contacts
      .filter((contact: any) => contact.name && contact.tel?.length > 0)
      .slice(0, maxContacts)
      .map((contact: any) => ({
        name: contact.name[0] || '',
        tel: contact.tel[0]?.replace(/\D/g, '') || '',
      }))
      .filter((contact: Contact) => contact.tel.length >= 10);
  } catch (error) {
    console.error('Contact picker failed:', error);
    throw error;
  }
};

/**
 * Parse vCard (.vcf) file content
 */
export const parseVCard = (vcardContent: string): Contact[] => {
  const contacts: Contact[] = [];
  const vcards = vcardContent.split('BEGIN:VCARD');

  vcards.forEach(vcard => {
    if (!vcard.trim()) return;

    const lines = vcard.split('\n');
    let name = '';
    let tel = '';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('FN:')) {
        name = trimmedLine.substring(3).trim();
      } else if (trimmedLine.startsWith('N:') && !name) {
        // Fallback to N field if FN is not available
        const nameParts = trimmedLine.substring(2).split(';');
        name = `${nameParts[1] || ''} ${nameParts[0] || ''}`.trim();
      } else if (
        trimmedLine.startsWith('TEL:') ||
        trimmedLine.includes('TEL;')
      ) {
        const telMatch = trimmedLine.match(/TEL[^:]*:(.+)/);
        if (telMatch) {
          tel = telMatch[1].replace(/\D/g, '');
        }
      }
    });

    if (name && tel && tel.length >= 10) {
      contacts.push({ name, tel });
    }
  });

  return contacts;
};

/**
 * Parse CSV content for contacts
 */
export const parseCSV = (csvContent: string): Contact[] => {
  const contacts: Contact[] = [];
  const lines = csvContent.split('\n').filter(line => line.trim());

  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes('name') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Try comma-separated values
    const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));

    if (parts.length >= 2) {
      const name = parts[0];
      const tel = parts[1].replace(/\D/g, '');

      if (name && tel && tel.length >= 10) {
        contacts.push({ name, tel });
      }
    }
  }

  return contacts;
};

/**
 * Parse bulk text input for contacts
 */
export const parseBulkText = (text: string): Contact[] => {
  const contacts: Contact[] = [];
  const lines = text.split('\n').filter(line => line.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Try different formats
    // Format 1: "Name: John Doe, Phone: 1234567890"
    let match = line.match(/name:\s*(.+?),?\s*phone:\s*(\d{10,15})/i);
    if (match) {
      contacts.push({
        name: match[1].trim(),
        tel: match[2].replace(/\D/g, ''),
      });
      continue;
    }

    // Format 2: "John Doe - 1234567890"
    match = line.match(/^(.+?)\s*[-–—]\s*(\d{10,15})$/);
    if (match) {
      contacts.push({
        name: match[1].trim(),
        tel: match[2].replace(/\D/g, ''),
      });
      continue;
    }

    // Format 3: "John Doe 1234567890"
    match = line.match(/^(.+?)\s+(\d{10,15})$/);
    if (match) {
      contacts.push({
        name: match[1].trim(),
        tel: match[2].replace(/\D/g, ''),
      });
      continue;
    }

    // Format 4: Two consecutive lines (name, then phone)
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const phoneMatch = nextLine.match(/^\+?[\d\s\-\(\)]{10,15}$/);
      if (phoneMatch) {
        contacts.push({
          name: line,
          tel: nextLine.replace(/\D/g, ''),
        });
        i++; // Skip next line as we've processed it
        continue;
      }
    }
  }

  return contacts.filter(
    contact =>
      contact.name.length > 0 &&
      contact.tel.length >= 10 &&
      contact.tel.length <= 15
  );
};

/**
 * Share contact request via Web Share API
 */
export const shareContactRequest = async (): Promise<void> => {
  if (!('share' in navigator)) {
    throw new Error('Web Share API not supported');
  }

  const shareText = `Hi! I'm registering as a voter and need to add you as a reference. Could you please share your contact details in this format?

Name: [Your Full Name]
Phone: [Your Phone Number]

Thanks!`;

  try {
    await navigator.share({
      title: 'Share Contacts for Reference',
      text: shareText,
    });
  } catch (error) {
    console.error('Share failed:', error);
    throw error;
  }
};

/**
 * Generate WhatsApp share URL for contact request
 */
export const generateWhatsAppShareURL = (): string => {
  const message = encodeURIComponent(
    "Hi! I'm registering as a voter and need to add you as a reference. Could you please share your contact details in this format?\n\nName: [Your Full Name]\nPhone: [Your Phone Number]\n\nThanks!"
  );
  return `https://wa.me/?text=${message}`;
};

/**
 * Validate contact information
 */
export const validateContact = (
  contact: Contact
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!contact.name || contact.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!contact.tel || contact.tel.length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }

  if (contact.tel && contact.tel.length > 15) {
    errors.push('Phone number must be less than 15 digits');
  }

  if (contact.tel && !/^\d+$/.test(contact.tel)) {
    errors.push('Phone number must contain only digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (tel: string): string => {
  const cleaned = tel.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  }

  return tel;
};

/**
 * Check if device supports PWA installation
 */
export const canInstallPWA = (): boolean => {
  return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
};

/**
 * Get installation instructions for the current platform
 */
export const getInstallInstructions = (
  capabilities: ContactCapabilities
): string[] => {
  if (capabilities.isIOS) {
    return [
      'Tap the Share button in Safari',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" to install the app',
      'The app will appear on your home screen with better contact access',
    ];
  }

  if (capabilities.isAndroid) {
    return [
      'Tap the menu (⋮) in your browser',
      'Select "Add to Home screen" or "Install app"',
      'Tap "Add" or "Install"',
      'The app will be installed with enhanced features',
    ];
  }

  return [
    'Look for an install prompt in your browser',
    'Or check the address bar for an install icon',
    'Installing the app provides better contact access',
  ];
};
