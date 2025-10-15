// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ContactPickerCard } from '../../components/dashboard/ContactPickerCard';
import { apiEndpoints } from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  apiEndpoints: {
    getReferences: vi.fn(),
    addReferences: vi.fn(),
  },
}));

// Mock the contact utils
vi.mock('../../lib/contactUtils', () => ({
  detectContactCapabilities: () => ({ supportsContactPicker: false }),
  formatPhoneNumber: (phone: string) => phone,
  validateContact: () => ({ isValid: true }),
  pickContacts: vi.fn(),
  parseVCard: vi.fn(),
  parseCSV: vi.fn(),
  parseBulkText: vi.fn(),
  shareContactRequest: vi.fn(),
  generateWhatsAppShareURL: vi.fn(),
}));

const mockReferences = [
  {
    id: '1',
    referenceName: 'John Doe',
    referenceContact: '9876543210',
    status: 'PENDING' as const,
    whatsappSent: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    referenceName: 'Jane Smith',
    referenceContact: '9876543211',
    status: 'CONTACTED' as const,
    whatsappSent: true,
    whatsappSentAt: '2024-01-02T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('ContactPickerCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays empty state when no references are added', async () => {
    vi.mocked(apiEndpoints.getReferences).mockResolvedValue({
      data: { success: true, references: [] },
    });

    render(<ContactPickerCard userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('No References Added')).toBeInTheDocument();
      expect(screen.getByText('Add Your First Reference')).toBeInTheDocument();
    });
  });

  it('displays references when they exist', async () => {
    vi.mocked(apiEndpoints.getReferences).mockResolvedValue({
      data: { success: true, references: mockReferences },
    });

    render(<ContactPickerCard userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Your References (2)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows correct status for each reference', async () => {
    vi.mocked(apiEndpoints.getReferences).mockResolvedValue({
      data: { success: true, references: mockReferences },
    });

    render(<ContactPickerCard userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Contacted')).toBeInTheDocument();
    });
  });

  it('shows WhatsApp status correctly', async () => {
    vi.mocked(apiEndpoints.getReferences).mockResolvedValue({
      data: { success: true, references: mockReferences },
    });

    render(<ContactPickerCard userId="test-user-id" />);

    await waitFor(() => {
      expect(
        screen.getByText('WhatsApp notification pending')
      ).toBeInTheDocument();
      expect(screen.getByText(/WhatsApp sent on/)).toBeInTheDocument();
    });
  });

  it('displays summary statistics correctly', async () => {
    vi.mocked(apiEndpoints.getReferences).mockResolvedValue({
      data: { success: true, references: mockReferences },
    });

    render(<ContactPickerCard userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Reference Status Overview')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total
      expect(screen.getByText('1')).toBeInTheDocument(); // Notified
      expect(
        screen.getByText('8 more references can be added')
      ).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(apiEndpoints.getReferences).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ContactPickerCard userId="test-user-id" />);

    expect(screen.getByText('Loading your references...')).toBeInTheDocument();
  });
});
