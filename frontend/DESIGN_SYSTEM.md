# MMO Store - Premium SaaS Design System

## Overview

This document outlines the premium SaaS-level design system implemented for the MMO Store digital marketplace.

## Design System Architecture

### Color Palette

| Name | Hex Code | Usage |
|------|----------|-------|
| Background Primary | `#0A0A0A` | Main background |
| Background Secondary | `#111111` | Card backgrounds |
| Background Tertiary | `#161616` | Input backgrounds |
| Border | `#1E1E1E` | Default borders |
| Border Hover | `#2A2A2A` | Hover state borders |
| Primary | `#3B82F6` | Primary actions, links |
| Success | `#22C55E` | Success states |
| Danger | `#EF4444` | Error, danger states |
| Warning | `#F59E0B` | Warning states |
| Text Primary | `#FFFFFF` | Primary text |
| Text Secondary | `#A1A1AA` | Secondary text |
| Text Tertiary | `#71717A` | Muted text |

### Typography

- **Font Family**: Inter (sans-serif), JetBrains Mono (monospace)
- **Base Size**: 16px
- **Scale**: 2xs → 7xl

### Spacing

Consistent 4px base grid system.

### Border Radius

- `sm`: 8px
- `DEFAULT`: 12px
- `lg`: 16px
- `xl`: 20px
- `2xl`: 24px

## Folder Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                 # Design system components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Drawer.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── CommandPalette.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── index.js
│   │   └── layout/             # Layout components
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       ├── Layout.jsx
│   │       ├── CartDrawer.jsx
│   │       └── index.js
│   ├── pages/                  # Page components
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Wishlist.jsx
│   │   ├── Licenses.jsx
│   │   ├── Support.jsx
│   │   ├── Checkout.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── store/
│   │   └── index.js           # Zustand stores
│   ├── api/
│   │   └── index.js           # API modules
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css              # Global styles
├── tailwind.config.js
└── package.json
```

## Component Library

### Core Components

| Component | Description |
|-----------|-------------|
| Button | Primary UI element with variants (primary, secondary, ghost, danger, success, warning, outline) |
| Input | Text input with validation states, icons |
| Select | Dropdown selection |
| Badge | Status indicators |
| Card | Container with hover effects |
| Modal | Dialog overlay |
| Drawer | Slide-in panel |
| Tabs | Tab navigation |
| Table | Data table with loading states |
| Pagination | Page navigation |
| Skeleton | Loading placeholders |
| CommandPalette | Search/command overlay |
| Toast | Notification system |

## Features Implemented

### 1. Landing Page
- Hero section with animated background
- Stats section
- Featured products grid
- Category browsing
- Why Choose Us section
- How It Works
- Testimonials
- FAQ accordion
- CTA banner
- Trust badges

### 2. Marketplace
- Advanced product filtering (category, price, sort)
- Search functionality
- Infinite scroll pagination
- Wishlist toggle
- Add to cart
- Share functionality

### 3. Product Detail
- Image gallery with thumbnails
- Product information display
- Rating and reviews
- Tabs (Description, Features, Reviews, Changelog)
- Sticky purchase panel
- Related products

### 4. Checkout
- Multi-payment support (VietQR, USDT)
- Coupon application
- Order summary
- Real-time payment polling
- Payment instructions

### 5. Dashboard
- Overview with stats
- Recent orders
- Affiliate program
- Settings management

### 6. Licenses
- License key display
- Copy to clipboard
- Download access
- Expiration tracking

### 7. Support Center
- Ticket creation
- Conversation view
- Status tracking
- Reply functionality

### 8. Wishlist
- Save products
- Move to cart
- Quick remove

## State Management

### Zustand Stores

```javascript
useCartStore     // Cart management with persistence
useWishlistStore // Wishlist management with persistence
useUIStore       // UI state (sidebar, theme, etc.)
```

## Animations

- Page transitions with Framer Motion
- Hover effects on cards
- Loading skeletons
- Toast notifications
- Drawer slide animations

## Performance

- Route lazy loading with React.lazy
- Code splitting
- Optimized bundle sizes
- Image lazy loading

## API Integration

All pages are connected to the backend APIs:
- Products API
- Orders API
- Cart API
- Wishlist API
- Licenses API
- Tickets API
- Affiliate API
- Auth API

## Running the Application

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Preview production
npm run preview
```

## Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
```
