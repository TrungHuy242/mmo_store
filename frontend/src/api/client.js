import axios from 'axios';
import { useAuthStore } from '../store';
import { handleSessionExpired } from '../utils/auth-redirect';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Track if we're already refreshing a token to prevent concurrent refresh requests
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Add token to request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Endpoints that manage the session itself. 401 on these endpoints means
// "your credentials are wrong", not "your session expired", so we must
// never trigger the global session-expired redirect from them.
const AUTH_ENDPOINT_FRAGMENTS = [
  '/auth/login',
  '/auth/admin/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/verify-email',
];

function isAuthEndpoint(url) {
  if (!url) return false;
  return AUTH_ENDPOINT_FRAGMENTS.some((frag) => url.includes(frag));
}

// Handle response with silent token refresh + smooth 401 handling
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // ── 401: token expired / invalid ─────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Auth endpoints: never try to refresh and never trigger the global
      // session-expired redirect. Just let the caller handle the 401.
      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      // Try to refresh the token silently first. If we have a refreshToken
      // AND it's still valid, the user keeps their session transparently.
      if (isRefreshing) {
        // Queue this request while another instance refreshes the token.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token available - immediately bounce to login.
        isRefreshing = false;
        processQueue(new Error('No refresh token'));
        handleSessionExpired('no-refresh');
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const responseData = response.data?.data || response.data;
        const accessToken = responseData?.accessToken || responseData?.token;

        if (!accessToken) {
          throw new Error('Invalid refresh response');
        }

        const newRefreshToken = responseData?.refreshToken;

        // Update tokens in localStorage
        localStorage.setItem('token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update auth store (keep existing user object, swap token)
        const authStore = useAuthStore.getState();
        if (authStore?.updateUser) {
          authStore.updateUser({ token: accessToken });
        }

        // Process queued requests
        processQueue(null, accessToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed - session is truly over. Logout + redirect.
        processQueue(refreshError);
        handleSessionExpired('refresh-failed');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;