import { query } from '../config/db.js';

function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image: row.image,
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      icon: row.category_icon,
    },
    deliveryType: row.delivery_type,
    isActive: row.is_active,
    stock: Number(row.stock || 0),
    flashSale: {
      enabled: row.flash_sale_enabled,
      salePrice: Number(row.flash_sale_sale_price),
      endsAt: row.flash_sale_ends_at,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const productSelect = `
  p.id, p.name, p.description, p.price, p.image, p.category_id,
  p.delivery_type, p.is_active, p.flash_sale_enabled, p.flash_sale_sale_price,
  p.flash_sale_ends_at, p.created_at, p.updated_at,
  c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
  COUNT(si.id) FILTER (WHERE si.sold = false) AS stock
`;

export async function listProducts({ categoryId, search, page = 1, limit = 12, sort = 'default' } = {}) {
  const conditions = ['p.is_active = true'];
  const values = [];
  let index = 1;

  if (categoryId) {
    conditions.push(`p.category_id = $${index}`);
    values.push(categoryId);
    index += 1;
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
    values.push(`%${search}%`);
    index += 1;
  }

  const offset = (page - 1) * limit;

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  else if (sort === 'price_desc') orderBy = 'p.price DESC';
  else if (sort === 'name_asc') orderBy = 'p.name ASC';

  const countResult = await query(
    `SELECT COUNT(*) AS total FROM products p WHERE ${conditions.join(' AND ')}`,
    values
  );
  const total = Number(countResult.rows[0]?.total || 0);
  const totalPages = Math.ceil(total / limit);

  values.push(limit, offset);
  const result = await query(
    `SELECT ${productSelect}
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN stock_items si ON si.product_id = p.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY p.id, c.name, c.slug, c.icon
     ORDER BY ${orderBy}
     LIMIT $${index} OFFSET $${index + 1}`,
    values
  );

  return {
    products: result.rows.map(mapProduct),
    total,
    totalPages,
    page,
    limit,
  };
}

export async function findProductById(id) {
  const result = await query(
    `SELECT ${productSelect}
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN stock_items si ON si.product_id = p.id
     WHERE p.id = $1
     GROUP BY p.id, c.name, c.slug, c.icon`,
    [id]
  );
  return mapProduct(result.rows[0]);
}

export async function createProduct(data) {
  const result = await query(
    `INSERT INTO products (name, description, price, image, category_id, delivery_type, is_active, flash_sale_enabled, flash_sale_sale_price, flash_sale_ends_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.name,
      data.description || '',
      data.price,
      data.image || '',
      data.category,
      data.deliveryType || 'text',
      data.isActive ?? true,
      data.flashSale?.enabled ?? false,
      data.flashSale?.salePrice ?? 0,
      data.flashSale?.endsAt ?? null,
    ]
  );
  return findProductById(result.rows[0].id);
}

export async function updateProduct(id, updates) {
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'deliveryType') {
      fields.push(`delivery_type = $${index}`);
    } else if (key === 'isActive') {
      fields.push(`is_active = $${index}`);
    } else if (key === 'flashSale') {
      fields.push(`flash_sale_enabled = $${index}`, `flash_sale_sale_price = $${index + 1}`, `flash_sale_ends_at = $${index + 2}`);
      values.push(value.enabled ?? false, value.salePrice ?? 0, value.endsAt ?? null);
      index += 3;
      continue;
    } else {
      fields.push(`${key} = $${index}`);
    }
    values.push(value);
    index += 1;
  }
  if (!fields.length) return findProductById(id);
  fields.push('updated_at = now()');
  const result = await query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, [...values, id]);
  return findProductById(result.rows[0].id);
}

export async function deleteProductById(id) {
  await query('DELETE FROM products WHERE id = $1', [id]);
}

export async function addStockItems(productId, items) {
  if (!items.length) return [];
  const values = [];
  const placeholders = [];
  items.forEach((item, idx) => {
    const pos = idx * 2;
    placeholders.push(`($${pos + 1}, $${pos + 2})`);
    values.push(productId, item);
  });
  await query(`INSERT INTO stock_items (product_id, payload_enc) VALUES ${placeholders.join(', ')}`, values);
}

export async function getAvailableStockItems(productId, quantity = 1) {
  const result = await query(
    `SELECT id, payload_enc FROM stock_items WHERE product_id = $1 AND sold = false ORDER BY id ASC LIMIT $2`,
    [productId, quantity]
  );
  return result.rows;
}

export async function markStockItemsSold(itemIds, orderId, client) {
  const executor = client || { query };
  await executor.query(
    `UPDATE stock_items SET sold = true, sold_to_order_id = $1, updated_at = now() WHERE id = ANY($2::int[])`,
    [orderId, itemIds]
  );
}

export async function countProducts() {
  const result = await query('SELECT COUNT(*) AS total FROM products');
  return Number(result.rows[0]?.total || 0);
}
