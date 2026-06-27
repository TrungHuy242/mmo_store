# MMO-Store Premium

<div align="center">

![Cyberpunk Store](https://img.shields.io/badge/MMO--Store-Premium-FF00FF?style=for-the-badge&labelColor=0a0a0a)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-FF6B6B?style=flat-square)

**Hệ thống mua bán sản phẩm kỹ thuật số tự động 24/7**

*Chào mừng đến với thế hệ cửa hàng số tiếp theo*

</div>

---

## Giới thiệu

**MMO-Store Premium** là nền tảng tối tân hỗ trợ bán các sản phẩm kỹ thuật số với cơ chế giao hàng và kích hoạt tự động hoàn toàn.

### Sản phẩm được hỗ trợ

| Danh mục | Ví dụ |
|----------|-------|
| :key: **Tài khoản Premium** | Netflix, Spotify, Disney+, YouTube Premium... |
| :globe_with_meridians: **Proxy** | HTTP, SOCKS5, Residential proxies |
| :wrench: **Tools & Software** | Automation tools, SEO tools, MMO tools |
| :ticket: **License Keys** | Phần mềm, game, dịch vụ số |
| :book: **Source Code** | Scripts, bots, templates, themes |

---

## Tính năng nổi bật

### :art: Giao diện Cyberpunk Glassmorphism

```
✓ Dark Theme tối ưu cho trải nghiệm mua sắm
✓ Hiệu ứng Glassmorphism hiện đại
✓ Responsive 100% - Desktop, Tablet, Mobile
✓ Animations mượt mà với Framer Motion
✓ Retro Sci-Fi Sound Effects cho tương tác
```

### :credit_card: Thanh toán đa kênh

| Phương thức | Mô tả | Xác nhận |
|--------------|--------|-----------|
| **VietQR** | Quét mã QR thanh toán | Auto (Casso Webhook) |
| **USDT TRC20** | Chuyển USDT qua mạng TRON | Auto (TronGrid) |
| **Thẻ cào** | Nạp qua thẻ điện thoại | TheSieuRe API |
| **Số dư** | Thanh toán bằng ví tích hợp | Instant |

### :package: Hệ thống phát hàng tự động

```
┌─────────────────────────────────────────────┐
│  ✅ Auto-Delivery Engine                   │
├─────────────────────────────────────────────┤
│  • License Keys độc lập cho từng khách     │
│  • Account credentials được mã hóa AES-256 │
│  • Giao qua Email + Telegram tức thì       │
│  • Digital downloads với link có expiry    │
└─────────────────────────────────────────────┘
```

### :shield: Admin Panel toàn năng

```
📦 Quản lý Kho hàng    → Bulk Add, Import/Export Excel
📊 Logs Hệ thống       → Audit Logs theo dõi mọi hành động
🎫 Ticket Hỗ trợ       → Quản lý tickets từ khách hàng
🎟️ Coupons             → Mã giảm giá linh hoạt (% hoặc VND)
💰 Giao dịch           → Duyệt/rút tiền affiliate
📈 Báo cáo             → Doanh thu, đơn hàng, inventory
```

### :robot: Tích hợp Telegram Bot

```
┌─────────────────────────────────────────────┐
│  🤖 Bot Commands                            │
├─────────────────────────────────────────────┤
│  /start     → Chào mừng & liên kết TK     │
│  /products  → Danh sách sản phẩm           │
│  /order     → Kiểm tra trạng thái đơn     │
│  /aff       → Quản lý affiliate           │
│  /balance   → Kiểm tra số dư              │
│  /help      → Hướng dẫn sử dụng           │
└─────────────────────────────────────────────┘

📢 Thông báo tự động:
   • Đơn hàng mới → Admin nhận notification
   • Lỗi hệ thống → Alert qua Telegram
   • Bảo mật → OTP/2FA thông qua Telegram
```

### :money_with_wings: Hệ thống Affiliate

```
┌─────────────────────────────────────────────┐
│  10% Hoa hồng cho người giới thiệu         │
├─────────────────────────────────────────────┤
│  • Link giới thiệu riêng cho từng user    │
│  • Dashboard theo dõi hoa hồng             │
│  • Rút tiền tự động qua VietQR/USDT       │
│  • Auto-settlement hàng ngày               │
└─────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

```
React 18 + Vite
├── State Management: Zustand
├── Styling: Tailwind CSS
├── Animations: Framer Motion
├── Routing: React Router DOM v6
├── i18n: react-i18next
└── HTTP Client: Axios
```

### Backend

```
Node.js + Express
├── ORM: Prisma
├── Database: PostgreSQL
├── Auth: JWT + bcrypt
├── Security: Helmet, CORS, Rate Limit
├── Email: Nodemailer (SMTP)
└── Payments: VietQR, USDT TRC20, Thẻ cào
```

### Infrastructure

```
Docker + Docker Compose
├── Nginx (Reverse Proxy)
├── PostgreSQL 15
└── Node.js 18+
```

---

## Cấu trúc dự án

```
mmo-store/
│
├── 📂 backend/                          # Express API Server
│   ├── 📂 prisma/
│   │   ├── schema.prisma               # Database Schema
│   │   └── migrations/                # DB Migrations
│   ├── 📂 src/
│   │   ├── 📂 modules/                # Feature Modules (Auth, Orders, Products...)
│   │   │   ├── auth/                  # Authentication
│   │   │   ├── products/              # Product Management
│   │   │   ├── orders/               # Order Processing
│   │   │   ├── payments/             # Payment Integration
│   │   │   ├── inventory/            # Stock Management
│   │   │   ├── licenses/             # License Keys
│   │   │   ├── affiliates/          # Affiliate System
│   │   │   ├── notifications/       # Email & Telegram
│   │   │   └── tickets/             # Support Tickets
│   │   ├── 📂 services/             # Business Logic
│   │   │   ├── delivery.service.js  # Auto-Delivery Engine
│   │   │   ├── payment.service.js   # Payment Processing
│   │   │   └── telegram.service.js  # Telegram Bot
│   │   ├── 📂 workers/               # Background Jobs
│   │   ├── 📂 middlewares/           # Express Middlewares
│   │   ├── 📂 utils/                # Utilities (encryption, upload...)
│   │   ├── 📂 webhooks/             # Webhook Handlers
│   │   ├── app.js                    # Express App
│   │   └── server.js                 # Server Entry
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
│
├── 📂 frontend/                        # React Client
│   ├── 📂 public/                     # Static Assets
│   ├── 📂 src/
│   │   ├── 📂 api/                   # API Client Layer
│   │   ├── 📂 components/           # UI Components
│   │   │   ├── admin/               # Admin Components
│   │   │   ├── layout/              # Layout Components
│   │   │   └── ui/                  # Base UI Components
│   │   ├── 📂 context/              # React Contexts
│   │   ├── 📂 hooks/                # Custom Hooks
│   │   ├── 📂 pages/                # Page Components
│   │   │   ├── admin/              # Admin Pages
│   │   │   └── *.jsx                # Customer Pages
│   │   ├── 📂 store/                # Zustand Stores
│   │   ├── 📂 utils/                # Utilities
│   │   ├── App.jsx                   # Root Component
│   │   └── main.jsx                  # Entry Point
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml                  # Root Docker Config
└── README.md
```

---

## Hướng dẫn cài đặt

### Yêu cầu hệ thống

```
• Node.js 18+
• PostgreSQL 15+
• Docker & Docker Compose (optional)
• npm or yarn
```

### 1. Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Sao chép file môi trường
cp .env.example .env

# Chỉnh sửa file .env (xem phần cấu hình bên dưới)

# Chạy migrations & tạo database
npx prisma db push

# Seed dữ liệu mẫu (admin, categories, products)
npm run seed

# Khởi chạy development server
npm run dev

# Server chạy tại: http://localhost:5000
```

### 2. Cài đặt Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Sao chép file môi trường
cp .env.example .env

# Chỉnh sửa: VITE_API_URL=http://localhost:5000/api

# Khởi chạy development server
npm run dev

# Client chạy tại: http://localhost:5173
```

### 3. Chạy với Docker (Khuyến nghị cho VPS)

```bash
# Sao chép và chỉnh sửa file môi trường
cp backend/.env.example backend/.env
# Chỉnh sửa: JWT_SECRET, ENCRYPTION_KEY, TELEGRAM_BOT_TOKEN...

# Build và chạy containers
docker compose up -d --build

# Seed dữ liệu
docker compose exec backend npm run seed

# Truy cập:
#   Frontend: http://localhost (hoặc domain của bạn)
#   Backend:  http://localhost:5000/api
```

---

## Cấu hình biến môi trường

### Backend (.env)

```bash
# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=development
PORT=5000
PUBLIC_BASE_URL=http://localhost:5000

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://user:password@localhost:5432/mmo_store

# ===========================================
# AUTHENTICATION & SECURITY
# ===========================================
# JWT Secret - chuỗi ngẫu nhiên dài 32+ ký tự
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AES-256-GCM Encryption Key - chính xác 32 ký tự
ENCRYPTION_KEY=32-character-encryption-key!!

# ===========================================
# TELEGRAM BOT
# ===========================================
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_CHAT_ID=123456789
TELEGRAM_USE_WEBHOOK=false           # true for production (VPS HTTPS)
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret

# ===========================================
# PAYMENT - VIETQR (Casso Integration)
# ===========================================
CASSO_API_KEY=your-casso-api-key
CASSO_WEBHOOK_SECRET=your-casso-webhook-secret

# Thông tin tài khoản ngân hàng (hiển thị trên QR)
VIETQR_BANK_ID=VPBANK
VIETQR_BANK_NAME=NGAN HANG TMCP VPBANK
VIETQR_ACCOUNT_NUMBER=123456789
VIETQR_ACCOUNT_NAME=CONG TY TNHH MMO STORE

# ===========================================
# PAYMENT - USDT TRC20
# ===========================================
TRONGRID_API_KEY=your-trongrid-api-key
USDT_WALLET_ADDRESS=TXxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===========================================
# PAYMENT - THE SIEU RE (Card Scratch)
# ===========================================
THESIEURE_PARTNER_ID=your-partner-id
THESIEURE_PARTNER_KEY=your-partner-key

# ===========================================
# EMAIL (Nodemailer SMTP)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM=noreply@mmostore.com

# ===========================================
# ADMIN ACCOUNT (Created by seed)
# ===========================================
ADMIN_EMAIL=admin@mmostore.com
ADMIN_PASSWORD=AdminPassword123!

# ===========================================
# ADDITIONAL
# ===========================================
# Ngưỡng cảnh báo hết hàng (số lượng)
LOW_STOCK_THRESHOLD=5
```

### Frontend (.env)

```bash
# API Base URL
VITE_API_URL=http://localhost:5000/api

# Production example:
# VITE_API_URL=https://api.yourdomain.com/api
```

---

## Cấu hình Webhook

### Telegram Webhook

```bash
# Khi TELEGRAM_USE_WEBHOOK=true, bot sẽ tự động set webhook tới:
https://your-domain.com/api/telegram/webhook/YOUR_WEBHOOK_SECRET

# Đảm bảo:
# ✓ Domain phải là HTTPS
# ✓ PUBLIC_BASE_URL đúng trong .env
```

### Casso Webhook (VietQR Auto-Check)

```
1. Đăng ký tài khoản Casso tại: https://casso.vn
2. Liên kết tài khoản ngân hàng
3. Tạo webhook trỏ tới:
   https://your-domain.com/api/payment/casso/webhook
4. Đặt Secure-Token trùng với CASSO_WEBHOOK_SECRET

# Lưu ý: Mã đơn hàng (orderNumber) phải xuất hiện trong nội dung chuyển khoản
# Ví dụ: "MMOABC123"
```

---

## Luồng thanh toán

```
┌──────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW DIAGRAM                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Khách hàng                                                 │
│       │                                                      │
│       ▼                                                      │
│   ┌─────────────────┐                                        │
│   │  Chọn sản phẩm  │                                       │
│   └────────┬────────┘                                        │
│            ▼                                                 │
│   ┌─────────────────┐                                        │
│   │    Checkout     │                                        │
│   └────────┬────────┘                                        │
│            ▼                                                 │
│   ┌─────────────────────────────────────┐                   │
│   │      Phương thức thanh toán         │                   │
│   ├─────────────┬───────────┬────────────┤                   │
│   │   VietQR    │   USDT    │  Thẻ cào  │                   │
│   └──────┬──────┴─────┬────┴─────┬──────┘                   │
│          │            │           │                           │
│          ▼            ▼           ▼                           │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│   │  Bank    │  │ TronGrid │  │TheSieuRe │                  │
│   │ Transfer │  │  Verify  │  │   API    │                  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│        │              │             │                         │
│        ▼              ▼             ▼                         │
│   ┌─────────────────────────────────────────┐               │
│   │          ORDER CONFIRMED                 │               │
│   └──────────────────┬──────────────────────┘               │
│                      ▼                                        │
│   ┌─────────────────────────────────────────┐               │
│   │           AUTO DELIVERY                 │               │
│   │  • License Key / Account Credentials    │               │
│   │  • Encrypted with AES-256-GCM           │               │
│   │  • Sent via Email + Telegram            │               │
│   └─────────────────────────────────────────┘               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Đăng nhập mặc định

```
🔐 Admin Credentials (sau khi chạy seed)

Email:    admin@mmostore.com
Password: AdminPassword123!

⚠️  THAY ĐỔI PASSWORD NGAY SAU KHI ĐĂNG NHẬP LẦN ĐẦU!
```

---

## Bảo mật

```
┌────────────────────────────────────────────────────────────┐
│  🔒 SECURITY FEATURES                                     │
├────────────────────────────────────────────────────────────┤
│  ✓ Secrets trong .env (không commit)                      │
│  ✓ Webhook signatures verification                        │
│  ✓ AES-256-GCM encryption cho dữ liệu nhạy cảm           │
│  ✓ bcrypt password hashing (cost factor 12)               │
│  ✓ JWT tokens với expiry                                 │
│  ✓ Rate limiting (Brute force protection)                │
│  ✓ Helmet.js security headers                            │
│  ✓ CORS configuration                                    │
│  ✓ Input validation & sanitization                       │
└────────────────────────────────────────────────────────────┘

⚠️  NHỚ ĐỔI TẤT CẢ SECRETS TRƯỚC KHI DEPLOY PRODUCTION!
```

---

## Scripts hữu ích

```bash
# Backend
npm run dev          # Development server
npm run build        # Production build
npm run seed         # Seed database
npm run db:push      # Push schema to DB
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio

# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

---

## License

```
© 2024 MMO-Store Premium
All Rights Reserved

This is proprietary software. Redistribution is not permitted.
```

---

<div align="center">

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ███╗   ███╗██╗███████╗███████╗██╗ ██████╗ ███╗   ██╗ ║
║     ████╗ ████║██║██╔════╝██╔════╝██║██╔═══██╗████╗  ██║ ║
║     ██╔████╔██║██║███████╗███████╗██║██║   ██║██╔██╗ ██║ ║
║     ██║╚██╔╝██║██║╚════██║╚════██║██║██║   ██║██║╚██╗██║ ║
║     ██║ ╚═╝ ██║██║███████║███████║██║╚██████╔╝██║ ╚████║ ║
║     ╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ║
║                                                           ║
║     ███████╗██╗   ██╗██████╗ ███████╗██████╗ ███████╗███╗  ║
║     ██╔════╝██║   ██║██╔══██╗██╔════╝██╔══██╗██╔════╝████╗ ║
║     ███████╗██║   ██║██████╔╝█████╗  ██████╔╝█████╗  ██╔██╗║
║     ╚════██║██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗██╔══╝  ██║╚██║║
║     ███████║╚██████╔╝██║     ███████╗██║  ██║███████╗██║ ╚██║║
║     ╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝║
║                                                           ║
║                    Premium Edition                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Build with** :heart: **by MMO-Store Team**

</div>
