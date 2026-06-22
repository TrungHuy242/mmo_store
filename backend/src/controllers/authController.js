import bcrypt from 'bcryptjs';
import { signToken, generateRefCode } from '../utils/token.js';
import { createUser, findUserByEmail, findUserByRefCode } from '../repositories/userRepository.js';

export async function register(req, res) {
  const { email, password, name, ref } = req.body;
  const exists = await findUserByEmail(email);
  if (exists) return res.status(409).json({ message: 'Email đã được đăng ký' });

  const hash = await bcrypt.hash(password, 10);
  let refCode = generateRefCode();
  while (await findUserByRefCode(refCode)) refCode = generateRefCode();

  let referredBy = null;
  if (ref) {
    const referrer = await findUserByRefCode(ref);
    if (referrer) referredBy = referrer.id;
  }

  const user = await createUser({
    email,
    password: hash,
    name: name || '',
    refCode,
    referredBy,
  });
  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({ token, user: sanitize(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu sai' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Email hoặc mật khẩu sai' });
  const token = signToken({ id: user.id, role: user.role });
  res.json({ token, user: sanitize(user) });
}

export async function me(req, res) {
  res.json({ user: sanitize(req.user) });
}

function sanitize(user) {
  return {
    id: user.id,
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
