# Password Management Features

This application includes comprehensive password management functionality integrated with the DPC API.

## Features

### 1. Forgot Password
- **Route**: `/forgot-password`
- **Functionality**: Allows users to request a password reset email
- **API Endpoint**: `POST /api/auth/forgot-password`
- **Usage**: Users enter their email address and receive a reset link

### 2. Reset Password
- **Route**: `/reset-password?token=<reset_token>`
- **Functionality**: Allows users to set a new password using a reset token
- **API Endpoint**: `POST /api/auth/reset-password`
- **Usage**: Users click the reset link from their email and enter a new password
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

### 3. Change Password (Authenticated Users)
- **Access**: Available in the user dropdown menu in the dashboard header
- **Functionality**: Allows authenticated users to change their password
- **API Endpoint**: `POST /api/auth/change-password`
- **Usage**: Users enter their current password and new password
- **Password Requirements**: Same as reset password

## Implementation Details

### API Integration
All password management functions are implemented in `src/lib/api/auth.ts`:
- `forgotPassword(email: string)`
- `resetPassword(token: string, newPassword: string)`
- `changePassword(oldPassword: string, newPassword: string)`

### Authentication Context
Password management functions are available through the `useAuth()` hook:
```typescript
const { forgotPassword, resetPassword, changePassword } = useAuth();
```

### Components
- `ForgotPassword.tsx` - Dedicated page for password reset requests
- `ResetPassword.tsx` - Page for setting new password with reset token
- `ChangePasswordDialog.tsx` - Modal dialog for authenticated users

### Security Features
- Password validation with strong requirements
- Secure token handling for password resets
- Authentication required for password changes
- Proper error handling and user feedback

## User Flow

1. **Forgot Password**:
   - User clicks "Forgot Password?" on sign-in page
   - User enters email address
   - System sends reset email
   - User receives confirmation

2. **Reset Password**:
   - User clicks reset link in email
   - User enters new password (with confirmation)
   - System validates and updates password
   - User is redirected to sign-in

3. **Change Password**:
   - Authenticated user clicks user menu in header
   - User selects "Change Password"
   - User enters current and new passwords
   - System validates and updates password

## Error Handling
- Invalid email addresses
- Expired or invalid reset tokens
- Incorrect current passwords
- Password validation failures
- Network errors

All errors are handled gracefully with user-friendly toast notifications. 