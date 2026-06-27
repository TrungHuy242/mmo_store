import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Bulk discount tiers configuration (same as ProductDetail)
      getBulkDiscount: (qty) => {
        if (qty >= 10) return 10;
        if (qty >= 5) return 5;
        return 0;
      },

      addItem: (product, quantity = 1, bulkDiscount = 0) => {
        const items = get().items;
        const existingIndex = items.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          // Recalculate bulk discount based on new total quantity
          newItems[existingIndex].bulkDiscount = get().getBulkDiscount(newItems[existingIndex].quantity);
          set({ items: newItems });
        } else {
          const itemWithDiscount = { ...product, quantity, bulkDiscount };
          set({ items: [...items, itemWithDiscount] });
        }
      },
      
      removeItem: (id) => {
        set({ items: get().items.filter(item => item.id !== id) });
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        const newItems = get().items.map(item =>
          item.id === id ? { ...item, quantity } : item
        );
        set({ items: newItems });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.price || 0) * item.quantity,
          0
        );
      },
      
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      // Validate and sync stock with server
      validateStock: async (toast) => {
        const items = get().items;
        if (items.length === 0) return { valid: true, updated: false };
        
        try {
          const response = await fetch('/api/products/stock-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: items.map(item => ({
                productId: item.id,
                quantity: item.quantity || 1,
              })),
            }),
          });
          
          const result = await response.json();
          if (!result.success) return { valid: true, updated: false };
          
          const stockResults = result.data || [];
          let hasChanges = false;
          const newItems = [...items];
          
          for (const stockInfo of stockResults) {
            const cartIndex = newItems.findIndex(item => item.id === stockInfo.productId);
            if (cartIndex === -1) continue;
            
            // Product not found or inactive - remove from cart
            if (!stockInfo.available && stockInfo.reason !== 'INSUFFICIENT_STOCK') {
              const productName = stockInfo.productName || newItems[cartIndex].name || 'Sản phẩm';
              const message = stockInfo.message || 'Sản phẩm không khả dụng';
              
              toast?.(`${productName}: ${message}`);
              toast?.(`${productName} đã được xóa khỏi giỏ hàng`, { icon: '🛒' });
              
              newItems.splice(cartIndex, 1);
              hasChanges = true;
            }
            // Insufficient stock - update quantity
            else if (stockInfo.warning && stockInfo.maxQuantity > 0) {
              const productName = stockInfo.productName || newItems[cartIndex].name || 'Sản phẩm';
              const currentQty = newItems[cartIndex].quantity || 1;
              
              newItems[cartIndex].quantity = stockInfo.maxQuantity;
              hasChanges = true;
              
              toast?.(`${productName} đã tự động cập nhật số lượng do kho hàng không đủ.`, { icon: '⚠️' });
            }
          }
          
          if (hasChanges) {
            set({ items: newItems });
          }
          
          return {
            valid: newItems.length > 0,
            updated: hasChanges,
            items: newItems,
          };
        } catch (error) {
          console.error('Stock validation error:', error);
          return { valid: true, updated: false };
        }
      },
    }),
    {
      name: 'mmo-cart-storage',
    }
  )
);

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      
      setItems: (items) => {
        set({ items: Array.isArray(items) ? items : [] });
      },
      
      addItem: (productId) => {
        if (!get().items.includes(productId)) {
          set({ items: [...get().items, productId] });
        }
      },
      
      removeItem: (productId) => {
        set({ items: get().items.filter(id => id !== productId) });
      },
      
      toggleItem: (productId) => {
        const items = get().items;
        if (items.includes(productId)) {
          set({ items: items.filter(id => id !== productId) });
        } else {
          set({ items: [...items, productId] });
        }
      },
      
      isInWishlist: (productId) => {
        return get().items.includes(productId);
      },
      
      clearWishlist: () => {
        set({ items: [] });
      },
      
      setLoading: (loading) => {
        set({ loading });
      },
      
      getCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'mmo-wishlist-storage',
    }
  )
);

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  commandPaletteOpen: false,
  theme: 'dark',
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}));

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (userData, token) => {
        set({ user: userData, token, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      },
      
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
    }),
    {
      name: 'mmo-auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
