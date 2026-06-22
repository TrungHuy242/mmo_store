import { query } from '../config/db.js';

function mapWithdrawal(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    method: row.method,
    details: row.details,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createWithdrawal(data) {
  const result = await query(
    `INSERT INTO withdrawals (user_id, amount, method, details, status, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.userId, data.amount, data.method || 'bank', data.details || '', data.status || 'pending', data.note || '']
  );
  return mapWithdrawal(result.rows[0]);
}

export async function listWithdrawals() {
  const result = await query(
    `SELECT w.*, u.email AS user_email
     FROM withdrawals w
     LEFT JOIN users u ON u.id = w.user_id
     ORDER BY w.created_at DESC`);
  return result.rows.map((row) => ({
    ...mapWithdrawal(row),
    userEmail: row.user_email,
  }));
}

export async function findWithdrawalById(id) {
  const result = await query('SELECT * FROM withdrawals WHERE id = $1', [id]);
  return mapWithdrawal(result.rows[0]);
}

export async function updateWithdrawal(id, updates) {
  const fields = [];
  const values = [];
  let index = 1;
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  }
  if (!fields.length) return findWithdrawalById(id);
  fields.push('updated_at = now()');
  const result = await query(`UPDATE withdrawals SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, [...values, id]);
  return mapWithdrawal(result.rows[0]);
}
