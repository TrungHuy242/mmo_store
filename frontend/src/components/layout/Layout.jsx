import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { CartProvider } from '../../context/CartContext';
import { CartDrawer } from '../sections/CartDrawer';
import { ToastProvider } from '../ui';
import CommandPalette from './CommandPalette';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.2,
};

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ToastProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 pt-16 lg:pt-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
          <CartDrawer />
          <CommandPalette />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#fff',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                maxWidth: '420px',
              },
              success: {
                iconTheme: { primary: '#22d3ee', secondary: '#fff' },
                style: { border: '1px solid rgba(34, 211, 238, 0.5)' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
                duration: 5000,
              },
            }}
          />
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
