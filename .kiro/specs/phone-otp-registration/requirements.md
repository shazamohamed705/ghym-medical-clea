# Requirements Document

## Introduction

This feature simplifies the user registration process by implementing phone-based OTP (One-Time Password) authentication only. The current registration flow requires users to provide name, email, password, and phone number, followed by a separate OTP verification step. The new flow will streamline this by requiring only a phone number, automatically sending an OTP, and creating the account immediately upon successful verification.

## Glossary

- **Registration_System**: The component responsible for handling new user account creation
- **OTP_Service**: The service that sends and verifies one-time passwords via SMS
- **Phone_Number**: A Saudi mobile phone number in the format 05XXXXXXXX (10 digits starting with 05)
- **OTP**: One-Time Password - a 6-digit numeric code sent via SMS for verification
- **User_Account**: The authenticated user profile created after successful OTP verification
- **Auth_Context**: The React context managing authentication state and user session

## Requirements

### Requirement 1: Phone Number Input

**User Story:** As a new user, I want to register using only my phone number, so that I can quickly create an account without filling multiple fields.

#### Acceptance Criteria

1. WHEN a user visits the registration page, THE Registration_System SHALL display a single input field for phone number
2. WHEN a user enters a phone number, THE Registration_System SHALL validate it matches the Saudi format (05XXXXXXXX)
3. WHEN a user enters non-numeric characters, THE Registration_System SHALL prevent the input and only accept digits
4. WHEN a user submits an invalid phone number format, THE Registration_System SHALL display an error message indicating the correct format
5. THE Registration_System SHALL provide real-time validation feedback as the user types

### Requirement 2: Automatic OTP Sending

**User Story:** As a new user, I want the OTP to be sent automatically when I submit my phone number, so that I don't need to perform additional steps.

#### Acceptance Criteria

1. WHEN a user submits a valid phone number, THE Registration_System SHALL automatically call the send-login-code endpoint
2. WHEN the OTP is sent successfully, THE Registration_System SHALL transition to the OTP verification screen
3. WHEN the OTP sending fails, THE Registration_System SHALL display an error message and allow the user to retry
4. THE Registration_System SHALL use the endpoint {{baseUrl}}/user/send-login-code with the request body {"phone_number":"XXXXXXXXXX"}
5. WHEN the API returns success status, THE Registration_System SHALL display a confirmation message showing the phone number

### Requirement 3: OTP Verification

**User Story:** As a new user, I want to verify my phone number with the OTP code, so that I can complete my registration securely.

#### Acceptance Criteria

1. WHEN the OTP verification screen is displayed, THE Registration_System SHALL show 6 input boxes for the OTP digits
2. WHEN a user enters a digit, THE Registration_System SHALL automatically focus the next input box
3. WHEN a user presses backspace on an empty box, THE Registration_System SHALL focus the previous input box
4. WHEN a user enters all 6 digits, THE Registration_System SHALL enable the verification button
5. WHEN a user submits the OTP, THE Registration_System SHALL call the verification endpoint
6. WHEN the OTP is verified successfully, THE Registration_System SHALL create the user account automatically
7. WHEN the OTP verification fails, THE Registration_System SHALL display an error message and allow retry

### Requirement 4: OTP Resend Functionality

**User Story:** As a new user, I want to request a new OTP if I didn't receive it, so that I can complete my registration.

#### Acceptance Criteria

1. WHEN the OTP verification screen is displayed, THE Registration_System SHALL show a resend button
2. WHEN a user clicks resend, THE Registration_System SHALL call the send-login-code endpoint again
3. WHEN the resend is triggered, THE Registration_System SHALL start a 60-second countdown timer
4. WHILE the countdown timer is active, THE Registration_System SHALL disable the resend button
5. WHEN the countdown reaches zero, THE Registration_System SHALL enable the resend button again
6. WHEN the resend is successful, THE Registration_System SHALL display a success message

### Requirement 5: Account Creation and Auto-Login (Registration = Registration + Login)

**User Story:** As a new user, I want to register and be automatically logged in in a single flow, so that I can access the application immediately without needing to log in separately.

#### Acceptance Criteria

1. WHEN the OTP is verified successfully, THE Registration_System SHALL create a User_Account with the verified phone number
2. WHEN the account is created, THE Registration_System SHALL automatically log the user in (establish authenticated session)
3. WHEN the account is created, THE Registration_System SHALL store the authentication token in the Auth_Context
4. WHEN the account is created, THE Registration_System SHALL persist the authentication state in localStorage
5. WHEN the account is created, THE Registration_System SHALL display a success message
6. WHEN the success message is displayed, THE Registration_System SHALL redirect the user to the Home page after 2 seconds
7. WHEN the user arrives at the Home page, THE user SHALL be fully authenticated and logged in (no additional login required)
8. THE Registration process SHALL complete both account creation AND user login in a single operation

### Requirement 6: Error Handling

**User Story:** As a new user, I want clear error messages when something goes wrong, so that I know how to proceed.

#### Acceptance Criteria

1. WHEN the phone number validation fails, THE Registration_System SHALL display "يرجى إدخال رقم هاتف سعودي صحيح (05xxxxxxxx)"
2. WHEN the OTP sending fails, THE Registration_System SHALL display the error message from the API response
3. WHEN the OTP verification fails, THE Registration_System SHALL display "رمز التحقق غير صحيح" and allow retry
4. WHEN a network error occurs, THE Registration_System SHALL display "حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى"
5. WHEN an incomplete OTP is submitted, THE Registration_System SHALL display "يرجى إدخال رمز التحقق المكون من 6 أرقام"

### Requirement 7: UI/UX Consistency

**User Story:** As a new user, I want the registration flow to be consistent with the login experience, so that the interface feels familiar.

#### Acceptance Criteria

1. THE Registration_System SHALL use the same styling classes as the existing login component
2. THE Registration_System SHALL display the website logo in the header
3. THE Registration_System SHALL include a back button to navigate to the previous page
4. THE Registration_System SHALL display text in Arabic (RTL layout)
5. THE Registration_System SHALL show loading states during API calls
6. WHEN the user is already registered, THE Registration_System SHALL provide a link to the login page

### Requirement 8: Login Flow Alignment

**User Story:** As a returning user, I want the login process to work seamlessly with the new registration flow, so that I can access my account consistently.

#### Acceptance Criteria

1. THE Registration_System SHALL use the same OTP endpoint for both registration and login flows
2. WHEN a registered user enters their phone number, THE Registration_System SHALL send an OTP using the same endpoint
3. THE Registration_System SHALL handle both new and existing users through the same OTP verification process
4. THE Auth_Context SHALL maintain consistent authentication state for both registration and login flows
