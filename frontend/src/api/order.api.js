import api from './client.js';

export const orderApi = {
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  getByOrderNumber: (orderNumber) => api.get(`/orders/number/${orderNumber}`),
  getMyOrders: (params = {}) => api.get('/orders/my-orders', { params }),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  getPaymentStatus: (id) => api.get(`/orders/${id}/payment-status`),
};

export default orderApi;
