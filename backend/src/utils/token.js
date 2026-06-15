import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';

export function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

// Sinh ma gioi thieu (affiliate) ngau nhien, ngan gon
export function generateRefCode() {
  return crypto.randomBytes(4).toString('hex');
}
