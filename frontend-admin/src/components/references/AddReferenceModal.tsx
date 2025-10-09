import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, X } from 'lucide-react';
import { Button, Modal, Input, LoadingSpinner } from '../ui';
import { ContactPicker } from './ContactPicker';
import { referenceApi } from '../../lib/referenceApi';
import { formatPhoneNumber, type Contact } from '../../lib/contactUtils';

interface AddReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

interface ReferenceFormData {
  referenceName: string;
  referenceContact: string;
}

export const AddReferenceModal: React.FC<AddReferenceModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const queryClient = useQueryClient();
  const [references, setReferences] = useState<ReferenceFormData[]>([
    { referenceName: '', referenceContact: '' },
  ]);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>(
    {}
  );

  // Add references mutation
  const addReferencesMutation = useMutation({
    mutationFn: (data: { userId: string; references: ReferenceFormData[] }) =>
      referenceApi.addReferences(data.userId, data.references),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onClose();
      resetForm();
    },
  });

  const resetForm = useCallback(() => {
    setReferences([{ referenceName: '', referenceContact: '' }]);
    setErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<number, Record<string, string>> = {};
    let isValid = true;

    references.forEach((ref, index) => {
      const refErrors: Record<string, string> = {};

      if (!ref.referenceName.trim()) {
        refErrors.referenceName = 'Reference name is required';
        isValid = false;
      } else if (ref.referenceName.trim().length < 2) {
        refErrors.referenceName =
          'Reference name must be at least 2 characters';
        isValid = false;
      }

      if (!ref.referenceContact.trim()) {
        refErrors.referenceContact = 'Contact number is required';
        isValid = false;
      } else {
        const cleanContact = ref.referenceContact.replace(/\D/g, '');
        if (cleanContact.length < 10) {
          refErrors.referenceContact =
            'Contact number must be at least 10 digits';
          isValid = false;
        } else if (cleanContact.length > 15) {
          refErrors.referenceContact =
            'Contact number must be less than 15 digits';
          isValid = false;
        }
      }

      if (Object.keys(refErrors).length > 0) {
        newErrors[index] = refErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [references]);

  const handleInputChange = useCallback(
    (index: number, field: keyof ReferenceFormData, value: string) => {
      setReferences(prev =>
        prev.map((ref, i) => (i === index ? { ...ref, [field]: value } : ref))
      );

      // Clear error for this field
      if (errors[index]?.[field]) {
        setErrors(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            [field]: '',
          },
        }));
      }
    },
    [errors]
  );

  const handleAddReference = useCallback(() => {
    setReferences(prev => [
      ...prev,
      { referenceName: '', referenceContact: '' },
    ]);
  }, []);

  const handleRemoveReference = useCallback(
    (index: number) => {
      if (references.length > 1) {
        setReferences(prev => prev.filter((_, i) => i !== index));
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          // Reindex remaining errors
          const reindexedErrors: Record<number, Record<string, string>> = {};
          Object.keys(newErrors).forEach(key => {
            const numKey = parseInt(key);
            if (numKey > index) {
              reindexedErrors[numKey - 1] = newErrors[numKey];
            } else if (numKey < index) {
              reindexedErrors[numKey] = newErrors[numKey];
            }
          });
          return reindexedErrors;
        });
      }
    },
    [references.length]
  );

  const handleContactsSelected = useCallback((contacts: Contact[]) => {
    const newReferences = contacts.map(contact => ({
      referenceName: contact.name,
      referenceContact: contact.tel,
    }));

    setReferences(prev => {
      // Replace empty references or add new ones
      const result = [...prev];
      let insertIndex = 0;

      // Find first empty reference or add to end
      for (let i = 0; i < result.length; i++) {
        if (!result[i].referenceName && !result[i].referenceContact) {
          insertIndex = i;
          break;
        }
        insertIndex = i + 1;
      }

      // Replace/insert the new references
      newReferences.forEach((newRef, index) => {
        if (insertIndex + index < result.length) {
          result[insertIndex + index] = newRef;
        } else {
          result.push(newRef);
        }
      });

      return result.slice(0, 10); // Limit to 10 references
    });

    setIsContactPickerOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Clean and prepare references
      const cleanReferences = references
        .filter(ref => ref.referenceName.trim() && ref.referenceContact.trim())
        .map(ref => ({
          referenceName: ref.referenceName.trim(),
          referenceContact: ref.referenceContact.replace(/\D/g, ''),
        }));

      if (cleanReferences.length === 0) {
        setErrors({
          0: { referenceName: 'At least one reference is required' },
        });
        return;
      }

      await addReferencesMutation.mutateAsync({
        userId,
        references: cleanReferences,
      });
    },
    [validateForm, references, userId, addReferencesMutation]
  );

  const handleClose = useCallback(() => {
    if (!addReferencesMutation.isPending) {
      onClose();
      resetForm();
    }
  }, [addReferencesMutation.isPending, onClose, resetForm]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Add References for ${userName}`}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Picker Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Add references for this voter. You can use the contact picker or
              enter manually.
            </p>
            <Button
              type="button"
              onClick={() => setIsContactPickerOpen(true)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Pick Contacts
            </Button>
          </div>

          {/* Reference Forms */}
          <div className="space-y-4">
            {references.map((reference, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">
                    Reference {index + 1}
                  </h4>
                  {references.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveReference(index)}
                      variant="secondary"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Name *
                    </label>
                    <Input
                      value={reference.referenceName}
                      onChange={e =>
                        handleInputChange(
                          index,
                          'referenceName',
                          e.target.value
                        )
                      }
                      placeholder="Enter full name"
                      error={errors[index]?.referenceName}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <Input
                      value={reference.referenceContact}
                      onChange={e =>
                        handleInputChange(
                          index,
                          'referenceContact',
                          e.target.value
                        )
                      }
                      placeholder="Enter phone number"
                      error={errors[index]?.referenceContact}
                    />
                    {reference.referenceContact && (
                      <p className="text-xs text-gray-500 mt-1">
                        Formatted:{' '}
                        {formatPhoneNumber(reference.referenceContact)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          {references.length < 10 && (
            <Button
              type="button"
              onClick={handleAddReference}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Another Reference
            </Button>
          )}

          {/* Error Display */}
          {addReferencesMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">
                {addReferencesMutation.error instanceof Error
                  ? addReferencesMutation.error.message
                  : 'Failed to add references. Please try again.'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={handleClose}
              variant="secondary"
              disabled={addReferencesMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addReferencesMutation.isPending}
              className="flex items-center gap-2"
            >
              {addReferencesMutation.isPending && <LoadingSpinner size="sm" />}
              Add References
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contact Picker Modal */}
      <ContactPicker
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        onContactsSelected={handleContactsSelected}
        maxContacts={10 - references.length}
      />
    </>
  );
};
