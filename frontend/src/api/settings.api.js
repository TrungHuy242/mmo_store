import apiClient from './client';

export const settingsApi = {
  // Get public system status (maintenance mode, etc.)
  getStatus: async () => {
    const response = await apiClient.get('/settings/status');
    return response;
  },

  // Get all settings (admin only)
  getAll: async () => {
    const response = await apiClient.get('/settings');
    return response;
  },

  // Get setting by key (admin only)
  get: async (key) => {
    const response = await apiClient.get(`/settings/${key}`);
    return response;
  },

  // Update setting (admin only)
  update: async (key, data) => {
    const response = await apiClient.put(`/settings/${key}`, data);
    return response;
  },

  // Toggle maintenance mode (admin only)
  toggleMaintenance: async (data) => {
    const response = await apiClient.post('/settings/toggle-maintenance', data);
    return response;
  },
};
