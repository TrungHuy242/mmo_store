import axios from 'axios';
import crypto from 'crypto';
import { config } from '../../config/env.js';

// Module nap the cao qua TheSieuRe. Co abstraction de sau them Card2K.
// Neu thieu key -> tra ve { fallback: true } de admin xac nhan thu cong.

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// Gui yeu cau gach the. telco: VIETTEL | MOBIFONE | VINAPHONE
export async function chargeCard({ telco, code, serial, amount, requestId }) {
  const { partnerId, partnerKey, apiUrl } = config.thesieure;
  if (!partnerId || !partnerKey) {
    return { fallback: true, message: 'Chưa cấu hình TheSieuRe, cần admin xác nhận thủ công.' };
  }
  // Chu ky theo tai lieu TheSieuRe: md5(partner_key + code + serial)
  const sign = md5(partnerKey + code + serial);
  try {
    const res = await axios.post(apiUrl, new URLSearchParams({
      telco,
      code,
      serial,
      amount: String(amount),
      request_id: requestId,
      partner_id: partnerId,
      sign,
      command: 'charging',
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 20000,
    });
    return { fallback: false, data: res.data };
  } catch (err) {
    console.error('[card] Lỗi gạch thẻ:', err.message);
    return { fallback: false, error: err.message };
  }
}

// Verify chu ky callback tu TheSieuRe
export function verifyCardCallback(payload) {
  const { partnerKey } = config.thesieure;
  if (!partnerKey) return false;
  const expected = md5(partnerKey + (payload.code || '') + (payload.serial || ''));
  return expected === payload.sign;
}
