/**
 * Zustand Store - Authentication
 * Handles login, registration, user state, JWT tokens
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { authService } from '../services/auth.service';

export const useAuthStore = create(
  persist(
    devtools(
      immer((set, get) => ({
        // State
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,

        // Login
        login: async (email, password) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          try {
            const { user, token, refreshToken } = await authService.login(
              email,
              password
            );
            set((state) => {
              state.user = user;
              state.token = token;
              state.refreshToken = refreshToken;
              state.isAuthenticated = true;
              state.isLoading = false;
            });
            return user;
          } catch (err) {
            set((state) => {
              state.error = err.message || 'Login failed';
              state.isLoading = false;
            });
            throw err;
          }
        },

        // Register
        register: async (email, password, name) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          try {
            const { user, token, refreshToken } = await authService.register(
              { email, password, name }
            );
            set((state) => {
              state.user = user;
              state.token = token;
              state.refreshToken = refreshToken;
              state.isAuthenticated = true;
              state.isLoading = false;
            });
            return user;
          } catch (err) {
            set((state) => {
              state.error = err.message || 'Registration failed';
              state.isLoading = false;
            });
            throw err;
          }
        },

        // Logout
        logout: () => {
          set((state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
          });
        },

        // Refresh user data
        refreshUser: async () => {
          try {
            const user = await authService.getMe();
            set((state) => {
              state.user = user;
            });
          } catch (err) {
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
            });
          }
        },

        // Clear error
        clearError: () =>
          set((state) => {
            state.error = null;
          }),
      })),
      { name: 'auth-store' }
    ),
    {
      name: 'auth-persist',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);

/**
 * Zustand Store - Cart
 * Handles shopping cart state, persist to localStorage
 */
export const useCartStore = create(
  persist(
    devtools(
      immer((set, get) => ({
        items: [],
        coupon: null,
        shippingMethod: 'instant',

        // Add to cart
        addItem: (product, quantity = 1) => {
          set((state) => {
            const existing = state.items.find((i) => i.id === product.id);
            if (existing) {
              existing.quantity += quantity;
            } else {
              state.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity,
              });
            }
          });
        },

        // Remove from cart
        removeItem: (productId) => {
          set((state) => {
            state.items = state.items.filter((i) => i.id !== productId);
          });
        },

        // Update quantity
        updateQuantity: (productId, quantity) => {
          set((state) => {
            const item = state.items.find((i) => i.id === productId);
            if (item) {
              if (quantity <= 0) {
                state.items = state.items.filter((i) => i.id !== productId);
              } else {
                item.quantity = quantity;
              }
            }
          });
        },

        // Clear cart
        clear: () => {
          set((state) => {
            state.items = [];
            state.coupon = null;
          });
        },

        // Computed
        get subtotal() {
          return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        },

        get total() {
          const subtotal = get().subtotal;
          return subtotal; // Add tax/shipping as needed
        },

        get itemCount() {
          return get().items.reduce((sum, item) => sum + item.quantity, 0);
        },
      })),
      { name: 'cart-store' }
    ),
    {
      name: 'cart-persist',
    }
  )
);

/**
 * Zustand Store - Theme
 */
export const useThemeStore = create(
  persist(
    devtools((set) => ({
      isDark: true,
      toggleTheme: () =>
        set((state) => ({
          isDark: !state.isDark,
        })),
      setTheme: (isDark) =>
        set({
          isDark,
        }),
    })),
    {
      name: 'theme-persist',
    }
  )
);

/**
 * Zustand Store - Product Data
 */
export const useProductStore = create(
  devtools((set, get) => ({
    products: [],
    categories: [],
    selectedCategory: null,
    searchQuery: '',
    isLoading: false,
    error: null,

    setProducts: (products) =>
      set(() => ({
        products,
      })),

    setCategories: (categories) =>
      set(() => ({
        categories,
      })),

    setSelectedCategory: (categoryId) =>
      set(() => ({
        selectedCategory: categoryId,
      })),

    setSearchQuery: (query) =>
      set(() => ({
        searchQuery: query,
      })),

    setIsLoading: (isLoading) =>
      set(() => ({
        isLoading,
      })),

    setError: (error) =>
      set(() => ({
        error,
      })),

    // Computed filtered products
    get filteredProducts() {
      let filtered = get().products;

      if (get().selectedCategory) {
        filtered = filtered.filter(
          (p) => p.categoryId === get().selectedCategory
        );
      }

      if (get().searchQuery) {
        const query = get().searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
      }

      return filtered;
    },
  })),
  { name: 'product-store' }
);

/**
 * Zustand Store - Admin
 */
export const useAdminStore = create(
  devtools((set) => ({
    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      totalUsers: 0,
      activeProducts: 0,
    },
    orders: [],
    users: [],
    isLoading: false,
    selectedOrder: null,
    selectedUser: null,

    setStats: (stats) =>
      set(() => ({
        stats,
      })),

    setOrders: (orders) =>
      set(() => ({
        orders,
      })),

    setUsers: (users) =>
      set(() => ({
        users,
      })),

    setIsLoading: (isLoading) =>
      set(() => ({
        isLoading,
      })),

    setSelectedOrder: (order) =>
      set(() => ({
        selectedOrder: order,
      })),

    setSelectedUser: (user) =>
      set(() => ({
        selectedUser: user,
      })),
  })),
  { name: 'admin-store' }
);
