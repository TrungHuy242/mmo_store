import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken, generateRefCode } from '../utils/token.js';

export async function register(req, res) {
  const { email, password, name, ref } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email da duoc dang ky' });

  const hash = await bcrypt.hash(password, 10);
  let refCode = generateRefCode();
  while (await User.findOne({ refCode })) refCode = generateRefCode();

  let referredBy = null;
  if (ref) {
    const referrer = await User.findOne({ refCode: ref });
    if (referrer) referredBy = referrer._id;
  }

  const user = await User.create({ email, password: hash, name: name || '', refCode, referredBy });
  const token = signToken({ id: user._id, role: user.role });
  res.status(201).json({ token, user: sanitize(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Email hoac mat khau sai' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Email hoac mat khau sai' });
  const token = signToken({ id: user._id, role: user.role });
  res.json({ token, user: sanitize(user) });
}

export async function me(req, res) {
  res.json({ user: sanitize(req.user) });
}

function sanitize(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    balance: user.balance,
    refCode: user.refCode,
    commissionBalance: user.commissionBalance,
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
  };
}
