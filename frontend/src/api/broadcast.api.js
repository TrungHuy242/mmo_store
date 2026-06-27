import api from './client.js';

export const broadcastApi = {
  send: (message) => api.post('/admin/broadcast', { message }),
  getStats: () => api.get('/admin/broadcast/stats'),
};

export default broadcastApi;
