import api from './client.js';

export const paymentApi = {
  // VietQR payment
  createVietQr: (data) => api.post('/payments/vietqr/create', data),
  
  // USDT payment
  createUsdt: (data) => api.post('/payments/usdt/create', data),
  checkUsdt: (orderId) => api.get(`/payments/usdt/check/${orderId}`),
  
  // Balance
  getBalance: () => api.get('/payments/balance'),
  
  // Poll order status
  pollStatus: (orderId) => api.get(`/orders/${orderId}`),
  
  // Check order status specifically
  checkOrderStatus: (orderId) => api.get(`/orders/${orderId}/status`),
};

export default paymentApi;
