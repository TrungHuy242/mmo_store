import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderApi } from '../api/order.api';
import { useAuthStore } from '../store';

export default function OrderInvoice() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const res = await orderApi.getById(orderId);
        const orderData = res.data?.data || res.data;
        setOrder(orderData);
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
  }, [orderId, isAuthenticated, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      'VIETQR': 'VietQR',
      'USDT_TRC20': 'USDT (TRC20)',
      'BALANCE': 'Số dư ví',
      'CARD': 'Thẻ cào',
      'BANK_TRANSFER': 'Chuyển khoản',
    };
    return methods[method] || method || '-';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-6">{error || 'Không tìm thấy đơn hàng'}</p>
          <Link to="/dashboard" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .invoice-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20mm !important;
            max-width: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-8 px-4">
        {/* Print Button - Hidden when printing */}
        <div className="max-w-3xl mx-auto mb-6 no-print">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              In hóa đơn / Lưu PDF
            </button>
          </div>
        </div>

        {/* Invoice Container - A4 Style */}
        <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden invoice-container">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">MMO STORE</h1>
                <p className="text-blue-100 text-sm">Nền tảng MMO uy tín hàng đầu</p>
                <p className="text-blue-100 text-sm mt-2">support@mmostore.com</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold mb-2">HÓA ĐƠN</h2>
                <p className="text-blue-100 text-sm">
                  <span className="text-white">Mã:</span> {order.orderNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="p-8 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ngày mua</h3>
                <p className="text-gray-800">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Phương thức thanh toán</h3>
                <p className="text-gray-800">{getPaymentMethodName(order.paymentMethod)}</p>
              </div>
            </div>

            {order.user && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thông tin khách hàng</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 font-medium">{order.user.username || order.user.email}</p>
                  <p className="text-gray-600 text-sm">{order.user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="p-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Chi tiết đơn hàng</h3>
            
            {/* Table Header */}
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="col-span-6">Sản phẩm</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-right">Đơn giá</div>
                <div className="col-span-2 text-right">Thành tiền</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {order.items?.map((item, index) => (
                  <div key={item.id || index} className="grid grid-cols-12 gap-4 p-4 items-center">
                    <div className="col-span-6">
                      <p className="text-gray-800 font-medium">{item.product?.name || 'Sản phẩm'}</p>
                      <p className="text-gray-500 text-sm">{item.product?.productType || 'Digital'}</p>
                    </div>
                    <div className="col-span-2 text-center text-gray-700">
                      {item.quantity || 1}
                    </div>
                    <div className="col-span-2 text-right text-gray-700">
                      {formatCurrency(item.price)}
                    </div>
                    <div className="col-span-2 text-right text-gray-800 font-medium">
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 text-gray-600">
                    <span>Tạm tính:</span>
                    <span>{formatCurrency(order.subtotal || order.total)}</span>
                  </div>
                  {(order.discount > 0 || order.couponCode) && (
                    <div className="flex justify-between py-2 text-green-600">
                      <span>Giảm giá{order.couponCode ? ` (${order.couponCode})` : ''}:</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 text-lg font-bold text-gray-800 border-t border-gray-200 mt-2">
                    <span>Tổng cộng:</span>
                    <span className="text-blue-600">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Trạng thái thanh toán:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'COMPLETED' || order.status === 'PAID'
                    ? 'bg-green-100 text-green-700'
                    : order.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {order.status === 'COMPLETED' || order.status === 'PAID' ? 'Đã thanh toán' : order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 text-center border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của MMO Store
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Mã hóa đơn: {order.orderNumber} | Ngày: {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Print hint - Hidden when printing */}
        <p className="max-w-3xl mx-auto mt-4 text-center text-gray-500 text-sm no-print">
          Nhấn <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Ctrl+P</kbd> hoặc <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Cmd+P</kbd> để in hóa đơn
        </p>
      </div>
    </>
  );
}
