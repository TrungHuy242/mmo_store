import api from './client.js';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (userId, token) => api.get(`/auth/verify-email/${userId}/${token}`),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  // 2FA OTP
  verifyLoginOtp: (userId, code) => api.post('/auth/verify-otp', { userId, code }),
  resendLoginOtp: (userId) => api.post('/auth/resend-otp', { userId }),
  toggleTwoFactor: (enabled) => api.post('/auth/toggle-2fa', { enabled }),
};

export const profileApi = {
  generateTelegramLink: () => api.post('/profile/telegram/generate-link'),
  getTelegramLinkStatus: () => api.get('/profile/telegram/link-status'),
  unlinkTelegram: () => api.post('/profile/telegram/unlink'),
};

export default authApi;
