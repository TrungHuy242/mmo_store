import api from './client.js';

export const wishlistApi = {
  getWishlist: (params = {}) => api.get('/wishlist', { params }),
  getCount: () => api.get('/wishlist/count'),
  checkProduct: (productId) => api.get(`/wishlist/check/${productId}`),
  addItem: (productId) => api.post('/wishlist/items', { productId }),
  removeItem: (productId) => api.delete(`/wishlist/items/${productId}`),
  moveToCart: (productId, quantity = 1) => api.post(`/wishlist/items/${productId}/move-to-cart`, { quantity }),
  clearWishlist: () => api.delete('/wishlist'),
};

export default wishlistApi;
