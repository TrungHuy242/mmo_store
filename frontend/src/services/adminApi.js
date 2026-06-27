/**
 * Admin API Service
 * Tập trung toàn bộ API calls cho Admin Dashboard
 *
 * Sử dụng shared axios client (api/client.js) để tận dụng:
 *   - Bearer token tự động gắn vào mỗi request
 *   - Silent refresh token khi gặp 401
 *   - Response shape đồng nhất: mỗi call trả về axios response,
 *     data nằm ở `res.data.data`, pagination ở `res.data.pagination`.
 */

import api from '../api/client.js';

// ─── Products ──────────────────────────────────────────────────────────────

export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (body) => api.post('/products', body);
export const updateProduct = (id, body) => api.put(`/products/${id}`, body);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// ─── Categories ────────────────────────────────────────────────────────────

export const getCategories = () => api.get('/categories');
export const createCategory = (body) => api.post('/categories', body);
export const updateCategory = (id, body) => api.put(`/categories/${id}`, body);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// ─── Orders ────────────────────────────────────────────────────────────────

export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`);
export const completeOrder = (id) => api.post(`/orders/${id}/complete`);

// ─── Inventory ─────────────────────────────────────────────────────────────

export const getInventoryByProduct = (productId, params) =>
  api.get(`/inventory/product/${productId}`, { params });

export const getInventoryStats = (productId) =>
  api.get('/inventory/statistics', { params: productId ? { productId } : {} });

export const addBulkInventory = (productId, items) =>
  api.post('/inventory/bulk', { productId, items });

export const deleteInventoryItem = (id) => api.delete(`/inventory/${id}`);

// ─── Customers ─────────────────────────────────────────────────────────────

export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const updateCustomerStatus = (id, status) =>
  api.patch(`/customers/${id}/status`, { status });
export const adjustCustomerBalance = (id, body) =>
  api.put(`/customers/${id}/balance`, body);

// ─── Dashboard ─────────────────────────────────────────────────────────────

export const getDashboardStats = () => api.get('/dashboard/statistics');
export const getRecentOrders = (limit = 5) =>
  api.get('/dashboard/recent-orders', { params: { limit } });
export const getTopProducts = (limit = 5) =>
  api.get('/dashboard/top-products', { params: { limit } });
export const getRevenueSeries = (period = 'month') =>
  api.get('/dashboard/revenue', { params: { period } });

// ─── Affiliates ────────────────────────────────────────────────────────────

export const getAffiliates = (params) => api.get('/affiliates', { params });
export const approveAffiliate = (userId) => api.put(`/affiliates/${userId}/approve`);
export const getWithdrawals = (status = 'pending') =>
  api.get('/affiliates/withdrawals', { params: { status } });
export const approveWithdrawal = (id, transactionId) =>
  api.put(`/affiliates/withdrawals/${id}/approve`, { transactionId });
export const rejectWithdrawal = (id, reason) =>
  api.put(`/affiliates/withdrawals/${id}/reject`, { reason });

// ─── Analytics ─────────────────────────────────────────────────────────────

export const getRevenue = (period = '30d') =>
  api.get('/analytics/revenue', { params: { period } });
export const getOrdersByDay = (period = 30) =>
  api.get('/analytics/orders-by-day', { params: { period } });

// ─── Payments / Transactions ───────────────────────────────────────────────

export const getTransactions = (params = {}) =>
  api.get('/payments/transactions', { params });

// ─── Namespace export (back-compat) ────────────────────────────────────────

export const adminApi = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getOrder,
  cancelOrder,
  completeOrder,
  getInventoryByProduct,
  getInventoryStats,
  addBulkInventory,
  deleteInventoryItem,
  getCustomers,
  getCustomer,
  updateCustomerStatus,
  adjustCustomerBalance,
  getDashboardStats,
  getRecentOrders,
  getTopProducts,
  getRevenueSeries,
  getAffiliates,
  approveAffiliate,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getRevenue,
  getOrdersByDay,
  getTransactions,
};

export default adminApi;