import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Textarea } from '../ui';
import { referenceSchema, type ReferenceFormData } from '../../lib/validation';
import { Users, User, Copy } from 'lucide-react';

interface Contact {
  name: string;
  tel: string;
}

interface ManualReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contact: Contact | Contact[]) => void;
}

export const ManualReferenceModal: React.FC<ManualReferenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ReferenceFormData>({
    resolver: zodResolver(referenceSchema),
  });

  const handleFormSubmit = (data: ReferenceFormData) => {
    onSubmit({
      name: data.name,
      tel: data.contact,
    });
    reset();
  };

  const handleBulkSubmit = () => {
    setBulkError(undefined);

    if (!bulkText.trim()) {
      setBulkError('Please enter contact information');
      return;
    }

    const contacts = parseBulkText(bulkText);

    if (contacts.length === 0) {
      setBulkError('No valid contacts found. Please check the format.');
      return;
    }

    onSubmit(contacts);
    setBulkText('');
  };

  const parseBulkText = (text: string): Contact[] => {
    const contacts: Contact[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Try different formats
      // Format 1: "Name: John Doe, Phone: 1234567890"
      let match = line.match(/name:\s*(.+?),?\s*phone:\s*(\d{10,15})/i);
      if (match) {
        contacts.push({
          name: match[1].trim(),
          tel: match[2].replace(/\D/g, ''),
        });
        continue;
      }

      // Format 2: "John Doe - 1234567890"
      match = line.match(/^(.+?)\s*[-–—]\s*(\d{10,15})$/);
      if (match) {
        contacts.push({
          name: match[1].trim(),
          tel: match[2].replace(/\D/g, ''),
        });
        continue;
      }

      // Format 3: "John Doe 1234567890"
      match = line.match(/^(.+?)\s+(\d{10,15})$/);
      if (match) {
        contacts.push({
          name: match[1].trim(),
          tel: match[2].replace(/\D/g, ''),
        });
        continue;
      }

      // Format 4: Two consecutive lines (name, then phone)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const phoneMatch = nextLine.match(/^\+?[\d\s\-\(\)]{10,15}$/);
        if (phoneMatch) {
          contacts.push({
            name: line,
            tel: nextLine.replace(/\D/g, ''),
          });
          i++; // Skip next line as we've processed it
          continue;
        }
      }
    }

    return contacts.filter(
      contact =>
        contact.name.length > 0 &&
        contact.tel.length >= 10 &&
        contact.tel.length <= 15
    );
  };

  const handleClose = () => {
    reset();
    setBulkText('');
    setBulkError(undefined);
    setMode('single');
    onClose();
  };

  const copyExampleFormat = () => {
    const exampleText = `John Doe - 9876543210
Jane Smith - 8765432109
Name: Mike Johnson, Phone: 7654321098`;

    navigator.clipboard.writeText(exampleText).then(() => {
      // Could show a toast notification here
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Reference Manually"
      size="lg"
    >
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'single'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="h-4 w-4 mr-2" />
            Single Contact
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'bulk'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Multiple Contacts
          </button>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="text-sm text-gray-600">
              Enter the contact details of someone who can vouch for your
              application. They will receive a WhatsApp notification about your
              voter registration.
            </div>

            <Input
              label="Full Name"
              placeholder="Enter reference's full name"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Contact Number"
              placeholder="Enter 10-digit mobile number"
              type="tel"
              maxLength={15}
              error={errors.contact?.message}
              {...register('contact')}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Add Reference
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Paste multiple contacts in any of these formats:
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Example formats:
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyExampleFormat}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="text-xs text-gray-700 font-mono space-y-1">
                <div>John Doe - 9876543210</div>
                <div>Jane Smith - 8765432109</div>
                <div>Name: Mike Johnson, Phone: 7654321098</div>
              </div>
            </div>

            <Textarea
              label="Contact Information"
              placeholder="Paste your contacts here..."
              value={bulkText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBulkText(e.target.value)
              }
              rows={8}
              error={bulkError}
            />

            {bulkText && (
              <div className="text-sm text-gray-600">
                Found {parseBulkText(bulkText).length} valid contacts
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleBulkSubmit}
                disabled={!bulkText.trim()}
              >
                Add Contacts
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
