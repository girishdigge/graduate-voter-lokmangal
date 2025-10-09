import React, { useState, useCallback } from 'react';
import { Users, Upload, FileText, Share2, Smartphone } from 'lucide-react';
import { Button, Modal } from '../ui';
import {
  detectContactCapabilities,
  pickContacts,
  parseVCard,
  parseCSV,
  parseBulkText,
  validateContact,
  formatPhoneNumber,
  shareContactRequest,
  generateWhatsAppShareURL,
  type Contact,
} from '../../lib/contactUtils';

interface ContactPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onContactsSelected: (contacts: Contact[]) => void;
  maxContacts?: number;
}

export const ContactPicker: React.FC<ContactPickerProps> = ({
  isOpen,
  onClose,
  onContactsSelected,
  maxContacts = 10,
}) => {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'picker' | 'file' | 'manual'>(
    'picker'
  );

  const capabilities = detectContactCapabilities();

  const handleDeviceContactPicker = useCallback(async () => {
    if (!capabilities.supportsContactPicker) {
      setError('Contact picker not supported on this device');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const contacts = await pickContacts(maxContacts);
      setSelectedContacts(contacts);
    } catch (err) {
      console.error('Contact picker error:', err);
      setError('Failed to access contacts. Please try manual entry.');
    } finally {
      setIsLoading(false);
    }
  }, [capabilities.supportsContactPicker, maxContacts]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        let contacts: Contact[] = [];

        try {
          if (file.name.toLowerCase().endsWith('.vcf')) {
            contacts = parseVCard(content);
          } else if (file.name.toLowerCase().endsWith('.csv')) {
            contacts = parseCSV(content);
          } else {
            contacts = parseBulkText(content);
          }

          // Validate and limit contacts
          const validContacts = contacts
            .map(contact => ({
              ...contact,
              tel: contact.tel.replace(/\D/g, ''),
            }))
            .filter(contact => validateContact(contact).isValid)
            .slice(0, maxContacts);

          setSelectedContacts(validContacts);
          setError(null);
        } catch (err) {
          console.error('File parsing error:', err);
          setError('Failed to parse file. Please check the format.');
        }
      };

      reader.readAsText(file);
    },
    [maxContacts]
  );

  const handleBulkTextParse = useCallback(() => {
    if (!bulkText.trim()) {
      setError('Please enter contact information');
      return;
    }

    try {
      const contacts = parseBulkText(bulkText);
      const validContacts = contacts
        .map(contact => ({ ...contact, tel: contact.tel.replace(/\D/g, '') }))
        .filter(contact => validateContact(contact).isValid)
        .slice(0, maxContacts);

      if (validContacts.length === 0) {
        setError('No valid contacts found. Please check the format.');
        return;
      }

      setSelectedContacts(validContacts);
      setError(null);
    } catch (err) {
      console.error('Bulk text parsing error:', err);
      setError('Failed to parse contacts. Please check the format.');
    }
  }, [bulkText, maxContacts]);

  const handleRemoveContact = useCallback((index: number) => {
    setSelectedContacts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (selectedContacts.length === 0) {
      setError('Please select at least one contact');
      return;
    }

    onContactsSelected(selectedContacts);
    onClose();
    setSelectedContacts([]);
    setBulkText('');
    setError(null);
  }, [selectedContacts, onContactsSelected, onClose]);

  const handleShareRequest = useCallback(async () => {
    try {
      if (capabilities.supportsWebShare) {
        await shareContactRequest();
      } else {
        window.open(generateWhatsAppShareURL(), '_blank');
      }
    } catch (err) {
      console.error('Share failed:', err);
      setError('Failed to share contact request');
    }
  }, [capabilities.supportsWebShare]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Contacts" size="lg">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('picker')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'picker'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Smartphone className="h-4 w-4 inline mr-2" />
            Device Contacts
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'file'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Manual Entry
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === 'picker' && (
            <div className="space-y-4">
              {capabilities.supportsContactPicker ? (
                <div className="text-center">
                  <Button
                    onClick={handleDeviceContactPicker}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {isLoading
                      ? 'Accessing Contacts...'
                      : 'Select from Device Contacts'}
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    Access your device contacts to quickly add references
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Contact Picker Not Available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your browser doesn't support the contact picker API. Try
                    uploading a file or manual entry.
                  </p>
                  <Button
                    onClick={handleShareRequest}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share Contact Request
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-sm text-gray-600">
                    Upload a contact file (.vcf, .csv, or .txt)
                  </span>
                  <input
                    type="file"
                    accept=".vcf,.csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Supported formats:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>vCard (.vcf) - Standard contact format</li>
                  <li>CSV (.csv) - Name, Phone columns</li>
                  <li>Text (.txt) - One contact per line</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter contacts (one per line)
                </label>
                <textarea
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={`Enter contacts in any of these formats:
John Doe - 1234567890
Jane Smith 9876543210
Name: Bob Johnson, Phone: 5555551234`}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button
                onClick={handleBulkTextParse}
                variant="secondary"
                size="sm"
              >
                Parse Contacts
              </Button>
            </div>
          )}
        </div>

        {/* Selected Contacts */}
        {selectedContacts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              Selected Contacts ({selectedContacts.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {selectedContacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatPhoneNumber(contact.tel)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRemoveContact(index)}
                    variant="secondary"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={selectedContacts.length === 0}
          >
            Add {selectedContacts.length} Reference
            {selectedContacts.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
