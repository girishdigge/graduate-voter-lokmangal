import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/Button';
import {
  Users,
  Plus,
  Upload,
  Smartphone,
  Share,
  HelpCircle,
  FileText,
  Share2,
  X,
} from 'lucide-react';
import { ManualReferenceModal } from './ManualReferenceModal';
import { CSVImport } from './CSVImport';
import { MobileContactHelper } from './MobileContactHelper';
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
  type ContactCapabilities,
} from '../../lib/contactUtils';

interface Contact {
  name: string;
  tel: string;
}

interface ContactPickerProps {
  onContactsSelected: (contacts: Contact[]) => void;
  maxContacts?: number;
  className?: string;
  showModal?: boolean;
}

export const ContactPicker: React.FC<ContactPickerProps> = ({
  onContactsSelected,
  maxContacts = 10,
  className,
  showModal = false,
}) => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isHelperModalOpen, setIsHelperModalOpen] = useState(false);
  const [isEnhancedModalOpen, setIsEnhancedModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'picker' | 'file' | 'manual'>(
    'picker'
  );
  const [deviceInfo, setDeviceInfo] = useState<ContactCapabilities>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    supportsContactPicker: false,
    supportsWebShare: false,
    supportsFileAPI: false,
    isPWA: false,
  });

  useEffect(() => {
    const capabilities = detectContactCapabilities();
    setDeviceInfo(capabilities);
  }, []);

  const handleNativeContactPicker = useCallback(async () => {
    if (showModal) {
      setIsEnhancedModalOpen(true);
      return;
    }

    try {
      const contacts = await pickContacts(maxContacts);
      onContactsSelected(contacts);
    } catch (error) {
      console.error('Contact picker failed:', error);
      // Fallback to manual entry
      setIsManualModalOpen(true);
    }
  }, [onContactsSelected, maxContacts, showModal]);

  const handleDeviceContactPicker = useCallback(async () => {
    if (!deviceInfo.supportsContactPicker) {
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
  }, [deviceInfo.supportsContactPicker, maxContacts]);

  const handleShareContacts = useCallback(async () => {
    try {
      await shareContactRequest();
      // After sharing, open manual entry for user to paste
      setIsManualModalOpen(true);
    } catch (error) {
      console.error('Share failed:', error);
      setIsManualModalOpen(true);
    }
  }, []);

  const handleManualContact = (contact: Contact | Contact[]) => {
    const contacts = Array.isArray(contact) ? contact : [contact];
    onContactsSelected(contacts);
    setIsManualModalOpen(false);
  };

  const handleCSVImport = (contacts: Contact[]) => {
    const limitedContacts = contacts.slice(0, maxContacts);
    onContactsSelected(limitedContacts);
    setIsCSVModalOpen(false);
  };

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        let contacts: Contact[] = [];

        // Handle vCard (.vcf) files
        if (file.name.endsWith('.vcf')) {
          contacts = parseVCard(content);
        } else if (file.name.endsWith('.csv')) {
          contacts = parseCSV(content);
        }

        if (showModal) {
          setSelectedContacts(contacts.slice(0, maxContacts));
        } else {
          onContactsSelected(contacts.slice(0, maxContacts));
        }
      };
      reader.readAsText(file);

      // Reset input
      event.target.value = '';
    },
    [onContactsSelected, maxContacts, showModal]
  );

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
    setIsEnhancedModalOpen(false);
    setSelectedContacts([]);
    setBulkText('');
    setError(null);
  }, [selectedContacts, onContactsSelected]);

  const handleShareRequest = useCallback(async () => {
    try {
      if (deviceInfo.supportsWebShare) {
        await shareContactRequest();
      } else {
        window.open(generateWhatsAppShareURL(), '_blank');
      }
    } catch (err) {
      console.error('Share failed:', err);
      setError('Failed to share contact request');
    }
  }, [deviceInfo.supportsWebShare]);

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Add References
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Add people who can vouch for your application. They will receive a
            WhatsApp notification.
          </p>

          {deviceInfo.isMobile && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Mobile Device Detected
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHelperModalOpen(true)}
                  className="text-xs"
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  Help
                </Button>
              </div>
              <p className="text-xs text-blue-700">
                {deviceInfo.isIOS &&
                  "Tap 'Help' for instructions on exporting iPhone contacts."}
                {deviceInfo.isAndroid &&
                  "Tap 'Help' for instructions on exporting Android contacts."}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Enhanced Contact Picker */}
          <Button
            onClick={() => setIsEnhancedModalOpen(true)}
            variant="primary"
            className="flex flex-col items-center p-6 h-auto"
          >
            <Users className="h-8 w-8 mb-2" />
            <span className="font-medium">Pick Contacts</span>
            <span className="text-xs opacity-80 mt-1">
              Multiple selection methods
            </span>
          </Button>

          {/* Native Contact Picker - Only show if supported and not using modal */}
          {deviceInfo.supportsContactPicker && !showModal && (
            <Button
              onClick={handleNativeContactPicker}
              variant="primary"
              className="flex flex-col items-center p-6 h-auto"
            >
              <Users className="h-8 w-8 mb-2" />
              <span className="font-medium">Device Contacts</span>
              <span className="text-xs opacity-80 mt-1">
                Select from contacts
              </span>
            </Button>
          )}

          {/* Share/Import for Mobile */}
          {deviceInfo.isMobile && (
            <>
              <Button
                onClick={handleShareContacts}
                variant="primary"
                className="flex flex-col items-center p-6 h-auto"
              >
                <Share className="h-8 w-8 mb-2" />
                <span className="font-medium">Share Contacts</span>
                <span className="text-xs opacity-80 mt-1">
                  Use device sharing
                </span>
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".vcf,.csv"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="contact-file-input"
                />
                <label
                  htmlFor="contact-file-input"
                  className="flex flex-col items-center p-6 h-auto w-full border border-gray-300 bg-transparent hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                >
                  <Upload className="h-8 w-8 mb-2" />
                  <span className="font-medium">Import File</span>
                  <span className="text-xs opacity-80 mt-1">
                    vCard or CSV file
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Manual Entry */}
          <Button
            onClick={() => setIsManualModalOpen(true)}
            variant="outline"
            className="flex flex-col items-center p-6 h-auto"
          >
            <Plus className="h-8 w-8 mb-2" />
            <span className="font-medium">Add Manually</span>
            <span className="text-xs opacity-80 mt-1">
              Enter details manually
            </span>
          </Button>

          {/* CSV Import for Desktop */}
          {!deviceInfo.isMobile && (
            <Button
              onClick={() => setIsCSVModalOpen(true)}
              variant="outline"
              className="flex flex-col items-center p-6 h-auto"
            >
              <Upload className="h-8 w-8 mb-2" />
              <span className="font-medium">Import CSV</span>
              <span className="text-xs opacity-80 mt-1">Upload CSV file</span>
            </Button>
          )}
        </div>

        {/* Mobile Instructions */}
        {deviceInfo.isMobile && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              How to export contacts:
            </h4>
            <div className="text-sm text-gray-700 space-y-2">
              {deviceInfo.isIOS && (
                <div>
                  <strong>iOS:</strong>
                  <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                    <li>Open Contacts app</li>
                    <li>Select contacts you want to share</li>
                    <li>Tap "Share Contact" and choose "Export vCard"</li>
                    <li>Use the "Import File" button above</li>
                  </ol>
                </div>
              )}
              {deviceInfo.isAndroid && (
                <div>
                  <strong>Android:</strong>
                  <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                    <li>Open Google Contacts (contacts.google.com)</li>
                    <li>Select contacts to export</li>
                    <li>Click "Export" and choose vCard format</li>
                    <li>Use the "Import File" button above</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Contact Picker Modal */}
      {isEnhancedModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Contacts
                </h2>
                <button
                  onClick={() => setIsEnhancedModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Tab Content */}
              <div className="min-h-[200px] mb-6">
                {activeTab === 'picker' && (
                  <div className="space-y-4">
                    {deviceInfo.supportsContactPicker ? (
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
                          Your browser doesn't support the contact picker API.
                          Try uploading a file or manual entry.
                        </p>
                        <Button
                          onClick={handleShareRequest}
                          variant="outline"
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
                      variant="outline"
                      size="sm"
                    >
                      Parse Contacts
                    </Button>
                  </div>
                )}
              </div>

              {/* Selected Contacts */}
              {selectedContacts.length > 0 && (
                <div className="space-y-3 mb-6">
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
                          <p className="font-medium text-gray-900">
                            {contact.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatPhoneNumber(contact.tel)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveContact(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  onClick={() => setIsEnhancedModalOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={selectedContacts.length === 0}
                >
                  Add {selectedContacts.length} Contact
                  {selectedContacts.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Reference Modal */}
      <ManualReferenceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleManualContact}
      />

      {/* CSV Import Modal */}
      <CSVImport
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImport={handleCSVImport}
        maxContacts={maxContacts}
      />

      {/* Mobile Contact Helper Modal */}
      <MobileContactHelper
        isOpen={isHelperModalOpen}
        onClose={() => setIsHelperModalOpen(false)}
      />
    </div>
  );
};
