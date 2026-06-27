import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState(null);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);
  
  const openCartWithItem = useCallback((item) => {
    setRecentlyAdded(item);
    setIsOpen(true);
    // Clear recently added after animation
    setTimeout(() => setRecentlyAdded(null), 2000);
  }, []);

  return (
    <CartContext.Provider value={{
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      openCartWithItem,
      recentlyAdded,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartDrawer must be used within CartProvider');
  }
  return context;
}

export default CartContext;
