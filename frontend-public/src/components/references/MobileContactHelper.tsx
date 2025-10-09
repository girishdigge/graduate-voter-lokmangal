import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  Smartphone,
  Share2,
  Download,
  Copy,
  ExternalLink,
  QrCode,
  MessageCircle,
} from 'lucide-react';

interface MobileContactHelperProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileContactHelper: React.FC<MobileContactHelperProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'share' | 'whatsapp'>(
    'export'
  );

  const handleCopyInstructions = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could show toast notification
  };

  const openWhatsAppShare = () => {
    const message = encodeURIComponent(
      "Hi! I'm registering as a voter and need to add you as a reference. Could you please share your contact details in this format?\n\nName: [Your Full Name]\nPhone: [Your Phone Number]\n\nThanks!"
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const exportInstructions = {
    ios: [
      'Open the Contacts app on your iPhone',
      'Select the contacts you want to share',
      'Tap the contact name to open details',
      "Tap 'Share Contact' at the bottom",
      "Choose 'Export vCard' or 'AirDrop'",
      'Save the file and upload it here',
    ],
    android: [
      'Open Google Contacts (contacts.google.com) in your browser',
      'Sign in with your Google account',
      'Select the contacts you want to export',
      "Click the 'Export' button",
      "Choose 'vCard (for iOS Contacts)' format",
      'Download the file and upload it here',
    ],
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mobile Contact Helper"
      size="lg"
    >
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Download className="h-4 w-4 mx-auto mb-1" />
            Export Contacts
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'share'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Share2 className="h-4 w-4 mx-auto mb-1" />
            Share Format
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'whatsapp'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <MessageCircle className="h-4 w-4 mx-auto mb-1" />
            WhatsApp
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                Export Your Contacts
              </h3>
              <p className="text-sm text-blue-800">
                Follow these steps to export contacts from your device:
              </p>
            </div>

            {/* iOS Instructions */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  📱 iPhone/iPad (iOS)
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopyInstructions(exportInstructions.ios.join('\n'))
                  }
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                {exportInstructions.ios.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Android Instructions */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">🤖 Android</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopyInstructions(
                      exportInstructions.android.join('\n')
                    )
                  }
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                {exportInstructions.android.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open('https://contacts.google.com', '_blank')
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Google Contacts
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Share Format Tab */}
        {activeTab === 'share' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2 flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Share Contact Format
              </h3>
              <p className="text-sm text-green-800">
                Ask your references to share their details in this format:
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Contact Format</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopyInstructions(
                      'Name: [Full Name]\nPhone: [Phone Number]'
                    )
                  }
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Format
                </Button>
              </div>
              <div className="font-mono text-sm bg-white p-3 rounded border">
                <div>Name: John Doe</div>
                <div>Phone: 9876543210</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">
                Alternative Formats
              </h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <div className="font-mono">John Doe - 9876543210</div>
                <div className="font-mono">John Doe 9876543210</div>
                <div className="font-mono">
                  Name: John Doe, Phone: 9876543210
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Request via WhatsApp
              </h3>
              <p className="text-sm text-green-800">
                Send a WhatsApp message to your references asking for their
                contact details:
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Message Template
              </h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                "Hi! I'm registering as a voter and need to add you as a
                reference. Could you please share your contact details in this
                format?
                <br />
                <br />
                Name: [Your Full Name]
                <br />
                Phone: [Your Phone Number]
                <br />
                <br />
                Thanks!"
              </div>
              <div className="mt-4 flex space-x-3">
                <Button
                  variant="primary"
                  onClick={openWhatsAppShare}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleCopyInstructions(
                      "Hi! I'm registering as a voter and need to add you as a reference. Could you please share your contact details in this format?\n\nName: [Your Full Name]\nPhone: [Your Phone Number]\n\nThanks!"
                    )
                  }
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
