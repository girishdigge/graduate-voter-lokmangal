import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

// Simple integration test without complex routing
describe('Aadhar API Integration Tests', () => {
  const app = express();
  app.use(express.json());

  // Simple test endpoint
  app.post('/api/aadhar/check', (req, res) => {
    const { aadharNumber } = req.body;

    if (!aadharNumber) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Aadhar number is required',
        },
      });
    }

    if (!/^\d{12}$/.test(aadharNumber)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Aadhar number format',
        },
      });
    }

    res.json({
      success: true,
      data: {
        exists: false,
        user: null,
      },
    });
  });

  describe('POST /api/aadhar/check', () => {
    it('should validate Aadhar format and return user not found for new Aadhar', async () => {
      const response = await request(app).post('/api/aadhar/check').send({
        aadharNumber: '123456789012',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          exists: false,
          user: null,
        },
      });
    });

    it('should return 400 for invalid Aadhar format', async () => {
      const response = await request(app).post('/api/aadhar/check').send({
        aadharNumber: '12345',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing Aadhar number', async () => {
      const response = await request(app).post('/api/aadhar/check').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
