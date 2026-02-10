// Feature: phone-otp-registration, Unit Tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';

// Mock the API service
jest.mock('../../API/apiService', () => ({
  resendOTP: jest.fn(),
  verifyPhoneOTP: jest.fn()
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Helper function to render component
const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

describe('Register Component - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Requirements: 2.2, 2.3, 2.5
  describe('OTP Send Flow', () => {
    test('successful OTP send transitions to OTP step', async () => {
      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          message: 'OTP sent successfully'
        })
      });

      renderRegister();
      
      // Enter valid phone number
      const phoneInput = screen.getByPlaceholderText(/رقم الهاتف/);
      fireEvent.change(phoneInput, { target: { value: '0501234567' } });
      
      // Submit form
      const submitButton = screen.getByText(/إرسال رمز التحقق/);
      fireEvent.click(submitButton);

      // Wait for transition to OTP step
      await waitFor(() => {
        expect(screen.getByText(/التحقق من رقم الهاتف/)).toBeInTheDocument();
      });

      // Verify OTP input boxes are displayed
      const otpInputs = screen.getAllByRole('textbox');
      expect(otpInputs).toHaveLength(6); // 6 OTP digit inputs
    });

    test('OTP send failure displays error message', async () => {
      // Mock API error response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          status: 'error',
          message: 'فشل في إرسال رمز التحقق'
        })
      });

      // Mock alert
      window.alert = jest.fn();

      renderRegister();
      
      // Enter valid phone number
      const phoneInput = screen.getByPlaceholderText(/رقم الهاتف/);
      fireEvent.change(phoneInput, { target: { value: '0501234567' } });
      
      // Submit form
      const submitButton = screen.getByText(/إرسال رمز التحقق/);
      fireEvent.click(submitButton);

      // Wait for error handling
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('فشل في إرسال رمز التحقق');
      });

      // Should remain on phone input step
      expect(screen.getByText(/إنشاء حساب جديد/)).toBeInTheDocument();
    });

    test('success message displays phone number', async () => {
      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          message: 'OTP sent successfully'
        })
      });

      renderRegister();
      
      const testPhone = '0501234567';
      
      // Enter valid phone number
      const phoneInput = screen.getByPlaceholderText(/رقم الهاتف/);
      fireEvent.change(phoneInput, { target: { value: testPhone } });
      
      // Submit form
      const submitButton = screen.getByText(/إرسال رمز التحقق/);
      fireEvent.click(submitButton);

      // Wait for transition to OTP step
      await waitFor(() => {
        expect(screen.getByText(/التحقق من رقم الهاتف/)).toBeInTheDocument();
      });

      // Verify phone number is displayed
      expect(screen.getByText(testPhone)).toBeInTheDocument();
      expect(screen.getByText(/تم إرسال رمز التحقق إلى رقم الهاتف/)).toBeInTheDocument();
    });
  });
});