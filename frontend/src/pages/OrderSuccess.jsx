import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderApi, assetApi } from '../api';
import { Button, Card, Badge } from '../components/ui';
import soundFX from '../utils/soundFX';
import { useCartStore } from '../store';

export default function OrderSuccess() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [downloadingItems, setDownloadingItems] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [playedSuccessSound, setPlayedSuccessSound] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await orderApi.getById(orderId);
        const orderData = res.data?.data || res.data;
        setOrder(orderData);
        
        // Clear cart when order is successfully loaded (payment completed)
        if (orderData) {
          clearCart();
          
          // Play success sound when order is loaded
          if (!playedSuccessSound) {
            setTimeout(() => {
              soundFX.playSuccess();
              setPlayedSuccessSound(true);
            }, 500);
          }
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Secure file download with progress tracking
  const handleDownload = async (item, asset) => {
    const itemKey = `${item.id}-${asset.id}`;
    
    setDownloadingItems(prev => ({ ...prev, [itemKey]: true }));
    setDownloadProgress(prev => ({ ...prev, [itemKey]: 0 }));

    try {
      // Get download URL first
      const res = await assetApi.getDownloadUrl(asset.id);
      const downloadData = res.data?.data || res.data;
      
      if (downloadData?.url) {
        // Simulate progress for URL download
        const progressInterval = setInterval(() => {
          setDownloadProgress(prev => ({
            ...prev,
            [itemKey]: Math.min((prev[itemKey] || 0) + 10, 90),
          }));
        }, 100);

        // Trigger download via link click
        const link = document.createElement('a');
        link.href = downloadData.url;
        link.download = downloadData.filename || asset.filename || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        clearInterval(progressInterval);
        setDownloadProgress(prev => ({ ...prev, [itemKey]: 100 }));
        
        setTimeout(() => {
          setDownloadingItems(prev => {
            const newState = { ...prev };
            delete newState[itemKey];
            return newState;
          });
          setDownloadProgress(prev => {
            const newState = { ...prev };
            delete newState[itemKey];
            return newState;
          });
        }, 1000);

        toast.success('Bắt đầu tải file!');
      } else {
        throw new Error('No download URL available');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Tải file thất bại. Vui lòng thử lại.');
      setDownloadingItems(prev => {
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
      setDownloadProgress(prev => {
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
    }
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      'VIETQR': 'VietQR',
      'USDT_TRC20': 'USDT (TRC20)',
      'BALANCE': 'Số dư',
      'CARD': 'Thẻ cào',
      'BANK_TRANSFER': 'Chuyển khoản',
    };
    return methods[method] || method;
  };

  const getProductTypeLabel = (type) => {
    const types = {
      'license': t('order_success.license_key'),
      'account': t('order_success.account_info'),
      'digital': t('order_success.download_links'),
    };
    return types[type] || type;
  };

  const getDeliveryStatusBadge = (item) => {
    if (item.deliveredAt) {
      return <Badge variant="success">{t('order_success.delivered')}</Badge>;
    }
    return <Badge variant="warning">{t('order_success.delivering')}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-text-primary mb-2">{t('common.error')}</h2>
          <p className="text-text-secondary mb-6">{error || 'Order not found'}</p>
          <Link to="/products">
            <Button>{t('order_success.continue_shopping')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Success Header */}
      <section className="bg-gradient-to-r from-success/10 via-primary/5 to-success/10 border-b border-border py-8">
        <div className="container-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">{t('order_success.title')}</h1>
            <p className="text-text-secondary text-lg">{t('order_success.congratulations')}</p>
            
            {/* Email notification */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-primary">{t('order_success.email_sent')}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container-lg py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info Card */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('order_success.order_details')}
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-xs text-text-tertiary mb-1">{t('order_success.order_number')}</p>
                  <p className="text-lg font-mono font-bold text-text-primary">{order.orderNumber}</p>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-xs text-text-tertiary mb-1">{t('order_success.payment_method')}</p>
                  <p className="text-lg font-semibold text-text-primary">{getPaymentMethodName(order.paymentMethod)}</p>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-xs text-text-tertiary mb-1">{t('order_success.total_amount')}</p>
                  <p className="text-lg font-bold text-primary">{Number(order.total).toLocaleString('vi-VN')}₫</p>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-xs text-text-tertiary mb-1">{t('order_success.delivery_status')}</p>
                  <Badge variant={order.status === 'COMPLETED' ? 'success' : 'warning'} className="mt-1">
                    {order.status === 'COMPLETED' ? t('order_success.delivered') : t('order_success.delivering')}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Purchased Items */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t('order_success.purchased_items')}
              </h2>
              
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={item.product?.thumbnail || item.product?.image || `https://picsum.photos/80?random=${item.productId}`}
                        alt={item.product?.name}
                        className="w-16 h-16 rounded-lg object-cover bg-bg-tertiary"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-text-primary line-clamp-2">{item.product?.name}</h3>
                            <p className="text-sm text-text-secondary mt-1">
                              {item.quantity} x {Number(item.price).toLocaleString('vi-VN')}₫
                            </p>
                            <p className="text-xs text-text-tertiary mt-1">
                              {getProductTypeLabel(item.product?.productType)}
                            </p>
                          </div>
                          {getDeliveryStatusBadge(item)}
                        </div>

                        {/* Delivery Content */}
                        {item.deliveredAt && (
                          <div className="mt-4 space-y-3">
                            {item.licenseKeyId && item.deliveryData && (
                              <div className="bg-success/10 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-success mb-1 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    {t('order_success.license_key')}
                                  </p>
                                  <button
                                    onClick={() => copyToClipboard(item.deliveryData, `license-${item.id}`)}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    {copiedId === `license-${item.id}` ? (
                                      <>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t('order_success.copied')}
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        {t('order_success.copy_key')}
                                      </>
                                    )}
                                  </button>
                                </div>
                                <code className="block text-sm font-mono text-text-primary bg-bg-primary p-2 rounded mt-1 break-all">
                                  {item.deliveryData}
                                </code>
                              </div>
                            )}

                            {item.inventoryItemId && item.deliveryData && (
                              <div className="bg-success/10 rounded-lg p-3">
                                <p className="text-sm font-medium text-success mb-2 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {t('order_success.account_info')}
                                </p>
                                <div className="bg-bg-primary p-2 rounded text-sm">
                                  <pre className="whitespace-pre-wrap text-text-primary font-mono text-xs">
                                    {typeof item.deliveryData === 'string' 
                                      ? item.deliveryData 
                                      : JSON.stringify(item.deliveryData, null, 2)
                                    }
                                  </pre>
                                </div>
                                <button
                                  onClick={() => {
                                    const text = typeof item.deliveryData === 'string' 
                                      ? item.deliveryData 
                                      : JSON.stringify(item.deliveryData, null, 2);
                                    copyToClipboard(text, `account-${item.id}`);
                                  }}
                                  className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                                >
                                  {copiedId === `account-${item.id}` ? (
                                    <>
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      {t('order_success.copied')}
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      {t('order_success.view_account')}
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {item.deliveryData && typeof item.deliveryData === 'string' && item.deliveryData.startsWith('{') && (
                              (() => {
                                try {
                                  const data = JSON.parse(item.deliveryData);
                                  if (data.assets) {
                                    return (
                                      <div className="bg-success/10 rounded-lg p-3">
                                        <p className="text-sm font-medium text-success mb-2 flex items-center gap-1">
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                          {t('order_success.download_links')}
                                        </p>
                                        <div className="space-y-2">
                                          {data.assets.map((asset, idx) => {
                                            const itemKey = `${item.id}-${asset.id || idx}`;
                                            const isDownloading = downloadingItems[itemKey];
                                            const progress = downloadProgress[itemKey] || 0;
                                            
                                            return (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-bg-primary rounded hover:bg-bg-secondary transition-colors group"
                                              >
                                                <span className="text-sm text-text-primary truncate">{asset.name || asset.filename}</span>
                                                
                                                <button
                                                  onClick={() => handleDownload(item, asset)}
                                                  disabled={isDownloading}
                                                  className={`
                                                    relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all overflow-hidden
                                                    ${isDownloading
                                                      ? 'bg-success/20 text-success cursor-wait'
                                                      : 'bg-success text-white hover:bg-success/80 opacity-0 group-hover:opacity-100'
                                                    }
                                                  `}
                                                >
                                                  {isDownloading ? (
                                                    <>
                                                      <div 
                                                        className="absolute inset-0 bg-success/40 transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                      />
                                                      <div className="relative flex items-center gap-1">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        {progress > 0 ? `${progress}%` : 'Đang tải...'}
                                                      </div>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Download className="w-4 h-4" />
                                                      Tải xuống
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  }
                                } catch (e) {}
                                return null;
                              })()
                            )}
                          </div>
                        )}

                        {!item.deliveredAt && (
                          <div className="mt-4 p-3 bg-warning/10 rounded-lg flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-warning border-t-transparent rounded-full"></div>
                            <p className="text-sm text-warning">{t('order_success.no_delivery_yet')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card>
              <div className="space-y-3">
                <Link to={`/orders/${order.id}/invoice`} target="_blank" className="block">
                  <Button variant="outline" fullWidth>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Xuất hóa đơn
                  </Button>
                </Link>
                <Link to="/dashboard" className="block">
                  <Button variant="secondary" fullWidth>
                    {t('order_success.view_orders')}
                  </Button>
                </Link>
                <Link to="/products" className="block">
                  <Button fullWidth>
                    {t('order_success.continue_shopping')}
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Support Card */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t('order_success.support')}
              </h3>
              <p className="text-sm text-text-secondary mb-4">{t('order_success.contact_support')}</p>
              <Link to="/support" className="block">
                <Button variant="outline" fullWidth>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {t('common.support')}
                </Button>
              </Link>
            </Card>

            {/* How to Use Card */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('order_success.how_to_use')}
              </h3>
              <ul className="text-sm text-text-secondary space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">1.</span>
                  <span>Sao chép License Key hoặc thông tin tài khoản ở trên</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">2.</span>
                  <span>Đăng nhập vào dịch vụ/phần mềm tương ứng</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">3.</span>
                  <span>Kích hoạt với License Key hoặc đăng nhập với tài khoản</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">4.</span>
                  <span>Liên hệ hỗ trợ nếu gặp vấn đề</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
