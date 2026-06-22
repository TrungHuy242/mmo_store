# MMO Store - Premium SaaS Redesign Blueprint

> A comprehensive technical blueprint transforming the MMO store from a basic e-commerce site into a **Stripe/Linear-grade premium platform** with futuristic UI, real-time capabilities, and institutional-grade reliability.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Design System](#design-system)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Migration Strategy](#migration-strategy)

---

## Design Philosophy

### Visual Aesthetic

- **Cyberpunk Elegance**: Neon accents on dark glass, high contrast, futuristic yet professional
- **Glassmorphism**: Frosted glass panels with subtle blur and transparency
- **Micro-interactions**: Every click, hover, and transition feels intentional
- **Motion Design**: Smooth 60fps animations, parallax effects, scroll-triggered reveals
- **Accessibility First**: WCAG 2.1 AA, dark mode native, keyboard navigation, reduced-motion support

### Core Principles

- **Clarity Over Decoration**: Information hierarchy is paramount
- **Responsive by Default**: Mobile-first, works flawlessly on all screens
- **Performance Obsessed**: Target <100ms TTI, <3s FCP, <1s LCP
- **Data Visualization**: Charts, gauges, and live metrics dominate admin/dashboard
- **Trust Signals**: Transparent pricing, live inventory, order tracking, social proof

---

## Frontend Architecture

### New Folder Structure

```
frontend/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── common/
│   │   │   ├── Button/          # Btn.jsx + variants (primary, ghost, neon, glow)
│   │   │   ├── Card/            # Card.jsx + Glass & Elevated variants
│   │   │   ├── Badge/           # Badge.jsx (sale, status, online)
│   │   │   ├── Skeleton/        # Skeleton loaders (pulse, wave, shimmer)
│   │   │   ├── Modal/           # Modal.jsx + Portal
│   │   │   ├── Tooltip/         # Tooltip.jsx (bubble, arrow)
│   │   │   ├── Dropdown/        # Dropdown.jsx + menu items
│   │   │   ├── Tabs/            # Tabs.jsx (animated underline)
│   │   │   ├── Input/           # Input.jsx + variants (outline, glass, filled)
│   │   │   ├── Select/          # Select.jsx (searchable, multi)
│   │   │   ├── Checkbox/        # Checkbox.jsx (custom styled)
│   │   │   ├── Radio/           # Radio.jsx (button group style)
│   │   │   ├── Toggle/          # Toggle.jsx (animated switch)
│   │   │   ├── Alert/           # Alert.jsx (success, error, warning, info)
│   │   │   ├── Toast/           # Toast.jsx (corner notifications)
│   │   │   ├── Spinner/         # Spinner.jsx (3 variants)
│   │   │   ├── Divider/         # Divider.jsx (animated)
│   │   │   ├── Pagination/      # Pagination.jsx (compact + full)
│   │   │   ├── Breadcrumb/      # Breadcrumb.jsx
│   │   │   ├── Avatar/          # Avatar.jsx + AvatarGroup
│   │   │   └── Icon/            # Icon.jsx (24x24, 16x16 sets)
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.jsx       # Top navigation with theme toggle
│   │   │   ├── Sidebar.jsx      # Collapsible admin sidebar
│   │   │   ├── Footer.jsx       # Sticky footer
│   │   │   ├── Container.jsx    # Max-width + padding wrapper
│   │   │   └── PageShell.jsx    # Layout + breadcrumb + title
│   │   │
│   │   ├── sections/
│   │   │   ├── Hero/
│   │   │   │   ├── HeroSection.jsx
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   └── CategoryPills.jsx
│   │   │   │
│   │   │   ├── Products/
│   │   │   │   ├── ProductGrid.jsx
│   │   │   │   ├── ProductCard.jsx      # Flash sale badge, countdown, quick add
│   │   │   │   ├── FlashSaleBanner.jsx
│   │   │   │   └── InventoryBar.jsx    # Live stock indicator
│   │   │   │
│   │   │   ├── Cart/
│   │   │   │   ├── CartDrawer.jsx      # Slide-out cart (right side)
│   │   │   │   ├── CartItem.jsx
│   │   │   │   └── CartSummary.jsx
│   │   │   │
│   │   │   ├── Checkout/
│   │   │   │   ├── CheckoutStepper.jsx
│   │   │   │   ├── PaymentMethodSelector.jsx
│   │   │   │   ├── BankTransferQR.jsx
│   │   │   │   ├── USDTWallet.jsx
│   │   │   │   ├── CardPayment.jsx
│   │   │   │   └── OrderConfirmation.jsx
│   │   │   │
│   │   │   ├── Dashboard/
│   │   │   │   ├── StatsGrid.jsx       # Key metrics (balance, commission, referred)
│   │   │   │   ├── OrdersList.jsx      # Recent orders table
│   │   │   │   ├── AffiliateStats.jsx  # Affiliate dashboard
│   │   │   │   └── WithdrawalForm.jsx
│   │   │   │
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard/
│   │   │   │   │   ├── AdminOverview.jsx
│   │   │   │   │   ├── RevenueChart.jsx
│   │   │   │   │   ├── OrderFunnel.jsx
│   │   │   │   │   ├── TopProducts.jsx
│   │   │   │   │   └── RecentOrders.jsx
│   │   │   │   │
│   │   │   │   ├── Products/
│   │   │   │   │   ├── ProductsList.jsx
│   │   │   │   │   ├── ProductForm.jsx (Create/Edit modal)
│   │   │   │   │   ├── BulkUpload.jsx
│   │   │   │   │   └── InventoryManager.jsx
│   │   │   │   │
│   │   │   │   ├── Orders/
│   │   │   │   │   ├── OrdersTable.jsx
│   │   │   │   │   ├── OrderDetail.jsx (Drawer)
│   │   │   │   │   └── OrderFilters.jsx
│   │   │   │   │
│   │   │   │   ├── Users/
│   │   │   │   │   ├── UsersList.jsx
│   │   │   │   │   ├── UserDetail.jsx (Drawer)
│   │   │   │   │   └── UserBalance.jsx (Adjustment modal)
│   │   │   │   │
│   │   │   │   └── Settings/
│   │   │   │       ├── Categories.jsx
│   │   │   │       ├── Broadcast.jsx
│   │   │   │       └── SystemSettings.jsx
│   │   │   │
│   │   │   └── Auth/
│   │   │       ├── LoginForm.jsx
│   │   │       ├── RegisterForm.jsx
│   │   │       ├── TelegramLink.jsx
│   │   │       └── VerificationStep.jsx
│   │   │
│   │   ├── charts/              # Recharts wrappers
│   │   │   ├── LineChart.jsx
│   │   │   ├── BarChart.jsx
│   │   │   ├── PieChart.jsx
│   │   │   ├── AreaChart.jsx
│   │   │   └── useChartTheme.js
│   │   │
│   │   └── animations/          # Framer Motion presets
│   │       ├── fadeIn.js
│   │       ├── slideIn.js
│   │       ├── scaleUp.js
│   │       ├── staggerContainer.js
│   │       └── useInView.js
│   │
│   ├── pages/                   # Route pages (use layouts)
│   │   ├── public/
│   │   │   ├── Home.jsx         # Hero + featured + categories
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── CategoryBrowse.jsx
│   │   │   ├── SearchResults.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Success.jsx      # Order confirmation
│   │   │   ├── Affiliate.jsx
│   │   │   ├── AffiliateSignup.jsx
│   │   │   └── NotFound.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── TelegramCallback.jsx
│   │   │
│   │   ├── user/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── Affiliate.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── Products.jsx
│   │       ├── Orders.jsx
│   │       ├── Users.jsx
│   │       ├── Settings.jsx
│   │       ├── Analytics.jsx
│   │       ├── Inventory.jsx
│   │       └── Broadcast.jsx
│   │
│   ├── store/                   # State management (Zustand)
│   │   ├── authStore.js
│   │   ├── cartStore.js
│   │   ├── productStore.js
│   │   ├── userStore.js
│   │   ├── adminStore.js
│   │   └── themeStore.js
│   │
│   ├── services/                # API integration
│   │   ├── api.js              # Axios instance + interceptors
│   │   ├── auth.service.js
│   │   ├── products.service.js
│   │   ├── orders.service.js
│   │   ├── users.service.js
│   │   ├── affiliate.service.js
│   │   ├── admin.service.js
│   │   ├── telegram.service.js
│   │   ├── payment.service.js
│   │   └── analytics.service.js
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   ├── useLocalStorage.js
│   │   ├── useFetch.js
│   │   ├── useDebounce.js
│   │   ├── useIntersectionObserver.js
│   │   ├── useMedia.js
│   │   ├── useClickOutside.js
│   │   └── useAsync.js
│   │
│   ├── utils/                   # Utilities
│   │   ├── cn.js               # Classname merger
│   │   ├── currency.js         # Format to VND/USD
│   │   ├── date.js             # Format dates
│   │   ├── validation.js       # Form validation
│   │   ├── constants.js
│   │   ├── retry.js            # Retry logic
│   │   └── logger.js
│   │
│   ├── styles/                  # Global styles
│   │   ├── globals.css         # Tailwind + custom resets
│   │   ├── animations.css      # Keyframe animations
│   │   ├── tokens.css          # Design tokens (CSS vars)
│   │   └── print.css
│   │
│   ├── config/
│   │   ├── app.config.js
│   │   └── routes.js           # Route definitions
│   │
│   ├── App.jsx                 # Router + Theme provider
│   ├── main.jsx
│   └── index.css
│
├── public/
│   ├── images/
│   │   ├── logos/
│   │   ├── heroes/
│   │   └── placeholders/
│   ├── icons/
│   └── fonts/
│
├── .env.example
├── .env.local
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

### State Management (Zustand)

**Architecture**: Zustand with immer middleware for immutable updates, persist for cart/theme, devtools.

```javascript
// store/authStore.js
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

export const useAuthStore = create(
  devtools(
    immer((set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const { user, token } = await authService.login(email, password);
          set((state) => {
            state.user = user;
            state.token = token;
            state.isLoading = false;
          });
        } catch (err) {
          set((state) => {
            state.error = err.message;
            state.isLoading = false;
          });
          throw err;
        }
      },

      logout: () => set({ user: null, token: null }),

      refreshUser: async () => {
        try {
          const user = await authService.getMe();
          set((state) => {
            state.user = user;
          });
        } catch (err) {
          set((state) => {
            state.user = null;
            state.token = null;
          });
        }
      },
    })),
    { name: "auth-store" },
  ),
);
```

**Similar stores for**: cartStore (persist), productStore, userStore, adminStore, themeStore (persist).

---

## Backend Architecture

### Transition from Express to NestJS (Modular Monolith)

**Rationale**:

- Scalable modular structure (nest modules)
- Dependency injection (IOC container)
- Built-in validation, logging, security
- WebSocket support (real-time inventory)
- GraphQL optional (future)
- Better TypeScript integration

### NestJS Folder Structure

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── auth.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── validation.decorator.ts
│   │   │   └── transform.decorator.ts
│   │   │
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── validation.filter.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── rate-limit.guard.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   ├── timeout.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   │
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   └── transform.pipe.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── logger.middleware.ts
│   │   │   └── correlation.middleware.ts
│   │   │
│   │   └── constants.ts
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   ├── telegram.config.ts
│   │   └── payment.config.ts
│   │
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── orm.config.ts        # TypeORM config
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── dtos/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   └── entities/
│   │   │
│   │   ├── products/
│   │   │   ├── products.module.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.repository.ts
│   │   │   ├── dtos/
│   │   │   │   ├── create-product.dto.ts
│   │   │   │   └── update-product.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── product.entity.ts
│   │   │   │   └── product-variant.entity.ts
│   │   │   └── cache/
│   │   │       └── products.cache.service.ts
│   │   │
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.repository.ts
│   │   │   ├── events/
│   │   │   │   ├── order-created.event.ts
│   │   │   │   ├── order-paid.event.ts
│   │   │   │   ├── order-shipped.event.ts
│   │   │   │   └── order-delivered.event.ts
│   │   │   ├── listeners/
│   │   │   │   ├── order-created.listener.ts
│   │   │   │   └── order-paid.listener.ts
│   │   │   ├── dtos/
│   │   │   └── entities/
│   │   │
│   │   ├── payment/
│   │   │   ├── payment.module.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── providers/
│   │   │   │   ├── vietqr.provider.ts
│   │   │   │   ├── usdt.provider.ts
│   │   │   │   ├── casso.provider.ts
│   │   │   │   └── card.provider.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── casso.webhook.ts
│   │   │   │   └── tron.webhook.ts
│   │   │   └── entities/
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── dtos/
│   │   │   └── entities/
│   │   │
│   │   ├── affiliate/
│   │   │   ├── affiliate.module.ts
│   │   │   ├── affiliate.controller.ts
│   │   │   ├── affiliate.service.ts
│   │   │   ├── events/
│   │   │   │   └── commission-earned.event.ts
│   │   │   └── entities/
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dtos/
│   │   │
│   │   ├── telegram/
│   │   │   ├── telegram.module.ts
│   │   │   ├── telegram.controller.ts
│   │   │   ├── telegram.service.ts
│   │   │   ├── handlers/
│   │   │   │   ├── start.handler.ts
│   │   │   │   ├── products.handler.ts
│   │   │   │   └── order.handler.ts
│   │   │   └── listeners/
│   │   │       ├── order-paid.listener.ts
│   │   │       └── delivery.listener.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── cache/
│   │   │   │   └── analytics.cache.service.ts
│   │   │   └── events/
│   │   │
│   │   ├── websocket/
│   │   │   ├── websocket.module.ts
│   │   │   ├── websocket.gateway.ts
│   │   │   ├── inventory.gateway.ts
│   │   │   └── notification.gateway.ts
│   │   │
│   │   └── jobs/
│   │       ├── jobs.module.ts
│   │       ├── tasks/
│   │       │   ├── inventory-alert.task.ts
│   │       │   ├── daily-report.task.ts
│   │       │   ├── cache-warm.task.ts
│   │       │   └── order-cleanup.task.ts
│   │       └── processors/
│   │
│   ├── events/                  # Global event bus
│   │   ├── event-emitter.service.ts
│   │   └── event-listener.ts
│   │
│   ├── cache/                   # Redis + memory cache
│   │   ├── redis.service.ts
│   │   ├── cache.decorator.ts
│   │   └── cache.strategy.ts
│   │
│   └── shared/
│       ├── entities/
│       │   ├── base.entity.ts    # Audit fields: createdAt, updatedAt, createdBy
│       │   └── soft-delete.entity.ts
│       ├── dtos/
│       │   └── pagination.dto.ts
│       ├── utils/
│       │   ├── encryption.ts
│       │   ├── token.ts
│       │   └── validators.ts
│       └── services/
│           └── notification.service.ts
│
├── migrations/
├── seeders/
├── test/
├── docker-compose.yml
├── Dockerfile
└── package.json
```

### Key Architectural Improvements

**1. Event-Driven Order Processing**

```typescript
// Orders flow through events, enabling async processing
OrderCreatedEvent
  → PaymentInitiatedEvent
  → PaymentConfirmedEvent
  → OrderPaidEvent
    → TelegramNotificationEvent (async)
    → InventoryUpdateEvent (async)
    → CommissionEarnedEvent (affiliate)
    → AutoDeliveryEvent (async, sends via email + telegram)
```

**2. Redis Caching Strategy**

- Hot products cached 1 hour
- Category listings cached 30 min
- User balance cached 5 min (invalidated on order)
- Admin analytics cached 15 min
- Session data in Redis (distributed)

**3. Real-Time Inventory via WebSocket**

- Admin broadcasts inventory updates
- Clients receive live stock changes
- Auto-disable buy button at 0 stock
- Notify clients when item back in stock

**4. Rate Limiting & Security**

- Per-user, per-IP rate limits
- Webhook signature validation
- JWT refresh token rotation
- Helmet.js security headers
- CORS whitelist

---

## Design System

### Color Palette (CSS Variables)

```css
/* styles/tokens.css */

:root {
  /* Dark Mode (Primary) */
  --color-bg-primary: #0a0e27;
  --color-bg-secondary: #121829;
  --color-bg-tertiary: #1a202f;
  --color-bg-hover: #232e48;

  /* Neon Accents (Cyberpunk) */
  --color-neon-cyan: #00d4ff;
  --color-neon-magenta: #ff006e;
  --color-neon-purple: #a855f7;
  --color-neon-blue: #0ea5e9;
  --color-neon-green: #10b981;
  --color-neon-yellow: #fbbf24;
  --color-neon-red: #ef4444;

  /* Glass & Borders */
  --color-glass-light: rgba(255, 255, 255, 0.1);
  --color-glass-lighter: rgba(255, 255, 255, 0.05);
  --color-border: rgba(255, 255, 255, 0.15);
  --color-border-subtle: rgba(255, 255, 255, 0.08);

  /* Text */
  --color-text-primary: #f5f7fa;
  --color-text-secondary: #b8c1d4;
  --color-text-tertiary: #8a96aa;
  --color-text-disabled: #5f6b7f;

  /* Status Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Shadows (Glow effects) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.2);

  /* Neon Glows */
  --glow-sm: 0 0 10px rgba(0, 212, 255, 0.3);
  --glow-md: 0 0 20px rgba(0, 212, 255, 0.5);
  --glow-lg: 0 0 30px rgba(0, 212, 255, 0.7);
  --glow-magenta: 0 0 20px rgba(255, 0, 110, 0.5);

  /* Typography */
  --font-family-sans:
    "Inter", "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  --font-family-mono: "JetBrains Mono", "Fira Code", monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 2.5rem;
  --spacing-3xl: 3rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;
  --radius-full: 9999px;

  /* Transitions */
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-color-scheme: light) {
  :root {
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f8fafb;
    --color-bg-tertiary: #f0f3f9;
    --color-text-primary: #0f172a;
    --color-text-secondary: #475569;
    --color-text-tertiary: #64748b;
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-base: 0ms;
    --duration-slow: 0ms;
  }
}
```

### Reusable Component Patterns

**Button Variants**:

```css
.btn-primary {
  @apply px-4 py-2 rounded-lg font-semibold text-white bg-neon-cyan text-black;
  @apply hover:shadow-lg hover:shadow-neon-cyan/50 transition-all duration-200;
}

.btn-ghost {
  @apply px-4 py-2 rounded-lg font-semibold text-text-secondary border border-border;
  @apply hover:bg-glass-light hover:text-text-primary transition-all duration-200;
}

.btn-glow {
  @apply px-4 py-2 rounded-lg font-semibold text-neon-magenta border border-neon-magenta;
  @apply shadow-glow-magenta hover:shadow-lg hover:shadow-magenta/50;
  @apply transition-all duration-200;
}

.btn-loading {
  @apply opacity-60 pointer-events-none;
}
```

**Glass Morphism**:

```css
.glass {
  @apply bg-glass-light backdrop-blur-xl border border-border rounded-xl;
  @apply transition-all duration-200;
}

.glass-hover:hover {
  @apply bg-glass-light border-border-subtle shadow-lg;
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Set up NestJS backend structure with TypeORM
- [ ] Create frontend folder structure + Zustand stores
- [ ] Build common UI components library
- [ ] Design tokens + Tailwind config

### Phase 2: Core Features (Weeks 3-4)

- [ ] Redesign auth pages (login, register, telegram link)
- [ ] Rebuild storefront (hero, product grid, search, categories)
- [ ] Implement cart system (drawer, persist)
- [ ] Build multi-step checkout (3 pages)

### Phase 3: Dashboards (Weeks 5-6)

- [ ] User dashboard (orders, affiliate, settings)
- [ ] Admin dashboard (overview, tables, charts)
- [ ] Real-time inventory indicators
- [ ] Analytics & reporting

### Phase 4: Integrations (Week 7)

- [ ] Payment providers (VietQR, USDT, card)
- [ ] Telegram bot redesign
- [ ] Email templates redesign
- [ ] WebSocket real-time updates

### Phase 5: Polish & Optimization (Week 8)

- [ ] Performance optimization (code splitting, lazy loading)
- [ ] E2E testing
- [ ] Security audit
- [ ] Accessibility review (WCAG 2.1 AA)

---

## Migration Strategy

### Express → NestJS Path

**Stage 1: Parallel Run (1 week)**

- Both servers run on different ports
- Frontend can switch via ENV flag
- Gradually migrate endpoints

**Stage 2: Feature Parity (2 weeks)**

- All endpoints migrated to NestJS
- Old Express endpoints deprecated
- Database migration complete

**Stage 3: Cutover (1 day)**

- Scheduled downtime (2 AM - 6 AM)
- Final data sync
- DNS switch to NestJS

**Database Migration**:

```bash
# Express (MongoDB) → NestJS (PostgreSQL)
npx typeorm migration:generate -n InitialSchema
npm run migration:run

# Seed data:
npm run seed
```

---

## Next Steps

1. **Approve design system** (colors, typography, spacing)
2. **Review component hierarchy** (which to build first)
3. **Choose state management** (Zustand vs Redux)
4. **Select database** (PostgreSQL confirmed, or add Redis)
5. **Begin Phase 1** (start with NestJS setup + UI components)

---

**Deliverables**:

- ✅ Folder structure (FE & BE)
- ✅ Component hierarchy
- ✅ Design tokens
- ✅ Architecture diagrams
- 🔜 Production components (next message)
- 🔜 Backend setup guide
- 🔜 Migration scripts
