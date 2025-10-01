import React, { useState } from 'react';
import { ContactPicker } from './ContactPicker';
import { ReferenceList, type Reference } from './ReferenceList';
import { Button } from '../ui/Button';

interface Contact {
  name: string;
  tel: string;
}

// Demo component to test reference functionality
export const ReferenceDemo: React.FC = () => {
  const [references, setReferences] = useState<Reference[]>([
    {
      id: '1',
      name: 'John Doe',
      contact: '9876543210',
      status: 'contacted',
      whatsappSent: true,
      whatsappSentAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Jane Smith',
      contact: '9876543211',
      status: 'pending',
      whatsappSent: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);
  const [showContactPicker, setShowContactPicker] = useState(false);

  const handleContactsSelected = (contacts: Contact[]) => {
    const newReferences: Reference[] = contacts.map((contact, index) => ({
      id: `demo-${Date.now()}-${index}`,
      name: contact.name,
      contact: contact.tel,
      status: 'pending' as const,
      whatsappSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setReferences(prev => [...prev, ...newReferences]);
    setShowContactPicker(false);
  };

  const handleDeleteReference = async (referenceId: string) => {
    setReferences(prev => prev.filter(ref => ref.id !== referenceId));
  };

  const handleResendWhatsApp = async (referenceId: string) => {
    setReferences(prev =>
      prev.map(ref =>
        ref.id === referenceId
          ? {
              ...ref,
              whatsappSent: true,
              whatsappSentAt: new Date().toISOString(),
              status: 'contacted' as const,
            }
          : ref
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reference Management Demo
        </h1>
        <p className="text-gray-600">
          Test the contact picker and reference management functionality
        </p>
      </div>

      {/* Contact Picker Section */}
      {showContactPicker && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ContactPicker
            onContactsSelected={handleContactsSelected}
            maxContacts={5}
          />
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setShowContactPicker(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reference List Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ReferenceList
          references={references}
          onAddReference={() => setShowContactPicker(true)}
          onDeleteReference={handleDeleteReference}
          onResendWhatsApp={handleResendWhatsApp}
        />
      </div>

      {/* Demo Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Demo Features</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Native Contact Picker API (if supported by browser)</li>
          <li>• Manual contact entry with validation</li>
          <li>• CSV import with drag-and-drop support</li>
          <li>• WhatsApp notification status tracking</li>
          <li>• Reference status management (pending, contacted, applied)</li>
          <li>• Delete and resend functionality</li>
        </ul>
      </div>
    </div>
  );
};
