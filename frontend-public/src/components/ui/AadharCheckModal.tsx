import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../../hooks/useAuth';
import { validateAadhar } from '../../lib/utils';
import { apiEndpoints } from '../../lib/api';

interface AadharCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AadharCheckResponse {
  exists: boolean;
  user?: {
    id: string;
    fullName: string;
    contact: string;
    email?: string;
    isVerified: boolean;
  };
  token?: string;
}

const AadharCheckModal: React.FC<AadharCheckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [aadharNumber, setAadharNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 12) {
      setAadharNumber(value);
      setError(''); // Clear error when user starts typing
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Aadhar number format
    if (!validateAadhar(aadharNumber)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiEndpoints.checkAadhar(aadharNumber);
      const data: AadharCheckResponse = response.data.data; // Backend wraps response in data object

      if (data.exists && data.user) {
        // User exists - log them in and redirect to dashboard
        await login(aadharNumber);
        onClose();
        navigate('/dashboard');
      } else {
        // User doesn't exist - redirect to enrollment
        onClose();
        navigate('/enroll', {
          state: { aadharNumber }, // Pass Aadhar number to enrollment form
        });
      }
    } catch (err: any) {
      console.error('Aadhar check error:', err);

      // Handle different error scenarios
      if (err.response?.status === 429) {
        setError('Too many requests. Please try again later.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else if (!err.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setAadharNumber('');
      setError('');
      onClose();
    }
  };

  const formatAadharDisplay = (value: string) => {
    // Format as XXXX XXXX XXXX for display
    return value.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Check Aadhar Number"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-gray-600 mb-4">
            Enter your 12-digit Aadhar number to check if you're already
            registered or to begin the enrollment process.
          </p>

          <Input
            label="Aadhar Number"
            type="text"
            value={formatAadharDisplay(aadharNumber)}
            onChange={handleAadharChange}
            placeholder="1234 5678 9012"
            error={error}
            helperText="Enter your 12-digit Aadhar number"
            disabled={isLoading}
            maxLength={14} // 12 digits + 2 spaces
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!aadharNumber || aadharNumber.length !== 12}
          >
            {isLoading ? 'Checking...' : 'Check & Continue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export { AadharCheckModal };
