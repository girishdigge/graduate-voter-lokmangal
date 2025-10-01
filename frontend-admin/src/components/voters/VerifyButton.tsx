import React, { useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui';

interface VerifyButtonProps {
  isVerified: boolean;
  onVerify: (isVerified: boolean) => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const VerifyButton: React.FC<VerifyButtonProps> = ({
  isVerified,
  onVerify,
  disabled = false,
  size = 'sm',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = async () => {
    if (showConfirm) {
      setIsLoading(true);
      try {
        await onVerify(!isVerified);
        setShowConfirm(false);
      } catch (error) {
        console.error('Verification error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowConfirm(true);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <AlertCircle className="h-4 w-4" />
          <span>{isVerified ? 'Unverify voter?' : 'Verify voter?'}</span>
        </div>
        <Button
          size={size}
          variant="primary"
          onClick={handleClick}
          isLoading={isLoading}
          disabled={disabled}
        >
          <Check className="h-4 w-4" />
          Yes
        </Button>
        <Button
          size={size}
          variant="secondary"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
          No
        </Button>
      </div>
    );
  }

  return (
    <Button
      size={size}
      variant={isVerified ? 'danger' : 'primary'}
      onClick={handleClick}
      disabled={disabled}
      className="flex items-center gap-1"
    >
      {isVerified ? (
        <>
          <X className="h-4 w-4" />
          Unverify
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          Verify
        </>
      )}
    </Button>
  );
};
