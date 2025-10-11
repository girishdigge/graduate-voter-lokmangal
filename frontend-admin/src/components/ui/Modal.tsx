import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Modal panel */}
        <div
          className={`relative w-full ${sizeClasses[size]} p-6 bg-white shadow-2xl rounded-lg transform transition-all border border-gray-200`}
          onClick={e => e.stopPropagation()}
          style={{ zIndex: 10001 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};
