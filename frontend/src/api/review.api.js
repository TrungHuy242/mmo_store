import api from './client.js';

export const reviewApi = {
  getByProduct: (productId, params = {}) => api.get(`/reviews/product/${productId}`, { params }),
  getMyReviews: (params = {}) => api.get('/reviews/my-reviews', { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  report: (id, reason) => api.post(`/reviews/${id}/report`, { reason }),
};

export default reviewApi;
