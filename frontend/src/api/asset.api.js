import api from './client.js';

export const assetApi = {
  // Get all assets (admin - for management panel)
  getAll: (params = {}) => api.get('/assets', { params }),
  getForProduct: (productId, params = {}) => api.get(`/assets/product/${productId}`, { params }),
  getById: (id) => api.get(`/assets/${id}`),
  upload: (formData) => api.post('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  toggleStatus: (id) => api.patch(`/assets/${id}/toggle`),
  getDownloads: (id, params = {}) => api.get(`/assets/${id}/downloads`, { params }),
  getStats: (productId) => api.get('/assets/stats/all', { params: { productId } }),
  // Secure download with progress tracking
  download: (assetId) => api.get(`/assets/download/${assetId}`, {
    responseType: 'blob',
  }),
  // Get signed download URL
  getDownloadUrl: (assetId) => api.get(`/assets/download/${assetId}/url`),
};

export default assetApi;
