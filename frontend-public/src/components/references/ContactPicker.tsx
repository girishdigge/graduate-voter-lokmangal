import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Users, Plus, Upload } from 'lucide-react';
import { ManualReferenceModal } from './ManualReferenceModal';
import { CSVImport } from './CSVImport';

interface Contact {
  name: string;
  tel: string;
}

interface ContactPickerProps {
  onContactsSelected: (contacts: Contact[]) => void;
  maxContacts?: number;
  className?: string;
}

export const ContactPicker: React.FC<ContactPickerProps> = ({
  onContactsSelected,
  maxContacts = 10,
  className,
}) => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isContactPickerSupported, setIsContactPickerSupported] = useState(
    'contacts' in navigator && 'ContactsManager' in window
  );

  const handleNativeContactPicker = useCallback(async () => {
    try {
      if (!('contacts' in navigator)) {
        throw new Error('Contact Picker API not supported');
      }

      const contacts = await (navigator as any).contacts.select(
        ['name', 'tel'],
        { multiple: true }
      );

      const formattedContacts: Contact[] = contacts
        .filter((contact: any) => contact.name && contact.tel?.length > 0)
        .slice(0, maxContacts)
        .map((contact: any) => ({
          name: contact.name[0] || '',
          tel: contact.tel[0]?.replace(/\D/g, '') || '',
        }))
        .filter((contact: Contact) => contact.tel.length >= 10);

      onContactsSelected(formattedContacts);
    } catch (error) {
      console.error('Contact picker failed:', error);
      // Fallback to manual entry
      setIsContactPickerSupported(false);
      setIsManualModalOpen(true);
    }
  }, [onContactsSelected, maxContacts]);

  const handleManualContact = (contact: Contact) => {
    onContactsSelected([contact]);
    setIsManualModalOpen(false);
  };

  const handleCSVImport = (contacts: Contact[]) => {
    const limitedContacts = contacts.slice(0, maxContacts);
    onContactsSelected(limitedContacts);
    setIsCSVModalOpen(false);
  };

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Native Contact Picker */}
          {isContactPickerSupported && (
            <Button
              onClick={handleNativeContactPicker}
              variant="primary"
              className="flex flex-col items-center p-6 h-auto"
            >
              <Users className="h-8 w-8 mb-2" />
              <span className="font-medium">Select from Contacts</span>
              <span className="text-xs opacity-80 mt-1">
                Choose from your device contacts
              </span>
            </Button>
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
              Enter contact details manually
            </span>
          </Button>

          {/* CSV Import */}
          <Button
            onClick={() => setIsCSVModalOpen(true)}
            variant="outline"
            className="flex flex-col items-center p-6 h-auto"
          >
            <Upload className="h-8 w-8 mb-2" />
            <span className="font-medium">Import CSV</span>
            <span className="text-xs opacity-80 mt-1">
              Upload a CSV file with contacts
            </span>
          </Button>
        </div>

        {!isContactPickerSupported && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Contact picker is not supported on this
              device. Please use manual entry or CSV import to add references.
            </p>
          </div>
        )}
      </div>

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
    </div>
  );
};
