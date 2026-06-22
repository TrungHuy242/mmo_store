import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.host || !config.smtp.user) {
    console.warn('[email] Chưa cấu hình SMTP, bỏ qua gửi email.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.sendMail({ from: config.smtp.from, to, subject, html });
    return true;
  } catch (err) {
    console.error('[email] Loi gui email:', err.message);
    return false;
  }
}

export function buildDeliveryEmail(order, items) {
  const list = items.map((i) => `<li><code>${escapeHtml(i)}</code></li>`).join('');
  return `
    <div style="font-family:sans-serif;background:#0b0b14;color:#e5e5f0;padding:24px;border-radius:12px">
      <h2 style="color:#22d3ee">Cảm ơn bạn đã mua hàng tại MMO Store!</h2>
      <p>Đơn hàng <b>#${order.code}</b> - <b>${escapeHtml(order.productName)}</b></p>
      <p>Thông tin sản phẩm của bạn:</p>
      <ul>${list}</ul>
      <p style="color:#a3a3b8;font-size:13px">Vui lòng bảo mật thông tin này. Không chia sẻ cho người khác.</p>
    </div>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
