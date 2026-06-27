import api from './client.js';

export const auditApi = {
  getAll: (params = {}) => api.get('/audit-logs', { params }),
  getById: (id) => api.get(`/audit-logs/${id}`),
  getByResource: (resource, resourceId, params = {}) => api.get(`/audit-logs/resource/${resource}/${resourceId}`, { params }),
  getStats: (params = {}) => api.get('/audit-logs/stats/summary', { params }),
};

export default auditApi;
