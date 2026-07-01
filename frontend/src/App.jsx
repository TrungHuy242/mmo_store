import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { settingsApi } from './api/settings.api';
import { useAuth } from './context/AuthContext';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Licenses = lazy(() => import('./pages/Licenses'));
const Support = lazy(() => import('./pages/Support'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderInvoice = lazy(() => import('./pages/OrderInvoice'));
const Admin = lazy(() => import('./pages/Admin'));
const LocketGold = lazy(() => import('./pages/LocketGold'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Profile = lazy(() => import('./pages/Profile'));
const Maintenance = lazy(() => import('./pages/Maintenance'));

// Page transition wrapper with fade + slide effect
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.22, 1, 0.36, 1]
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Enhanced PageLoader with spinner animation
function PageLoader() {
  return (
    <motion.div 
      className="min-h-[60vh] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="relative w-12 h-12"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"></div>
        </motion.div>
        <motion.p 
          className="text-text-secondary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Đang tải...
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  // Check maintenance mode on app load
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const res = await settingsApi.getStatus();
        const data = res.data?.data || res.data;
        
        if (data.maintenanceMode) {
          setMaintenanceMode(true);
          setMaintenanceMessage(data.maintenanceMessage || 'Hệ thống đang được bảo trì. Vui lòng quay lại sau.');
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
        // Continue normally if check fails
      } finally {
        setMaintenanceLoading(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  // Check if current user is admin
  const isAdmin = user && ['SUPER_ADMIN', 'MANAGER', 'SUPPORT', 'FINANCE', 'INVENTORY_STAFF', 'MARKETING'].includes(user.role);
  
  // Admin bypasses maintenance mode
  const showMaintenance = maintenanceMode && !isAdmin;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<PageLoader />}>
        {showMaintenance ? (
          <Routes>
            <Route path="*" element={<Maintenance />} />
          </Routes>
        ) : (
          <Routes location={location} key={location.pathname}>
          {/* Nhóm các route sử dụng Layout chung của User */}
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
            <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
            <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
            <Route path="/verify-otp" element={<PageTransition><VerifyOtp /></PageTransition>} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <PageTransition><Dashboard /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute>
                <PageTransition><Wishlist /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/licenses" element={
              <ProtectedRoute>
                <PageTransition><Licenses /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute>
                <PageTransition><Support /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/checkout/:productId" element={
              <ProtectedRoute>
                <PageTransition><Checkout /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <PageTransition><Checkout /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/order-success/:orderId" element={
              <ProtectedRoute>
                <PageTransition><OrderSuccess /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/orders/:orderId/invoice" element={
              <ProtectedRoute>
                <PageTransition><OrderInvoice /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <PageTransition><Profile /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/locket-gold" element={
              <ProtectedRoute>
                <PageTransition><LocketGold /></PageTransition>
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Admin routes - TÁCH BIỆT HOÀN TOÀN */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <PageTransition><Admin /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/locket-gold" element={
            <ProtectedRoute adminOnly>
              <PageTransition><Admin /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute adminOnly>
              <PageTransition><Admin /></PageTransition>
            </ProtectedRoute>
          } />
          
          {/* Catch all - 404 */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      )}
    </Suspense>
  </AnimatePresence>
  );
}
