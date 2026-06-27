/**
 * Authentication Service
 * Handles all authentication API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authService = {
  /**
   * Login user
   */
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.message || res.error || 'Login failed');
    }

    // Support both response formats:
    // Format A: { success, data: { user, accessToken, refreshToken } }
    // Format B: { user, token, refreshToken } (old format)
    const payload = res.data || res;
    const token = payload.accessToken || payload.token;
    const refreshToken = payload.refreshToken;
    const user = payload.user || res.user;

    // Store tokens
    if (token) {
      localStorage.setItem('token', token);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    return {
      user,
      token,
      refreshToken,
    };
  },

  /**
   * Register new user
   */
  register: async ({ email, password, name }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.message || res.error || 'Registration failed');
    }

    const payload = res.data || res;
    const token = payload.accessToken || payload.token;
    const refreshToken = payload.refreshToken;
    const user = payload.user || res.user;

    if (token) {
      localStorage.setItem('token', token);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    return {
      user,
      token,
      refreshToken,
    };
  },

  /**
   * Get current user info
   */
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user info');
    }

    return data.user;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
    } finally {
      // Clear local storage regardless of API result
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('auth-store');
      localStorage.removeItem('auth-persist');
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      throw new Error(data.message || 'Token refresh failed');
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }

    return {
      token: data.token,
      refreshToken: data.refreshToken,
    };
  },
};

export default authService;
