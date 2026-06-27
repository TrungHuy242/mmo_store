import api from './client.js';

export const affiliateApi = {
  getDashboard: () => api.get('/affiliates/dashboard'),
  withdraw: (data) => api.post('/affiliates/withdraw', data),
};

export default affiliateApi;
