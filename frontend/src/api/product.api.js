import api from './client.js';

export const productApi = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  getFeatured: (limit = 10) => api.get('/products/featured', { params: { limit } }),
  getTopSelling: (limit = 10) => api.get('/products/top-selling', { params: { limit } }),
  checkStock: (items) => api.post('/products/stock-check', { items }),
  search: (params = {}) => api.get('/products/search', { params }),
};

export const productSearchApi = {
  search: (params = {}) => api.get('/products/search', { params }),
};

// Alias for backwards compatibility
export const searchProducts = (params) => api.get('/products/search', { params });

export const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
};

export default { productApi, categoryApi };
