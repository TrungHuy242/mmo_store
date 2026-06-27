import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { wishlistApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store';
import { Button, Card, Badge, Skeleton } from '../components/ui';

export default function Wishlist() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addItem } = useCartStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistApi.getWishlist();
      // Backend trả về { success, data, pagination }
      const wishlistItems = res.data?.data || res.data || [];
      setItems(wishlistItems);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      toast.error(t('wishlist.load_error') || 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);
      await wishlistApi.removeItem(productId);
      setItems(prev => prev.filter(item => item.productId !== productId));
      toast.success(t('wishlist.removed') || 'Đã xóa khỏi yêu thích');
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error(error.response?.data?.message || t('wishlist.remove_error') || 'Không thể xóa sản phẩm');
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToCart = async (item) => {
    const product = item.product || item;
    try {
      await wishlistApi.moveToCart(product.id);
      addItem({
        id: product.id,
        name: product.name,
        price: Number(product.effectivePrice || product.price),
        image: product.thumbnail || product.image,
      });
      setItems(prev => prev.filter(i => (i.productId || i.product?.id) !== product.id));
      toast.success(t('wishlist.moved_to_cart') || 'Đã chuyển vào giỏ hàng');
    } catch (error) {
      // Nếu API fail, vẫn thêm vào cart local và xóa khỏi wishlist
      addItem({
        id: product.id,
        name: product.name,
        price: Number(product.effectivePrice || product.price),
        image: product.thumbnail || product.image,
      });
      setItems(prev => prev.filter(i => (i.productId || i.product?.id) !== product.id));
      toast.success(t('wishlist.moved_to_cart') || 'Đã chuyển vào giỏ hàng');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t('wishlist.confirm_clear') || 'Bạn có chắc muốn xóa tất cả?')) return;
    try {
      await wishlistApi.clearWishlist();
      setItems([]);
      toast.success(t('wishlist.cleared') || 'Đã xóa tất cả');
    } catch (error) {
      console.error('Failed to clear wishlist:', error);
      toast.error(t('wishlist.clear_error') || 'Không thể xóa tất cả');
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <section className="bg-bg-secondary border-b border-border py-8">
        <div className="container-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">{t('wishlist.my_wishlist')}</h1>
              <p className="text-text-secondary">{items.length} {t('wishlist.items_saved')}</p>
            </div>
            {items.length > 0 && (
              <Button variant="secondary" size="sm" onClick={handleClearAll}>
                {t('wishlist.clear_all') || 'Xóa tất cả'}
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container-lg py-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, i) => (
              <motion.div
                key={item.productId || item.product?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <WishlistCard
                  item={item}
                  onRemove={handleRemove}
                  onMoveToCart={handleMoveToCart}
                  removing={removingId === (item.productId || item.product?.id)}
                  t={t}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-bg-secondary rounded-xl border border-border">
            <svg className="w-16 h-16 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-text-primary mb-2">{t('wishlist.empty_wishlist')}</h3>
            <p className="text-text-secondary mb-6">{t('wishlist.save_products')}</p>
            <Link to="/products">
              <Button>{t('wishlist.browse_products')}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function WishlistCard({ item, onRemove, onMoveToCart, removing, t }) {
  const product = item.product || item;
  const productId = item.productId || product.id;
  const isOutOfStock = product.stock === 0 && !product.unlimitedStock;
  
  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square bg-bg-tertiary">
        <img
          src={product.thumbnail || product.image || `https://picsum.photos/seed/${product.id}/400/400`}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => onRemove(productId)}
          disabled={removing}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50"
          title={t('wishlist.remove') || 'Xóa khỏi yêu thích'}
        >
          {removing ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
        {product.isFeatured && (
          <Badge className="absolute bottom-3 left-3" variant="primary">
            {t('product.featured') || 'Nổi bật'}
          </Badge>
        )}
      </div>
      <div className="p-4">
        <Link to={`/product/${productId}`}>
          <h3 className="font-medium text-text-primary mb-1 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-text-secondary mb-2">{product.category?.name || product.category || 'Category'}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {Number(product.effectivePrice || product.price).toLocaleString('vi-VN')}đ
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMoveToCart(item)}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? (t('product.out_of_stock') || 'Hết hàng') : (t('common.add_to_cart') || 'Thêm vào giỏ')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
