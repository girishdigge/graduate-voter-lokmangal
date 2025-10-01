import { describe, it, expect, vi } from 'vitest';

// Simple unit tests for userService functions
describe('UserService', () => {
  describe('validateAadharFormat', () => {
    it('should validate correct Aadhar format', async () => {
      // Import the function to test
      const { validateAadharFormat } = await import(
        '../../services/userService'
      );

      expect(validateAadharFormat('123456789012')).toBe(true);
      expect(validateAadharFormat('1234 5678 9012')).toBe(true);
      expect(validateAadharFormat('1234-5678-9012')).toBe(true);
    });

    it('should reject invalid Aadhar format', async () => {
      const { validateAadharFormat } = await import(
        '../../services/userService'
      );

      expect(validateAadharFormat('12345')).toBe(false);
      expect(validateAadharFormat('abcd12345678')).toBe(false);
      expect(validateAadharFormat('')).toBe(false);
    });
  });

  describe('cleanAadharNumber', () => {
    it('should clean Aadhar number by removing spaces and hyphens', async () => {
      const { cleanAadharNumber } = await import('../../services/userService');

      expect(cleanAadharNumber('1234 5678 9012')).toBe('123456789012');
      expect(cleanAadharNumber('1234-5678-9012')).toBe('123456789012');
      expect(cleanAadharNumber('123456789012')).toBe('123456789012');
    });
  });
});
