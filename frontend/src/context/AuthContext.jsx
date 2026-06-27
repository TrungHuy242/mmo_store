import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuthStore } from '../store/index.js';

const AuthContext = createContext(null);

const ADMIN_ROLES = ['SUPER_ADMIN', 'MANAGER', 'SUPPORT', 'FINANCE', 'INVENTORY_STAFF', 'MARKETING'];
const isAdminRole = (role) => !!role && ADMIN_ROLES.includes(role);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      .catch(() => {
        localStorage.removeItem('token');
        useAuthStore.getState().logout?.();
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
        throw new Error('Quá nhiều yêu cầu. Vui lòng chờ và thử lại sau.');
      } else if (status === 401 || status === 403) {
        throw new Error(serverMsg || 'Email hoặc mật khẩu không đúng');
      } else {
        throw new Error(serverMsg || 'Đăng nhập thất bại');
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
