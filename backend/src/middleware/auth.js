import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Chua dang nhap' });
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Token khong hop le' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token het han hoac khong hop le' });
  }
}

export function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chi admin moi co quyen' });
  }
  next();
}
