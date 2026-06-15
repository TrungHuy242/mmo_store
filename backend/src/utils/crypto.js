import crypto from 'crypto';
import { config } from '../config/env.js';

// AES-256-GCM de ma hoa du lieu giao hang nhay cam (user/pass, proxy, key...).
const ALGO = 'aes-256-gcm';

function getKey() {
  const key = config.encryptionKey || '';
  // Dam bao dung 32 byte
  return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(plainText) {
  if (plainText == null) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Luu dang: iv:tag:ciphertext (base64)
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

export function decrypt(payload) {
  if (!payload) return null;
  try {
    const [ivB64, tagB64, dataB64] = payload.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[crypto] Loi giai ma:', err.message);
    return null;
  }
}
