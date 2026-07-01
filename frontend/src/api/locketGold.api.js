import api from './client.js';

export const locketGoldApi = {
  /** Service status + config */
  getConfig: () => api.get('/locket-gold/config'),

  /** Submit a username for Gold activation */
  activate: (username) => api.post('/locket-gold/activate', { username }),

  /** Check Gold status for a specific UID */
  checkStatus: (uid) => api.get(`/locket-gold/status/${uid}`),

  /** Current user's queue position */
  getQueue: () => api.get('/locket-gold/queue'),

  /** Current user's daily usage stats */
  getUsage: () => api.get('/locket-gold/usage'),

  // ── Admin ────────────────────────────────────────────────────────────────

  /** Dashboard stats */
  getStats: () => api.get('/locket-gold/stats'),

  /** Paginated usage logs */
  getLogs: (params) => api.get('/locket-gold/logs', { params }),

  /** Token sets list */
  getTokens: () => api.get('/locket-gold/tokens'),

  /** Create token set */
  createToken: (data) => api.post('/locket-gold/tokens', data),

  /** Update token set */
  updateToken: (id, data) => api.put(`/locket-gold/tokens/${id}`, data),

  /** Delete token set */
  deleteToken: (id) => api.delete(`/locket-gold/tokens/${id}`),

  /** Full queue state for admin */
  getQueueState: () => api.get('/locket-gold/queue-state'),

  /** Update service config */
  updateConfig: (data) => api.put('/locket-gold/config', data),

  /** Restart workers */
  restartWorkers: () => api.post('/locket-gold/restart-workers'),

  /** Broadcast message to all users */
  broadcast: (message) => api.post('/locket-gold/broadcast', { message }),
};

export default locketGoldApi;
