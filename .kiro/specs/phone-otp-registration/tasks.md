# Implementation Plan: Phone-Based OTP Registration

## Overview

This implementation plan converts the existing multi-field registration form into a streamlined phone-only OTP authentication flow. The approach focuses on simplifying the Register component by removing unnecessary fields (name, email, password) and implementing a two-step process: phone number entry and OTP verification. The implementation will reuse existing API endpoints and maintain consistency with the current UI/UX patterns.

## Tasks

- [x] 1. Simplify registration form to phone-only input
  - Remove name, email, password, and confirm password input fields from the registration form
  - Remove all validation logic for removed fields (name validation, password strength, password match)
  - Update form state to only track phone number and validation state
  - Keep the existing phone input field with Saudi format validation (05XXXXXXXX)
  - Maintain real-time validation feedback with icons (✓ or ✗)
  - Update submit button text to "إرسال رمز التحقق" (Send Verification Code)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Write property test for phone validation
  - **Property 1: Phone Number Validation**
  - **Validates: Requirements 1.2, 1.4**

- [x] 1.2 Write property test for non-numeric filtering
  - **Property 2: Non-Numeric Character Filtering**
  - **Validates: Requirements 1.3**

- [x] 1.3 Write property test for real-time validation
  - **Property 3: Real-Time Validation Updates**
  - **Validates: Requirements 1.5**

- [x] 2. Implement automatic OTP sending on phone submission
  - Update `handleSubmit` function to call `/user/send-login-code` endpoint instead of `/user/register`
  - Remove the registration API call completely
  - On successful OTP send, transition to OTP verification step (`currentStep: 'otp'`)
  - Pass the phone number to OTP state for display and verification
  - Display success message "تم إرسال رمز التحقق إلى رقم هاتفك"
  - Handle API errors and display appropriate error messages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Write property test for OTP send API integration
  - **Property 4: OTP Send API Integration**
  - **Validates: Requirements 2.1, 2.4**

- [x] 2.2 Write unit tests for OTP send flow
  - Test successful OTP send transitions to OTP step
  - Test OTP send failure displays error message
  - Test success message displays phone number
  - _Requirements: 2.2, 2.3, 2.5_

- [-] 3. Update OTP verification screen
  - Keep existing 6-digit OTP input boxes
  - Auto-populate phone number in OTP state (skip phone entry step)
  - Display phone number prominently: "تم إرسال رمز التحقق إلى رقم الهاتف: [phone]"
  - Keep existing auto-focus navigation between OTP boxes
  - Keep existing backspace navigation
  - Keep existing resend functionality with 60-second timer
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 3.1 Write property tests for OTP input navigation
  - **Property 5: OTP Digit Auto-Focus Navigation**
  - **Property 6: OTP Backspace Navigation**
  - **Validates: Requirements 3.2, 3.3**

- [x] 3.2 Write property test for verification button state
  - **Property 7: Verification Button State**
  - **Validates: Requirements 3.4**

- [x] 3.3 Write property test for verification API call
  - **Property 8: OTP Verification API Call**
  - **Validates: Requirements 3.5**

- [x] 3.4 Write property tests for resend functionality
  - **Property 9: Resend OTP API Call**
  - **Property 10: Resend Timer Button Disable**
  - **Validates: Requirements 4.2, 4.4**

- [x] 3.5 Write unit tests for OTP screen
  - Test OTP screen displays 6 input boxes
  - Test resend button exists
  - Test timer starts at 60 seconds
  - Test resend button disabled during countdown
  - _Requirements: 3.1, 4.1, 4.3_

- [x] 4. Implement account creation and auto-login after OTP verification
  - Update `handleOtpVerification` to create account AND login user after successful verification
  - On successful OTP verification, receive user data and token from verification endpoint
  - Call `login()` from AuthContext to establish authenticated session (this completes the login part)
  - Display success message "تم التحقق من رقم هاتفك بنجاح!"
  - Transition to success step (`currentStep: 'verified'`)
  - Redirect to Home page after 2 seconds (user is now fully authenticated and logged in)
  - Ensure user does NOT need to visit login page after registration
  - _Requirements: 3.6, 3.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 4.1 Write property test for account creation
  - **Property 11: Account Creation with Phone Number**
  - **Validates: Requirements 5.1**

- [x] 4.2 Write property test for authentication persistence
  - **Property 12: Authentication Persistence**
  - **Validates: Requirements 5.5**

- [x] 4.3 Write unit tests for account creation and auto-login flow
  - Test successful verification creates account
  - Test auth token stored in AuthContext
  - Test user is logged in after verification (not just account created)
  - Test success message displayed
  - Test redirect to Home page after 2 seconds
  - Test user is fully authenticated when arriving at Home page
  - Test user does NOT need to visit login page
  - Test verification failure shows error and allows retry
  - _Requirements: 3.6, 3.7, 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.8_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement comprehensive error handling
  - Add error handling for phone validation failures with message "يرجى إدخال رقم هاتف سعودي صحيح (05xxxxxxxx)"
  - Add error handling for OTP send failures (display API error message)
  - Add error handling for OTP verification failures with message "رمز التحقق غير صحيح"
  - Add error handling for network errors with message "حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى"
  - Add error handling for incomplete OTP with message "يرجى إدخال رمز التحقق المكون من 6 أرقام"
  - Clear error messages when user starts typing or making changes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.1 Write property test for API error display
  - **Property 13: API Error Message Display**
  - **Validates: Requirements 6.2**

- [ ] 6.2 Write unit tests for error handling
  - Test phone validation error message
  - Test OTP verification error message
  - Test network error message
  - Test incomplete OTP error message
  - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 7. Implement loading states and UI polish
  - Add loading state during OTP send API call
  - Add loading state during OTP verification API call
  - Add loading state during resend API call
  - Disable submit buttons during loading
  - Show loading text on buttons ("جاري الإرسال...", "جاري التحقق...")
  - Ensure logo displays correctly in header
  - Ensure back button navigates to previous page
  - Ensure login link is visible on registration page
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

- [ ] 7.1 Write property test for loading states
  - **Property 14: Loading State During API Calls**
  - **Validates: Requirements 7.5**

- [ ] 7.2 Write unit tests for UI elements
  - Test logo displays in header
  - Test back button exists and navigates
  - Test login link exists on registration page
  - _Requirements: 7.2, 7.3, 7.6_

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Clean up and remove unused code
  - Remove unused state variables (firstName, lastName, email, password, confirmPassword)
  - Remove unused validation functions (isPasswordStrong, validatePasswordMatch, handleNameChange, isArabicText)
  - Remove unused validation state (passwordStrength, nameValidation, passwordMatch)
  - Remove commented or dead code
  - Ensure no console.log statements remain
  - Update component comments to reflect new simplified flow

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The existing OTP verification logic can be largely reused, only the registration step changes
- The API endpoint `/user/send-login-code` is already implemented and working
- The design maintains backward compatibility with the login flow
