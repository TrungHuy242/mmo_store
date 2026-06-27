import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * ErrorBoundary - Bắt lỗi React render để tránh trắng màn hình
 * Dùng Class Component vì cần lifecycle methods
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 max-w-lg w-full text-center"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="relative inline-block"
              >
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl rotate-6 opacity-50 blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl animate-pulse" />
                  <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 left-2 right-2 h-0.5 bg-cyan-400 opacity-70" />
                  <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-cyan-400 opacity-50" />
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 animate-pulse">
                  HỆ THỐNG GẶP SỰ CỐ
                </h1>
                <h2 className="text-lg md:text-xl font-mono text-cyan-400 mt-2 tracking-wider">
                  SYSTEM_ERROR
                </h2>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 mb-8"
            >
              <p className="text-gray-300 text-sm font-mono mb-2">
                <span className="text-red-400">ERROR:</span> {this.state.error?.message || 'Unknown error occurred'}
              </p>
              {this.state.errorInfo?.componentStack && (
                <details className="text-left mt-3">
                  <summary className="text-cyan-400 text-xs cursor-pointer hover:text-cyan-300">
                    Chi tiết lỗi
                  </summary>
                  <pre className="mt-2 p-3 bg-black/50 rounded-lg text-xs text-gray-400 overflow-x-auto max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => window.location.reload()}
                className="group relative px-6 py-3 rounded-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-cyan-600 transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
                <div className="absolute inset-0 rounded-xl border-2 border-cyan-300/50" />
                <span className="relative flex items-center justify-center gap-2 text-white font-semibold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Tải lại trang
                </span>
              </button>

              <Link
                to="/"
                className="group relative px-6 py-3 rounded-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
                <div className="absolute inset-0 rounded-xl border-2 border-purple-300/50" />
                <span className="relative flex items-center justify-center gap-2 text-white font-semibold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Về trang chủ
                </span>
              </Link>
            </motion.div>

            <div className="mt-8 flex justify-center gap-8 opacity-40">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                STATUS: ERROR
              </div>
              <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                RENDER: FAILED
              </div>
            </div>

            <p className="mt-6 text-gray-500 text-xs">
              Mã lỗi: {Date.now().toString(36).toUpperCase()}
            </p>
          </motion.div>

          <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-500/30 rounded-br-3xl" />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
