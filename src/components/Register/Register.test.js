import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
import Register from './Register';

// Mock the API service
jest.mock('../../API/apiService', () => ({
  resendOTP: jest.fn(),
  verifyPhoneOTP: jest.fn(),
}));

// Helper function to render Register component with router
const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

// Helper function to get phone input
const getPhoneInput = () => screen.getByPlaceholderText(/رقم الهاتف/);

describe('Register Component - Property-Based Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Property 1: Phone Number Validation', () => {
    /**
     * Feature: phone-otp-registration, Property 1: Phone Number Validation
     * **Validates: Requirements 1.2, 1.4**
     * 
     * For any string input to the phone number field, the validation function should return 
     * `isValid: true` only when the input matches the Saudi phone format (exactly 10 digits 
     * starting with "05"), and should return an appropriate Arabic error message for all invalid formats.
     */
    test('should validate phone numbers correctly for all input strings', () => {
      fc.assert(
        fc.property(fc.string(), (inputString) => {
          renderRegister();
          const phoneInput = getPhoneInput();
          
          // Simulate user input
          fireEvent.change(phoneInput, { target: { value: inputString } });
          
          // Check if the input matches Saudi phone format
          const saudiPhoneRegex = /^05\d{8}$/;
          const isValidFormat = saudiPhoneRegex.test(inputString);
          
          if (isValidFormat) {
            // Should show success indicator for valid format
            expect(screen.queryByText(/رقم الهاتف صحيح/)).toBeInTheDocument();
          } else if (inputString.length > 0) {
            // Should show error message for invalid format (if not empty)
            expect(screen.queryByText(/يرجى إدخال رقم هاتف سعودي صحيح/)).toBeInTheDocument();
          }
          
          // The input value should only contain digits (non-numeric chars filtered)
          const filteredValue = inputString.replace(/\D/g, '');
          expect(phoneInput.value).toBe(filteredValue);
        }),
        { numRuns: 100 }
      );
    });

    test('should validate specifically valid Saudi phone numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99999999 }).map(num => `05${num.toString().padStart(8, '0')}`),
          (validPhone) => {
            renderRegister();
            const phoneInput = getPhoneInput();
            
            fireEvent.change(phoneInput, { target: { value: validPhone } });
            
            // Valid Saudi phone numbers should show success
            expect(screen.getByText(/رقم الهاتف صحيح/)).toBeInTheDocument();
            expect(phoneInput.value).toBe(validPhone);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject invalid phone number formats', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Wrong prefix
            fc.string({ minLength: 10, maxLength: 10 }).filter(s => !s.startsWith('05')),
            // Wrong length
            fc.string({ minLength: 1, maxLength: 9 }),
            fc.string({ minLength: 11, maxLength: 20 }),
            // Contains non-digits after filtering
            fc.string().filter(s => s.length > 0 && !/^05\d{8}$/.test(s))
          ),
          (invalidPhone) => {
            renderRegister();
            const phoneInput = getPhoneInput();
            
            fireEvent.change(phoneInput, { target: { value: invalidPhone } });
            
            // Invalid formats should show error (if input is not empty after filtering)
            const filteredValue = invalidPhone.replace(/\D/g, '');
            if (filteredValue.length > 0) {
              expect(screen.queryByText(/يرجى إدخال رقم هاتف سعودي صحيح/)).toBeInTheDocument();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});