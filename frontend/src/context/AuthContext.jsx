import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import i18n from '../i18n';
import api from '../api/client.js';
import { useAuthStore } from '../store/index.js';
import { registerAuthNavigator } from '../utils/auth-redirect';

const AuthContext = createContext(null);

// Must match backend/src/modules/auth/constants.js → AdminRoles exactly.
const ADMIN_ROLES = ['SUPER_ADMIN', 'MANAGER', 'SUPPORT', 'FINANCE', 'INVENTORY_STAFF', 'MARKETING'];
const isAdminRole = (role) => !!role && ADMIN_ROLES.includes(role);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Expose React Router's navigate to the axios 401 interceptor so it can
  // perform a smooth client-side redirect (no full page reload) when the
  // session expires.
  useEffect(() => {
    const unregister = registerAuthNavigator((to, options) => {
      navigate(to, options);
    });
    return unregister;
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => {
        const userData = res.data.data;
        setUser(userData);
        // Sync with Zustand store
        useAuthStore.getState().login?.(userData, token);
      })
      .catch((err) => {
        // 401 on /auth/me is expected for cold-boot stale tokens - clear them
        // silently (no toast, no redirect). Real session expirations while the
        // app is running are handled by the response interceptor above.
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          useAuthStore.getState().logout?.();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    // Try /login first (works for customers AND admins/staff).
    // Fall back to /admin/login only if server explicitly says this account requires admin endpoint.
    const tryEndpoint = async (endpoint) => {
      const res = await api.post(endpoint, { email, password });
      const responseData = res.data?.data || res.data;
      const token = responseData.accessToken || responseData.token;
      const userData = responseData.user;
      const refreshToken = responseData.refreshToken;
      if (!token) throw new Error('Invalid response from server');
      return { token, userData, refreshToken };
    };

    let token, userData, refreshToken;
    try {
      ({ token, userData, refreshToken } = await tryEndpoint('/auth/login'));
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error || err.response?.data?.message || '';
      if (status === 403 && /admin/i.test(serverMsg)) {
        ({ token, userData, refreshToken } = await tryEndpoint('/auth/admin/login'));
      } else if (status === 429) {
        throw new Error(i18n.t('errors.too_many_requests'));
      } else if (status === 401 || status === 403) {
        // Translate known backend strings (e.g. "Invalid email or password")
        // into the user's current UI language.
        const known = /invalid email or password|verify your email/i;
        if (known.test(serverMsg)) {
          const key = /verify your email/i.test(serverMsg)
            ? 'errors.email_not_verified'
            : 'errors.invalid_credentials';
          throw new Error(i18n.t(key));
        }
        throw new Error(serverMsg || i18n.t('errors.invalid_credentials'));
      } else {
        throw new Error(serverMsg || i18n.t('auth.login_failed'));
      }
    }

    const isAdmin = isAdminRole(userData?.role);
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    useAuthStore.getState().login?.(userData, token);
    return { ...userData, isAdmin };
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const responseData = res.data.data;
    localStorage.setItem('token', responseData.accessToken);
    if (responseData.refreshToken) localStorage.setItem('refreshToken', responseData.refreshToken);
    setUser(responseData.user);
    // Sync with Zustand store
    useAuthStore.getState().login?.(responseData.user, responseData.accessToken);
    return responseData.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    // Sync with Zustand store
    useAuthStore.getState().logout?.();
  };

  const refresh = async () => {
    const res = await api.get('/auth/me');
    const userData = res.data.data;
    setUser(userData);
    useAuthStore.getState().updateUser?.(userData);
  };

  const updateUser = (userData) => {
    setUser(userData);
    useAuthStore.getState().updateUser?.(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
