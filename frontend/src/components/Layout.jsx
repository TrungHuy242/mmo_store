import { useState } from 'react';
import Navbar from './Navbar.jsx';
import CartDrawer from './sections/CartDrawer.jsx';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems] = useState([]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onCartClick={() => setCartOpen(true)} cartCount={cartItems.length} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>
      <footer className="glass mx-3 mb-3 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Main footer row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm text-gray-400">
                MMO Store © {new Date().getFullYear()} - Sản phẩm số tự động 24/7
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-300 transition">Điều khoản</a>
              <a href="#" className="hover:text-gray-300 transition">Chính sách</a>
              <a href="#" className="hover:text-gray-300 transition">Hỗ trợ</a>
            </div>
          </div>
          
          {/* Payment icons row */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
            <span className="text-xs text-gray-500 mr-2">Thanh toán:</span>
            <div className="flex items-center gap-3">
              {/* VietQR */}
              <div className="w-10 h-7 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">VietQR</span>
              </div>
              {/* Visa */}
              <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="w-10 h-7 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
              {/* Bank Transfer */}
              <div className="w-10 h-7 bg-green-600 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {/* USDT */}
              <div className="w-10 h-7 bg-green-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">₮</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#22d3ee',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}
