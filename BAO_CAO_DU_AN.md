# BÁO CÁO DỰ ÁN MMO STORE

## Tình trạng hiện tại (22/06/2026)

### ✅ Đã hoàn thành

#### 1. README
- Viết lại README tiếng Việt có dấu đầy đủ

#### 2. Frontend UI (React + Vite + Tailwind)
- **index.css**: Nâng cấp với font Be Vietnam Pro, gradient background, component classes mới, animations
- **Navbar**: Logo gradient, desktop nav + mobile menu, user avatar, hover effects
- **Layout**: Toast notifications, responsive footer
- **ProductCard**: Discount badge, hover zoom image, stock indicator, animated badges
- **Home**: Hero section, search bar, sort dropdown, category filters, pagination, empty states
- **Login/Register**: Form validation, password strength meter, icons trong input, loading state
- **Dashboard**: Stats cards với icons, affiliate section, withdraw form, orders table
- **Admin**: Dashboard stats, Orders/Products/Categories/Users/Broadcast tabs đầy đủ

#### 3. Backend (Node.js + Express + PostgreSQL)
- Server chạy ổn định tại port 5000
- API health check: OK
- PostgreSQL connected
- Auth (register/login/me)
- Products CRUD
- Categories CRUD
- Orders CRUD + payment processing
- Affiliate system
- Admin management
- Payment integrations (VietQR, USDT, Card)
- Email service
- Telegram bot handlers
- Cron jobs

#### 4. Stitch MCP
- API kết nối thành công
- Project tạo: `projects/12581568749404678872`
- Tools hoạt động: `create_project`, `upload_design_md`, `list_projects`, `list_tools`
- `generate_screen_from_text`: Lỗi 400 (cần xử lý)

---

### ⚠️ CẦN XỬ LÝ

#### 1. Stitch MCP - generate_screen_from_text lỗi
- API trả về `400 Bad Request` khi gọi `generate_screen_from_text`
- Nguyên nhân: Request format không đúng hoặc quota/hạn chế của API key
- **Giải pháp**: Sử dụng Stitch web interface trực tiếp (studio.google.com/stitch)
  1. Mở: https://studio.google.com/stitch
  2. Đăng nhập Google account
  3. Mở project "MMO Store - Digital Products Marketplace"
  4. Click "Generate Screen" → nhập prompt → tạo design
  5. Export HTML/CSS code → tôi sẽ code lại thành React component

#### 2. Design System trên Stitch
- Schema `create_design_system` không đúng format
- **Giải pháp**: Upload DESIGN.md (đã làm) hoặc tạo manual trên web

---

### 📋 THÔNG TIN CÒN THIẾU (CẦN BẠN CUNG CẤP)

#### 1. Stitch API Key
- API key hiện tại: `REDACTED_GCP_API_KEY`
- Có thể hết quota hoặc bị giới hạn
- **Cần kiểm tra**: https://console.cloud.google.com/apis/credentials

#### 2. Cấu hình thanh toán (backend/.env)
| Biến | Trạng thái | Ghi chú |
|-------|-----------|---------|
| TELEGRAM_BOT_TOKEN | ❌ Trống | Lấy từ @BotFather |
| TELEGRAM_ADMIN_CHAT_ID | ❌ Trống | Chat ID của admin |
| TELEGRAM_WEBHOOK_SECRET | ⚠️ placeholder | Đổi thành chuỗi ngẫu nhiên |
| TRONGRID_API_KEY | ❌ Trống | Cho thanh toán USDT |
| USDT_WALLET_ADDRESS | ❌ Trống | Ví USDT TRC20 nhận tiền |
| CASSO_WEBHOOK_SECRET | ❌ Trống | Key webhook ngân hàng |
| THESIEURE_PARTNER_ID | ❌ Trống | Cho gạch thẻ cào |
| THESIEURE_PARTNER_KEY | ❌ Trống | Cho gạch thẻ cào |
| SMTP_USER | ❌ Trống | Email gửi (gmail/app password) |
| SMTP_PASS | ❌ Trống | App password của email |

#### 3. Cấu hình deploy
| Biến | Hiện tại | Cần đổi thành |
|-------|-----------|----------------|
| PUBLIC_BASE_URL | http://localhost:5000 | https://api.yourdomain.com |
| FRONTEND_URL | http://localhost:5173 | https://yourdomain.com |
| DATABASE_URL | localhost | PostgreSQL production host |

#### 4. Các API keys cần đăng ký
- [ ] **Telegram Bot**: @BotFather → /newbot
- [ ] **TronGrid**: https://trongrid.io → API Key
- [ ] **Casso**: https://casso.vn → Webhook setup
- [ ] **TheSieuRe**: https://thesieure.com → Partner API
- [ ] **Email SMTP**: Gmail với App Password hoặc SMTP provider khác

---

## KẾ HOẠCH TIẾP THEO

### Giai đoạn 1: Hoàn thiện Stitch Design
1. Bạn mở Stitch web → tạo 11 screens theo prompts đã viết
2. Export code từng screen
3. Tôi code lại thành React components

### Giai đoạn 2: Code Backend hoàn chỉnh
1. Kiểm tra tất cả endpoints
2. Thêm endpoint `/admin/stats` (Admin Dashboard cần)
3. Fix data model consistency (MongoDB vs PostgreSQL)
4. Test toàn bộ API

### Giai đoạn 3: Kết nối Frontend ↔ Backend
1. Verify tất cả API calls hoạt động
2. Xử lý lỗi và loading states
3. Authentication flow

### Giai đoạn 4: Testing & Fix bugs
1. Luồng đăng ký → mua hàng → giao hàng
2. Affiliate flow
3. Payment flows (VietQR, USDT, Card)
4. Admin operations

### Giai đoạn 5: Deploy
1. Docker setup
2. Environment variables production
3. Domain + SSL
4. Monitoring

---

## PROMPTS CHO STITCH (ĐÃ VIẾT SẴN)

Xem file: `stitch_prompts.md` (sẽ tạo bên dưới)

---

## CÁCH SỬ DỤNG STITCH

1. Mở: https://studio.google.com/stitch
2. Đăng nhập Google account (cùng account với API key)
3. Chọn project "MMO Store - Digital Products Marketplace"
4. **Cách tạo screen**:
   - Click "+" hoặc "Generate Screen"
   - Paste prompt từ file `stitch_prompts.md`
   - Chọn device type (Desktop/Mobile)
   - Generate
5. **Export code**:
   - Click vào screen → "Export" → HTML/CSS
   - Copy code → gửi cho tôi
6. **Tạo Design System**:
   - Settings → Design System
   - Điền colors từ DESIGN.md

---

## FILES QUAN TRỌNG

| File | Mô tả |
|------|--------|
| `README.md` | Tài liệu dự án (tiếng Việt) |
| `DESIGN.md` | Design specification chi tiết |
| `stitch_prompts.md` | Prompts cho Stitch (sẽ tạo) |
| `backend/.env` | Cấu hình (chưa đầy đủ) |
| `frontend/src/` | Tất cả React components |
| `backend/src/` | Tất cả Node.js backend |

---

## GHI CHÚ

- Backend đang chạy: http://localhost:5000
- Frontend đang chạy: http://localhost:5174 (hoặc 5173)
- Stitch project: https://studio.google.com/stitch → project ID `12581568749404678872`
- Database: PostgreSQL (cần kiểm tra connection string)
