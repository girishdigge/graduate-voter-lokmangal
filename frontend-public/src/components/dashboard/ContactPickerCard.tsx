import {
  useState,
  useCallback,
  useEffect,
  type ChangeEvent,
  type FC,
} from 'react';
import {
  Users,
  Plus,
  Upload,
  FileText,
  Share2,
  Smartphone,
  X,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { apiEndpoints } from '../../lib/api';
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

interface ContactPickerCardProps {
  userId: string;
}

interface Reference {
  id: string;
  referenceName: string;
  referenceContact: string;
  status: 'PENDING' | 'CONTACTED' | 'APPLIED';
  whatsappSent: boolean;
  whatsappSentAt?: string;
  statusUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const ContactPickerCard: FC<ContactPickerCardProps> = ({
  userId,
}: ContactPickerCardProps) => {
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [manualContacts, setManualContacts] = useState<
    Array<{ name: string; number: string }>
  >([{ name: '', number: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'picker' | 'file' | 'manual'>(
    'picker'
  );
  const [showContactPicker, setShowContactPicker] = useState(false);

  const capabilities = detectContactCapabilities();

  // Load existing references on component mount
  useEffect(() => {
    loadReferences();
  }, [userId]);

  const loadReferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiEndpoints.getReferences(userId);
      if (response.data.success) {
        setReferences(response.data.references || []);
      }
    } catch (error: any) {
      console.error('Failed to load references:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to load references. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceContactPicker = useCallback(async () => {
    if (!capabilities.supportsContactPicker) {
      setError('Contact picker not supported on this device');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const contacts = await pickContacts(10 - references.length);
      setSelectedContacts(contacts);
    } catch (err) {
      console.error('Contact picker error:', err);
      setError('Failed to access contacts. Please try manual entry.');
    } finally {
      setIsLoading(false);
    }
  }, [capabilities.supportsContactPicker, references.length]);

  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
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
            .map((contact: Contact) => ({
              ...contact,
              tel: contact.tel.replace(/\D/g, ''),
            }))
            .filter((contact: Contact) => validateContact(contact).isValid)
            .slice(0, 10 - references.length);

          setSelectedContacts(validContacts);
          setError(null);
        } catch (err) {
          console.error('File parsing error:', err);
          setError('Failed to parse file. Please check the format.');
        }
      };

      reader.readAsText(file);
    },
    [references.length]
  );

  const handleManualContactChange = useCallback(
    (index: number, field: 'name' | 'number', value: string) => {
      setManualContacts(prev =>
        prev.map((contact, i) =>
          i === index ? { ...contact, [field]: value } : contact
        )
      );
    },
    []
  );

  const addManualContactField = useCallback(() => {
    setManualContacts(prev => [...prev, { name: '', number: '' }]);
  }, []);

  const removeManualContactField = useCallback((index: number) => {
    setManualContacts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleManualContactsParse = useCallback(() => {
    const validContacts = manualContacts
      .filter(contact => contact.name.trim() && contact.number.trim())
      .map(contact => ({
        name: contact.name.trim(),
        tel: contact.number.replace(/\D/g, ''),
      }))
      .filter((contact: Contact) => validateContact(contact).isValid)
      .slice(0, 10 - references.length);

    if (validContacts.length === 0) {
      setError('Please enter valid contact information');
      return;
    }

    setSelectedContacts(validContacts);
    setError(null);
  }, [manualContacts, references.length]);

  const handleRemoveContact = useCallback((index: number) => {
    setSelectedContacts((prev: Contact[]) =>
      prev.filter((_: Contact, i: number) => i !== index)
    );
  }, []);

  const handleSubmitReferences = useCallback(async () => {
    if (selectedContacts.length === 0) {
      setError('Please select at least one contact');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formattedReferences = selectedContacts.map((contact: Contact) => ({
        referenceName: contact.name,
        referenceContact: contact.tel,
      }));

      const response = await apiEndpoints.addReferences(
        userId,
        formattedReferences
      );

      if (response.data.success) {
        await loadReferences(); // Reload references
        setSelectedContacts([]);
        setManualContacts([{ name: '', number: '' }]);
        setShowContactPicker(false);
        alert('References added successfully!');
      }
    } catch (error: any) {
      console.error('Failed to add references:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to add references. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedContacts, userId]);

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'CONTACTED':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Contacted',
        };
      case 'APPLIED':
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: 'Applied',
        };
      default:
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          label: 'Pending',
        };
    }
  };

  if (isLoading && references.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Loading references..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-50 rounded-lg mr-3">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">References</h3>
            <p className="text-sm text-gray-600">
              Add contacts who can vouch for your application
            </p>
          </div>
        </div>
        {references.length < 10 && (
          <Button
            onClick={() => setShowContactPicker(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add References
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Existing References */}
      {references.length > 0 && (
        <div className="space-y-4 mb-6">
          {references.map((reference: Reference) => {
            const statusInfo = getStatusInfo(reference.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={reference.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div
                      className={`p-2 ${statusInfo.bgColor} rounded-lg mr-3`}
                    >
                      <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {reference.referenceName}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatPhoneNumber(reference.referenceContact)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact Picker Modal */}
      {showContactPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg mr-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Select Contacts
                  </h2>
                  <p className="text-sm text-gray-600">
                    Choose contacts to add as references
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setShowContactPicker(false);
                  setSelectedContacts([]);
                  setManualContacts([{ name: '', number: '' }]);
                  setError(null);
                }}
                variant="ghost"
                className="p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
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
                {/* <button
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'file'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Upload className="h-4 w-4 inline mr-2" />
                  Upload File
                </button> */}
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
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Add contacts manually
                      </label>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {manualContacts.map((contact, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  value={contact.name}
                                  onChange={(
                                    e: ChangeEvent<HTMLInputElement>
                                  ) =>
                                    handleManualContactChange(
                                      index,
                                      'name',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                />
                              </div>
                              <div>
                                <input
                                  type="tel"
                                  placeholder="Phone Number"
                                  value={contact.number}
                                  onChange={(
                                    e: ChangeEvent<HTMLInputElement>
                                  ) =>
                                    handleManualContactChange(
                                      index,
                                      'number',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {index === manualContacts.length - 1 && (
                                <Button
                                  onClick={addManualContactField}
                                  variant="outline"
                                  size="sm"
                                  className="p-2"
                                  title="Add another contact"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                              {manualContacts.length > 1 && (
                                <Button
                                  onClick={() =>
                                    removeManualContactField(index)
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Remove this contact"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {
                          manualContacts.filter(
                            c => c.name.trim() && c.number.trim()
                          ).length
                        }{' '}
                        contact(s) ready
                      </p>
                      <Button
                        onClick={handleManualContactsParse}
                        variant="outline"
                        size="sm"
                        disabled={
                          !manualContacts.some(
                            c => c.name.trim() && c.number.trim()
                          )
                        }
                      >
                        Add Contacts
                      </Button>
                    </div>
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
                    {selectedContacts.map((contact: Contact, index: number) => (
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
                        <Button
                          onClick={() => handleRemoveContact(index)}
                          variant="outline"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setShowContactPicker(false);
                    setSelectedContacts([]);
                    setManualContacts([{ name: '', number: '' }]);
                    setError(null);
                  }}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReferences}
                  disabled={selectedContacts.length === 0 || isSubmitting}
                  loading={isSubmitting}
                >
                  Add {selectedContacts.length} Reference
                  {selectedContacts.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {references.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No References Added
          </h4>
          <p className="text-gray-600 mb-6">
            Use the contact picker to quickly add references from your device
            contacts, or enter them manually.
          </p>
          <Button
            onClick={() => setShowContactPicker(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Reference
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      {references.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {references.length}
              </p>
              <p className="text-xs text-gray-500">Total References</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {references.filter((r: Reference) => r.whatsappSent).length}
              </p>
              <p className="text-xs text-gray-500">WhatsApp Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {
                  references.filter((r: Reference) => r.status === 'CONTACTED')
                    .length
                }
              </p>
              <p className="text-xs text-gray-500">Contacted</p>
            </div>
          </div>
        </div>
      )}

      {/* Reference Guidelines */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Reference Guidelines
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Add people who know you personally and can vouch for your identity
          </li>
          <li>
            • References will receive WhatsApp notifications about your
            application
          </li>
          <li>
            • Provide accurate contact numbers for successful verification
          </li>
          <li>• You can add up to 10 references for your application</li>
        </ul>
      </div>
    </div>
  );
};
