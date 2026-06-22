# MMO Store - Design Specification

## Overview
MMO Store is a digital products marketplace with dark theme, modern UI, and automated delivery.

## Color Palette
- Background Dark: #0a0a12
- Surface Dark: #12121f
- Primary (Neon Cyan): #22d3ee
- Secondary (Neon Magenta): #e635c5
- Accent Gold: #fbbf24
- Accent Green: #10b981
- Text Primary: #ffffff
- Text Secondary: #9ca3af
- Text Muted: #6b7280
- Border: rgba(255, 255, 255, 0.1)
- Border Hover: rgba(255, 255, 255, 0.2)

## Typography
- Font Family: Be Vietnam Pro, system-ui, sans-serif
- Headings: Bold, white
- Body: Regular, gray-300
- Labels: Medium, gray-400

## Spacing System
- Base unit: 4px
- Container max-width: 1280px
- Card padding: 24px
- Gap between cards: 16px
- Border radius: 16px (cards), 12px (buttons), 8px (inputs)

## Screens

### 1. Home Page
```
Layout:
- Sticky navbar (glassmorphism, 12px padding, mx-3)
- Hero section (glass, gradient bg, centered text)
- Filter bar (glass, search + category pills)
- Product grid (4-col desktop, 2-col mobile)
- Footer (glass, mx-3)

Navbar:
- Logo: "MMO" in cyan + "Store" in magenta, bold 20px
- Nav links: white, hover cyan
- User area: avatar circle or login/register buttons

Hero:
- Headline: "CHỢ SẢN PHẨM MMO UY TÍN" 48px bold white
- Subtitle: "Tài khoản, proxy, tool, thẻ cào, khóa học..." 18px gray-400
- Feature badges: 3 horizontal badges with icons

Product Card:
- Width: full column
- Image: aspect-video, object-cover, rounded-top-16px
- Badge overlay: FLASH SALE (magenta), stock counter (dark)
- Title: 16px semibold white, 2-line clamp
- Description: 12px gray-400, 2-line clamp
- Price: cyan, 18px bold (sale: gold + strikethrough)
- Button: "MUA NGAY" cyan border, hover fill
```

### 2. Login Page
```
Layout: centered, max-width 400px, mt-10
Card: glass, p-8, rounded-16px

Header:
- Icon: shield/lock, 48px, gradient cyan-magenta circle
- Title: "Đăng nhập" 24px bold
- Subtitle: "Chào mừng trở lại" 14px gray-400

Form fields:
- Email: input with envelope icon prefix
- Password: input with lock icon prefix, show/hide toggle

Submit button:
- Full width, "Đăng nhập", cyan gradient, py-3

Footer:
- "Chưa có tài khoản? Đăng ký" link magenta

Demo hint box: gray-500 text, email/password
```

### 3. Register Page
```
Similar to login
- Plus icon for header
- "Tạo tài khoản mới"
- Extra field: Display name
- Password strength meter (4 bars: red/orange/yellow/green)
- Referral banner if ref param present
- Terms text at bottom
```

### 4. Checkout Page
```
Layout: max-width 600px, centered

Product info card:
- Left: product image
- Right: name, category badge, price (large cyan)

Payment methods (2x2 grid):
- Balance (wallet icon) - default selected
- VietQR (QR code icon)
- USDT (crypto icon)
- Card (phone icon)

Selected method: cyan border glow

VietQR view:
- QR code image centered
- Amount display (large)
- Bank account card
- Order code in gold monospace
- Auto-confirm notice

USDT view:
- Wallet address display
- Check payment button

Card view:
- Telco dropdown
- Card code input
- Serial input
- Submit button
```

### 5. Dashboard Page (User Account)
```
Layout: space-y-6

Stats row (3 cards):
- Card 1: Số dư - wallet icon - cyan value
- Card 2: Hoa hồng - coins icon - gold value
- Card 3: Người giới thiệu - users icon - magenta value

Affiliate section:
- Card glass
- Label "Link giới thiệu của bạn"
- Read-only input with copy button

Withdraw section:
- Amount input + bank account input
- "Rút tiền" button gold

Orders table:
- Headers: Mã, Sản phẩm, Tiền, Trạng thái
- Status badges: yellow/cyan/green/red
- Empty state: bag icon + "Chưa có đơn hàng"
```

### 6. Admin - Dashboard Tab
```
Stats row (4 cards):
- Tổng đơn hàng (cyan)
- Doanh thu (gold)
- Người dùng (magenta)
- Sản phẩm (green)

Recent activity:
- Timeline of recent orders
- Avatar, email, product, amount, time
```

### 7. Admin - Orders Tab
```
Table with columns: Mã, Khách, Sản phẩm, Tiền, Thanh toán, Trạng thái, Hành động
- Export Excel button top right
- Row hover highlight
- Action: "Xác nhận" link
- Status badge colors
```

### 8. Admin - Products Tab
```
Add product form card:
- Grid 3-col: name, price, category
- 2-col: delivery type, image URL
- Full width: description
- Full width: stock textarea
- "Tạo sản phẩm" button

Products table:
- Columns: Tên, Danh mục, Giá, Kho, Hành động
- Stock badge: green >5, yellow <5, red 0
- Action: "Nạp kho" link
```

### 9. Admin - Categories Tab
```
Add category card:
- Name input + emoji picker
- "Tạo" button

Category grid (4-col):
- Emoji + name card
- Hover: edit/delete
```

### 10. Admin - Users Tab
```
Users table:
- Avatar + email
- Name
- Role badge (admin: gold, user: gray)
- Balance (cyan)
- Commission (gold)
- Telegram link indicator
- Action: "Sửa số dư" link
```

### 11. Admin - Broadcast Tab
```
Telegram icon header
Large textarea for message
Character counter
"Gửi thông báo" button magenta
```

## Components

### Button Variants
- Primary: cyan border, cyan text, hover fill
- Secondary: magenta border, magenta text, hover fill
- Gold: gold border, gold text, hover fill
- Ghost: transparent, white text, hover bg-white/5

### Input
- Dark surface background
- White/10 border
- Focus: cyan border, ring
- Rounded 12px, py-3

### Card (Glass)
- Background: white/5
- Backdrop blur
- Border: white/10
- Rounded 16px
- Shadow: 0 8px 32px rgba(0,0,0,0.3)

### Badge
- Rounded 8px
- Variants: cyan, magenta, gold, success (green), warning (yellow), danger (red)

### Toast
- Dark card with colored icon
- Success: cyan checkmark
- Error: red X
- Position: top-right

## Animations
- Page transitions: fade + slide, 300ms
- Card hover: translateY(-4px), scale(1.02), 200ms spring
- Button hover: scale(0.98), shadow increase
- Loading: pulse animation
- Skeleton: shimmer gradient animation
