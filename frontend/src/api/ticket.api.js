import api from './client.js';

export const ticketApi = {
  getMyTickets: (params = {}) => api.get('/tickets/my-tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  reply: (id, content) => api.post(`/tickets/${id}/reply`, { content }),
  rate: (id, data) => api.post(`/tickets/${id}/rate`, data), // rating, feedback
};

export const adminTicketApi = {
  getAll: (params = {}) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  assign: (id, assignedToId) => api.patch(`/tickets/${id}/assign`, { assignedToId }),
  close: (id) => api.patch(`/tickets/${id}/close`),
  reply: (id, content) => api.post(`/tickets/${id}/reply`, { content }),
};

export default { ticketApi, adminTicketApi };
