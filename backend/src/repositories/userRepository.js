import { query } from '../config/db.js';

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role,
    balance: Number(row.balance),
    refCode: row.ref_code,
    referredBy: row.referred_by,
    commissionBalance: Number(row.commission_balance),
    telegramId: row.telegram_id,
    telegramUsername: row.telegram_username,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return mapUser(result.rows[0]);
}

export async function findUserById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return mapUser(result.rows[0]);
}

export async function findUserByRefCode(refCode) {
  const result = await query('SELECT * FROM users WHERE ref_code = $1', [refCode]);
  return mapUser(result.rows[0]);
}

export async function findUserByTelegramId(telegramId) {
  const result = await query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  return mapUser(result.rows[0]);
}

export async function createUser(data) {
  const result = await query(
    `INSERT INTO users (email, password, name, role, balance, ref_code, referred_by, commission_balance, telegram_id, telegram_username)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.email,
      data.password,
      data.name || '',
      data.role || 'user',
      data.balance ?? 0,
      data.refCode || null,
      data.referredBy || null,
      data.commissionBalance ?? 0,
      data.telegramId || null,
      data.telegramUsername || null,
    ]
  );
  return mapUser(result.rows[0]);
}

export async function updateUser(id, updates) {
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'refCode') {
      fields.push(`ref_code = $${index}`);
    } else if (key === 'referredBy') {
      fields.push(`referred_by = $${index}`);
    } else if (key === 'commissionBalance') {
      fields.push(`commission_balance = $${index}`);
    } else if (key === 'telegramId') {
      fields.push(`telegram_id = $${index}`);
    } else if (key === 'telegramUsername') {
      fields.push(`telegram_username = $${index}`);
    } else {
      fields.push(`${key} = $${index}`);
    }
    values.push(value);
    index += 1;
  }

  if (!fields.length) return findUserById(id);
  fields.push(`updated_at = now()`);
  const result = await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, [...values, id]);
  return mapUser(result.rows[0]);
}

export async function incrementUserBalance(id, amount) {
  const result = await query(
    `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [amount, id]
  );
  return mapUser(result.rows[0]);
}

export async function incrementUserCommission(id, amount) {
  const result = await query(
    `UPDATE users SET commission_balance = commission_balance + $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [amount, id]
  );
  return mapUser(result.rows[0]);
}

export async function countUsersReferredBy(userId) {
  const result = await query('SELECT COUNT(*) AS total FROM users WHERE referred_by = $1', [userId]);
  return Number(result.rows[0]?.total || 0);
}

export async function listUsers(limit = 500) {
  const result = await query(
    `SELECT id, email, name, role, balance, ref_code, referred_by, commission_balance, telegram_id, telegram_username, created_at, updated_at
     FROM users ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows.map(mapUser);
}

export async function listUsersWithTelegram(limit = 1000) {
  const result = await query(
    `SELECT id, telegram_id FROM users WHERE telegram_id IS NOT NULL ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows.map((row) => ({ id: row.id, telegramId: row.telegram_id }));
}

export async function countUsers() {
  const result = await query('SELECT COUNT(*) AS total FROM users');
  return Number(result.rows[0]?.total || 0);
}
