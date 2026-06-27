import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';
import useSEO from '../hooks/useSEO';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Icons as components
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function Home() {
  // SEO - Dynamic page title
  useSEO({
    title: 'Trang chủ',
    description: 'MMO Store - Hệ thống mua bán tài khoản Premium, Source Code, Tools & Scripts chất lượng cao với giao dịch tự động 24/7.',
    keywords: 'mmo store, tai khoan premium, source code, tools, scripts, mua ban tu dong',
  });

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats */}
      <StatsSection />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Categories */}
      <CategoriesSection />

      {/* Features */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <CTASection />

      {/* Trust Badges */}
      <TrustBadges />
    </div>
  );
}

function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-cyan/10 rounded-full blur-[128px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(to right, #1E1E1E 1px, transparent 1px),
                         linear-gradient(to bottom, #1E1E1E 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="container-lg relative z-10 py-20 lg:py-32">
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-8">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {t('home.hero_badge')}
            </Link>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight"
          >
            {t('home.hero_title')}
            <br />
            <span className="gradient-text">{t('home.hero_title_accent')}</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10"
          >
            {t('home.hero_subtitle')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link to="/products">
              <Button size="lg" rightIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              }>
                {t('home.browse_products')}
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" size="lg">
                {t('home.create_account')}
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-text-tertiary"
          >
            <span className="flex items-center gap-2">
              <CheckIcon />
              {t('home.instant_delivery')}
            </span>
            <span className="flex items-center gap-2">
              <CheckIcon />
              {t('home.support_247')}
            </span>
            <span className="flex items-center gap-2">
              <CheckIcon />
              {t('home.secure_payments')}
            </span>
            <span className="flex items-center gap-2">
              <CheckIcon />
              {t('home.warranty_30day')}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const { t } = useTranslation();
  const stats = [
    { value: '50K+', labelKey: 'home.stats_sold' },
    { value: '25K+', labelKey: 'home.stats_users' },
    { value: '99.9%', labelKey: 'home.stats_delivery' },
    { value: '24/7', labelKey: 'home.stats_support' },
  ];

  return (
    <section className="py-16 border-y border-border bg-bg-secondary/50">
      <div className="container-lg">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-text-secondary">{t(stat.labelKey)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProducts() {
  const { t } = useTranslation();
  const products = [
    {
      id: 1,
      name: 'Premium Netflix Account',
      price: 29.99,
      originalPrice: 49.99,
      image: 'https://picsum.photos/400/300?random=1',
      rating: 4.8,
      reviews: 234,
      sales: 1234,
      badge: 'Best Seller',
    },
    {
      id: 2,
      name: 'SEO PowerSuite Pro',
      price: 149.99,
      image: 'https://picsum.photos/400/300?random=2',
      rating: 4.9,
      reviews: 567,
      sales: 892,
      badge: 'Hot',
    },
    {
      id: 3,
      name: 'Social Media Bot Source Code',
      price: 299.99,
      originalPrice: 399.99,
      image: 'https://picsum.photos/400/300?random=3',
      rating: 4.7,
      reviews: 123,
      sales: 456,
      badge: 'Sale',
    },
    {
      id: 4,
      name: 'Proxy Package 1000 IPs',
      price: 79.99,
      image: 'https://picsum.photos/400/300?random=4',
      rating: 4.6,
      reviews: 89,
      sales: 234,
    },
  ];

  return (
    <section className="py-20 lg:py-24">
      <div className="container-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
              {t('home.featured_title')}
            </h2>
            <p className="text-text-secondary">
              {t('home.featured_subtitle')}
            </p>
          </div>
          <Link to="/products" className="hidden sm:flex items-center gap-2 text-primary hover:underline">
            {t('common.viewAll')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/product/${product.id}`} className="group block">
                <div className="card overflow-hidden hover:border-border-hover transition-all">
                  {/* Image */}
                  <div className="relative aspect-product bg-bg-tertiary overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {product.badge && (
                      <span className={`absolute top-3 left-3 badge ${
                        product.badge === 'Sale' ? 'badge-warning' :
                        product.badge === 'Hot' ? 'badge-danger' : 'badge-primary'
                      }`}>
                        {product.badge}
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="absolute top-3 right-3 bg-danger text-white text-xs font-bold px-2 py-1 rounded">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} />
                      ))}
                      <span className="text-xs text-text-tertiary ml-1">({product.reviews})</span>
                    </div>
                    <h3 className="font-medium text-text-primary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-text-primary">
                          ${product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-text-tertiary line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-tertiary">
                        {product.sales}+ {t('products.sold')}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <Link to="/products" className="sm:hidden flex items-center justify-center gap-2 text-primary mt-6 hover:underline">
          {t('common.viewAll')} {t('products.all')}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

function CategoriesSection() {
  const { t } = useTranslation();
  const categories = [
    { nameKey: 'common.accounts', icon: '👤', count: 2500, color: 'from-blue-500 to-cyan-500' },
    { nameKey: 'common.source_code', icon: '💻', count: 850, color: 'from-purple-500 to-pink-500' },
    { nameKey: 'common.products', icon: '⚙️', count: 1200, color: 'from-orange-500 to-red-500' },
    { nameKey: 'common.products', icon: '🌐', count: 680, color: 'from-green-500 to-emerald-500' },
    { nameKey: 'common.products', icon: '📚', count: 420, color: 'from-yellow-500 to-orange-500' },
    { nameKey: 'common.products', icon: '📋', count: 350, color: 'from-indigo-500 to-purple-500' },
  ];

  return (
    <section className="py-20 lg:py-24 bg-bg-secondary/50">
      <div className="container-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-4">
            {t('home.categories_title')}
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            {t('home.categories_subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.nameKey + i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/products?category=${cat.nameKey}`}
                className="group block p-6 bg-bg-tertiary border border-border rounded-xl hover:border-border-hover transition-all text-center"
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl`}>
                  {cat.icon}
                </div>
                <h3 className="font-medium text-text-primary mb-1 group-hover:text-primary transition-colors">
                  {t(cat.nameKey)}
                </h3>
                <p className="text-xs text-text-tertiary">{cat.count.toLocaleString()} {t('common.items')}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { t } = useTranslation();
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      titleKey: 'home.feature_delivery_title',
      descKey: 'home.feature_delivery_desc',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      titleKey: 'home.feature_secure_title',
      descKey: 'home.feature_secure_desc',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      titleKey: 'home.feature_support_title',
      descKey: 'home.feature_support_desc',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      titleKey: 'home.feature_warranty_title',
      descKey: 'home.feature_warranty_desc',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      titleKey: 'home.feature_payment_title',
      descKey: 'home.feature_payment_desc',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      titleKey: 'home.feature_affiliate_title',
      descKey: 'home.feature_affiliate_desc',
    },
  ];

  return (
    <section className="py-20 lg:py-24">
      <div className="container-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-4">
            {t('home.why_choose_us')}
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            {t('home.why_desc')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-bg-secondary border border-border rounded-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-sm text-text-secondary">
                {t(feature.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    {
      number: '01',
      titleKey: 'home.step1_title',
      descKey: 'home.step1_desc',
    },
    {
      number: '02',
      titleKey: 'home.step2_title',
      descKey: 'home.step2_desc',
    },
    {
      number: '03',
      titleKey: 'home.step3_title',
      descKey: 'home.step3_desc',
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-bg-secondary/50">
      <div className="container-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-4">
            {t('home.how_it_works')}
          </h2>
          <p className="text-text-secondary">
            {t('home.how_desc')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] right-0 h-px bg-border" />
              )}
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary font-bold text-2xl mb-6">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {t(step.titleKey)}
              </h3>
              <p className="text-sm text-text-secondary max-w-xs mx-auto">
                {t(step.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Digital Marketer',
      avatar: 'https://picsum.photos/100?random=10',
      content: 'Great marketplace! The delivery was instant and the quality exceeded my expectations. Will definitely buy again.',
      rating: 5,
    },
    {
      name: 'Sarah Johnson',
      role: 'Software Developer',
      avatar: 'https://picsum.photos/100?random=11',
      content: 'The source code I purchased was exactly as described. Clean code, good documentation. Highly recommend!',
      rating: 5,
    },
    {
      name: 'Mike Roberts',
      role: 'SEO Specialist',
      avatar: 'https://picsum.photos/100?random=12',
      content: 'Best MMO marketplace I\'ve used. Fast support and genuine products. Been a customer for 2 years now.',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 lg:py-24">
      <div className="container-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-4">
            {t('home.testimonials_title')}
          </h2>
          <p className="text-text-secondary">
            {t('home.testimonials_subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-bg-secondary border border-border rounded-xl"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-warning fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-text-secondary mb-6 italic">"{testimonial.content}"</p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-text-primary">{testimonial.name}</div>
                  <div className="text-sm text-text-tertiary">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How does instant delivery work?',
      answer: 'After payment is confirmed, you\'ll receive your product details immediately via email and can also access them in your dashboard. Most deliveries are automated and happen within seconds.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept USDT (TRC20), VietQR bank transfers, and major credit/debit cards. All payments are processed securely through our encrypted payment system.',
    },
    {
      question: 'Is there a warranty on products?',
      answer: 'Yes! All products come with a 30-day warranty. If you experience any issues, our support team will help resolve them or provide a replacement.',
    },
    {
      question: 'Can I become an affiliate?',
      answer: 'Absolutely! Join our affiliate program and earn 10% commission on every sale made through your referral link. Withdrawals are processed within 24 hours.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach us 24/7 through our ticket system, email, or Telegram. Average response time is under 1 hour.',
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-bg-secondary/50">
      <div className="container-lg max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-4">
            {t('home.faq_title')}
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-bg-secondary border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-medium text-text-primary pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-text-tertiary flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 text-text-secondary">
                  {faq.answer}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 lg:py-24">
      <div className="container-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent-purple p-8 lg:p-16 text-center"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-[128px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-[128px]" />
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4">
              {t('home.cta_title')}
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">
              {t('home.cta_desc')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 border-white">
                  {t('home.cta_btn_free')}
                </Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  {t('home.cta_btn_browse')}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustBadges() {
  const { t } = useTranslation();
  const badges = [
    { nameKey: 'home.ssl_secure', icon: '🔒' },
    { nameKey: 'home.verified_seller', icon: '✓' },
    { nameKey: 'home.fast_delivery', icon: '⚡' },
    { nameKey: 'home.support_247', icon: '💬' },
  ];

  return (
    <section className="py-12 border-t border-border">
      <div className="container-lg">
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {badges.map((badge) => (
            <div key={badge.nameKey} className="flex items-center gap-2 text-text-tertiary">
              <span className="text-lg">{badge.icon}</span>
              <span className="text-sm font-medium">{t(badge.nameKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
