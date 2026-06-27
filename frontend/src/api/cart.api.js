import api from './client.js';

export const cartApi = {
  getCart: () => api.get('/cart'),
  addItem: (productId, quantity = 1) => api.post('/cart/items', { productId, quantity }),
  updateItem: (productId, quantity) => api.patch(`/cart/items/${productId}`, { quantity }),
  removeItem: (productId) => api.delete(`/cart/items/${productId}`),
  clearCart: () => api.delete('/cart'),
  applyCoupon: (couponCode) => api.post('/cart/apply-coupon', { couponCode }),
  syncCart: () => api.post('/cart/sync'),
};

export default cartApi;
