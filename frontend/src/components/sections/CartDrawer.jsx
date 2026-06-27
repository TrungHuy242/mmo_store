import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore, useWishlistStore } from '../../store';
import { useCartDrawer } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { wishlistApi } from '../../api';

export const CartDrawer = () => {
  const { isOpen, closeCart, recentlyAdded } = useCartDrawer();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const items = useCartStore((state) => state.items);
  const addItemToCart = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotal = useCartStore((state) => state.getTotal);
  const subtotal = getTotal();

  const wishlistIds = useWishlistStore((state) => state.items);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);

  // Fetch wishlist products when drawer opens
  useEffect(() => {
    if (isOpen && wishlistIds.length > 0) {
      fetchWishlistProducts();
    }
  }, [isOpen, wishlistIds]);

  const fetchWishlistProducts = async () => {
    try {
      setWishlistLoading(true);
      const res = await wishlistApi.getWishlist({ limit: 10 });
      const products = res.data?.data || [];
      setWishlistProducts(products);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Filter out products already in cart
  const availableWishlistProducts = wishlistProducts
    .filter(p => !items.some(item => item.id === p.id))
    .slice(0, 3);

  // Quick add from wishlist to cart
  const handleQuickAddToCart = async (product) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    try {
      setAddingToCart(product.id);
      
      // Add to cart
      addItemToCart({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.thumbnail || product.images?.[0],
      });
      
      // Remove from wishlist
      removeFromWishlist(product.id);
      setWishlistProducts(prev => prev.filter(p => p.id !== product.id));
      
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      navigate('/login');
      closeCart();
      return;
    }
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              mass: 0.8
            }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-50 glass rounded-l-2xl border-l border-white/15 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Giỏ hàng</h2>
                  <p className="text-sm text-gray-400">{items.length} sản phẩm</p>
                </div>
              </div>
              <button 
                onClick={closeCart} 
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Recently Added Notification */}
            <AnimatePresence>
              {recentlyAdded && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mx-6 mt-4 p-3 bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg"
                >
                  <p className="text-sm text-neon-cyan flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Đã thêm "{recentlyAdded.name}" vào giỏ hàng
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4"
                  >
                    <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </motion.div>
                  <p className="text-gray-400 font-medium text-lg">Giỏ hàng trống</p>
                  <p className="text-sm text-gray-500 mt-1">Thêm sản phẩm để bắt đầu mua sắm</p>
                  <Link 
                    to="/products" 
                    onClick={closeCart}
                    className="mt-6 px-6 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 rounded-xl hover:bg-neon-cyan/30 transition-colors font-medium"
                  >
                    Khám phá sản phẩm
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onRemove={() => removeItem(item.id)}
                        onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                      />
                    ))}
                  </AnimatePresence>
                  
                  {/* Wishlist Quick Add Section */}
                  {availableWishlistProducts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-neon-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-gray-300">Sản phẩm bạn đã thích</h4>
                      </div>
                      
                      <div className="space-y-2">
                        {availableWishlistProducts.map((product) => (
                          <WishlistQuickAddItem
                            key={product.id}
                            product={product}
                            onAdd={() => handleQuickAddToCart(product)}
                            isAdding={addingToCart === product.id}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="border-t border-white/10 p-6 space-y-4"
              >
                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Tạm tính ({items.reduce((sum, i) => sum + i.quantity, 0)} sản phẩm)</span>
                    <span>{subtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10">
                    <span>Tổng cộng</span>
                    <span className="text-xl text-neon-cyan">{subtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={closeCart} 
                    className="flex-1 py-3 rounded-xl font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                  >
                    Tiếp tục mua
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 py-3 rounded-xl font-semibold bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Thanh toán
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [quantityLoading, setQuantityLoading] = React.useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove();
      setIsRemoving(false);
    }, 300);
  };

  const handleQuantityChange = (newQty) => {
    if (newQty < 1) {
      handleRemove();
      return;
    }
    setQuantityLoading(true);
    setTimeout(() => {
      onUpdateQuantity(newQty);
      setQuantityLoading(false);
    }, 150);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: isRemoving ? 0 : 1, x: 0 }}
      exit={{ opacity: 0, x: -100, height: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3"
    >
      {/* Image */}
      <Link to={`/product/${item.id}`} className="flex-shrink-0">
        <img 
          src={item.image || `https://picsum.photos/80?random=${item.id}`} 
          alt={item.name} 
          className="w-20 h-20 rounded-lg object-cover bg-white/5" 
        />
      </Link>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <Link to={`/product/${item.id}`}>
            <h4 className="font-semibold text-white line-clamp-1 hover:text-neon-cyan transition-colors">
              {item.name}
            </h4>
          </Link>
          <p className="text-sm text-neon-cyan font-bold mt-0.5">
            {item.price.toLocaleString('vi-VN')} đ
          </p>
        </div>
        
        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center bg-white/5 rounded-lg">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={quantityLoading}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <div className="w-10 h-8 flex items-center justify-center">
              {quantityLoading ? (
                <svg className="w-4 h-4 animate-spin text-neon-cyan" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="text-sm font-semibold text-white">{item.quantity}</span>
              )}
            </div>
            
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={quantityLoading}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="ml-auto p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Xóa sản phẩm"
          >
            {isRemoving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const WishlistQuickAddItem = ({ product, onAdd, isAdding }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-3 group hover:border-neon-magenta/30 transition-colors"
    >
      {/* Image */}
      <Link to={`/product/${product.id}`} className="flex-shrink-0">
        <img
          src={product.thumbnail || product.images?.[0] || `https://picsum.photos/60?random=${product.id}`}
          alt={product.name}
          className="w-12 h-12 rounded-lg object-cover bg-white/5"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/product/${product.id}`}>
          <h5 className="text-sm font-medium text-white line-clamp-1 hover:text-neon-magenta transition-colors">
            {product.name}
          </h5>
        </Link>
        <p className="text-xs text-neon-cyan font-semibold">
          {parseFloat(product.price).toLocaleString('vi-VN')} đ
        </p>
      </div>

      {/* Quick Add Button */}
      <button
        onClick={onAdd}
        disabled={isAdding}
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-neon-magenta/20 border border-neon-magenta/40 text-neon-magenta hover:bg-neon-magenta/30 flex items-center justify-center transition-all disabled:opacity-50"
        title="Thêm vào giỏ hàng"
      >
        {isAdding ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    </motion.div>
  );
};

export default CartDrawer;
