import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { orderApi, paymentApi, productApi, couponApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store';
import { Button, Input, Card, Badge } from '../components/ui';
import useSEO from '../hooks/useSEO';
import soundFX from '../utils/soundFX';

const paymentMethods = [
  {
    id: 'VIETQR',
    name: 'VietQR',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    id: 'USDT_TRC20',
    name: 'USDT (TRC20)',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
        <path d="M16 32C24.837 32 32 24.837 32 16S24.837 0 16 0 0 7.163 0 16s7.163 16 16 16zm-2.005-23.925v2.305L19.76 8h-2.54L12.5 20.12V17.81L7.5 10.25h2.54l3.015 5.14 4.14-5.14h2.24l.07 2.12zm10.01 0v2.305L25.53 8H23l-5.22 12.12v-2.31l-5-7.56h2.54l3.015 5.14 4.14-5.14h2.24l.07 2.12z"/>
      </svg>
    ),
  },
];

export default function Checkout() {
  const { t } = useTranslation();
  // SEO - Dynamic page title
  useSEO({
    title: 'Thanh toán',
    description: 'Hoàn tất thanh toán đơn hàng của bạn một cách an toàn và nhanh chóng.',
  });
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart, validateStock } = useCartStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('VIETQR');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [stockValidated, setStockValidated] = useState(false);

  // Validate stock when entering checkout page
  useEffect(() => {
    if (!productId && items.length > 0 && !stockValidated) {
      const validateCartStock = async () => {
        setLoading(true);
        try {
          const result = await validateStock(toast);
          if (!result.valid) {
            // Cart is empty after validation
            navigate('/products');
          } else if (result.updated) {
            // Items were adjusted, user should see the changes
            setStockValidated(true);
          }
        } catch (error) {
          console.error('Stock validation failed:', error);
        } finally {
          setLoading(false);
        }
      };
      
      validateCartStock();
    }
  }, [productId, items.length, stockValidated, validateStock, navigate]);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          const res = await productApi.getById(productId);
          setProduct(res.data?.data || res.data);
        } catch (error) {
          console.error('Failed to fetch product:', error);
        }
      };
      fetchProduct();
    }
  }, [productId]);

  const cartItems = productId ? [{ ...product, quantity: 1 }] : items;
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || item.effectivePrice || 0) * (item.quantity || 1), 0);
  const discount = coupon ? (coupon.type === 'PERCENTAGE' ? subtotal * (coupon.value / 100) : Number(coupon.value)) : 0;
  const total = subtotal - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      setCouponLoading(true);
      const res = await couponApi.validate(couponCode, subtotal);
      
      if (res.data?.success) {
        setCoupon(res.data.coupon);
      } else {
        alert(res.data?.message || t('checkout.invalid_coupon'));
      }
    } catch (error) {
      alert(error.response?.data?.message || t('checkout.apply_coupon_failed'));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      alert(t('checkout.empty_cart'));
      return;
    }

    try {
      setLoading(true);
      soundFX.playClick(); // Play click when creating order
      
      const orderRes = await orderApi.create({
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity || 1,
        })),
        couponCode: coupon?.code,
        paymentMethod,
      });

      const order = orderRes.data?.data || orderRes.data;
      setOrderId(order.id);
      setOrderNumber(order.orderNumber);
      setOrderStatus(order.status);
      soundFX.playClick(); // Confirm order created

      // For VietQR, create payment to get QR code
      if (paymentMethod === 'VIETQR') {
        const paymentRes = await paymentApi.createVietQr({ 
          orderId: order.id,
          amount: total 
        });
        setPaymentData(paymentRes.data?.data || paymentRes.data);
      } else if (paymentMethod === 'USDT_TRC20') {
        // Create USDT payment to get deposit address
        const paymentRes = await paymentApi.createUsdt({ 
          orderId: order.id,
          amount: total 
        });
        setPaymentData(paymentRes.data?.data || paymentRes.data);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      soundFX.playError(); // Error sound
      alert(error.response?.data?.message || t('checkout.create_order_failed'));
    } finally {
      setLoading(false);
    }
  };

  // Check USDT payment manually
  const handleCheckUsdtPayment = async () => {
    if (!orderId) return;

    try {
      setCheckLoading(true);
      const res = await paymentApi.checkUsdt(orderId);
      const data = res.data?.data || res.data;

      if (data.confirmed || data.order?.paymentStatus === 'CONFIRMED') {
        setOrderStatus('COMPLETED');
        soundFX.playSuccess(); // Success sound
        clearCart();
        navigate(`/order-success/${orderId}`);
      } else {
        soundFX.playNotification(); // Notification sound
        toast.error(t('checkout.payment_not_found'));
      }
    } catch (error) {
      console.error('Check payment error:', error);
      toast.error(t('checkout.check_payment_failed'));
    } finally {
      setCheckLoading(false);
    }
  };

  // Check VietQR payment manually
  const handleCheckVietQrPayment = async () => {
    if (!orderId) return;

    try {
      setCheckLoading(true);
      const res = await paymentApi.pollStatus(orderId);
      const order = res.data?.data || res.data;

      if (order?.status === 'PAID' || order?.status === 'COMPLETED' || order?.status === 'PROCESSING') {
        setOrderStatus('COMPLETED');
        soundFX.playSuccess();
        clearCart();
        toast.success(t('checkout.payment_success'));
        navigate(`/order-success/${orderId}`);
      } else {
        soundFX.playNotification();
        toast.error(t('checkout.payment_not_found'));
      }
    } catch (error) {
      console.error('Check payment error:', error);
      toast.error(t('checkout.check_payment_failed'));
    } finally {
      setCheckLoading(false);
    }
  };

  // Poll for payment confirmation
  useEffect(() => {
    if (!orderId || !paymentData) return;

    // For VietQR, poll order status
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await paymentApi.pollStatus(orderId);
        const order = statusRes.data?.data || statusRes.data;
        
        if (order?.status === 'PAID' || order?.status === 'COMPLETED' || order?.status === 'PROCESSING') {
          clearInterval(pollInterval);
          setOrderStatus('COMPLETED');
          clearCart();
          navigate(`/order-success/${orderId}`);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId, paymentData, navigate, clearCart]);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!productId && items.length === 0) {
    return (
      <div className="container-lg py-16 text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-4">{t('checkout.empty_cart')}</h2>
        <Link to="/products">
          <Button>{t('checkout.browse_products')}</Button>
        </Link>
      </div>
    );
  }

  if (paymentData) {
    return (
      <PaymentView
        paymentData={paymentData}
        orderId={orderId}
        orderNumber={orderNumber}
        total={total}
        paymentMethod={paymentMethod}
        orderStatus={orderStatus}
        onCheckUsdt={handleCheckUsdtPayment}
        onCheckVietQr={handleCheckVietQrPayment}
        checkLoading={checkLoading}
        t={t}
        onExpire={() => {
          setPaymentData(null);
          setOrderId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <section className="bg-bg-secondary border-b border-border py-6">
        <div className="container-lg">
          <h1 className="text-2xl font-bold text-text-primary">{t('checkout.checkout')}</h1>
        </div>
      </section>

      <div className="container-lg py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">{t('checkout.payment_method')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                      ${paymentMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border-hover'
                      }
                    `}
                  >
                    <div className={`${paymentMethod === method.id ? 'text-primary' : 'text-text-secondary'}`}>
                      {method.icon}
                    </div>
                    <span className="font-medium text-text-primary">{method.name}</span>
                    {paymentMethod === method.id && (
                      <svg className="w-5 h-5 text-primary ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">{t('checkout.coupon_code')}</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={t('checkout.enter_coupon')}
                  className="input flex-1"
                  disabled={coupon}
                />
                {coupon ? (
                  <Badge variant="success" className="px-4">{t('checkout.applied')}</Badge>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={handleApplyCoupon}
                    loading={couponLoading}
                    disabled={!couponCode.trim()}
                  >
                    {t('checkout.apply')}
                  </Button>
                )}
              </div>
              {coupon && (
                <p className="text-sm text-success mt-2">
                  {coupon.type === 'PERCENTAGE' ? `${coupon.value}% off` : `${Number(coupon.value).toLocaleString('vi-VN')}₫ off`}
                </p>
              )}
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <h2 className="text-lg font-semibold text-text-primary mb-4">{t('checkout.order_summary')}</h2>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.image || item.thumbnail || `https://picsum.photos/60?random=${item.id}`}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover bg-bg-tertiary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary line-clamp-2">{item.name}</p>
                      <p className="text-xs text-text-tertiary">{t('checkout.qty')}: {item.quantity || 1}</p>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      {((item.price || item.effectivePrice || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('checkout.subtotal')}</span>
                  <span className="text-text-primary">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success">{t('checkout.discount')}</span>
                    <span className="text-success">-{discount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span className="text-text-primary">{t('common.total')}</span>
                  <span className="text-text-primary">{total.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleCreateOrder}
                loading={loading}
                className="mt-6"
              >
                {paymentMethod === 'USDT_TRC20' ? t('checkout.pay_usdt') : t('checkout.pay_vietqr')}
              </Button>

              <p className="text-xs text-text-tertiary text-center mt-3">
                {t('checkout.terms_agreement')}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentView({ paymentData, orderId, orderNumber, total, paymentMethod, orderStatus, onCheckUsdt, onCheckVietQr, checkLoading, t, onExpire }) {
  const [copiedField, setCopiedField] = useState(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes countdown (600 seconds)
  const [manualCheckCount, setManualCheckCount] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = countdown <= 120; // Less than 2 minutes
  const isCriticalTime = countdown <= 60; // Less than 1 minute

  // Handle expired
  const handleExpire = () => {
    if (onExpire) {
      onExpire();
    }
  };

  // Handle retry order
  const handleRetryOrder = () => {
    window.location.reload();
  };

  // Copy to clipboard
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    soundFX.playClick(); // Play click on copy
    setCopiedField(field);
    toast.success('Đã sao chép!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = () => {
    if (orderStatus === 'COMPLETED' || orderStatus === 'PROCESSING') {
      return <Badge variant="success">{t('checkout.status_completed')}</Badge>;
    }
    if (orderStatus === 'PAID') {
      return <Badge variant="success">{t('checkout.status_paid')}</Badge>;
    }
    return <Badge variant="warning">{t('checkout.status_pending')}</Badge>;
  };

  // Generate VietQR URL for QR code
  const generateVietQrUrl = () => {
    if (!paymentData?.qrCode) return null;
    // If it's already a full URL, use it
    if (paymentData.qrCode.startsWith('http')) {
      return paymentData.qrCode;
    }
    // Generate QR data for VietQR
    return paymentData.qrCode;
  };

  // Get transfer amount (VietQR needs exact amount)
  const transferAmount = paymentData?.amount || total;
  // Get transfer note (IMPORTANT for auto-matching)
  const transferNote = paymentData?.transferNote || orderNumber || `MMO${orderId}`;

  // Manual check handler
  const handleManualCheck = () => {
    setManualCheckCount((c) => c + 1);
    if (paymentMethod === 'USDT_TRC20') {
      onCheckUsdt?.();
    } else {
      onCheckVietQr?.();
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <section className="bg-bg-secondary border-b border-border py-6">
        <div className="container-lg">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/checkout" className="text-text-secondary hover:text-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">{t('checkout.complete_payment')}</h1>
          </div>
          <div className="flex items-center gap-3 ml-8">
            <p className="text-text-secondary">{t('checkout.order')}: <span className="font-mono font-semibold text-neon-cyan">{orderNumber || orderId}</span></p>
            {getStatusBadge()}
          </div>
        </div>
      </section>

      <div className="container-lg py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            {/* Amount Header */}
            <div className="text-center mb-6 p-4 bg-gradient-to-r from-primary/10 to-neon-magenta/10 rounded-xl">
              <p className="text-sm text-text-secondary mb-1">{t('checkout.amount_to_pay')}</p>
              <p className="text-4xl font-bold text-gradient bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text">
                {total.toLocaleString('vi-VN')}₫
              </p>
            </div>

            {/* VietQR Payment */}
            {paymentMethod === 'VIETQR' && (
              <>
                <div className="mb-6 p-4 bg-white rounded-xl inline-block shadow-lg">
                  {paymentData?.qrCode ? (
                    <img
                      src={paymentData.qrCode}
                      alt="VietQR Payment"
                      className="w-64 h-64 rounded-xl"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-64 h-64 hidden items-center justify-center bg-gray-100 rounded-xl">
                    <QRCodeSVG
                      value={generateVietQrUrl() || `MMO${orderNumber || orderId}`}
                      size={240}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>
                <p className="text-text-secondary mb-4 text-center">
                  <svg className="w-5 h-5 inline mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('checkout.scan_instruction')}
                </p>
              </>
            )}

            {/* USDT Payment */}
            {paymentMethod === 'USDT_TRC20' && (
              <>
                <div className="mb-6 p-4 bg-white rounded-xl inline-block shadow-lg">
                  <QRCodeSVG
                    value={`trx:${paymentData?.depositAddress}?amount=${paymentData?.amount || (total / 25000).toFixed(2)}`}
                    size={240}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-text-secondary mb-4 text-center">{t('checkout.usdt_instruction')}</p>
              </>
            )}

            {/* Payment Details Box - Manual Transfer Info */}
            <div className="bg-bg-tertiary rounded-xl p-5 space-y-4 text-left max-w-md mx-auto border border-border">
              <h3 className="font-semibold text-text-primary flex items-center gap-2 pb-2 border-b border-border">
                <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Thông tin chuyển khoản
              </h3>

              {paymentMethod === 'USDT_TRC20' ? (
                <>
                  {/* USDT Transfer Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">{t('checkout.network')}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-text-primary font-medium">TRC20 (TRON)</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-text-tertiary mb-1">{t('checkout.usdt_address')}</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs text-text-primary font-mono bg-bg-primary p-2 rounded-lg break-all">
                          {paymentData?.depositAddress}
                        </code>
                        <button
                          onClick={() => copyToClipboard(paymentData?.depositAddress, 'address')}
                          className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors flex-shrink-0"
                          title="Sao chép"
                        >
                          {copiedField === 'address' ? (
                            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">{t('checkout.amount')}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-text-primary font-medium">
                            {paymentData?.amount ? `${paymentData.amount} USDT` : `~${(total / 25000).toFixed(2)} USDT`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-text-tertiary mb-1">{t('checkout.memo')} <span className="text-red-400">*</span></p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-text-primary font-mono font-bold bg-bg-primary p-2 rounded-lg text-neon-magenta">
                          {orderNumber || orderId}
                        </code>
                        <button
                          onClick={() => copyToClipboard(orderNumber || orderId, 'memo')}
                          className="p-2 rounded-lg bg-neon-magenta/10 hover:bg-neon-magenta/20 transition-colors flex-shrink-0"
                          title="Sao chép"
                        >
                          {copiedField === 'memo' ? (
                            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-neon-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-neon-magenta mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {t('checkout.memo_warning')}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* VietQR Bank Transfer Info */}
                  <div className="space-y-3">
                    {/* Bank Name */}
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">{t('checkout.bank')}</p>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm text-text-primary font-medium">
                          {paymentData?.bankName || 'VPBank'}
                          {paymentData?.bankId && <span className="text-text-tertiary ml-1">({paymentData.bankId})</span>}
                        </p>
                        <button
                          onClick={() => copyToClipboard(paymentData?.bankName || 'VPBank', 'bank')}
                          className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors"
                          title="Sao chép"
                        >
                          {copiedField === 'bank' ? (
                            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Account Number */}
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">{t('checkout.account_number')}</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-text-primary font-mono font-bold bg-bg-primary p-2 rounded-lg">
                          {paymentData?.accountNumber || '9704222226666688'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(paymentData?.accountNumber || '9704222226666688', 'account')}
                          className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors"
                          title="Sao chép"
                        >
                          {copiedField === 'account' ? (
                            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Account Name */}
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">{t('checkout.account_name')}</p>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm text-text-primary font-medium">
                          {paymentData?.accountName || 'CONG TY TNHH MMO STORE'}
                        </p>
                        <button
                          onClick={() => copyToClipboard(paymentData?.accountName || 'CONG TY TNHH MMO STORE', 'name')}
                          className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors"
                          title="Sao chép"
                        >
                          {copiedField === 'name' ? (
                            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">{t('checkout.amount')}</p>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-xl text-text-primary font-bold text-neon-cyan">
                          {transferAmount.toLocaleString('vi-VN')}₫
                        </p>
                        <button
                          onClick={() => copyToClipboard(transferAmount.toString(), 'amount')}
                          className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors"
                          title="Sao chép"
                        >
                          {copiedField === 'amount' ? (
                            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-text-tertiary mt-1">Chuyển đúng số tiền để hệ thống tự động xác nhận</p>
                    </div>

                    {/* Transfer Note - CRITICAL */}
                    <div className="p-3 bg-neon-magenta/10 rounded-lg border border-neon-magenta/30">
                      <p className="text-xs text-neon-magenta mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {t('checkout.content')} <span className="font-bold">QUAN TRỌNG NHẤT</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-base text-text-primary font-mono font-bold bg-bg-primary p-2 rounded-lg text-neon-magenta">
                          {transferNote}
                        </code>
                        <button
                          onClick={() => copyToClipboard(transferNote, 'note')}
                          className="p-2 rounded-lg bg-neon-magenta/20 hover:bg-neon-magenta/30 transition-colors flex-shrink-0"
                          title="Sao chép nội dung"
                        >
                          {copiedField === 'note' ? (
                            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-neon-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-neon-magenta/80 mt-2 flex items-start gap-1">
                        <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ghi đúng nội dung này để Casso tự động xác nhận và cấp hàng ngay!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Countdown Timer - Enhanced with urgency indicators */}
            {countdown > 0 ? (
              <div className={`mt-6 p-4 rounded-xl border transition-all ${
                isCriticalTime 
                  ? 'bg-red-500/20 border-red-500/50 animate-pulse' 
                  : isLowTime 
                    ? 'bg-amber-500/20 border-amber-500/50' 
                    : 'bg-warning/10 border-warning/20'
              }`}>
                <div className={`flex items-center justify-center gap-2 ${
                  isCriticalTime ? 'text-red-400' : isLowTime ? 'text-amber-400' : 'text-warning'
                }`}>
                  <svg className={`w-5 h-5 ${isCriticalTime ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-sm">
                    {isCriticalTime 
                      ? '⚠️ Sắp hết hạn! ' 
                      : isLowTime 
                        ? '⏰ ' 
                        : ''}
                    Thời gian còn lại: 
                    <span className={`font-mono font-bold text-lg ${
                      isCriticalTime 
                        ? 'text-red-400' 
                        : isLowTime 
                          ? 'text-amber-400' 
                          : 'text-warning'
                    }`}>
                      {formatTime(countdown)}
                    </span>
                  </span>
                </div>
                <p className={`text-xs text-center mt-2 ${
                  isCriticalTime ? 'text-red-400' : isLowTime ? 'text-amber-400/80' : 'text-warning/80'
                }`}>
                  Vui lòng thanh toán nhanh để giữ sản phẩm
                </p>
              </div>
            ) : null}

            {/* Status and Actions */}
            <div className="mt-6 space-y-4">
              {orderStatus === 'COMPLETED' || orderStatus === 'PROCESSING' || orderStatus === 'PAID' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-success/10 rounded-xl text-success border border-success/20">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold text-lg">{t('checkout.payment_success')}</p>
                    <p className="text-sm mt-1">{t('checkout.redirecting')}</p>
                  </div>
                </div>
              ) : expired ? (
                // Expired State
                <div className="space-y-4">
                  <div className="p-6 bg-red-500/10 rounded-xl border border-red-500/30">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-xl font-bold text-red-400 mb-2">Thời gian thanh toán đã hết hạn!</h3>
                      <p className="text-gray-400 mb-4">
                        Sản phẩm đã được trả lại kho. Bạn có thể tạo đơn hàng mới.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={handleRetryOrder}
                          className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                        >
                          Tạo đơn hàng mới
                        </button>
                        <Link
                          to="/products"
                          className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
                        >
                          Tiếp tục mua sắm
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Auto polling status */}
                  <div className="flex items-center justify-center gap-2 text-text-secondary">
                    <div className="animate-spin w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full"></div>
                    <span className="text-sm">{t('checkout.waiting_payment')}</span>
                  </div>

                  {/* Manual check button - NOW WORKS FOR BOTH VIETQR AND USDT */}
                  <motion.button
                    onClick={handleManualCheck}
                    disabled={checkLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-3
                      ${checkLoading
                        ? 'bg-neon-cyan/20 text-neon-cyan cursor-not-allowed'
                        : 'bg-gradient-to-r from-neon-cyan to-neon-magenta text-white hover:shadow-lg hover:shadow-neon-cyan/25'
                      }
                    `}
                  >
                    {checkLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang kiểm tra thanh toán...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Tôi đã chuyển khoản / Kiểm tra giao dịch
                      </>
                    )}
                  </motion.button>

                  {manualCheckCount > 0 && !checkLoading && (
                    <p className="text-xs text-text-tertiary text-center">
                      Đã kiểm tra {manualCheckCount} lần. Vui lòng đợi hoặc kiểm tra lại sau vài giây.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-bg-tertiary/50 rounded-xl text-left border border-border">
              <h3 className="font-medium text-text-primary mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-neon-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {t('checkout.tips')}
              </h3>
              <ul className="text-xs text-text-secondary space-y-1 ml-6">
                {paymentMethod === 'VIETQR' ? (
                  <>
                    <li>• Quét mã QR bằng app ngân hàng để thanh toán nhanh nhất</li>
                    <li>• Nếu quét QR lỗi, dùng chuyển khoản thủ công với thông tin bên trên</li>
                    <li>• <strong className="text-neon-magenta">QUAN TRỌNG:</strong> Ghi đúng nội dung chuyển khoản để được cấp hàng tự động</li>
                    <li>• Đơn hàng sẽ tự động xác nhận trong vài phút sau khi thanh toán</li>
                  </>
                ) : (
                  <>
                    <li>• Quét mã QR bằng ví USDT (Trust Wallet, Token Pocket...)</li>
                    <li>• Đảm bảo mạng TRON (TRC20) khi chuyển</li>
                    <li>• <strong className="text-neon-magenta">QUAN TRỌNG:</strong> Ghi đúng Memo/Tag để được cấp hàng</li>
                    <li>• Kiểm tra tỷ giá USDT/VND trước khi chuyển</li>
                  </>
                )}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
