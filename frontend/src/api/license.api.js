import api from './client.js';

export const licenseApi = {
  getForProduct: (productId, params = {}) => api.get(`/licenses/product/${productId}`, { params }),
  getMyLicenses: (params = {}) => api.get('/licenses/my-licenses', { params }),
  generate: (data) => api.post('/licenses/generate', data),
  activate: (data) => api.post('/licenses/activate', data),
  deactivate: (id) => api.post(`/licenses/${id}/deactivate`),
  blacklist: (id) => api.post(`/licenses/${id}/blacklist`),
  getStatistics: (productId) => api.get('/licenses/statistics', { params: { productId } }),
};

export default licenseApi;
