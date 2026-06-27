import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSEO from '../hooks/useSEO';

const GlitchText = ({ text, className = '' }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main text */}
      <span className="relative z-10">{text}</span>
      
      {/* Glitch layers */}
      <span 
        className="absolute top-0 left-0 z-0 glitch-layer-1"
        data-text={text}
        aria-hidden="true"
      >
        {text}
      </span>
      <span 
        className="absolute top-0 left-0 z-0 glitch-layer-2"
        data-text={text}
        aria-hidden="true"
      >
        {text}
      </span>
    </div>
  );
};

const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-neon-cyan"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: 0.3,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

const GlitchLine = () => (
  <motion.div
    className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
    animate={{
      y: ['0vh', '100vh'],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: 'linear',
    }}
  />
);

export default function NotFound() {
  useSEO({
    title: '404 - Không tìm thấy trang',
    description: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.',
    noIndex: true,
  });

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      {/* Floating Particles */}
      <FloatingParticles />
      
      {/* Glitch Lines */}
      <GlitchLine />
      <GlitchLine style={{ animationDelay: '1.5s' }} />
      <GlitchLine style={{ animationDelay: '3s' }} />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Glitch 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="relative">
            {/* Glow effect behind number */}
            <div className="absolute inset-0 blur-3xl bg-neon-cyan/20 scale-150" />
            
            <h1 className="relative text-[12rem] sm:text-[16rem] md:text-[20rem] font-bold leading-none select-none">
              <GlitchText text="404" className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-cyan bg-[length:200%_100%] animate-gradient-shift" />
            </h1>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-neon-magenta">Không</span>{' '}
            <span className="text-white">Tìm</span>{' '}
            <span className="text-neon-cyan">Thấy</span>{' '}
            <span className="text-white">Trang</span>
          </h2>
          
          <motion.p 
            className="text-gray-400 text-lg max-w-md mx-auto"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚠️ Lỗi: Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </motion.p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Glow Button - Primary */}
          <Link to="/" className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-cyan rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative bg-bg-primary border-2 border-neon-cyan text-neon-cyan px-8 py-4 rounded-2xl font-bold text-lg hover:bg-neon-cyan/10 transition-all duration-300 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Quay lại Trang chủ
            </div>
          </Link>

          {/* Secondary Button */}
          <Link to="/products" className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-magenta to-neon-purple rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition duration-500" />
            <div className="relative bg-bg-primary border-2 border-neon-magenta/50 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-neon-magenta/10 hover:border-neon-magenta transition-all duration-300 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Xem sản phẩm
            </div>
          </Link>
        </motion.div>

        {/* Scan Lines Effect */}
        <div className="fixed inset-0 pointer-events-none scanlines opacity-[0.03]" />
        
        {/* Terminal decoration */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 0.6, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="hidden lg:block absolute left-8 top-1/3"
        >
          <div className="font-mono text-sm text-neon-cyan/80">
            <div className="mb-2">$ cd /404</div>
            <div className="mb-2">$ ls -la</div>
            <div className="mb-2 text-neon-magenta/60">drwxr-xr-x page-not-found/</div>
            <div className="text-neon-gold/60">-rw-r--r-- error.log</div>
          </div>
        </motion.div>

        {/* Right decoration */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 0.6, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="hidden lg:block absolute right-8 top-1/3"
        >
          <div className="font-mono text-sm text-neon-cyan/80 text-right">
            <div className="mb-2">STATUS: <span className="text-danger">ERROR</span></div>
            <div className="mb-2">CODE: <span className="text-neon-gold">404</span></div>
            <div className="mb-2 text-neon-magenta/60">REASON: PAGE_NOT_FOUND</div>
            <div className="text-success">SOLUTION: GO_HOME</div>
          </div>
        </motion.div>
      </div>

      {/* CSS for glitch effect */}
      <style>{`
        @keyframes glitch-1 {
          0%, 100% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); }
          20% { clip-path: inset(92% 0 1% 0); transform: translate(2px, -2px); }
          40% { clip-path: inset(43% 0 1% 0); transform: translate(-2px, 0); }
          60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, 2px); }
          80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, -2px); }
        }

        @keyframes glitch-2 {
          0%, 100% { clip-path: inset(50% 0 30% 0); transform: translate(2px, -2px); }
          20% { clip-path: inset(5% 0 85% 0); transform: translate(-2px, 2px); }
          40% { clip-path: inset(70% 0 10% 0); transform: translate(2px, 0); }
          60% { clip-path: inset(10% 0 60% 0); transform: translate(-2px, -2px); }
          80% { clip-path: inset(30% 0 50% 0); transform: translate(2px, 2px); }
        }

        .glitch-layer-1 {
          color: #22d3ee;
          animation: glitch-1 0.5s infinite linear alternate-reverse;
        }

        .glitch-layer-2 {
          color: #e635c5;
          animation: glitch-2 0.5s infinite linear alternate-reverse;
          animation-delay: 0.1s;
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-gradient-shift {
          animation: gradient-shift 3s ease infinite;
        }

        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }

        .scanlines {
          background: repeating-linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0px,
            rgba(0, 0, 0, 0) 1px,
            rgba(0, 0, 0, 0.1) 1px,
            rgba(0, 0, 0, 0.1) 2px
          );
          animation: scanlines 0.5s linear infinite;
        }

        .bg-grid {
          background-image: 
            linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}
