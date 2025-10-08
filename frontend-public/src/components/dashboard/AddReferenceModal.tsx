import React, { useState } from 'react';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../ui/Button';

interface Reference {
  name: string;
  contact: string;
}

interface AddReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (references: Reference[]) => Promise<void>;
  maxReferences: number;
}

export const AddReferenceModal: React.FC<AddReferenceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  maxReferences,
}) => {
  const [references, setReferences] = useState<Reference[]>([
    { name: '', contact: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const validateReference = (reference: Reference, index: number) => {
    const newErrors: { [key: string]: string } = {};

    if (!reference.name.trim()) {
      newErrors[`name-${index}`] = 'Name is required';
    } else if (reference.name.trim().length < 2) {
      newErrors[`name-${index}`] = 'Name must be at least 2 characters';
    }

    if (!reference.contact.trim()) {
      newErrors[`contact-${index}`] = 'Contact number is required';
    } else if (!/^\d{10}$/.test(reference.contact.trim())) {
      newErrors[`contact-${index}`] =
        'Contact number must be exactly 10 digits';
    }

    return newErrors;
  };

  const validateAllReferences = () => {
    let allErrors: { [key: string]: string } = {};
    const validReferences = references.filter(
      ref => ref.name.trim() || ref.contact.trim()
    );

    if (validReferences.length === 0) {
      allErrors.general = 'At least one reference is required';
      return allErrors;
    }

    validReferences.forEach((reference, index) => {
      const referenceErrors = validateReference(reference, index);
      allErrors = { ...allErrors, ...referenceErrors };
    });

    // Check for duplicate contacts
    const contacts = validReferences
      .map(ref => ref.contact.trim())
      .filter(Boolean);
    const duplicateContacts = contacts.filter(
      (contact, index) => contacts.indexOf(contact) !== index
    );

    if (duplicateContacts.length > 0) {
      allErrors.general = 'Duplicate contact numbers are not allowed';
    }

    return allErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateAllReferences();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const validReferences = references.filter(
      ref => ref.name.trim() && ref.contact.trim()
    );

    try {
      setIsSubmitting(true);
      await onAdd(validReferences);
      // Reset form
      setReferences([{ name: '', contact: '' }]);
      setErrors({});
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReferences([{ name: '', contact: '' }]);
    setErrors({});
    onClose();
  };

  const addReference = () => {
    if (references.length < maxReferences) {
      setReferences([...references, { name: '', contact: '' }]);
    }
  };

  const removeReference = (index: number) => {
    if (references.length > 1) {
      const newReferences = references.filter((_, i) => i !== index);
      setReferences(newReferences);

      // Clear errors for removed reference
      const newErrors = { ...errors };
      delete newErrors[`name-${index}`];
      delete newErrors[`contact-${index}`];
      setErrors(newErrors);
    }
  };

  const updateReference = (
    index: number,
    field: keyof Reference,
    value: string
  ) => {
    const newReferences = [...references];
    newReferences[index] = { ...newReferences[index], [field]: value };
    setReferences(newReferences);

    // Clear field error when user starts typing
    const errorKey = `${field}-${index}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  return (
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
                Add References
              </h2>
              <p className="text-sm text-gray-600">
                Add people who can vouch for your application
              </p>
            </div>
          </div>
          <Button onClick={handleClose} variant="ghost" className="p-2">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
            {references.map((reference, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    Reference {index + 1}
                  </h4>
                  {references.length > 1 && (
                    <Button
                      onClick={() => removeReference(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={reference.name}
                      onChange={e =>
                        updateReference(index, 'name', e.target.value)
                      }
                      placeholder="Enter full name"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors[`name-${index}`]
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    />
                    {errors[`name-${index}`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`name-${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={reference.contact}
                      onChange={e =>
                        updateReference(
                          index,
                          'contact',
                          e.target.value.replace(/\D/g, '').slice(0, 10)
                        )
                      }
                      placeholder="10-digit mobile number"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors[`contact-${index}`]
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    />
                    {errors[`contact-${index}`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`contact-${index}`]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          {references.length < maxReferences && (
            <div className="mt-4">
              <Button
                onClick={addReference}
                variant="outline"
                className="w-full flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Reference ({references.length}/{maxReferences})
              </Button>
            </div>
          )}

          {/* Guidelines */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Guidelines
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Add people who know you personally (friends, colleagues,
                neighbors)
              </li>
              <li>
                • Provide accurate contact numbers for WhatsApp notifications
              </li>
              <li>
                • References will receive a message about your voter
                registration
              </li>
              <li>• You can add up to {maxReferences} more references</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={references.every(
                ref => !ref.name.trim() && !ref.contact.trim()
              )}
            >
              Add References
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
