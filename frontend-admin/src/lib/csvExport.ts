import type { Reference } from '../types/reference';
import type { Voter } from '../types/voter';

/**
 * Format numeric strings to prevent Excel from converting to scientific notation
 */
const formatNumericString = (value: string): string => {
  // Check if the value is a numeric string (contains only digits)
  if (/^\d+$/.test(value) && value.length > 10) {
    // For long numeric strings, add a leading apostrophe to force text format
    return `'${value}`;
  }
  return value;
};

/**
 * Format CSV cell value with proper escaping and text formatting
 */
const formatCsvCell = (value: any, header: string): string => {
  const stringValue = String(value || '');

  // Handle numeric strings that should be treated as text (phone numbers, Aadhar, etc.)
  const numericFields = [
    'Contact',
    'Reference Contact',
    'Voter Contact',
    'Phone Number',
    'Aadhar Number',
    'Voter Aadhar',
    'Pincode',
    'Assembly Number',
    'Polling Station',
    'Polling Station Number',
    'EPIC Number',
    'Graduation Year',
  ];

  let formattedValue = stringValue;

  // Format numeric strings to prevent scientific notation
  if (numericFields.includes(header) && stringValue) {
    formattedValue = formatNumericString(stringValue);
  }

  // Always wrap in quotes to ensure proper CSV formatting
  // This prevents issues with commas, quotes, newlines, and leading zeros
  return `"${formattedValue.replace(/"/g, '""')}"`;
};

/**
 * Convert data to CSV format
 */
export const convertToCSV = (data: any[], headers: string[]): string => {
  if (data.length === 0) return '';

  // Create CSV header row (wrap headers in quotes for consistency)
  const csvHeaders = headers.map(header => `"${header}"`).join(',');

  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers
      .map(header => {
        const value = getNestedValue(row, header);
        return formatCsvCell(value, header);
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Get nested object value by dot notation
 */
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Download CSV file with proper encoding
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  // Add BOM (Byte Order Mark) for proper Excel encoding
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  const blob = new Blob([csvWithBOM], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Format date for CSV export in dd/mm/yyyy format
 */
export const formatDateForCSV = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

/**
 * Format datetime for CSV export in dd/mm/yyyy, hh:mm am/pm format
 */
export const formatDateTimeForCSV = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const hoursStr = hours.toString().padStart(2, '0');

    return `${day}/${month}/${year}, ${hoursStr}:${minutes} ${ampm}`;
  } catch {
    return '';
  }
};

/**
 * Format Aadhar number with masking for privacy
 */
export const formatAadharForCSV = (
  aadharNumber: string | null | undefined
): string => {
  if (!aadharNumber) return '';

  // If Aadhar number is 12 digits, mask the middle 4 digits
  if (aadharNumber.length === 12 && /^\d{12}$/.test(aadharNumber)) {
    return `${aadharNumber.substring(0, 4)}****${aadharNumber.substring(8)}`;
  }

  // Return as-is if not a standard 12-digit Aadhar
  return aadharNumber;
};

/**
 * Export references to CSV
 */
export const exportReferencesToCSV = (
  references: Reference[],
  filename?: string
): void => {
  const csvData = references.map(ref => ({
    'Reference Name': ref.referenceName,
    'Reference Contact': ref.referenceContact,
    Status: ref.status,
    'Voter Name': ref.user.fullName,
    'Voter Contact': ref.user.contact || '',
    'Voter Aadhar': ref.user.aadharNumber || '',
    'WhatsApp Sent': ref.whatsappSent ? 'Yes' : 'No',
    'WhatsApp Sent Date': formatDateTimeForCSV(ref.whatsappSentAt),
    'Status Updated Date': formatDateTimeForCSV(ref.statusUpdatedAt),
    'Created Date': formatDateTimeForCSV(ref.createdAt),
    'Last Updated': formatDateTimeForCSV(ref.updatedAt),
  }));

  const headers = [
    'Reference Name',
    'Reference Contact',
    'Status',
    'Voter Name',
    'Voter Contact',
    'Voter Aadhar',
    'WhatsApp Sent',
    'WhatsApp Sent Date',
    'Status Updated Date',
    'Created Date',
    'Last Updated',
  ];

  // Use Excel-specific CSV formatting for better compatibility
  const csvContent = convertToExcelCSV(csvData, headers);
  const exportFilename =
    filename ||
    `references_export_${new Date().toISOString().split('T')[0]}.csv`;

  downloadCSV(csvContent, exportFilename);
};

/**
 * Export voters to CSV with all available fields
 */
export const exportVotersToCSV = (voters: Voter[], filename?: string): void => {
  const csvData = voters.map(voter => ({
    // Personal Information
    'Full Name': voter.fullName,
    Sex: voter.sex || '',
    'Guardian/Spouse': voter.guardianSpouse || '',
    'Date of Birth': formatDateForCSV(voter.dateOfBirth),
    Age: voter.age || '',
    Occupation: voter.occupation || '',
    Qualification: voter.qualification || '',
    'Phone Number': voter.contact || '',
    Email: voter.email || 'Not provided',
    Address:
      `${voter.houseNumber || ''} ${voter.street || ''} ${voter.area || ''}`.trim() ||
      '',
    'House Number': voter.houseNumber || '',
    Street: voter.street || '',
    Area: voter.area || '',
    City: voter.city || '',
    State: voter.state || '',
    Pincode: voter.pincode || '',
    'Registered Elector': voter.isRegisteredElector ? 'Yes' : 'No',
    'Assembly Number': voter.assemblyNumber || '',
    'Assembly Name': voter.assemblyName || '',
    'Polling Station': voter.pollingStationNumber || '',
    'EPIC Number': voter.epicNumber || '',
    Disabilities: voter.disabilities
      ? typeof voter.disabilities === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(voter.disabilities);
              return Array.isArray(parsed)
                ? parsed.join(', ')
                : voter.disabilities;
            } catch {
              return voter.disabilities;
            }
          })()
        : voter.disabilities
      : '',
    University: voter.university || '',
    'Graduation Year': voter.graduationYear || '',
    'Document Type': voter.graduationDocType || '',
    'Aadhar Number': voter.aadharNumber || '', // Keep unmasked as requested
    'Registration Date': formatDateTimeForCSV(voter.createdAt),
    'Verification Status': voter.isVerified ? 'Verified' : 'Unverified',
    'Verified Date': formatDateTimeForCSV(voter.verifiedAt),
    'Verified By': voter.verifiedByAdmin?.fullName || '',
    'Last Updated': formatDateTimeForCSV(voter.updatedAt),
  }));

  const headers = [
    'Full Name',
    'Sex',
    'Guardian/Spouse',
    'Date of Birth',
    'Age',
    'Occupation',
    'Qualification',
    'Phone Number',
    'Email',
    'Address',
    'House Number',
    'Street',
    'Area',
    'City',
    'State',
    'Pincode',
    'Registered Elector',
    'Assembly Number',
    'Assembly Name',
    'Polling Station',
    'EPIC Number',
    'Disabilities',
    'University',
    'Graduation Year',
    'Document Type',
    'Aadhar Number',
    'Registration Date',
    'Verification Status',
    'Verified Date',
    'Verified By',
    'Last Updated',
  ];

  // Use Excel-specific CSV formatting for better compatibility
  const csvContent = convertToExcelCSV(csvData, headers);
  const exportFilename =
    filename || `voters_export_${new Date().toISOString().split('T')[0]}.csv`;

  downloadCSV(csvContent, exportFilename);
};

/**
 * Export filtered data based on current search and filters
 */
export interface ExportOptions {
  includeFiltered?: boolean;
  customFilename?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Alternative CSV export with Excel-specific formatting
 */
export const convertToExcelCSV = (data: any[], headers: string[]): string => {
  if (data.length === 0) return '';

  // Create CSV header row
  const csvHeaders = headers.map(header => `"${header}"`).join(',');

  // Create CSV data rows with Excel-specific formatting
  const csvRows = data.map(row => {
    return headers
      .map(header => {
        const value = getNestedValue(row, header);
        const stringValue = String(value || '');

        // For numeric fields that should remain as text, use Excel formula
        const numericFields = [
          'Contact',
          'Reference Contact',
          'Voter Contact',
          'Phone Number',
          'Aadhar Number',
          'Voter Aadhar',
          'Pincode',
          'Assembly Number',
          'Polling Station',
          'Polling Station Number',
          'EPIC Number',
          'Graduation Year',
        ];

        if (
          numericFields.includes(header) &&
          stringValue &&
          /^\d+$/.test(stringValue)
        ) {
          // Use Excel TEXT formula to preserve leading zeros and prevent scientific notation
          return `"=""${stringValue}"""`;
        }

        // Regular text formatting
        return `"${stringValue.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Get export statistics
 */
export const getExportStats = (totalItems: number, filteredItems: number) => {
  return {
    total: totalItems,
    filtered: filteredItems,
    percentage:
      totalItems > 0 ? Math.round((filteredItems / totalItems) * 100) : 0,
  };
};
