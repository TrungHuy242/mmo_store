import crypto from 'crypto';
import { config } from '../../config/env.js';

// Sinh link anh VietQR (quicklink) - khong can API key
// Format: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact2.png?amount=&addInfo=
export function buildVietQrUrl({ amount, addInfo }) {
  const { bankId, accountNo, accountName } = config.bank;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: addInfo || '',
    accountName: accountName || '',
  });
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?${params.toString()}`;
}

// Verify secret token Casso gui kem webhook (header Secure-Token)
export function verifyCassoToken(token) {
  const expected = config.bank.cassoWebhookSecret;
  if (!expected) return false;
  const a = Buffer.from(String(token || ''));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Tim ma don trong noi dung chuyen khoan (description)
export function extractOrderCode(description) {
  if (!description) return null;
  const match = String(description).toUpperCase().match(/MMO[A-Z0-9]+/);
  return match ? match[0] : null;
}
