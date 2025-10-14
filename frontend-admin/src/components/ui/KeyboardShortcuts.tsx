import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    keys: ['Ctrl', '←'],
    description: 'Previous page',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', '→'],
    description: 'Next page',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', 'Home'],
    description: 'First page',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', 'End'],
    description: 'Last page',
    category: 'Navigation',
  },
  {
    keys: ['?'],
    description: 'Show keyboard shortcuts',
    category: 'Help',
  },
];

interface KeyboardShortcutsProps {
  className?: string;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${className}`}
        title="Keyboard shortcuts"
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline">Shortcuts</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Keyboard Shortcuts"
        size="md"
      >
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(
            ([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-gray-400 text-xs">+</span>
                            )}
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Keyboard shortcuts work when not typing in
              input fields.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
