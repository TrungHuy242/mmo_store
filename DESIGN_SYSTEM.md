# Design System & Style Guide - MMO Store Premium Edition

## Visual Identity

### Color Palette

#### Primary Neon Accents (Cyberpunk Theme)

```css
--neon-cyan: #00d4ff /* Primary CTA, highlights, focus states */
  --neon-magenta: #ff006e /* Secondary, emphasis, sale badges */
  --neon-purple: #a855f7 /* Tertiary, gradients */ --neon-blue: #0ea5e9
  /* Info, secondary actions */ --neon-green: #10b981
  /* Success, positive states */ --neon-yellow: #fbbf24
  /* Warnings, time-limited offers */ --neon-red: #ef4444
  /* Errors, danger, critical */;
```

#### Dark Mode Background Layers

```css
--bg-primary: #0a0e27 /* Main background */ --bg-secondary: #121829
  /* Cards, panels */ --bg-tertiary: #1a202f /* Nested elements, hover states */
  --bg-hover: #232e48 /* Interactive hover */;
```

#### Neutral Text

```css
--text-primary: #f5f7fa /* Main text, headings */ --text-secondary: #b8c1d4
  /* Descriptions, labels */ --text-tertiary: #8a96aa /* Disabled, inactive */
  --text-disabled: #5f6b7f /* Placeholder text */;
```

#### Glass & Borders

```css
--glass-light: rgba(255, 255, 255, 0.1) /* Frosted glass */
  --glass-lighter: rgba(255, 255, 255, 0.05) /* Light glass */
  --border: rgba(255, 255, 255, 0.15) /* Default border */
  --border-subtle: rgba(255, 255, 255, 0.08) /* Subtle dividers */;
```

### Typography

#### Font Families

```css
/* Body & UI */
font-family:
  "Inter",
  "Manrope",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
/* Monospace (Code, prices) */
font-family: "JetBrains Mono", "Fira Code", monospace;
```

#### Scale

```css
/* Hierarchy (px) */
--text-xs: 12px; /* Captions, badges */
--text-sm: 14px; /* Descriptions, secondary */
--text-base: 16px; /* Body text, default */
--text-lg: 18px; /* Subheadings */
--text-xl: 20px; /* Section titles */
--text-2xl: 24px; /* Large titles */
--text-3xl: 30px; /* Major headings */
--text-4xl: 36px; /* Hero headings */

/* Font Weights */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

#### Line Heights

```css
--lh-tight: 1.2; /* Headings */
--lh-normal: 1.5; /* Body */
--lh-relaxed: 1.75; /* Long-form text */
```

### Spacing System

```css
/* 8px grid system */
--spacing-xs: 0.25rem (4px) --spacing-sm: 0.5rem (8px) --spacing-md: 1rem (16px)
  --spacing-lg: 1.5rem (24px) --spacing-xl: 2rem (32px) --spacing-2xl: 2.5rem
  (40px) --spacing-3xl: 3rem (48px) /* Usage */ padding: var(--spacing-md)
  var(--spacing-lg); /* 16px 24px */
margin-bottom: var(--spacing-xl); /* 32px */
```

### Radius

```css
--radius-sm: 6px /* Small elements */ --radius-md: 8px /* Buttons, inputs */
  --radius-lg: 12px /* Cards, modals */ --radius-xl: 16px /* Large containers */
  --radius-2xl: 20px /* Hero sections */ --radius-full: 9999px
  /* Pills, avatars */;
```

### Shadows & Glows

```css
/* Subtle shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.2);

/* Neon glows */
--glow-sm: 0 0 10px rgba(0, 212, 255, 0.3);
--glow-md: 0 0 20px rgba(0, 212, 255, 0.5);
--glow-lg: 0 0 30px rgba(0, 212, 255, 0.7);
--glow-magenta: 0 0 20px rgba(255, 0, 110, 0.5);

/* Usage for interactive elements */
box-shadow: var(--shadow-md);
&:hover {
  box-shadow: var(--glow-md);
}
```

### Transitions

```css
--duration-fast: 150ms /* Micro-interactions */ --duration-base: 300ms
  /* Standard transitions */ --duration-slow: 500ms /* Elaborate animations */
  --easing-in: cubic-bezier(0.4, 0, 1, 1); /* Entering */
--easing-out: cubic-bezier(0, 0, 0.2, 1); /* Exiting */
--easing-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* Smooth */
```

---

## Component Specifications

### Buttons

#### Primary Button

```jsx
<Button variant="primary" size="md" fullWidth={false}>
  Label
</Button>
```

**Styles**:

- Background: `--neon-cyan`
- Text: `--bg-primary` (dark text)
- Glow: `box-shadow: var(--glow-md);`
- Hover: `scale: 1.02, shadow: var(--glow-lg)`
- Active: `scale: 0.98`
- Disabled: `opacity: 0.5, pointer-events: none`

#### Ghost Button

```jsx
<Button variant="ghost" size="md">
  Label
</Button>
```

**Styles**:

- Background: transparent
- Border: `1px solid var(--border)`
- Text: `--text-secondary`
- Hover: `background: var(--glass-light), border: var(--border-subtle)`

#### Glow Button (Sale/Special)

```jsx
<Button variant="glow" size="md">
  Special Offer
</Button>
```

**Styles**:

- Background: `rgba(255, 0, 110, 0.1)`
- Border: `1px solid var(--neon-magenta)`
- Text: `var(--neon-magenta)`
- Glow: `box-shadow: var(--glow-magenta)`

#### Sizes

- `sm`: `px-3 py-1.5 text-sm`
- `md`: `px-4 py-2 text-base`
- `lg`: `px-6 py-3 text-lg`

### Cards

#### Glass Card

```jsx
<Card variant="glass">Content</Card>
```

**Styles**:

```css
background: var(--glass-light);
backdrop-filter: blur(24px);
border: 1px solid var(--border);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-glass);
padding: var(--spacing-lg);
```

#### Elevated Card

```jsx
<Card variant="elevated">Content</Card>
```

**Styles**:

```css
background: var(--bg-secondary);
border: 1px solid var(--border);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-lg);
padding: var(--spacing-lg);
```

### Inputs

#### Text Input

```jsx
<Input
  label="Email"
  placeholder="your@email.com"
  icon={EmailIcon}
  error="Invalid email"
/>
```

**Styles**:

```css
background: var(--bg-secondary);
border: 1px solid var(--border);
border-radius: var(--radius-md);
color: var(--text-primary);
padding: var(--spacing-md) var(--spacing-lg);

&:focus {
  outline: none;
  ring: 2px;
  ring-color: var(--neon-cyan);
  border: transparent;
}

&:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Badges

#### Success Badge

```jsx
<Badge variant="success" size="md">
  Completed
</Badge>
```

**Styles**:

```css
background: rgba(16, 185, 129, 0.1);
border: 1px solid rgba(16, 185, 129, 0.3);
color: var(--neon-green);
padding: var(--spacing-sm) var(--spacing-md);
border-radius: var(--radius-full);
font-size: var(--text-sm);
font-weight: var(--weight-semibold);
```

#### Sale Badge (Glow)

```jsx
<Badge variant="sale" size="md">
  -30%
</Badge>
```

**Styles**:

```css
background: rgba(255, 0, 110, 0.2);
border: 1px solid rgba(255, 0, 110, 0.5);
color: var(--neon-magenta);
box-shadow: var(--glow-magenta);
animation: pulse-glow 2s infinite;
```

### Animations

#### Fade In

```css
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
animation: fade-in var(--duration-base) var(--easing-out);
```

#### Slide In (Right)

```css
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
animation: slide-in-right var(--duration-base) var(--easing-out);
```

#### Pulse Glow

```css
@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.8);
  }
}
animation: pulse-glow var(--duration-slow) ease-in-out infinite;
```

#### Float

```css
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
animation: float 3s ease-in-out infinite;
```

#### Shimmer (Skeleton)

```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
background: linear-gradient(
  90deg,
  var(--bg-secondary) 0%,
  var(--bg-tertiary) 50%,
  var(--bg-secondary) 100%
);
background-size: 1000px 100%;
animation: shimmer 2s infinite;
```

---

## Page Layouts

### Homepage Layout

```
┌─────────────────────────────────────┐
│           Navbar                    │
├─────────────────────────────────────┤
│                                     │
│         Hero Section                │
│     (CTA, Search, Categories)       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Featured Products Grid         │
│     (4 columns on desktop)          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Flash Sale Banner              │
│    (Animated countdown timer)       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Product Recommendations        │
│     (Horizontal scroll on mobile)   │
│                                     │
├─────────────────────────────────────┤
│           Footer                    │
└─────────────────────────────────────┘
```

### Dashboard Layout

```
┌─────────────────────────────────────┐
│      Navbar + Sidebar Toggle        │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │    Main Content          │
│          │   (Stats, Orders, etc.)  │
│ (Sticky) │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

---

## Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }

/* Grid Columns */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

1. **Color Contrast**: All text ≥ 4.5:1 ratio

   ```css
   color: #f5f7fa; /* Primary text on dark */
   background: #0a0e27;
   /* Contrast ratio: ~16:1 ✓ */
   ```

2. **Focus States**: Visible focus ring on all interactive elements

   ```css
   &:focus {
     outline: 2px solid var(--neon-cyan);
     outline-offset: 2px;
   }
   ```

3. **Keyboard Navigation**: All interactive elements accessible via Tab
   - Buttons, links, inputs, dropdowns
   - Logical tab order

4. **Reduced Motion**: Respect `prefers-reduced-motion`

   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

5. **Semantic HTML**: Use proper heading hierarchy (h1 → h6), `<label>` for inputs, `<button>` for buttons

6. **ARIA**: Use `aria-label`, `aria-describedby`, `aria-live` when needed

   ```jsx
   <div aria-live="polite" aria-label="Shopping cart">
     Items: 3
   </div>
   ```

7. **Screen Reader**: All images have descriptive `alt` text

---

## Performance Targets

| Metric                             | Target            |
| ---------------------------------- | ----------------- |
| **LCP** (Largest Contentful Paint) | < 1s              |
| **FID** (First Input Delay)        | < 100ms           |
| **CLS** (Cumulative Layout Shift)  | < 0.1             |
| **TTI** (Time to Interactive)      | < 3s              |
| **Bundle Size**                    | < 200KB (gzipped) |
| **Core Web Vitals**                | All green         |

### Optimization Strategies

1. **Code Splitting**: Lazy load heavy pages

   ```jsx
   const Admin = lazy(() => import("./pages/Admin"));
   <Suspense fallback={<Spinner />}>
     <Admin />
   </Suspense>;
   ```

2. **Image Optimization**: WebP with fallbacks

   ```jsx
   <picture>
     <source srcSet="image.webp" type="image/webp" />
     <source srcSet="image.jpg" type="image/jpeg" />
     <img src="image.jpg" alt="description" />
   </picture>
   ```

3. **CSS-in-JS Minimization**: Use Tailwind purge in production
   ```javascript
   // tailwind.config.js
   content: ['./src/**/*.{js,jsx,ts,tsx}'],
   ```

---

## Dark Mode

All colors defined as CSS variables automatically support dark mode via `.dark` class:

```html
<!-- HTML -->
<html class="dark">
  <body>
    <!-- Automatically uses dark colors -->
  </body>
</html>
```

```css
/* CSS Media Query (System Preference) */
@media (prefers-color-scheme: dark) {
  :root {
    /* Already dark by default */
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --color-bg-primary: #ffffff;
    --color-text-primary: #0f172a;
    /* Light mode overrides */
  }
}
```

---

## Implementation Checklist

- [ ] Install Tailwind CSS + plugins
- [ ] Configure design tokens in CSS variables
- [ ] Create Tailwind config with custom colors
- [ ] Build component library (Button, Card, Input, etc.)
- [ ] Set up Framer Motion animations
- [ ] Configure responsive breakpoints
- [ ] Test accessibility (axe DevTools, Lighthouse)
- [ ] Optimize images (WebP, lazy loading)
- [ ] Bundle size audit (Webpack Bundle Analyzer)
- [ ] Dark mode testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (iPhone, Android)

---

**Design System Version**: 1.0
**Last Updated**: 2024
**Status**: Ready for Implementation
