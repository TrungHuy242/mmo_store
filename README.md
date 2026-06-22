# MMO Store

Hệ thống **website + Telegram bot** bán sản phẩm MMO (sản phẩm số: tài khoản, proxy, tool, sms, thẻ cào, khóa học, data...). Giao hàng **tự động** sau khi thanh toán, hỗ trợ **affiliate 10%**, **admin panel** đầy đủ.

## Công nghệ

- **Frontend:** React 18 + Vite + Tailwind CSS + Framer Motion + React Router DOM
- **Backend:** Node.js + Express + PostgreSQL + JWT
- **Telegram bot:** node-telegram-bot-api (webhook, có polling cho dev)
- **Thanh toán:** USDT TRC20 (TronGrid), VietQR/Bank (Casso webhook), Thẻ cào (TheSieuRe)
- **Email:** Nodemailer SMTP
- **Deploy:** Docker + docker-compose

## Cấu trúc

```
mmo-store/
  backend/         # Express API + Telegram bot + payment + cron
  frontend/        # React + Vite + Tailwind
  docker-compose.yml
```

## Tính năng chính

- Đăng ký / đăng nhập (JWT), liên kết Telegram
- Danh sách sản phẩm theo danh mục + tìm kiếm + flash sale countdown
- Giỏ hàng / checkout, **auto-delivery** qua email + Telegram
- Affiliate 10% hoa hồng, rút tiền
- Live inventory (kho tự giảm, admin nạp thêm)
- Admin: CRUD sản phẩm/danh mục, duyệt đơn, sửa số dư, export Excel, broadcast Telegram
- Tự động: cảnh báo hết hàng (<5), báo cáo doanh thu hàng ngày qua Telegram

## Bảo mật

- Secret nằm trong `.env` (không commit). Có `.env.example`, `.gitignore` chặn `.env` thật.
- Webhook Casso/Telegram/thẻ cào đều verify chữ ký/secret.
- Dữ liệu giao hàng nhạy cảm (user/pass) được **mã hóa AES-256-GCM** trong DB.
- Mật khẩu hash bcrypt, JWT có expiry, rate limit, helmet, CORS.

---

## 1. Chạy chế độ DEV (không Docker)

### Backend

```bash
cd backend
cp .env.example .env   # điền các biến (xem bên dưới)
npm install
npm run seed           # tạo admin + danh mục + sản phẩm mẫu
npm run dev            # chạy tại http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev            # chạy tại http://localhost:5173
```

Đăng nhập admin mặc định: email/password lấy từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `backend/.env`.

---

## 2. Chạy bằng Docker (khuyến nghị cho VPS)

```bash
# 1. Tạo file env cho backend
cp backend/.env.example backend/.env
# Sửa backend/.env: điền JWT_SECRET, ENCRYPTION_KEY (32 ký tự), token telegram, key thanh toán, SMTP...
# Lưu ý: backend hiện tại sử dụng PostgreSQL. Đặt DB_TYPE=postgres và DATABASE_URL.

# 2. (Tùy chọn) tạo .env ở root để đổi VITE_API_URL cho frontend khi deploy production
cp .env.example .env

# 3. Build & chạy
docker compose up -d --build

# 4. Seed dữ liệu (admin + sản phẩm mẫu)
docker compose exec backend npm run seed
```

- Frontend: http://localhost (port 80)
- Backend API: http://localhost:5000/api

Khi deploy production: trỏ domain frontend vào port 80, và đặt `VITE_API_URL=https://api.yourdomain.com/api` (build lại frontend), `PUBLIC_BASE_URL=https://api.yourdomain.com` trong backend/.env.

---

## 3. Cấu hình các biến môi trường (backend/.env)

| Biến | Mô tả |
| --- | --- |
| `JWT_SECRET` | Chuỗi ngẫu nhiên dài để ký JWT |
| `ENCRYPTION_KEY` | **Dùng 32 ký tự** - khóa AES mã hóa dữ liệu giao hàng nhạy cảm |
| `TELEGRAM_BOT_TOKEN` | Token bot từ @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat ID của admin nhận cảnh báo/báo cáo |
| `TELEGRAM_USE_WEBHOOK` | `true` cho production (VPS HTTPS), `false` cho dev (polling) |
| `TELEGRAM_WEBHOOK_SECRET` | Secret bảo vệ endpoint webhook telegram |
| `TRONGRID_API_KEY` | API key TronGrid (USDT TRC20) |
| `USDT_WALLET_ADDRESS` | Địa chỉ ví nhận USDT |
| `BANK_ID` / `BANK_ACCOUNT_NO` / `BANK_ACCOUNT_NAME` | Thông tin tài khoản ngân hàng để sinh VietQR |
| `CASSO_WEBHOOK_SECRET` | Secure-Token Casso gửi kèm webhook (bắt buộc để verify) |
| `THESIEURE_PARTNER_ID` / `THESIEURE_PARTNER_KEY` | Key gạch thẻ cào |
| `SMTP_*` / `MAIL_FROM` | Cấu hình gửi email |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Tài khoản admin tạo bởi seed |

---

## 4. Cấu hình Telegram webhook

Khi `TELEGRAM_USE_WEBHOOK=true`, backend tự động gọi `setWebHook` tới:

```
{PUBLIC_BASE_URL}/api/telegram/webhook/{TELEGRAM_WEBHOOK_SECRET}
```

Đảm bảo `PUBLIC_BASE_URL` là domain HTTPS công khai của VPS. Bot các lệnh: `/start`, `/products`, `/order [id]`, `/status [mã]`, `/aff`, `/help`.

Liên kết tài khoản: user cần có `telegramId` trong DB (admin có thể gán, hoặc mở rộng thêm luồng liên kết qua bot).

---

## 5. Cấu hình webhook Casso (VietQR auto-check)

1. Đăng ký tài khoản **Casso**, liên kết ngân hàng.
2. Tạo webhook trỏ tới: `https://api.yourdomain.com/api/payment/casso/webhook`
3. Đặt **Secure-Token** trùng với `CASSO_WEBHOOK_SECRET` trong `.env`.
4. Khi khách chuyển khoản với nội dung chứa **mã đơn** (vd `MMOABC123`), Casso gửi webhook, hệ thống tự đối chiếu và giao hàng.

---

## 6. Luồng thanh toán

- **Số dư:** trừ trực tiếp, giao hàng ngay.
- **VietQR/Bank:** hiện QR -> khách CK nội dung = mã đơn -> Casso webhook -> auto giao. (Hoặc admin bấm "Xác nhận".)
- **USDT TRC20:** khách chuyển đúng số tiền -> bấm "kiểm tra" hoặc hệ thống đối chiếu TronGrid -> auto giao.
- **Thẻ cào:** nhập mã+serial -> gạch qua TheSieuRe (thiếu key thì admin xác nhận thủ công).

---

## Ghi chú

- Đây là nền tảng đầy đủ, có thể mở rộng thêm (ví dụ: luồng liên kết Telegram tự động, thêm cổng thanh toán, giỏ hàng nhiều sản phẩm).
- **Nhớ đổi tất cả secret mặc định trước khi lên production.**
