import React, { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';

interface Contact {
  name: string;
  tel: string;
}

interface CSVImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: Contact[]) => void;
  maxContacts: number;
}

interface ParsedContact extends Contact {
  isValid: boolean;
  error?: string;
}

export const CSVImport: React.FC<CSVImportProps> = ({
  isOpen,
  onClose,
  onImport,
  maxContacts,
}) => {
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState(false);

  const validateContact = (
    name: string,
    tel: string
  ): { isValid: boolean; error?: string } => {
    if (!name || name.trim().length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters' };
    }

    const cleanTel = tel.replace(/\D/g, '');
    if (cleanTel.length !== 10) {
      return { isValid: false, error: 'Contact must be exactly 10 digits' };
    }

    return { isValid: true };
  };

  const parseCSV = (csvText: string): ParsedContact[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const contacts: ParsedContact[] = [];

    // Skip header if it exists (check if first line contains 'name' or 'contact')
    const startIndex =
      lines[0]?.toLowerCase().includes('name') ||
      lines[0]?.toLowerCase().includes('contact')
        ? 1
        : 0;

    for (
      let i = startIndex;
      i < lines.length && contacts.length < maxContacts;
      i++
    ) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma and handle quoted values
      const parts = line
        .split(',')
        .map(part => part.trim().replace(/^"|"$/g, ''));

      if (parts.length >= 2) {
        const name = parts[0];
        const tel = parts[1];
        const validation = validateContact(name, tel);

        contacts.push({
          name,
          tel: tel.replace(/\D/g, ''),
          isValid: validation.isValid,
          error: validation.error,
        });
      }
    }

    return contacts;
  };

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setFileName(file.name);

      try {
        const text = await file.text();
        const contacts = parseCSV(text);
        setParsedContacts(contacts);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setParsedContacts([]);
      } finally {
        setIsProcessing(false);
      }
    },
    [maxContacts]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const handleImport = () => {
    const validContacts = parsedContacts
      .filter(contact => contact.isValid)
      .map(contact => ({ name: contact.name, tel: contact.tel }));

    onImport(validContacts);
  };

  const handleClose = () => {
    setParsedContacts([]);
    setFileName('');
    onClose();
  };

  const validCount = parsedContacts.filter(c => c.isValid).length;
  const invalidCount = parsedContacts.length - validCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Contacts from CSV"
      size="lg"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            CSV Format Instructions
          </h4>
          <p className="text-sm text-blue-800 mb-2">
            Your CSV file should have two columns: Name and Contact Number
          </p>
          <div className="text-xs text-blue-700 font-mono bg-blue-100 p-2 rounded">
            Name,Contact
            <br />
            John Doe,9876543210
            <br />
            Jane Smith,9876543211
          </div>
        </div>

        {/* File Upload Area */}
        {parsedContacts.length === 0 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileInputChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isProcessing ? (
                <div className="space-y-2">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-gray-600">
                    Processing {fileName}...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    {isDragActive
                      ? 'Drop your CSV file here'
                      : 'Upload CSV File'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum {maxContacts} contacts will be imported
                  </p>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Preview Results */}
        {parsedContacts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Import Preview</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setParsedContacts([])}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-900">
                    {validCount} Valid Contacts
                  </span>
                </div>
              </div>
              {invalidCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-900">
                      {invalidCount} Invalid Contacts
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Contact List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">
                      Contact
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedContacts.map((contact, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-4 py-2">{contact.name}</td>
                      <td className="px-4 py-2 font-mono">{contact.tel}</td>
                      <td className="px-4 py-2">
                        {contact.isValid ? (
                          <span className="inline-flex items-center text-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Valid
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center text-red-700"
                            title={contact.error}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Invalid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {parsedContacts.length > 0 && validCount > 0 && (
            <Button variant="primary" onClick={handleImport}>
              Import {validCount} Contact{validCount !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
