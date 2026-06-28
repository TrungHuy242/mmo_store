import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Maintenance() {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState('');
  const [particles, setParticles] = useState([]);

  // Generate random particles for background effect
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  // Glitch text effect
  const [glitchText, setGlitchText] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 150);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-magenta/5" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite',
          }}
        />
      </div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-neon-cyan"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="w-full h-1 bg-neon-cyan/20"
          animate={{
            top: ['0%', '100%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Glitch Icon */}
        <motion.div
          className="mb-8 relative"
          animate={{ 
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          {/* Outer ring */}
          <div className="relative w-40 h-40 mx-auto">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-neon-magenta/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border border-neon-cyan/40"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-4 rounded-full border border-neon-gold/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Wrench Icon */}
                <svg 
                  className={`w-16 h-16 text-neon-cyan ${glitchText ? 'animate-pulse' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
                
                {/* Glow effect */}
                <div className="absolute inset-0 blur-xl bg-neon-cyan/30 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Title with Glitch Effect */}
        <motion.h1
          className={`text-4xl md:text-5xl font-bold mb-4 tracking-wider ${
            glitchText ? 'text-neon-magenta' : 'text-neon-cyan'
          }`}
          animate={{
            textShadow: glitchText 
              ? ['0 0 10px #00ffff, 0 0 20px #ff00ff', '0 0 20px #ff00ff, 0 0 40px #00ffff', '0 0 10px #00ffff, 0 0 20px #ff00ff']
              : ['0 0 10px #00ffff', '0 0 20px #00ffff'],
          }}
          transition={{ duration: 0.3 }}
        >
          {glitchText ? 'SYST3M' : 'SYSTEM'}
        </motion.h1>

        <motion.h2
          className="text-2xl md:text-3xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          MAINTENANCE <span className="text-neon-magenta">MODE</span>
        </motion.h2>

        {/* Status Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-gold/10 border border-neon-gold/30 mt-4 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-neon-gold"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-neon-gold text-sm font-medium tracking-wider">{t('common.upgrading')}</span>
        </motion.div>

        {/* Message Box */}
        <motion.div
          className="glass p-8 rounded-2xl border border-white/10 backdrop-blur-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-neon-cyan font-semibold">THÔNG BÁO</span>
          </div>
          
          <p className="text-gray-300 text-lg leading-relaxed">
            Hệ thống đang được <span className="text-neon-cyan font-semibold">nâng cấp định kỳ</span>.
          </p>
          <p className="text-gray-400 mt-2">
            Chúng tôi sẽ quay trở lại sau <span className="text-neon-magenta font-semibold">ít phút</span>.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{t('common.progress')}</span>
            <span>{t('common.loading_dots')}</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-gold"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          className="grid grid-cols-2 gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="glass p-4 rounded-xl border border-neon-cyan/20">
            <div className="text-neon-cyan text-2xl font-bold mb-1">24/7</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">{t('common.availability')}</div>
          </div>
          <div className="glass p-4 rounded-xl border border-neon-magenta/20">
            <div className="text-neon-magenta text-2xl font-bold mb-1">&lt;5min</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">{t('common.downtime')}</div>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-gray-500 text-sm mb-4">
            Cần hỗ trợ khẩn cấp?
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:support@mmostore.com"
              className="px-6 py-2 rounded-xl border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
            <a
              href="https://t.me/mmostore"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 rounded-xl border border-neon-magenta/30 text-neon-magenta hover:bg-neon-magenta/10 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.751-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.1.154.234.169.333.015.098.034.32.019.493z"/>
              </svg>
              Telegram
            </a>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          className="text-gray-600 text-xs mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          MMO-Store Premium v2.0 • Hệ thống đang được tối ưu hóa
        </motion.p>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-neon-cyan/20 rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-neon-magenta/20 rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-neon-magenta/20 rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-neon-cyan/20 rounded-br-3xl" />

      {/* CSS Animation */}
      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  );
}
