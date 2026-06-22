import { Pool } from 'pg';
import { config } from './env.js';

let pool = null;

export async function connectDB() {
  if (config.dbType !== 'postgres') {
    console.error('[db] Backend hiện chỉ hỗ trợ PostgreSQL. Đặt DB_TYPE=postgres trong backend/.env');
    process.exit(1);
  }

  if (!config.databaseUrl) {
    console.error('[db] DATABASE_URL chưa được cấu hình. Đặt DB_TYPE=postgres và DATABASE_URL trong backend/.env');
    process.exit(1);
  }

  pool = new Pool({ connectionString: config.databaseUrl });
  try {
    await pool.query('SELECT 1');
    console.log('[db] Đã kết nối PostgreSQL');
    await ensureSchema();
  } catch (err) {
    console.error('[db] Lỗi kết nối PostgreSQL:', err.message);
    process.exit(1);
  }
}

export async function disconnectDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function query(text, params = []) {
  if (!pool) throw new Error('Database chưa được kết nối');
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  if (!pool) throw new Error('Database chưa được kết nối');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      balance NUMERIC NOT NULL DEFAULT 0,
      ref_code TEXT UNIQUE,
      referred_by INTEGER REFERENCES users(id),
      commission_balance NUMERIC NOT NULL DEFAULT 0,
      telegram_id TEXT,
      telegram_username TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC NOT NULL DEFAULT 0,
      image TEXT NOT NULL DEFAULT '',
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      delivery_type TEXT NOT NULL DEFAULT 'text',
      is_active BOOLEAN NOT NULL DEFAULT true,
      flash_sale_enabled BOOLEAN NOT NULL DEFAULT false,
      flash_sale_sale_price NUMERIC NOT NULL DEFAULT 0,
      flash_sale_ends_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price NUMERIC NOT NULL,
      total_amount NUMERIC NOT NULL,
      code TEXT NOT NULL UNIQUE,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      delivered_items JSONB NOT NULL DEFAULT '[]',
      delivered_at TIMESTAMPTZ,
      payment_meta JSONB NOT NULL DEFAULT '{}',
      commission_paid NUMERIC NOT NULL DEFAULT 0,
      affiliate_id INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS stock_items (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      payload_enc TEXT NOT NULL,
      sold BOOLEAN NOT NULL DEFAULT false,
      sold_to_order_id INTEGER REFERENCES orders(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      method TEXT NOT NULL DEFAULT 'bank',
      details TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
