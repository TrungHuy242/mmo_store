import api from './client.js';

export const couponApi = {
  getAll: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  delete: (id) => api.delete(`/coupons/${id}`),
  validate: (code, orderTotal) => api.post('/coupons/validate', { code, orderTotal }),
};

export default couponApi;
