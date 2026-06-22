import { verifyToken } from '../utils/token.js';
import { findUserById } from '../repositories/userRepository.js';

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Token không hợp lệ' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ' });
  }
}

export function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền' });
  }
  next();
}
