# MMO Store

He thong **website + Telegram bot** ban san pham MMO (digital products: tai khoan, proxy, tool, sms, the cao, khoa hoc, data...). Giao hang **tu dong** sau khi thanh toan, ho tro **affiliate 10%**, **admin panel** day du.

## Cong nghe
- **Frontend:** React 18 + Vite + Tailwind CSS + Framer Motion + React Router DOM
- **Backend:** Node.js + Express + MongoDB (Mongoose) + JWT
- **Telegram bot:** node-telegram-bot-api (webhook, co polling cho dev)
- **Thanh toan:** USDT TRC20 (TronGrid), VietQR/Bank (Casso webhook), The cao (TheSieuRe)
- **Email:** Nodemailer SMTP
- **Deploy:** Docker + docker-compose

## Cau truc
```
mmo-store/
  backend/         # Express API + Telegram bot + payment + cron
  frontend/        # React + Vite + Tailwind
  docker-compose.yml
```

## Tinh nang chinh
- Dang ky / dang nhap (JWT), lien ket Telegram
- Danh sach san pham theo danh muc + tim kiem + flash sale countdown
- Gio hang / checkout, **auto-delivery** qua email + Telegram
- Affiliate 10% hoa hong, rut tien
- Live inventory (kho tu giam, admin nap them)
- Admin: CRUD san pham/danh muc, duyet don, sua so du, export Excel, broadcast Telegram
- Tu dong: canh bao het hang (<5), bao cao doanh thu hang ngay qua Telegram

## Bao mat
- Secret nam trong `.env` (khong commit). Co `.env.example`, `.gitignore` chan `.env` that.
- Webhook Casso/Telegram/the cao deu verify chu ky/secret.
- Du lieu giao hang nhay cam (user/pass) duoc **ma hoa AES-256-GCM** trong DB.
- Mat khau hash bcrypt, JWT co expiry, rate limit, helmet, CORS.

---

## 1. Chay che do DEV (khong Docker)

### Backend
```bash
cd backend
cp .env.example .env   # dien cac bien (xem ben duoi)
npm install
npm run seed           # tao admin + danh muc + san pham mau
npm run dev            # chay tai http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev            # chay tai http://localhost:5173
```

Dang nhap admin mac dinh: email/password lay tu `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `backend/.env`.

---

## 2. Chay bang Docker (khuyen nghi cho VPS)

```bash
# 1. Tao file env cho backend
cp backend/.env.example backend/.env
# Sua backend/.env: dien JWT_SECRET, ENCRYPTION_KEY (32 ky tu), token telegram, key thanh toan, SMTP...
# Luu y: trong Docker, MONGO_URI da duoc set san = mongodb://mongo:27017/mmostore

# 2. (Tuy chon) tao .env o root de doi VITE_API_URL cho frontend khi deploy production
cp .env.example .env

# 3. Build & chay
docker compose up -d --build

# 4. Seed du lieu (admin + san pham mau)
docker compose exec backend npm run seed
```

- Frontend: http://localhost (port 80)
- Backend API: http://localhost:5000/api

Khi deploy production: tro domain frontend vao port 80, va dat `VITE_API_URL=https://api.yourdomain.com/api` (build lai frontend), `PUBLIC_BASE_URL=https://api.yourdomain.com` trong backend/.env.

---

## 3. Cau hinh cac bien moi truong (backend/.env)

| Bien | Mo ta |
|------|-------|
| `JWT_SECRET` | Chuoi ngau nhien dai de ky JWT |
| `ENCRYPTION_KEY` | **Dung 32 ky tu** - khoa AES ma hoa du lieu giao hang |
| `TELEGRAM_BOT_TOKEN` | Token bot tu @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat ID admin nhan canh bao/bao cao |
| `TELEGRAM_USE_WEBHOOK` | `true` cho production (VPS HTTPS), `false` cho dev (polling) |
| `TELEGRAM_WEBHOOK_SECRET` | Secret bao ve endpoint webhook telegram |
| `TRONGRID_API_KEY` | API key TronGrid (USDT TRC20) |
| `USDT_WALLET_ADDRESS` | Dia chi vi nhan USDT |
| `BANK_ID` / `BANK_ACCOUNT_NO` / `BANK_ACCOUNT_NAME` | Thong tin tao VietQR |
| `CASSO_WEBHOOK_SECRET` | Secure-Token Casso gui kem webhook (bat buoc) |
| `THESIEURE_PARTNER_ID` / `THESIEURE_PARTNER_KEY` | Key gach the cao |
| `SMTP_*` / `MAIL_FROM` | Cau hinh gui email |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Tai khoan admin tao boi seed |

---

## 4. Cau hinh Telegram webhook

Khi `TELEGRAM_USE_WEBHOOK=true`, backend tu dong goi `setWebHook` toi:
```
{PUBLIC_BASE_URL}/api/telegram/webhook/{TELEGRAM_WEBHOOK_SECRET}
```
Dam bao `PUBLIC_BASE_URL` la domain HTTPS cong khai cua VPS. Bot cac lenh: `/start`, `/products`, `/order [id]`, `/status [ma]`, `/aff`, `/help`.

Lien ket tai khoan: user can co `telegramId` trong DB (admin co the gan, hoac mo rong them luong lien ket qua bot).

---

## 5. Cau hinh webhook Casso (VietQR auto-check)

1. Dang ky tai khoan **Casso**, lien ket ngan hang.
2. Tao webhook tro toi: `https://api.yourdomain.com/api/payment/casso/webhook`
3. Dat **Secure-Token** trung voi `CASSO_WEBHOOK_SECRET` trong `.env`.
4. Khi khach chuyen khoan voi noi dung chua **ma don** (vd `MMOABC123`), Casso gui webhook, he thong tu doi chieu va giao hang.

---

## 6. Luong thanh toan

- **So du:** tru truc tiep, giao hang ngay.
- **VietQR/Bank:** hien QR -> khach CK noi dung = ma don -> Casso webhook -> auto giao. (Hoac admin bam "Xac nhan".)
- **USDT TRC20:** khach chuyen dung so tien -> bam "kiem tra" hoac he thong doi chieu TronGrid -> auto giao.
- **The cao:** nhap ma+serial -> gach qua TheSieuRe (thieu key thi admin xac nhan thu cong).

---

## Ghi chu
- Day la nen tang day du, co the mo rong them (vi du: luong lien ket Telegram tu dong, them cong thanh toan, gio hang nhieu san pham).
- **Nho doi tat ca secret mac dinh truoc khi len production.**
