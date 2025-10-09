import React, { useState, useEffect } from 'react';
import { ContactPicker } from './ContactPicker';
import { ReferenceList, type Reference } from './ReferenceList';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { apiEndpoints } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface Contact {
  name: string;
  tel: string;
}

interface ReferenceManagerProps {
  userId?: string;
  className?: string;
}

export const ReferenceManager: React.FC<ReferenceManagerProps> = ({
  userId,
  className,
}) => {
  const { user } = useAuth();
  const [references, setReferences] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = userId || user?.id;

  // Load references on component mount
  useEffect(() => {
    if (currentUserId) {
      loadReferences();
    }
  }, [currentUserId]);

  const loadReferences = async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiEndpoints.getReferences(currentUserId);
      setReferences(response.data.references || []);
    } catch (error) {
      console.error('Failed to load references:', error);
      setError('Failed to load references. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactsSelected = async (contacts: Contact | Contact[]) => {
    if (!currentUserId) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Normalize to array
      const contactArray = Array.isArray(contacts) ? contacts : [contacts];

      // Convert contacts to the format expected by the API
      const referencesData = contactArray.map(contact => ({
        referenceName: contact.name,
        referenceContact: contact.tel,
      }));

      const response = await apiEndpoints.addReferences(
        currentUserId,
        referencesData
      );

      // Add new references to the list
      const newReferences = response.data.references || [];
      setReferences(prev => [...prev, ...newReferences]);

      setIsContactPickerOpen(false);
    } catch (error: any) {
      console.error('Failed to add references:', error);
      const errorMessage =
        error.response?.data?.error?.message ||
        'Failed to add references. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReference = async (referenceId: string) => {
    try {
      // Note: This would need a DELETE endpoint in the API
      // For now, we'll just remove it from the local state
      setReferences(prev => prev.filter(ref => ref.id !== referenceId));
    } catch (error) {
      console.error('Failed to delete reference:', error);
      setError('Failed to delete reference. Please try again.');
    }
  };

  const handleResendWhatsApp = async (referenceId: string) => {
    try {
      // Note: This would need a resend WhatsApp endpoint in the API
      // For now, we'll just update the local state
      setReferences(prev =>
        prev.map(ref =>
          ref.id === referenceId
            ? {
                ...ref,
                whatsappSent: true,
                whatsappSentAt: new Date().toISOString(),
              }
            : ref
        )
      );
    } catch (error) {
      console.error('Failed to resend WhatsApp:', error);
      setError('Failed to resend WhatsApp notification. Please try again.');
    }
  };

  if (!currentUserId) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600">Please log in to manage references.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      <ReferenceList
        references={references}
        onAddReference={() => setIsContactPickerOpen(true)}
        onDeleteReference={handleDeleteReference}
        onResendWhatsApp={handleResendWhatsApp}
        isLoading={isLoading}
      />

      {/* Contact Picker Modal */}
      <Modal
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        title="Add References"
        size="lg"
      >
        <ContactPicker
          onContactsSelected={handleContactsSelected}
          maxContacts={10}
        />

        {isSubmitting && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
              <p className="text-blue-800">
                Adding references and sending WhatsApp notifications...
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
