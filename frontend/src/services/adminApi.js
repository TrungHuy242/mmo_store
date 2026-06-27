/**
 * Admin API Service
 * Tập trung toàn bộ API calls cho Admin Dashboard
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Helper để tạo query string từ object
 */
const toQueryString = (params = {}) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  return new URLSearchParams(filtered).toString();
};

/**
 * Base fetch wrapper với error handling
 */
const apiFetch = async (path, options = {}) => {
  const qs = options.params ? `?${toQueryString(options.params)}` : '';
  const url = `${API_BASE_URL}${path}${qs}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.response = { status: res.status, data };
    throw err;
  }

  return data;
};

// ─── Products ──────────────────────────────────────────────────────────────

export const getProducts = (params) =>
  apiFetch('/products', { params });

export const getProduct = (id) =>
  apiFetch(`/products/${id}`);

export const createProduct = (body) =>
  apiFetch('/products', { method: 'POST', body: JSON.stringify(body) });

export const updateProduct = (id, body) =>
  apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteProduct = (id) =>
  apiFetch(`/products/${id}`, { method: 'DELETE' });

// ─── Categories ────────────────────────────────────────────────────────────

export const getCategories = () =>
  apiFetch('/categories');

export const createCategory = (body) =>
  apiFetch('/categories', { method: 'POST', body: JSON.stringify(body) });

export const updateCategory = (id, body) =>
  apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteCategory = (id) =>
  apiFetch(`/categories/${id}`, { method: 'DELETE' });

// ─── Orders ────────────────────────────────────────────────────────────────

export const getOrders = (params) =>
  apiFetch('/orders', { params });

export const getOrder = (id) =>
  apiFetch(`/orders/${id}`);

export const cancelOrder = (id) =>
  apiFetch(`/orders/${id}/cancel`, { method: 'PUT' });

export const completeOrder = (id) =>
  apiFetch(`/orders/${id}/complete`, { method: 'POST' });

// ─── Inventory ─────────────────────────────────────────────────────────────

export const getInventoryByProduct = (productId, params) =>
  apiFetch(`/inventory/product/${productId}`, { params });

export const getInventoryStats = (productId) =>
  apiFetch('/inventory/statistics', { params: productId ? { productId } : {} });

export const addBulkInventory = (productId, items) =>
  apiFetch('/inventory/bulk', {
    method: 'POST',
    body: JSON.stringify({ productId, items }),
  });

export const deleteInventoryItem = (id) =>
  apiFetch(`/inventory/${id}`, { method: 'DELETE' });

// ─── Customers ─────────────────────────────────────────────────────────────

export const getCustomers = (params) =>
  apiFetch('/customers', { params });

export const getCustomer = (id) =>
  apiFetch(`/customers/${id}`);

export const updateCustomerStatus = (id, status) =>
  apiFetch(`/customers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

export const adjustCustomerBalance = (id, body) =>
  apiFetch(`/customers/${id}/balance`, { method: 'PUT', body: JSON.stringify(body) });

// ─── Dashboard ─────────────────────────────────────────────────────────────

export const getDashboardStats = () =>
  apiFetch('/dashboard/statistics');

export const getRecentOrders = (limit = 5) =>
  apiFetch('/dashboard/recent-orders', { params: { limit } });

export const getTopProducts = (limit = 5) =>
  apiFetch('/dashboard/top-products', { params: { limit } });

// ─── Affiliates ────────────────────────────────────────────────────────────

export const getAffiliates = (params) =>
  apiFetch('/affiliates', { params });

export const approveAffiliate = (userId) =>
  apiFetch(`/affiliates/${userId}/approve`, { method: 'PUT' });

export const getWithdrawals = (status = 'pending') =>
  apiFetch('/affiliates/withdrawals', { params: { status } });

export const approveWithdrawal = (id, transactionId) =>
  apiFetch(`/affiliates/withdrawals/${id}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ transactionId }),
  });

export const rejectWithdrawal = (id, reason) =>
  apiFetch(`/affiliates/withdrawals/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });

// ─── Analytics ─────────────────────────────────────────────────────────────

export const getRevenue = (period = '30d') =>
  apiFetch('/analytics/revenue', { params: { period } });

export const getOrdersByDay = (period = 30) =>
  apiFetch('/analytics/orders-by-day', { params: { period } });

// ─── Payments / Transactions ───────────────────────────────────────────────

export const getTransactions = (params = {}) =>
  apiFetch('/payments/transactions', { params });

// ─── Namespace export ──────────────────────────────────────────────────────

export const adminApi = {
  // Products
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Orders
  getOrders,
  getOrder,
  cancelOrder,
  completeOrder,
  // Inventory
  getInventoryByProduct,
  getInventoryStats,
  addBulkInventory,
  deleteInventoryItem,
  // Customers
  getCustomers,
  getCustomer,
  updateCustomerStatus,
  adjustCustomerBalance,
  // Dashboard
  getDashboardStats,
  getRecentOrders,
  getTopProducts,
  // Affiliates
  getAffiliates,
  approveAffiliate,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  // Analytics
  getRevenue,
  getOrdersByDay,
  // Payments
  getTransactions,
};

export default adminApi;
