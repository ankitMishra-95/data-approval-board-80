import Cookies from 'js-cookie';

const API_BASE_URL = 'https://dpc-backend-qs8j.onrender.com/api';
const AUTH_COOKIE_NAME = 'auth_token';

interface PasswordResetRequest {
  email: string;
}

interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export const forgotPassword = async (data: PasswordResetRequest) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to send password reset email');
  }

  return await response.json();
};

export const resetPassword = async (data: PasswordResetConfirmRequest) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to reset password');
  }

  return await response.json();
};

export const changePassword = async (data: PasswordChangeRequest) => {
  const token = Cookies.get(AUTH_COOKIE_NAME);
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to change password');
  }

  return await response.json();
}; 