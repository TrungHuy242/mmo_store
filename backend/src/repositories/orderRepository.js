import { query } from '../config/db.js';

function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    totalAmount: Number(row.total_amount),
    code: row.code,
    paymentMethod: row.payment_method,
    status: row.status,
    deliveredItems: row.delivered_items,
    deliveredAt: row.delivered_at,
    paymentMeta: row.payment_meta,
    commissionPaid: Number(row.commission_paid),
    affiliateId: row.affiliate_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createOrder(data) {
  const result = await query(
    `INSERT INTO orders (user_id, product_id, product_name, quantity, unit_price, total_amount, code, payment_method, status, payment_meta, commission_paid, affiliate_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.userId,
      data.productId,
      data.productName,
      data.quantity,
      data.unitPrice,
      data.totalAmount,
      data.code,
      data.paymentMethod,
      data.status || 'pending',
      data.paymentMeta ?? {},
      data.commissionPaid ?? 0,
      data.affiliateId || null,
    ]
  );
  return mapOrder(result.rows[0]);
}

export async function findOrderByCode(code) {
  const result = await query('SELECT * FROM orders WHERE code = $1', [code]);
  return mapOrder(result.rows[0]);
}

export async function findOrderByCodeStatus(code, status, paymentMethod) {
  const result = await query(
    'SELECT * FROM orders WHERE code = $1 AND status = $2 AND payment_method = $3',
    [code, status, paymentMethod]
  );
  return mapOrder(result.rows[0]);
}

export async function findOrderByIdAndUser(id, userId) {
  const result = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [id, userId]);
  return mapOrder(result.rows[0]);
}

export async function findOrderById(id) {
  const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
  return mapOrder(result.rows[0]);
}

export async function findOrdersByStatusesSince(statuses, since) {
  const result = await query(
    'SELECT * FROM orders WHERE status = ANY($1::text[]) AND created_at >= $2',
    [statuses, since]
  );
  return result.rows.map(mapOrder);
}

export async function findOrdersByUser(userId) {
  const result = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows.map(mapOrder);
}

export async function deleteOrderById(id) {
  await query('DELETE FROM orders WHERE id = $1', [id]);
}

export async function findOrdersByAffiliate(affiliateId) {
  const result = await query(
    'SELECT id, code, created_at, commission_paid, status FROM orders WHERE affiliate_id = $1 ORDER BY created_at DESC',
    [affiliateId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    createdAt: row.created_at,
    commissionPaid: Number(row.commission_paid),
    status: row.status,
  }));
}

export async function listOrders(limit = 500) {
  const result = await query(
    `SELECT o.*, u.email AS user_email
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((row) => ({
    ...mapOrder(row),
    userEmail: row.user_email,
  }));
}

export async function updateOrder(id, updates, client) {
  const executor = client || { query };
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'userId') {
      fields.push(`user_id = $${index}`);
    } else if (key === 'productId') {
      fields.push(`product_id = $${index}`);
    } else if (key === 'productName') {
      fields.push(`product_name = $${index}`);
    } else if (key === 'unitPrice') {
      fields.push(`unit_price = $${index}`);
    } else if (key === 'totalAmount') {
      fields.push(`total_amount = $${index}`);
    } else if (key === 'paymentMethod') {
      fields.push(`payment_method = $${index}`);
    } else if (key === 'deliveredItems') {
      fields.push(`delivered_items = $${index}`);
    } else if (key === 'deliveredAt') {
      fields.push(`delivered_at = $${index}`);
    } else if (key === 'paymentMeta') {
      fields.push(`payment_meta = $${index}`);
    } else if (key === 'commissionPaid') {
      fields.push(`commission_paid = $${index}`);
    } else if (key === 'affiliateId') {
      fields.push(`affiliate_id = $${index}`);
    } else {
      fields.push(`${key} = $${index}`);
    }
    values.push(value);
    index += 1;
  }

  if (!fields.length) return findOrderById(id);
  fields.push('updated_at = now()');
  const result = await executor.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, [...values, id]);
  return mapOrder(result.rows[0]);
}

export async function countOrders() {
  const result = await query('SELECT COUNT(*) AS total FROM orders');
  return Number(result.rows[0]?.total || 0);
}

export async function sumRevenue() {
  const result = await query(
    "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status IN ('paid', 'delivered')"
  );
  return Number(result.rows[0]?.total || 0);
}

export async function listRecentOrders(limit = 10) {
  const result = await query(
    `SELECT o.*, u.email AS user_email
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((row) => ({
    ...mapOrder(row),
    user: { email: row.user_email },
  }));
}
