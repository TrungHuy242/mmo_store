# STITCH PROMPTS - MMO STORE

Sao chép từng prompt bên dưới và paste vào Stitch (studio.google.com/stitch).

---

## SCREEN 1: HOME PAGE - PRODUCT LISTING

```
Design a modern e-commerce dark theme home page for MMO digital products marketplace.

Color Palette:
- Background: #0a0a12 (dark black)
- Surface: #12121f (slightly lighter)
- Primary: #22d3ee (neon cyan)
- Secondary: #e635c5 (neon magenta)
- Accent Gold: #fbbf24
- Text: #ffffff (white)
- Border: rgba(255,255,255,0.1)

Typography: Be Vietnam Pro font, clean modern style

Sections (top to bottom):
1. STICKY NAVBAR: Glassmorphism effect, backdrop blur, border white/10. Left: Logo "MMO" in cyan + "Store" in magenta bold 20px. Center: Nav links with icons (Trang chủ, Tài khoản, Quản trị). Right: "Đăng nhập" ghost button + "Đăng ký" cyan button.

2. HERO SECTION: Full-width glass card with gradient radial glow background (cyan top-left, magenta bottom-right). Centered content: Headline "CHỢ SẢN PHẨM MMO UY TÍN" 48px bold white. Subtitle "Tài khoản, proxy, tool, thẻ cào, khóa học... Giao hàng tự động 24/7" 18px gray-400. Three horizontal feature badges with icons: "Giao hàng tự động" (lightning icon), "Bảo mật cao" (shield icon), "Hỗ trợ Affiliate 10%" (gift icon).

3. FILTER BAR: Glass card, flex row. Left: Search input with magnifying glass icon, full width, dark surface bg, white text, white/10 border, rounded 12px. Right: Sort dropdown (default options).

4. CATEGORY PILLS: Horizontal scrollable row. Pills with white border, rounded 999px, hover fill cyan. Categories: Tất cả, Tài khoản, Proxy, Tool, Thẻ cào, Khóa học, Data.

5. PRODUCT GRID: 4-column responsive grid (2-col tablet, 1-col mobile). Each product card:
   - Glass card, rounded 16px, overflow hidden
   - Product image (picsum placeholder 400x300), object-cover
   - Overlay badges top-left: "FLASH SALE" magenta badge, "-20%" red badge rotated
   - Top-right: Stock counter badge "Kho: 15" dark bg
   - Content padding 16px
   - Category: small cyan text "Proxy"
   - Title: 16px semibold white, 2-line clamp
   - Description: 12px gray-400, 2-line clamp
   - Price row: Original "250,000đ" gray strikethrough + Sale "200,000đ" gold bold
   - Bottom: "MUA NGAY" button full width, cyan border, hover fill cyan

6. FOOTER: Glass card, mx-3 mb-3. Logo left, "MMO Store © 2026" gray text. Links right: Điều khoản, Chính sách, Hỗ trợ. Row below: payment icons (Visa, Mastercard, bank icons).

Device: DESKTOP (1440px width)
```

---

## SCREEN 2: LOGIN PAGE

```
Design a modern dark theme login page for MMO digital products store.

Colors:
- Background: #0a0a12
- Surface: #12121f
- Primary: #22d3ee (neon cyan)
- Secondary: #e635c5 (neon magenta)
- Text: #ffffff
- Muted: #6b7280
- Border: rgba(255,255,255,0.1)

Typography: Be Vietnam Pro

Layout:
- Full page dark background with subtle radial gradient glow
- Centered card, max-width 420px
- Card: glassmorphism, bg white/5, backdrop blur, border white/10, rounded 16px, p-8

Card content (top to bottom):
1. Icon: Shield/lock icon in 48px circle, gradient bg from cyan to magenta, centered
2. Title: "Đăng nhập" 24px bold white, centered, mb-2
3. Subtitle: "Chào mừng trở lại" 14px gray-400, centered, mb-8

4. Email field:
   - Label "Email" 14px medium gray-300, mb-2
   - Input: dark surface bg, white/10 border, rounded 12px, h-12
   - Left icon: envelope icon gray-500
   - Placeholder: "Nhập email của bạn" gray-500
   - Focus: cyan border glow

5. Password field (mt-4):
   - Label "Mật khẩu" 14px medium gray-300, mb-2
   - Input: same style as email
   - Left icon: lock icon gray-500
   - Right: show/hide eye icon gray-500, toggleable
   - Placeholder: "Nhập mật khẩu"

6. Submit button (mt-6):
   - Full width, h-12, rounded 12px
   - "Đăng nhập" 16px semibold
   - Cyan border, cyan text, bg transparent
   - Hover: bg cyan/20, shadow glow cyan
   - Loading: spinner + "Đang xử lý..."

7. Demo hint box (mt-4):
   - Small card, bg white/5, border white/10, rounded 12px, p-3
   - Gray-500 text, centered: "Demo: admin@mmostore.com / Admin@12345"

8. Footer link (mt-6):
   - Centered text: "Chưa có tài khoản?"
   - Link: "Đăng ký ngay" magenta color

Device: DESKTOP
```

---

## SCREEN 3: REGISTER PAGE

```
Design a modern dark theme registration page for MMO digital products store.

Colors: Same as login page (dark #0a0a12, cyan #22d3ee, magenta #e635c5)

Layout: Same centered card as login, max-width 420px

Card content:
1. Icon: Plus in circle icon, 48px, gradient cyan-magenta, centered
2. Title: "Tạo tài khoản mới" 24px bold white
3. Subtitle: "Đăng ký để bắt đầu mua sắm" 14px gray-400

4. Name field:
   - Label "Tên hiển thị" 14px gray-300
   - Input with user icon left

5. Email field:
   - Label "Email" 14px gray-300
   - Input with envelope icon left

6. Password field:
   - Label "Mật khẩu" 14px gray-300
   - Input with lock icon left, eye toggle right

7. Password strength meter (below password input):
   - 4 horizontal bars, each representing strength level
   - Colors: red (weak), orange, yellow, green (strong)
   - Label below: "Yếu" / "Trung bình" / "Khá" / "Mạnh" / "Rất mạnh"
   - Show when typing

8. Submit button:
   - "Tạo tài khoản" magenta border and text
   - Hover: bg magenta/20

9. Referral banner (if applicable):
   - Small gold banner: "Bạn được giới thiệu - Hoa hồng 10%!" with gift icon

10. Terms text (mt-4):
    - Centered, 12px gray-500
    - "Bằng việc đăng ký, bạn đồng ý với Điều khoản và Chính sách bảo mật" with cyan links

11. Footer:
    - "Đã có tài khoản? Đăng nhập" with cyan link

Device: DESKTOP
```

---

## SCREEN 4: CHECKOUT PAGE

```
Design a modern dark theme checkout page for MMO digital products store.

Colors: Background #0a0a12, Surface #12121f, Cyan #22d3ee, Magenta #e635c5, Gold #fbbf24

Layout: Centered, max-width 600px

Section 1 - Product Info Card (glass card, p-6):
- Two columns: left image (200x150, rounded), right info
- Product name: 18px semibold white
- Category badge: small cyan pill "Proxy"
- Price: 28px bold cyan "200,000 đ"

Section 2 - Payment Methods (2x2 grid of glass cards):
Each method card (p-4, rounded 12px, border white/10):
- Icon 32px centered
- Label centered below icon
Methods:
1. "Số dư tài khoản" - wallet icon - SELECTED (cyan border glow)
2. "Chuyển khoản VietQR" - QR code icon
3. "USDT TRC20" - crypto icon
4. "Thẻ cào" - phone card icon

Section 3 - VietQR Payment View (shown when VietQR selected):
- Large QR code image centered (200x200), rounded 16px, shadow
- Amount: "Số tiền: 200,000 đ" 20px bold white centered
- Bank card (glass, p-4): Bank name, account number, account name
- Order code: "Mã đơn: MMOABC123XYZ" 14px gold monospace
- Notice: "Hệ thống tự động xác nhận sau khi chuyển khoản" gray-400

Section 4 - USDT Payment View:
- Note text: "Chuyển đúng số tiền vào ví"
- Wallet address display: monospace text, cyan bg, selectable
- "Đã chuyển, kiểm tra ngay" button cyan

Section 5 - Card Charging View:
- Telco dropdown (Viettel, Mobifone, Vinaphone)
- Card code input field
- Serial number input field
- "Gạch thẻ" button magenta

Section 6 - Bottom action:
- "Tạo đơn hàng" full width button cyan (shown when no order created)
- "Đã thanh toán, kiểm tra" button (after order created)

Device: DESKTOP
```

---

## SCREEN 5: USER DASHBOARD

```
Design a modern dark theme user dashboard for MMO store.

Colors: Background #0a0a12, Cyan #22d3ee, Magenta #e635c5, Gold #fbbf24, Green #10b981

Layout: max-width 1200px, space-y-6

Section 1 - Header:
- "Xin chào, [UserName]!" 28px bold white
- "Quản lý tài khoản và đơn hàng của bạn" 14px gray-400

Section 2 - Stats Row (3 cards in grid):
Each stat card: glass, p-5, rounded 16px
Card 1: 
- Icon box: 40px, rounded-xl, bg cyan/20, shield icon cyan
- Label: "Số dư tài khoản" 14px gray-400
- Value: "1,250,000 đ" 28px bold cyan

Card 2:
- Icon box: 40px, bg gold/20, coins icon gold
- Label: "Hoa hồng chờ rút" 14px gray-400
- Value: "350,000 đ" 28px bold gold

Card 3:
- Icon box: 40px, bg magenta/20, users icon magenta
- Label: "Người đã giới thiệu" 14px gray-400
- Value: "12" 28px bold magenta

Section 3 - Affiliate Card (glass p-6):
- Header: Link icon cyan + "Link giới thiệu của bạn" 16px semibold
- Subtitle: "Nhận 10% hoa hồng khi người khác đăng ký" 12px gray-400
- Row: Input readonly (bg surface, monospace font) + "Sao chép" button cyan

Section 4 - Withdraw Card (glass p-6):
- Header: bank icon gold + "Rút hoa hồng"
- Subtitle: "Tối thiểu 50,000đ - Xử lý trong 24h" 12px gray-400
- Row: Amount input + Bank account input + "Rút tiền" button gold

Section 5 - Orders Table (glass p-6):
- Header: clipboard icon + "Lịch sử đơn hàng" + count badge
- Table headers: Mã đơn | Sản phẩm | Số tiền | Thanh toán | Trạng thái
- Table rows: hover bg white/5
- Order code: gold monospace
- Amount: white
- Payment method: lowercase
- Status badges: yellow "Chờ xử lý", cyan "Đã thanh toán", green "Đã giao", red "Đã hủy"
- Empty state: shopping bag icon + "Chưa có đơn hàng nào"

Device: DESKTOP
```

---

## SCREEN 6: ADMIN DASHBOARD TAB

```
Design a modern dark theme admin dashboard overview.

Colors: Background #0a0a12, Cyan #22d3ee, Magenta #e635c5, Gold #fbbf24, Green #10b981

Layout: max-width 1400px

Section 1 - Page Header:
- Shield icon + "Trang quản trị" 24px bold
- "Quản lý cửa hàng của bạn" 14px gray-400
- Badge "Admin Panel" gold

Section 2 - Stats Grid (4 cards):
Card 1: Tổng đơn hàng - shopping cart icon - cyan - 1,234
Card 2: Doanh thu - money icon - gold - 89,500,000 đ
Card 3: Người dùng - users icon - magenta - 567
Card 4: Sản phẩm - box icon - green - 89

Each card: glass, p-6, rounded 16px
- Value: 28px bold
- Label: 14px gray-400
- Icon: 48px rounded-xl in colored bg

Section 3 - Recent Activity (glass p-6):
- Header: "Hoạt động gần đây" 16px semibold
- Activity list (timeline style):
  - Each item: avatar circle (gradient), email, product, amount (gold), timestamp (gray)
  - Subtle divider between items
  - Hover highlight

Device: DESKTOP
```

---

## SCREEN 7: ADMIN ORDERS TAB

```
Design a modern dark theme admin orders management table.

Layout: max-width 1400px

Header: 
- "Quản lý đơn hàng" 18px semibold
- "Xuất Excel" button gold top-right

Filter bar (glass p-4, mb-4):
- Status dropdown (Tất cả, Chờ xử lý, Đã thanh toán, Đã giao, Đã hủy)
- Date range picker
- Search by order code input
- Search button

Orders Table (glass card, overflow-x):
Headers: Mã đơn | Khách hàng | Sản phẩm | Số tiền | Thanh toán | Trạng thái | Hành động

Rows:
- Order code: gold monospace 14px
- Email: white 14px
- Product: white 14px
- Amount: white, right-aligned
- Payment: lowercase gray
- Status: colored badge
- Action: cyan "Xác nhận" link text, hover underline

Row hover: bg white/5
Alternating subtle rows

Pagination: centered, prev/next buttons, page numbers

Empty: "Chưa có đơn hàng nào" centered gray text

Device: DESKTOP
```

---

## SCREEN 8: ADMIN PRODUCTS TAB

```
Design a modern dark theme admin products management.

Layout: max-width 1400px

Section 1 - Add Product Form (glass card p-6, mb-6):
Header: "Thêm sản phẩm mới" 16px semibold

Form grid (3-col desktop):
- Product name input
- Price input (with đ suffix)
- Category dropdown (Tài khoản, Proxy, Tool, Thẻ cào, Khóa học)
- Delivery type radio (Text / File)
- Image URL input
Full width: Description textarea
Full width: Stock textarea (one item per line, placeholder: "item1\nitem2\nitem3")

Bottom: "Tạo sản phẩm" cyan button

Section 2 - Products List (glass card p-6):
Header: "Danh sách sản phẩm (89)" 16px semibold

Table:
Headers: Tên | Danh mục | Giá | Kho | Trạng thái | Hành động

- Name: white semibold
- Category: gray-400
- Price: cyan bold
- Stock: badge (green >5, yellow <5, red 0)
- Actions: cyan "Nạp kho" link, magenta "Sửa" link

Device: DESKTOP
```

---

## SCREEN 9: ADMIN CATEGORIES TAB

```
Design admin categories management page.

Layout: max-width 1200px

Section 1 - Add Category (glass p-6, mb-6):
- Name input (flex-1)
- Icon picker input (flex-1, placeholder: emoji)
- "Tạo danh mục" button cyan

Section 2 - Categories Grid (4-col):
Each category card (glass p-4, rounded 12px, hover scale):
- Large emoji (32px)
- Category name (16px semibold)
- Product count badge small
- Hover: border white/20, scale(1.02)

Categories: 📱 Tài khoản (45), 🌐 Proxy (23), ⚙️ Tool (12), 💳 Thẻ cào (8), 📚 Khóa học (5), 📊 Data (3)

Device: DESKTOP
```

---

## SCREEN 10: ADMIN USERS TAB

```
Design admin users management table.

Layout: max-width 1400px

Header: "Người dùng (567)" 18px semibold

Users Table (glass card, overflow-x):
Headers: Avatar | Email | Tên | Vai trò | Số dư | Hoa hồng | Telegram | Ngày đăng ký | Hành động

Rows:
- Avatar: 36px circle with initial letter, gradient bg
- Email: white
- Name: gray-400
- Role: badge (Admin: gold, User: gray)
- Balance: cyan
- Commission: gold
- Telegram: green checkmark if linked, gray dash if not
- Date: gray-400
- Actions: cyan "Sửa số dư" link

Search bar above table
Pagination below

Device: DESKTOP
```

---

## SCREEN 11: ADMIN BROADCAST TAB

```
Design admin broadcast message page.

Layout: max-width 600px centered

Card (glass p-8):
Header: broadcast icon + "Gửi thông báo Telegram"
Subtitle: "Gửi tin nhắn đến tất cả người dùng đã liên kết Telegram"

Textarea (h-40):
- Dark surface bg, white/10 border, rounded 12px
- Placeholder: "Nhập nội dung thông báo..."
- Focus: cyan border

Character counter bottom-right (gray-500, 12px)

Button: "Gửi thông báo" magenta full width, h-12, rounded 12px
Hover: bg magenta/20, shadow glow

Preview section (mt-4):
- "Xem trước" label
- Mock Telegram message bubble (dark bg, white text, rounded corners)

Device: DESKTOP
```

---

## MOBILE SCREENS

### MOBILE 1: Mobile Home
```
Mobile e-commerce home page for MMO store.

Header: 
- Logo left, hamburger menu right
- Search bar full width below

Category pills: horizontal scroll, compact pills

Product grid: 2-column
Each card: image, badges, title 1-line, price cyan, "MUA" button

Bottom nav: Home, Search, Cart, Account icons
```

### MOBILE 2: Mobile Login
```
Mobile login: logo top, form card below, full width inputs, buttons, links
```

### MOBILE 3: Mobile Checkout
```
Mobile checkout: stacked sections, payment method list vertical, QR code centered, sticky bottom bar with total + confirm button
```

### MOBILE 4: Mobile Dashboard
```
Mobile dashboard: stacked cards, stats 1-column, affiliate link, orders list, bottom nav
```

Device: MOBILE (390px width)
